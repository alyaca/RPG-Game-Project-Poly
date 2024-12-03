import { IMessage } from '@app/interfaces/message.interface';
import { ChatService } from '@app/services/chat/chat.service';
import { CombatService } from '@app/services/combat/combat.service';
import { GameService } from '@app/services/game/game.service';
import { RoomService } from '@app/services/room/room.service';
import { Game } from '@common/interfaces/game';
import { Avatar, Behavior, Player, Position } from '@common/interfaces/player';
import { ActionData } from '@common/interfaces/socket-data.interface';
import { ClientToServerEvent, ServerToClientEvent } from '@common/socket.events';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

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

    @SubscribeMessage(ClientToServerEvent.CreateRoom)
    handleCreateRoom(client: Socket, game: Game): void {
        const room = this.roomService.createRoom(client, game);
        client.emit(ServerToClientEvent.RoomCreated, room);
        this.logger.log(`Room ${room.roomId} created by admin: ${client.id}`);
    }

    @SubscribeMessage(ClientToServerEvent.JoinRoom)
    handleJoinRoom(client: Socket, roomId: string): void {
        this.gameService.handleJoinGame(client, roomId);
        this.logger.debug(`client ${client.id} joined room ${roomId}`);
    }

    @SubscribeMessage(ClientToServerEvent.LeaveRoom)
    handleLeaveRoom(client: Socket, roomId: string): void {
        this.logger.debug(`client ${client.id} left room ${roomId}`);
        this.gameService.leavePlayerFromGame(roomId, client);
    }

    @SubscribeMessage(ClientToServerEvent.ChangeLockRoom)
    handleLockRoom(client: Socket, isLocked: boolean) {
        const roomId = this.roomService.getRoomId(client);
        this.gameService.toggleLockRoom(roomId, isLocked);
    }

    @SubscribeMessage(ClientToServerEvent.IsLocked)
    handleIsRoomLocked(client: Socket) {
        const room = this.roomService.getRoom(client);
        client.emit(ServerToClientEvent.IsRoomLocked, room.isLocked);
    }

    @SubscribeMessage(ClientToServerEvent.CreatePlayer)
    handleCreatePlayer(client: Socket, player: Player) {
        const room = this.roomService.getRoom(client);
        this.gameService.handleCreatePlayer(room, player, client);
        this.logger.debug(`Player created with client ${client.id} in room ${room.roomId}`);
    }

    @SubscribeMessage(ClientToServerEvent.CreateBot)
    handleCreateBot(client: Socket, behavior: Behavior) {
        this.gameService.createBot(behavior, client);
    }

    @SubscribeMessage(ClientToServerEvent.SelectCharacter)
    handleSelectCharacter(client: Socket, avatar: Avatar) {
        const room = this.roomService.getRoom(client);
        this.gameService.selectedAvatar(room, avatar, client);
    }

    @SubscribeMessage(ClientToServerEvent.KickPlayer)
    handleKickPlayer(client: Socket, playerId: string) {
        this.gameService.onKickPlayer(client, playerId);
        this.logger.debug(`client ${playerId} was kicked out of room`);
    }

    @SubscribeMessage(ClientToServerEvent.KickBot)
    handleKickBot(client: Socket, botId: string) {
        this.gameService.onKickBot(client, botId);
        this.logger.debug(`bot ${botId} was kicked out of room`);
    }

    @SubscribeMessage(ClientToServerEvent.StartGame)
    handleStartGame(client: Socket) {
        this.gameService.onStartGame(client);
    }

    @SubscribeMessage(ClientToServerEvent.FindPath)
    handleFindPath(client: Socket, destination: Position) {
        const room = this.roomService.getRoom(client);
        const activePlayer = this.gameService.getActivePlayer(room);
        const path = room.navigation.findFastestPath(activePlayer, destination, room);
        this.server.to(room.roomId).emit(ServerToClientEvent.PathFound, path);
    }

    @SubscribeMessage(ClientToServerEvent.AttackPlayer)
    handleAttackPlayer(client: Socket) {
        const room = this.roomService.getRoom(client);
        this.combatService.attackPlayer(room, this.server);
    }

    @SubscribeMessage(ClientToServerEvent.ItemSwapped)
    handleItemSwapped(client: Socket, { inventoryToUndo, newInventory, droppedItem }) {
        this.gameService.startItemSwap({ server: this.server, client, oldInventory: inventoryToUndo, modifiedInventory: newInventory, droppedItem });
    }

    @SubscribeMessage(ClientToServerEvent.EvadeCombat)
    handleEvadeCombat(client: Socket) {
        const room = this.roomService.getRoom(client);
        this.combatService.evadingPlayer(room, this.server);
    }

    @SubscribeMessage(ClientToServerEvent.EndTurn)
    handleEndTurn(client: Socket) {
        const room = this.roomService.getRoom(client);
        this.gameService.onTurnEnded(room);
        this.logger.debug(`client ${client.id} turn is over`);
    }

    @SubscribeMessage(ClientToServerEvent.StartTurn)
    handleBeforeStartTurn(client: Socket) {
        const room = this.roomService.getRoom(client);
        this.gameService.onStartTurn(room);
    }

    @SubscribeMessage(ClientToServerEvent.SendMessage)
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

    @SubscribeMessage(ClientToServerEvent.DebugMode)
    handleDebugMode(client: Socket, debugMode: boolean) {
        this.gameService.handleDebugMode(debugMode, client);
    }

    @SubscribeMessage(ClientToServerEvent.PlayerNavigation)
    handlePlayerNavigation(client: Socket, path: Position[]) {
        const room = this.roomService.getRoom(client);
        this.gameService.processNavigation(room, path, client);
    }

    @SubscribeMessage(ClientToServerEvent.TeleportPlayer)
    handleTeleportPlayer(client: Socket, position: Position) {
        const room = this.roomService.getRoom(client);
        this.gameService.processTeleportation(room, position);
    }

    @SubscribeMessage(ClientToServerEvent.DoorAction)
    handleDoorAction(client: Socket, doorActionData: ActionData) {
        this.gameService.handleDoor(client, doorActionData);
    }

    @SubscribeMessage(ClientToServerEvent.CombatAction)
    handleCombatAction(client: Socket, combatActionData: ActionData) {
        const room = this.roomService.getRoom(client);
        this.combatService.startFight(room, this.server, combatActionData);
    }

    @SubscribeMessage(ClientToServerEvent.GetRoom)
    handleGetRoom(client: Socket) {
        const room = this.roomService.getRoom(client);
        this.server.to(room.roomId).emit(ServerToClientEvent.ObtainRoomInfo, room);
    }

    // TODO: move it to service !
    async saveMessage(client: Socket, message: IMessage): Promise<void> {
        try {
            const savedMessage = await this.chatService.saveMessage(message);
            this.logger.log(`Message saved: ${savedMessage.message} from ${savedMessage.username}`);
            this.server.to(message.roomId).emit(ServerToClientEvent.MessageReceived, savedMessage);
        } catch (error) {
            this.logger.error(`Failed to save message: ${error.message}`);
            client.emit(ServerToClientEvent.ErrorMessage, 'Failed to send message.');
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
            this.combatService.handleDisconnectedPlayer(client, this.server);
        }
        this.gameService.leavePlayerFromGame(room.roomId, client);

        if (!this.server.sockets.adapter.rooms.get(room.roomId)) {
            this.gameService.stopGameTimers(room);
        }
        this.logger.log(`Client disconnected: ${client.id}`);
    }
}
