import { IMessage } from '@app/interfaces/message.interface';
import { ChatService } from '@app/services/chat/chat.service';
import { GameService } from '@app/services/game/game.service';
import { RoomService } from '@app/services/room/room.service';
import { Game } from '@common/game';
import { Avatar, Player } from '@common/player';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RoomEvents } from './player-connection.events';

@WebSocketGateway({ cors: { origin: '*' } })
@Injectable()
export class PlayerConnectionGateway implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
    @WebSocketServer()
    private server: Server;

    constructor(
        private roomService: RoomService,
        private logger: Logger,
        private gameService: GameService,
        private chatService: ChatService,
    ) {}

    @SubscribeMessage(RoomEvents.CreateRoom)
    handleCreateRoom(client: Socket, game: Game): void {
        const room = this.roomService.createRoom(client, game);
        client.emit('roomCreated', room);
        this.logger.log(`Room ${room.roomId} created by admin: ${client.id}`); // for debug
    }

    @SubscribeMessage(RoomEvents.JoinRoom)
    handleJoinRoom(client: Socket, roomId: string): void {
        const connectionRes = this.gameService.connectPlayerToGame(roomId);
        const room = this.roomService.rooms.get(roomId);
        this.roomService.joinRoom(client, roomId);
        if (connectionRes.errorType) {
            this.roomService.leaveRoom(roomId, client);
            client.emit(connectionRes.event, connectionRes.errorType);
        } else {
            client.emit(connectionRes.event, room);
            this.logger.debug(`client ${client.id} joined room ${roomId}`); // for debug
        }
    }

    @SubscribeMessage(RoomEvents.LeaveRoom)
    handleLeaveRoom(client: Socket, roomId: string): void {
        this.logger.debug(`client ${client.id} left room ${roomId}`); // for debug
        this.gameService.leavePlayerFromGame(roomId, client, this.server);
    }

    @SubscribeMessage(RoomEvents.ChangeLockRoom)
    handleLockRoom(client: Socket, data: { isLocked: boolean }) {
        const roomId = this.roomService.getRoomId(client);
        this.gameService.toggleLockRoom(roomId, data.isLocked);
    }

    @SubscribeMessage(RoomEvents.IsLocked)
    handleIsRoomLocked(client: Socket) {
        const room = this.roomService.getRoom(client);
        client.emit('isRoomLocked', room.isLocked);
    }

    @SubscribeMessage(RoomEvents.CreatePlayer)
    handleCreatePlayer(client: Socket, player: Player) {
        const room = this.roomService.getRoom(client);
        const isAdmin = this.roomService.isPlayerAdmin(client);
        this.gameService.createPlayer(room, player, client);
        client.emit('updatedPlayer', room);
        client.to(room.roomId).emit('updatedPlayer', room);
        client.emit('isPlayerAdmin', isAdmin);
    }

    @SubscribeMessage(RoomEvents.SelectCharacter)
    handleSelectCharacter(client: Socket, avatar: Avatar) {
        const room = this.roomService.getRoom(client);
        this.gameService.selectedAvatar(room, avatar, client, this.server);
    }

    @SubscribeMessage(RoomEvents.KickPlayer)
    handleKickPlayer(client: Socket, playerId: string) {
        const room = this.roomService.getRoom(client);
        this.logger.debug(`client ${playerId} was kicked out of room `); // Debug log
        this.server.to(playerId).emit('kickPlayer', playerId);

        const playerSocket = this.server.sockets.sockets.get(playerId);
        this.gameService.removePlayerFromRoom(room.roomId, playerSocket, this.server);
        this.server.to(room.roomId).emit('updatedPlayer', room);
    }

    @SubscribeMessage(RoomEvents.SendMessage)
    async handleMessage(client: Socket, message: IMessage): Promise<void> {
        const roomId = this.roomService.getRoomId(client);
        this.logger.log(`Message received: ${message.message} from ${message.username} with roomCode: ${client.data.roomCode}`);

        const messageWithRoomId: IMessage = {
            roomId,
            username: client.data.username,
            message: message.message,
            timestamp: message.timestamp,
        };
        await this.saveMessage(client, messageWithRoomId);
    }

    async saveMessage(client: Socket, message: IMessage): Promise<void> {
        try {
            const savedMessage = await this.chatService.saveMessage(message);
            this.logger.log(`Message saved: ${savedMessage.message} from ${savedMessage.username}`);
            this.server.to(message.roomId).emit('messageReceived', savedMessage);
        } catch (error) {
            this.logger.error(`Failed to save message: ${error.message}`);
            client.emit('errorMessage', 'Failed to send message.');
        }
    }

    onModuleInit() {
        this.roomService.setServer(this.server);
    }

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        const room = this.roomService.getRoom(client);
        if (room) {
            this.gameService.leavePlayerFromGame(room.roomId, client, this.server);
            this.logger.log(`Client disconnected: ${client.id}`);
        }
    }
}
