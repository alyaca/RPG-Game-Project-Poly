import { Navigation } from '@app/classes/navigation/navigation';
import { IMessage } from '@app/interfaces/message.interface';
import { DoorActionData } from '@app/interfaces/socket-data';
import { ChatService } from '@app/services/chat/chat.service';
import { CombatService } from '@app/services/combat/combat.service';
import { GameService } from '@app/services/game/game.service';
import { RoomService } from '@app/services/room/room.service';
import { Game } from '@common/game';
import { Avatar, Player, Position } from '@common/player';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SocketEvents } from './socket.events';

@WebSocketGateway({ cors: { origin: '*' } })
@Injectable()
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
    @WebSocketServer()
    private server: Server;
    private navigation: Navigation;

    constructor(
        private roomService: RoomService,
        private logger: Logger,
        private chatService: ChatService,
        private combatService: CombatService,
        private gameService: GameService,
    ) {
        this.navigation = new Navigation();
    }

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

    @SubscribeMessage(SocketEvents.SelectCharacter)
    handleSelectCharacter(client: Socket, avatar: Avatar) {
        const room = this.roomService.getRoom(client);
        this.gameService.selectedAvatar(room, avatar, client, this.server);
    }

    @SubscribeMessage(SocketEvents.KickPlayer)
    handleKickPlayer(client: Socket, playerId: string) {
        const room = this.roomService.getRoom(client);
        this.logger.debug(`client ${playerId} was kicked out of room`);
        this.server.to(playerId).emit('kickPlayer', playerId);

        const playerSocket = this.server.sockets.sockets.get(playerId);
        this.gameService.removePlayerFromRoom(room.roomId, playerSocket, this.server);
        this.server.to(room.roomId).emit('updatedPlayer', room);
    }

    @SubscribeMessage(SocketEvents.StartGame)
    handleStartGame(client: Socket) {
        const room = this.roomService.getRoom(client);
        this.navigation.initializeNavigation(room.gameMap, room.gameMap.itemPlacement, room.listPlayers);
        room.navigation = this.navigation;
        this.gameService.onStartGame(room, client);
        const activePlayer = this.gameService.getActivePlayer(room);

        this.server.to(room.roomId).emit('startGame', room);
        this.server.to(room.roomId).emit('mapInformation', room);
        this.server.to(room.roomId).emit('isActive', activePlayer.id);

        this.server.to(room.roomId).emit('isActive', activePlayer);
        const reachability = room.navigation.findReachableTiles(activePlayer, room.gameMap);
        this.server.to(room.roomId).emit('reachableTiles', reachability);
    }

    @SubscribeMessage('findPath')
    handleFindPath(client: Socket, destination: Position) {
        const room = this.roomService.getRoom(client);
        const activePlayer = this.gameService.getActivePlayer(room);
        const path = room.navigation.findFastestPath(activePlayer, destination, room.gameMap);
        this.server.to(room.roomId).emit('pathFound', path);
    }

    /*
    @SubscribeMessage('getAccessibleTile')
    handleGetAccessibleTile(){
        //this.navigation.findReachableTiles();
    }
        */

    @SubscribeMessage(SocketEvents.StartFight)
    handleStartFight(client: Socket, { player1, player2, isPlayer1Active }) {
        this.combatService.startFight(client, player1, player2, isPlayer1Active, this.server);
    }

    @SubscribeMessage(SocketEvents.AttackPlayer)
    handleAttackPlayer(client: Socket) {
        this.combatService.attackPlayer(client, this.server);
    }

    @SubscribeMessage(SocketEvents.EvadeCombat)
    handleEvadeCombat(client: Socket, player: Player) {
        this.combatService.evadingPlayer(client, player, this.server);
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

    @SubscribeMessage(SocketEvents.SendGameLog)
    handleGameLog(client: Socket, log: string) {
        const roomId = this.roomService.getRoomId(client);
        this.logger.log(`Game log received: ${log} from ${client.id} with roomCode: ${roomId}`);
        client.to(roomId).emit('gameLogReceived', log);
    }

    @SubscribeMessage(SocketEvents.PlayerNavigation)
    handlePlayerNavigation(client: Socket, path: Position[]) {
        const room = this.roomService.getRoom(client);
        this.gameService.processNavigation(room, this.server, path, client);
    }

    @SubscribeMessage(SocketEvents.DoorAction)
    handleDoorAction(client: Socket, doorActionData: DoorActionData) {
        const { position, player } = doorActionData;
        const room = this.roomService.getRoom(client);
        const activePlayer = this.gameService.getActivePlayer(room);

        if (this.navigation.hasHandleDoorAction(position.x, position.y, player)) {
            this.server.to(room.roomId).emit('doorClicked', this.navigation.gameMap.tiles);
            const reachability = room.navigation.findReachableTiles(activePlayer, room.gameMap);
            this.server.to(room.roomId).emit('reachableTiles', reachability);
        }
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
            if (this.combatService.isInCombat(client)) {
                this.combatService.disconnectedPlayer(client, this.server);
            }
            this.gameService.leavePlayerFromGame(room.roomId, client, this.server);

            if (!this.server.sockets.adapter.rooms.get(room.roomId)) {
                this.gameService.stopGameTimers(room);
            }
            this.logger.log(`Client disconnected: ${client.id}`);
        } else {
            this.logger.log(`Client disconnected when no room: ${client.id}`);
        }
    }
}
