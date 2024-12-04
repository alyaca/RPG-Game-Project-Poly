import { Navigation } from '@app/classes/navigation/navigation';
import { Stopwatch } from '@app/classes/stopwatch/stopwatch';
import {
    DEFAULT_ACTION_POINT,
    DEFAULT_ATTRIBUTE,
    DISCONNECTED_POSITION,
    EQUAL_ODDS_PROBABILITY,
    FALLING_PROBABILITY,
    HIGH_ATTRIBUTE,
    LogType,
    MAX_ACTION_POINT,
    MOVEMENT_TIME,
    NO_ITEM,
    PLAYER_FELL_DELAY,
    SINGLE_PLAYER,
    STARTING_TIME,
    TURN_TIME,
} from '@app/constants';
import { InfoSwap } from '@app/interfaces/info-item-swap';
import { baseBot } from '@app/mocks/mock-players';
import { BotService } from '@app/services/bot/bot.service';
import { GameLogsService } from '@app/services/game-logs/game-logs.service';
import { MatchService } from '@app/services/match/match.service';
import { PlayerInventoryService } from '@app/services/player-inventory/player-inventory.service';
import { RoomService } from '@app/services/room/room.service';
import { ObjectType } from '@common/avatars-info';
import { GameMode, TileCost, TileType } from '@common/constants';
import { Avatar, Behavior, Player, Position, Status } from '@common/interfaces/player';
import { GameStatus, Room } from '@common/interfaces/room';
import { ActionData } from '@common/interfaces/socket-data.interface';
import { ServerToClientEvent } from '@common/socket.events';
import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';

/* eslint-disable max-lines */
@Injectable()
export class GameService {
    private isMoving: boolean = false;
    private isTurnSkipped: boolean = false;
    private isPlayerFell: boolean = false;

    constructor(
        private roomService: RoomService,
        private playerInventoryService: PlayerInventoryService,
        private gameLogsService: GameLogsService,
        private matchService: MatchService,
        private botService: BotService,
    ) {}

    handleJoinGame(client: Socket, roomId: string) {
        const connectionRes = this.connectPlayerToGame(roomId);
        const room = this.roomService.rooms.get(roomId);
        this.roomService.joinRoom(client, roomId);
        if (connectionRes.errorType) {
            this.roomService.leaveRoom(roomId, client);
            client.emit(connectionRes.event, connectionRes.errorType);
        } else {
            client.emit(connectionRes.event, room);
        }
    }

    handleCreatePlayer(room: Room, player: Player, socket: Socket) {
        const isAdmin = this.roomService.isPlayerAdmin(socket);
        const isBot = player.status === Status.Bot;
        if (!isBot) {
            player.id = socket.id;
            player.status = isAdmin ? Status.Admin : player.status;
        }
        this.setUniquePlayerName(player, socket, !isBot);
        room.listPlayers.push(player);
        const takenAvatar = this.getAvatarByName(room, player.avatar);
        takenAvatar.isTaken = true;
        this.emitEventToRoom(room.roomId, ServerToClientEvent.UpdatedPlayer, room);
        socket.emit(ServerToClientEvent.IsPlayerAdmin, isAdmin);
    }

    getActivePlayer(room: Room): Player {
        return room.listPlayers.find((player) => player.isActive);
    }

    getRoomById(roomId: string) {
        return this.roomService.rooms.get(roomId);
    }

    getPlayerById(room: Room, socket: Socket) {
        return room.listPlayers.find((player) => player.id === socket.id);
    }

    getServer() {
        return this.roomService.getServer();
    }

    getTurnTimer(roomId: string) {
        return this.roomService.getTurnTimer(roomId);
    }

    getFightTimer(roomId: string) {
        return this.roomService.getFightTimer(roomId);
    }

    emitEventToRoom(roomId: string, event: string, data?) {
        this.getServer().to(roomId).emit(event, data);
    }

    leavePlayerFromGame(roomId: string, socket: Socket) {
        const isAdmin = this.roomService.isPlayerAdmin(socket);
        const room = this.getRoomById(roomId);
        socket.emit(ServerToClientEvent.LeftRoom, isAdmin);
        const player = this.getPlayerById(room, socket);

        if (isAdmin) {
            this.handleAdminDisconnection(room, socket);
        }
        if (room.gameStatus === GameStatus.Started) {
            this.gameLogsService.sendPlayerLog(roomId, this.getServer(), player, LogType.GiveUp);
            this.handleStartedGameDisconnection(room, socket, player);
        } else {
            this.removePlayerFromRoom(room, socket);
        }
    }

    selectedAvatar(room: Room, avatar: Avatar, socket: Socket) {
        this.freeUpAvatar(room, socket);
        const selectedAvatar = this.getAvatarByName(room, avatar);
        if (selectedAvatar && !selectedAvatar.isTaken) {
            selectedAvatar.isTaken = true;
            socket.data.clickedAvatar = selectedAvatar;
            this.updateAvatarsForAllClients(room.roomId);
        }
    }

    stopGameTimers(room: Room) {
        this.getFightTimer(room.roomId).stopTimer();
        this.getTurnTimer(room.roomId).stopTimer();
    }

    toggleLockRoom(roomId: string, isLocked: boolean) {
        const game = this.getRoomById(roomId);
        game.isLocked = isLocked;
    }

    onStartGame(socket: Socket) {
        const room = this.roomService.getRoom(socket);
        room.stopwatch = new Stopwatch();
        room.stopwatch.start();
        room.navigation = new Navigation(room.gameMap, room.gameMap.itemPlacement, room.listPlayers);
        this.matchService.processMapObjects(socket);
        room.gameStatus = GameStatus.Started;
        this.sortPlayersBySpeed(room);
        room.navigation.removeUnusedSpawnPoints();
        room.listPlayers[0].isActive = true;
        this.emitStartGameEvents(room);
    }

    onStartTurn(room: Room) {
        const activePlayer = this.getActivePlayer(room);
        this.emitEventToRoom(room.roomId, ServerToClientEvent.OtherPlayerTurn, activePlayer.name);
        this.gameLogsService.sendPlayerLog(room.roomId, this.getServer(), activePlayer, LogType.StartTurn);

        this.getTurnTimer(room.roomId).startTimer(STARTING_TIME, (timeRemaining) => {
            this.emitEventToRoom(room.roomId, ServerToClientEvent.BeforeStartTurnTimer, timeRemaining);
            if (timeRemaining <= 0) {
                this.playerTurnTimer(room);
            }
        });
        if (activePlayer.status === Status.Bot) {
            this.botService.processBotTurn(room, this.getServer(), activePlayer);
            return;
        }
    }

    onTurnEnded(room: Room) {
        if (this.isMoving) {
            this.isTurnSkipped = true;
            return;
        }
        room.globalPostGameStats.turns++;
        this.updateActivePlayer(room);
        const activePlayer = this.getActivePlayer(room);
        activePlayer.attributes.movementPointsLeft = activePlayer.attributes.speed;
        this.emitEventsOnTurnEnded(room, activePlayer);
        this.checkActions(room);
    }

    createBot(behavior: Behavior, client: Socket) {
        const room = this.roomService.getRoom(client);
        baseBot.id = (parseInt(baseBot.id, 10) + 1).toString();
        let newBot = this.assignAvatarToBot(room, behavior);
        newBot = this.assignStatsToBot(newBot);
        newBot.collectedItems = [];
        this.handleCreatePlayer(room, newBot, client);
        this.updateAvatarsForAllClients(room.roomId);
        this.emitEventToRoom(room.roomId, ServerToClientEvent.UpdatedPlayer, room);
    }

    onKickBot(socket: Socket, botId: string) {
        const room = this.roomService.getRoom(socket);
        this.getServer().to(botId).emit(ServerToClientEvent.KickPlayer, botId);
        const botPlayer = room.listPlayers.find((player) => player.id === botId);
        botPlayer.avatar.isTaken = false;
        room.listPlayers = room.listPlayers.filter((player) => player.id !== botId);
        this.emitEventToRoom(room.roomId, ServerToClientEvent.UpdatedPlayer, room);
        this.updateAvatarsForAllClients(room.roomId);
    }

    onKickPlayer(socket: Socket, playerId: string) {
        const room = this.roomService.getRoom(socket);
        this.getServer().to(playerId).emit(ServerToClientEvent.KickPlayer, playerId);
        const playerSocket = this.getServer().sockets.sockets.get(playerId);
        this.removePlayerFromRoom(room, playerSocket);
        this.emitEventToRoom(room.roomId, ServerToClientEvent.UpdatedPlayer, room);
    }

    handleDebugMode(isDebugMode: boolean, client: Socket) {
        const room = this.roomService.getRoom(client);
        room.isDebug = isDebugMode;
        this.gameLogsService.sendDebugLog(isDebugMode, room.roomId, this.getServer());
        this.emitEventToRoom(room.roomId, ServerToClientEvent.DebugMode, isDebugMode);
    }

    processTeleportation(room: Room, position: Position) {
        const player = this.getActivePlayer(room);
        const playerId = player.id;
        if (room.navigation.isTileValidTeleport(position.x, position.y)) {
            player.position = position;
            this.emitEventToRoom(room.roomId, ServerToClientEvent.TeleportPlayer, { position, playerId });
        }
        const reachability = room.navigation.findReachableTiles(player, room);
        this.emitEventToRoom(room.roomId, ServerToClientEvent.EndMovement);
        this.emitEventToRoom(room.roomId, ServerToClientEvent.ReachableTiles, reachability);
        this.checkActions(room);
    }

    startItemSwap(infoSwap: InfoSwap) {
        const room = this.roomService.getRoom(infoSwap.client);
        let activePlayer = this.getActivePlayer(room);
        activePlayer = this.playerInventoryService.updatePlayerAfterSwap(infoSwap);

        this.getTurnTimer(room.roomId).resumeTimer((timeLeft) => {
            if (timeLeft <= 0) {
                this.onTurnEnded(room);
            }
            infoSwap.server.to(room.roomId).emit(ServerToClientEvent.StartedTurnTimer, timeLeft);
        });
        infoSwap.client.emit(ServerToClientEvent.UpdatedInventory, activePlayer);
    }

    onEndGame(winner: Player, room: Room) {
        room.gameStatus = GameStatus.Ended;
        room.stopwatch.stop();
        room.globalPostGameStats.gameDuration = room.stopwatch.getTime();
        this.emitEventToRoom(room.roomId, ServerToClientEvent.EndGame, { winner, room });
        this.resetGlobalStats(room);
        this.stopGameTimers(room);
    }

    handleDoor(client: Socket, doorActionData: ActionData) {
        const { clickedPosition, player } = doorActionData;
        const room = this.roomService.getRoom(client);
        if (room.navigation.hasHandleDoorAction(clickedPosition.x, clickedPosition.y, player)) {
            this.handleToggleDoor(client, room, clickedPosition);
        }
    }

    async processNavigation(room: Room, path: Position[], client: Socket) {
        this.isPlayerFell = false;
        const player = this.getActivePlayer(room);
        this.initTileHistory(room);
        for (const tile of path) {
            this.isMoving = true;
            player.position = tile;

            if (await this.handleTileActions(room, client, player, tile)) {
                break;
            }
        }
        this.handleEndNavigation(room, player, client);
    }

    placeItemsOnGround(room: Room, player: Player) {
        const playerToDropItems = room.listPlayers.find((p) => p.id === player.id);
        if (playerToDropItems.inventory.length === 0) return;
        this.playerInventoryService.restoreInitialStats(playerToDropItems);
        for (const items of playerToDropItems.inventory) {
            const position = room.navigation.findClosestValidTile(playerToDropItems, room);
            room.gameMap.itemPlacement[position.x][position.y] = items.id;
            this.emitEventToRoom(room.roomId, ServerToClientEvent.UpdateObjectsAfterCombat, { newGrid: room.gameMap.itemPlacement, position });
        }
        playerToDropItems.inventory = [];
        this.getServer().to(playerToDropItems.id).emit(ServerToClientEvent.UpdatedInventory, playerToDropItems);
    }

    private emitEventsOnTurnEnded(room: Room, activePlayer: Player) {
        this.emitEventToRoom(room.roomId, ServerToClientEvent.Reachability, activePlayer);
        this.emitEventToRoom(room.roomId, ServerToClientEvent.ActivePlayer, activePlayer);

        const host = room.listPlayers.find((player) => player.status === Status.Player || player.status === Status.Admin);
        if (!host) return;
        this.getServer().to(host.id).emit(ServerToClientEvent.TurnEnded);
        this.emitEventToRoom(room.roomId, ServerToClientEvent.UpdateVisual, room.listPlayers);

        room.navigation.isBot = activePlayer.status === Status.Bot;
        const reachability = room.navigation.findReachableTiles(activePlayer, room);
        this.emitEventToRoom(room.roomId, ServerToClientEvent.ReachableTiles, reachability);
    }

    private assignStatsToBot(bot: Player): Player {
        bot.attributes.currentHp = Math.random() > EQUAL_ODDS_PROBABILITY ? HIGH_ATTRIBUTE : DEFAULT_ATTRIBUTE;
        bot.attributes.speed = bot.attributes.currentHp === HIGH_ATTRIBUTE ? DEFAULT_ATTRIBUTE : HIGH_ATTRIBUTE;

        bot.attributes.atkDiceMax = Math.random() > EQUAL_ODDS_PROBABILITY ? HIGH_ATTRIBUTE : DEFAULT_ATTRIBUTE;
        bot.attributes.defDiceMax = bot.attributes.atkDiceMax === HIGH_ATTRIBUTE ? DEFAULT_ATTRIBUTE : HIGH_ATTRIBUTE;

        return bot;
    }

    private assignAvatarToBot(room: Room, behavior: Behavior): Player {
        const newBot = JSON.parse(JSON.stringify(baseBot));
        newBot.behavior = behavior;
        const behaviorSuffix = behavior === Behavior.Aggressive ? '-A' : '-D';
        const availableAvatars = room.availableAvatars.filter((avatar) => !avatar.isTaken);
        if (availableAvatars.length > 0) {
            const randomAvatar = availableAvatars[Math.floor(Math.random() * availableAvatars.length)];
            newBot.avatar = randomAvatar;
            newBot.name = `${randomAvatar.name}${behaviorSuffix}-bot`;
            randomAvatar.isTaken = true;
        }
        return newBot;
    }

    private updateAvatarsForAllClients(roomId: string) {
        this.getServer().sockets.sockets.forEach((clientSocket: Socket) => {
            if (clientSocket.rooms.has(roomId)) {
                this.sendAvatarListToClient(clientSocket);
            }
        });
    }

    private setUniquePlayerName(player: Player, socket: Socket, updateSocketData: boolean) {
        const playerName = this.generateUniquePlayerName(player.name, socket);
        player.name = playerName;
        if (updateSocketData) {
            socket.data.username = player.name;
        }
    }

    private addUniqueTileToHistory(positionList: Position[], tile: Position) {
        if (!positionList.some((pos) => pos.x === tile.x && pos.y === tile.y)) {
            positionList.push(tile);
        }
    }

    private initTileHistory(room: Room) {
        for (const player of room.listPlayers) {
            this.addUniqueTileToHistory(player.positionHistory, player.spawnPosition);
            this.addUniqueTileToHistory(room.globalPostGameStats.globalTilesVisited, player.spawnPosition);
        }
    }

    private resetGlobalStats(room: Room) {
        room.globalPostGameStats.globalTilesVisited = [];
        room.globalPostGameStats.doorsInteracted = [];
        room.globalPostGameStats.turns = 1;
        room.globalPostGameStats.nbFlagBearers = 0;
        room.globalPostGameStats.gameDuration = '';
    }

    private checkActions(room: Room) {
        this.checkDoors(room);
        this.checkAttack(room);
    }

    private checkEndTurn(client: Socket, activePlayer: Player): boolean {
        if (!activePlayer || !this.isActivePlayer(client)) return;
        const room = this.roomService.getRoom(client);
        const reachableTileCount = room.navigation.findReachableTiles(activePlayer, room).length;
        const players = room.listPlayers;

        if (!room.navigation.haveActions(activePlayer, players) && reachableTileCount === 0) {
            return true;
        } else if (!room.navigation.hasMovementPoints(activePlayer) && !room.navigation.haveActions(activePlayer, players)) {
            return true;
        } else if (!room.navigation.hasMovementPoints(activePlayer) && !room.navigation.hasActionPoints(activePlayer)) {
            return true;
        }
        return false;
    }

    private async delay(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    private async handleTileActions(room: Room, client: Socket, player: Player, tile: Position): Promise<boolean> {
        const hasPickUpItem = this.handleItemPickup(room, client, player, tile);
        await this.processTileNavigation(room, tile);
        if (this.checkPlayerFell(room, tile, client)) {
            return true;
        }
        player.attributes.movementPointsLeft -= this.getCost(room.gameMap.tiles[tile.x][tile.y], player);
        return hasPickUpItem;
    }

    private async processTileNavigation(room: Room, tile: Position) {
        const player = this.getActivePlayer(room);
        this.addUniqueTileToHistory(player.positionHistory, tile);
        this.addUniqueTileToHistory(room.globalPostGameStats.globalTilesVisited, tile);

        if (room.gameMap.mode === GameMode.CaptureTheFlag) {
            this.checkFlagModeEndGame(player, room);
        }

        if (this.isMoving) {
            await this.delay(MOVEMENT_TIME);
        }
        this.emitEventToRoom(room.roomId, ServerToClientEvent.PlayerNavigation, tile);
    }

    private checkPlayerFell(room: Room, tile: Position, client: Socket): boolean {
        if (!room.isDebug && this.isTileIce(room, tile) && !this.checkFell()) {
            this.handleFallingOnIce(room, client);
            this.isPlayerFell = true;
            this.isMoving = false;
            return true;
        }
        return false;
    }

    private handleEndNavigation(room: Room, player: Player, client: Socket) {
        this.isMoving = false;
        const reachability = room.navigation.findReachableTiles(player, room);
        this.emitEventToRoom(room.roomId, ServerToClientEvent.EndMovement);
        this.emitEventToRoom(room.roomId, ServerToClientEvent.ReachableTiles, reachability);
        if (this.checkEndTurn(client, player)) {
            this.onTurnEnded(room);
            return;
        }
        if (this.isTurnSkipped && !this.isPlayerFell) {
            this.onTurnEnded(room);
            this.isTurnSkipped = false;
            return;
        }
        this.checkActions(room);
    }

    private handleItemPickup(room: Room, client: Socket, player: Player, tile: Position): boolean {
        if (this.isObject(room, tile)) {
            const infoSwap: InfoSwap = {
                server: this.getServer(),
                client,
                player,
            };
            this.playerInventoryService.updateInventory(infoSwap, room.gameMap.itemPlacement);
            this.emitEventToRoom(room.roomId, ServerToClientEvent.UpdateObjects, room.gameMap.itemPlacement);
            return true;
        }
        return false;
    }

    private emitStartGameEvents(room: Room) {
        const activePlayer = this.getActivePlayer(room);
        this.emitEventToRoom(room.roomId, ServerToClientEvent.StartGame, room);
        this.emitEventToRoom(room.roomId, ServerToClientEvent.MapInformation, room);
        this.emitEventToRoom(room.roomId, ServerToClientEvent.ActivePlayer, activePlayer);
        const reachability = room.navigation.findReachableTiles(activePlayer, room);
        this.emitEventToRoom(room.roomId, ServerToClientEvent.ReachableTiles, reachability);
        this.checkActions(room);
    }

    private connectPlayerToGame(roomId: string) {
        const game = this.getRoomById(roomId);
        if (!this.isCodeFormatValid(roomId)) {
            return { event: 'joinError', errorType: 'invalidFormat' };
        }
        if (!this.roomService.isRoomActive(roomId)) {
            return { event: 'joinError', errorType: 'roomNotFound' };
        }
        if (game.isLocked) {
            return { event: 'joinError', errorType: 'roomLocked' };
        }
        return { event: 'joinedRoom' };
    }

    private handleToggleDoor(client: Socket, room: Room, clickedPosition: Position) {
        const activePlayer = this.getActivePlayer(room);
        this.addUniqueTileToHistory(room.globalPostGameStats.doorsInteracted, clickedPosition);
        this.gameLogsService.sendDoorLog(room.gameMap.tiles[clickedPosition.x][clickedPosition.y], activePlayer, room.roomId, this.getServer());
        activePlayer.attributes.actionPoints--;
        this.emitEventToRoom(room.roomId, ServerToClientEvent.DoorClicked, room.navigation.gameMap.tiles);
        const reachability = room.navigation.findReachableTiles(activePlayer, room);
        this.emitEventToRoom(room.roomId, ServerToClientEvent.ReachableTiles, reachability);
        if (this.checkEndTurn(client, activePlayer)) {
            this.onTurnEnded(room);
        }
    }

    private addActionPoints(player: Player) {
        if (this.hasTridentObject(player)) {
            this.updateTridentEffect(player);
        } else {
            player.attributes.actionPoints = DEFAULT_ACTION_POINT;
        }
    }

    private playerInWall(room: Room, player: Player) {
        return room.gameMap.tiles[player.position.x][player.position.y] === TileType.Wall;
    }

    private hasTridentObject(player: Player) {
        return player.inventory.find((items) => items.id === ObjectType.Trident);
    }

    private updateTridentEffect(player: Player) {
        if (player.attributes.actionPoints === DEFAULT_ACTION_POINT) {
            player.attributes.maxActionPoints = MAX_ACTION_POINT;
            player.attributes.actionPoints += DEFAULT_ACTION_POINT;
        } else {
            player.attributes.actionPoints = DEFAULT_ACTION_POINT;
        }
    }

    private async handleFallingOnIce(room: Room, client: Socket) {
        if (!room.navigation.isBot) {
            this.stopGameTimers(room);
            client.emit(ServerToClientEvent.PlayerFell);
        } else {
            await this.delay(PLAYER_FELL_DELAY);
            this.onTurnEnded(room);
        }
    }

    private isTileIce(room: Room, tile: Position) {
        return room.gameMap.tiles[tile.x][tile.y] === TileType.Ice;
    }

    private isObject(room: Room, tile: Position) {
        const objectId = room.gameMap.itemPlacement[tile.x][tile.y];
        return (objectId > NO_ITEM && objectId <= ObjectType.Random) || this.isOjectFlag(room, tile);
    }

    private isOjectFlag(room: Room, tile: Position) {
        return room.gameMap.itemPlacement[tile.x][tile.y] === ObjectType.Flag;
    }

    private checkFlagModeEndGame(player: Player, room: Room) {
        const hasPlayerFlag = player.inventory.find((object) => object.id === ObjectType.Flag);
        const isPlayerOnSpawn = player.position.x === player.spawnPosition.x && player.position.y === player.spawnPosition.y;
        if (isPlayerOnSpawn && hasPlayerFlag) {
            this.onEndGame(player, room);
            this.gameLogsService.sendEndGameLog(room.listPlayers, room.roomId, this.getServer());
        }
    }

    private checkAttack(room: Room) {
        const activePlayer = this.getActivePlayer(room);
        if (room.navigation.checkAttack(activePlayer, room.listPlayers) && room.navigation.hasActionPoints(activePlayer)) {
            const targets = room.navigation.getNeighborPlayers(activePlayer, room.listPlayers);
            this.emitEventToRoom(room.roomId, ServerToClientEvent.AttackAround, { attackAround: true, targets });
        } else {
            this.emitEventToRoom(room.roomId, ServerToClientEvent.AttackAround, false);
        }
    }

    private checkDoors(room: Room) {
        const activePlayer = this.getActivePlayer(room);
        if (room.navigation.checkDoor(activePlayer, room.listPlayers) && room.navigation.hasActionPoints(activePlayer)) {
            const targets = room.navigation.getNeighborDoors(activePlayer, room.listPlayers);
            this.emitEventToRoom(room.roomId, ServerToClientEvent.DoorAround, { doorAround: true, targets });
        } else {
            this.emitEventToRoom(room.roomId, ServerToClientEvent.DoorAround, false);
        }
    }

    private freeUpAvatar(room: Room, socket: Socket) {
        if (socket.data.clickedAvatar) {
            const previousAvatar = this.getAvatarByName(room, socket.data.clickedAvatar);
            if (previousAvatar) {
                previousAvatar.isTaken = false;
            }
        }
    }

    private getCost(tileType: number, activePlayer: Player): number {
        switch (tileType) {
            case TileType.Ground:
                return TileCost.Ground;
            case TileType.Water:
                return TileCost.Water;
            case TileType.Ice:
                return TileCost.Ice;
            case TileType.OpenDoor:
                return TileCost.OpenDoor;
            case TileType.Wall:
                return this.hasKuneeItem(activePlayer) ? TileCost.Ground : Infinity;
            default:
                return Infinity;
        }
    }

    private hasKuneeItem(player: Player) {
        return player.inventory.find((objects) => objects.id === ObjectType.Kunee);
    }

    private checkFell(): boolean {
        const randomValue = Math.random();
        return randomValue > FALLING_PROBABILITY;
    }

    private generateUniquePlayerName(playerName: string, socket: Socket): string {
        let name = playerName;
        let suffix = 2;

        while (this.isPlayerNameTaken(name, socket)) {
            name = `${playerName}-${suffix}`;
            suffix++;
        }
        return name;
    }

    private getAvatarByName(room: Room, avatar: Avatar) {
        return room.availableAvatars.find((av) => av.name === avatar.name);
    }

    private getPlayerConnectedInRoom(room: Room) {
        return room.listPlayers.filter((player) => player.status !== Status.Disconnected);
    }

    private isActivePlayer(socket: Socket) {
        const room = this.roomService.getRoom(socket);
        const currentPlayer = this.getPlayerById(room, socket);
        return currentPlayer.isActive;
    }

    private isLastPlayer(room: Room) {
        return this.getPlayerConnectedInRoom(room).length === SINGLE_PLAYER;
    }

    private isCodeFormatValid(roomCode: string): boolean {
        return /^[0-9]{4}$/.test(roomCode);
    }

    private isPlayerNameTaken(name: string, socket: Socket) {
        const playersList = this.roomService.getRoom(socket).listPlayers;
        return playersList.some((player) => player.name === name);
    }

    private playerTurnTimer(room: Room) {
        this.getTurnTimer(room.roomId).resetTimer(TURN_TIME, (timeRemaining) => {
            this.emitEventToRoom(room.roomId, ServerToClientEvent.StartedTurnTimer, timeRemaining);
            if (timeRemaining <= 0) {
                this.onTurnEnded(room);
            }
        });
    }

    private sendAvatarListToClient(socket: Socket) {
        const room = this.roomService.getRoom(socket);
        const customizedAvatarsList = room.availableAvatars.map((avatar) => {
            const isSelectedByClient = socket.data.clickedAvatar?.name === avatar.name;
            return {
                ...avatar,
                isTaken: !isSelectedByClient && avatar.isTaken,
                isSelected: isSelectedByClient,
            };
        });
        socket.emit(ServerToClientEvent.CharacterSelected, customizedAvatarsList);
    }

    private sortPlayersBySpeed(room: Room) {
        let listPlayers = room.listPlayers;
        if (listPlayers.length > 1) {
            listPlayers.sort((player1, player2) => player2.attributes.speed - player1.attributes.speed);
            listPlayers = [
                ...listPlayers.filter((player) => player.status !== Status.Disconnected),
                ...listPlayers.filter((player) => player.status === Status.Disconnected),
            ];
        }
        room.listPlayers = listPlayers;
    }

    private updateActivePlayer(room: Room) {
        const listPlayers = this.getPlayerConnectedInRoom(room);
        const index = listPlayers.findIndex((item) => item.id === this.getActivePlayer(room).id);
        const previousActivePlayer = listPlayers[index];
        this.addActionPoints(previousActivePlayer);

        if (this.playerInWall(room, previousActivePlayer)) {
            this.removePlayerFromWall(room, previousActivePlayer);
        }
        listPlayers[index] = previousActivePlayer;
        const nextIndex = (index + 1) % listPlayers.length;
        listPlayers[index].isActive = false;
        listPlayers[nextIndex].isActive = true;
    }

    private removePlayerFromWall(room: Room, previousActivePlayer: Player) {
        room.gameMap.itemPlacement[previousActivePlayer.position.x][previousActivePlayer.position.y] = 0;
        this.emitEventToRoom(room.roomId, ServerToClientEvent.UpdateObjectsAfterCombat, {
            newGrid: room.gameMap.itemPlacement,
            position: { x: previousActivePlayer.position.x, y: previousActivePlayer.position.y },
        });

        const destination = room.navigation.movePlayerFromWall(room, previousActivePlayer);
        room.navigation.findFastestPath(previousActivePlayer, destination, room);

        previousActivePlayer.position = destination;
        room.gameMap.itemPlacement[previousActivePlayer.position.x][previousActivePlayer.position.y] = previousActivePlayer.avatar.id;
        this.processTeleportation(room, previousActivePlayer.position);
        this.emitEventToRoom(room.roomId, ServerToClientEvent.UpdateObjectsAfterCombat, {
            newGrid: room.gameMap.itemPlacement,
            position: previousActivePlayer.position,
        });
    }

    private handleAdminDisconnection(room: Room, socket: Socket) {
        if (room.isDebug && room.gameStatus === GameStatus.Started) {
            room.isDebug = false;
            this.emitEventToRoom(room.roomId, ServerToClientEvent.DebugMode, false);
        } else if (room.gameStatus === GameStatus.Lobby) {
            this.roomService.deleteRoom(room.roomId, socket);
        }
    }

    private handleStartedGameDisconnection(room: Room, socket: Socket, player: Player) {
        this.handlePlayerDisconnection(room, socket);
        socket.to(room.roomId).emit(ServerToClientEvent.UpdatePlayerList, room.listPlayers);
        const activePlayer = this.getActivePlayer(room);
        player.position = DISCONNECTED_POSITION;
        if (activePlayer.id !== player.id) {
            const reachability = room.navigation.findReachableTiles(activePlayer, room);
            this.emitEventToRoom(room.roomId, ServerToClientEvent.ReachableTiles, reachability);
        }
    }

    private handlePlayerDisconnection(room: Room, socket: Socket) {
        const disconnectedPlayer = this.getPlayerById(room, socket);
        this.placeItemsOnGround(room, disconnectedPlayer);
        this.handleTurnAfterDisconnection(room, socket, disconnectedPlayer);
        disconnectedPlayer.status = Status.Disconnected;

        if (this.isLastPlayer(room)) {
            this.emitEventToRoom(room.roomId, ServerToClientEvent.DrawGame);
            return;
        }
        this.emitEventToRoom(room.roomId, ServerToClientEvent.PlayerDisconnected, disconnectedPlayer);
        this.sortPlayersBySpeed(room);
    }

    private handleTurnAfterDisconnection(room: Room, socket: Socket, disconnectedPlayer: Player) {
        if (this.isActivePlayer(socket)) {
            disconnectedPlayer.status = Status.PendingDisconnection;
            this.onTurnEnded(room);
        }
    }

    private removePlayerFromRoom(room: Room, socket: Socket) {
        room.listPlayers = room.listPlayers.filter((player) => player.id !== socket.id);
        this.freeUpAvatar(room, socket);
        this.updateAvatarsForAllClients(room.roomId);
        this.roomService.leaveRoom(room.roomId, socket);
        socket.to(room.roomId).emit(ServerToClientEvent.UpdatedPlayer, room);
    }
}
