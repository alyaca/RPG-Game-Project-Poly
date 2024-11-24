import { IMessage } from '@app/interfaces/message.interface';
import { DoorActionData } from '@app/interfaces/socket-data.interface';
import { ChatService } from '@app/services/chat/chat.service';
import { CombatService } from '@app/services/combat/combat.service';
import { GameService } from '@app/services/game/game.service';
import { RoomService } from '@app/services/room/room.service';
import { Game } from '@common/game';
import { Avatar, Behavior, Player, Position } from '@common/player';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SocketEvents } from './socket.events';
@WebSocketGateway({ cors: { origin: '*' } })
@Injectable()
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
    @WebSocketServer()
    private server: Server;

    constructor(
        private roomService: RoomService,
        private logger: Logger,
        private chatService: ChatService,
        private combatService: CombatService,
        private gameService: GameService,
    ) {}

    @SubscribeMessage(SocketEvents.CreateRoom)
    handleCreateRoom(client: Socket, game: Game): void {
        const room = this.roomService.createRoom(client, game);
        client.emit('roomCreated', room);
        this.logger.log(`Room ${room.roomId} created by admin: ${client.id}`);
    }

    @SubscribeMessage(SocketEvents.JoinRoom)
    handleJoinRoom(client: Socket, roomId: string): void {
        const connectionRes = this.gameService.connectPlayerToGame(roomId);
        const room = this.roomService.rooms.get(roomId);
        this.roomService.joinRoom(client, roomId);
        if (connectionRes.errorType) {
            this.roomService.leaveRoom(roomId, client);
            client.emit(connectionRes.event, connectionRes.errorType);
        } else {
            client.emit(connectionRes.event, room);
            this.logger.debug(`client ${client.id} joined room ${roomId}`);
        }
    }

    @SubscribeMessage(SocketEvents.LeaveRoom)
    handleLeaveRoom(client: Socket, roomId: string): void {
        this.logger.debug(`client ${client.id} left room ${roomId}`);
        this.gameService.leavePlayerFromGame(roomId, client, this.server);
    }

    @SubscribeMessage(SocketEvents.ChangeLockRoom)
    handleLockRoom(client: Socket, isLocked: boolean) {
        const roomId = this.roomService.getRoomId(client);
        this.gameService.toggleLockRoom(roomId, isLocked);
    }

    @SubscribeMessage(SocketEvents.IsLocked)
    handleIsRoomLocked(client: Socket) {
        const room = this.roomService.getRoom(client);
        client.emit('isRoomLocked', room.isLocked);
    }

    @SubscribeMessage(SocketEvents.CreatePlayer)
    handleCreatePlayer(client: Socket, player: Player) {
        const room = this.roomService.getRoom(client);
        const isAdmin = this.roomService.isPlayerAdmin(client);
        this.gameService.createPlayer(room, player, client);
        this.server.to(room.roomId).emit('updatedPlayer', room);
        client.emit('isPlayerAdmin', isAdmin);
    }

    @SubscribeMessage(SocketEvents.CreateBot)
    handleCreateBot(client: Socket, behavior: Behavior) {
        this.gameService.createBot(behavior, client, this.server);
    }

    @SubscribeMessage(SocketEvents.SelectCharacter)
    handleSelectCharacter(client: Socket, avatar: Avatar) {
        const room = this.roomService.getRoom(client);
        this.gameService.selectedAvatar(room, avatar, client, this.server);
    }

    @SubscribeMessage(SocketEvents.KickPlayer)
    handleKickPlayer(client: Socket, playerId: string) {
        this.gameService.onKickPlayer(client, this.server, playerId);
        this.logger.debug(`client ${playerId} was kicked out of room`);
    }

    @SubscribeMessage(SocketEvents.KickBot)
    handleKickBot(client: Socket, botId: string) {
        this.gameService.onKickBot(client, botId, this.server);
        this.logger.debug(`bot ${botId} was kicked out of room`);
    }

    @SubscribeMessage(SocketEvents.StartGame)
    handleStartGame(client: Socket) {
        this.gameService.onStartGame(client, this.server);
    }

    @SubscribeMessage(SocketEvents.FindPath)
    handleFindPath(client: Socket, destination: Position) {
        const room = this.roomService.getRoom(client);
        const activePlayer = this.gameService.getActivePlayer(room);
        const path = room.navigation.findFastestPath(activePlayer, destination, room);
        this.server.to(room.roomId).emit('pathFound', path);
    }

    @SubscribeMessage(SocketEvents.StartFight)
    handleStartFight(client: Socket, { player1, player2, isPlayer1Active }) {
        this.combatService.startFight(client, player1, player2, isPlayer1Active, this.server);
    }

    @SubscribeMessage(SocketEvents.AttackPlayer)
    handleAttackPlayer(client: Socket) {
        this.combatService.attackPlayer(client, this.server);
    }

    @SubscribeMessage(SocketEvents.EvadeCombat)
    handleEvadeCombat(client: Socket) {
        this.combatService.evadingPlayer(client, this.server);
    }

    @SubscribeMessage(SocketEvents.EndTurn)
    handleEndTurn(client: Socket) {
        this.gameService.onTurnEnded(client, this.server);
        this.logger.debug(`client ${client.id} turn is over`);
    }

    @SubscribeMessage(SocketEvents.StartTurn)
    handleBeforeStartTurn(client: Socket) {
        this.gameService.onStartTurn(client, this.server);
    }

    @SubscribeMessage(SocketEvents.SendMessage)
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

    @SubscribeMessage(SocketEvents.DebugMode)
    handleDebugMode(client: Socket, debugMode: boolean) {
        const room = this.roomService.getRoom(client);
        room.isDebug = debugMode;
        this.gameService.updateLogsDebugMode(debugMode, this.server, client);
        this.server.to(room.roomId).emit('debugMode', debugMode);
        const activePlayer = this.gameService.getActivePlayer(room);
        const reachability = room.navigation.findReachableTiles(activePlayer, room);
        this.server.to(room.roomId).emit('reachableTiles', reachability);
    }

    @SubscribeMessage(SocketEvents.PlayerNavigation)
    handlePlayerNavigation(client: Socket, path: Position[]) {
        const room = this.roomService.getRoom(client);
        if (room.isDebug) {
            this.gameService.processTeleportation(room, this.server, path);
        } else {
            this.gameService.processNavigation(room, this.server, path, client);
        }
    }

    @SubscribeMessage(SocketEvents.DoorAction)
    handleDoorAction(client: Socket, doorActionData: DoorActionData) {
        this.gameService.handleDoor(client, this.server, doorActionData);
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

        if (!room) {
            this.logger.log(`Client disconnected but was not in a room: ${client.id}`);
            return;
        }

        if (this.combatService.isInCombat(client)) {
            this.combatService.disconnectedPlayer(client, this.server);
        }
        this.gameService.leavePlayerFromGame(room.roomId, client, this.server);

        if (!this.server.sockets.adapter.rooms.get(room.roomId)) {
            this.gameService.stopGameTimers(room);
        }
        this.logger.log(`Client disconnected: ${client.id}`);
    }
}
