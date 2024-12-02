import { NO_ITEM } from '@app/constants';
import { ObjectType } from '@common/avatars-info';
import { TileCost, TileType } from '@common/constants';
import { Game } from '@common/interfaces/game';
import { Player, Position } from '@common/interfaces/player';
import { PointWithDistance } from '@common/interfaces/point-distance.interface';
import { Room } from '@common/interfaces/room';
import { ActionData } from '@common/interfaces/socket-data.interface';

export class Navigation {
    gameMap: Game;
    path: Position[];
    players: Player[];
    positions: number[][];

    isBot: boolean = false;
    private distances: number[][];
    private previous: Position[][];
    private destination: Position;

    constructor(gameMap: Game, objects: number[][], players: Player[]) {
        this.gameMap = gameMap;
        this.positions = objects;
        this.players = players;
    }

    findFastestPath(player: Player, destination: Position, room: Room): Position[] {
        this.destination = destination;
        const game = room.gameMap;
        this.initializeDistances(player, game);

        const priorityQueue: PointWithDistance[] = [{ x: player.position.x, y: player.position.y, distance: 0 }];

        while (priorityQueue.length > 0) {
            const nextNode = this.getNextNode(priorityQueue);

            if (!nextNode || this.isDestinationReached(nextNode, destination)) break;

            const neighbors = this.getNeighbors(nextNode, game);
            this.exploreNeighbors(neighbors, nextNode, priorityQueue, game);
        }
        const path = this.reconstructPath(destination);
        path.shift();
        return path;
    }

    isReachableTile(row: number, col: number): boolean {
        return (this.destination.x === row && this.destination.y === col) || !this.hasPlayerOnTile({ x: row, y: col }, this.players);
    }

    initializeDistances(player: Player, game: Game): void {
        const dimension = game.dimension;
        this.distances = Array.from({ length: dimension }, () => Array(dimension).fill(Infinity));
        this.previous = Array.from({ length: dimension }, () => Array(dimension).fill(null));
        this.distances[player.position.x][player.position.y] = 0;
    }

    findReachableTiles(player: Player, room: Room): Position[] {
        const game = room.gameMap;
        this.initializeDistances(player, game);
        const maxMovementPoints = player.attributes.movementPointsLeft;

        const reachableTiles: Position[] = [];
        const priorityQueue: PointWithDistance[] = [{ x: player.position.x, y: player.position.y, distance: 0 }];

        while (priorityQueue.length > 0) {
            const nextNode = this.getNextNode(priorityQueue);
            if (!nextNode || nextNode.distance > maxMovementPoints) continue;

            reachableTiles.push({ x: nextNode.x, y: nextNode.y });
            const neighbors = this.getNeighbors(nextNode, game);
            this.exploreNeighborsForReachableTiles(neighbors, nextNode, priorityQueue, maxMovementPoints, game);
        }
        reachableTiles.shift();
        return reachableTiles;
    }

    getTileCost(tileType: number): number {
        const player = this.players.find((players) => players.isActive);
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
                if (player?.inventory.find((object) => object.id === ObjectType.Kunee)) {
                    return TileCost.Ground;
                }
                return Infinity;
            default:
                return Infinity;
        }
    }

    isNeighbor(row: number, col: number, player: Player): boolean {
        const neighbors = this.getNeighbors(player.position, this.gameMap);
        return neighbors.some((neighbor) => neighbor.x === row && neighbor.y === col);
    }

    getNeighbors(position: Position, game: Game): Position[] {
        const directions = [
            { dx: 0, dy: 1 },
            { dx: 0, dy: -1 },
            { dx: 1, dy: 0 },
            { dx: -1, dy: 0 },
        ];
        return directions
            .map(({ dx, dy }) => ({ x: position.x + dx, y: position.y + dy }))
            .filter(({ x, y }) => this.isValidTile(x, y, game.dimension));
    }

    hasHandleDoorAction(row: number, col: number, player: Player) {
        if (this.isNeighbor(row, col, player) && this.isTileDoor({ x: row, y: col })) {
            this.gameMap.tiles[row][col] = this.toggleDoorState(this.gameMap.tiles[row][col]);
            return true;
        }
        return false;
    }

    getCombatOpponent(combatActionData: ActionData) {
        const neighborPlayers = this.getNeighborPlayers(combatActionData.player, this.players);
        if (this.hasPlayerOnTile(combatActionData.clickedPosition, neighborPlayers)) {
            return this.getPlayerWithPosition(combatActionData.clickedPosition, this.players);
        }
        return null;
    }

    getPlayerWithPosition(position: Position, players: Player[]) {
        return players.find((player) => player.position.x === position.x && player.position.y === position.y);
    }

    haveActions(player: Player, players: Player[]): boolean {
        return this.hasActionPoints(player) && (this.checkAttack(player, players) || this.checkDoor(player, players));
    }

    checkAttack(player: Player, players: Player[]): boolean {
        return this.getNeighborPlayers(player, players).length > 0;
    }

    getNeighborPlayers(player: Player, players: Player[]): Player[] {
        const neighbors = this.getNeighbors(player.position, this.gameMap);
        const neighboringPlayers: Player[] = [];
        for (const neighbor of neighbors) {
            if (this.hasPlayerOnTile(neighbor, players)) {
                const foundPlayer = players.find((p) => p.position.x === neighbor.x && p.position.y === neighbor.y);
                if (foundPlayer) {
                    neighboringPlayers.push(foundPlayer);
                }
            }
        }
        return neighboringPlayers;
    }

    getNeighborDoors(player: Player, players: Player[]): Position[] {
        const neighbors = this.getNeighbors(player.position, this.gameMap);
        const doors: Position[] = [];
        for (const neighbor of neighbors) {
            if (this.isTileDoor(neighbor) && !this.hasPlayerOnTile(neighbor, players)) {
                doors.push(neighbor);
            }
        }
        return doors;
    }

    checkDoor(player: Player, players: Player[]): boolean {
        return this.getNeighborDoors(player, players).length > 0;
    }

    hasPlayerOnTile(position: Position, players: Player[]) {
        return players.some((player) => player.position.x === position.x && player.position.y === position.y);
    }

    hasActionPoints(player: Player) {
        return player?.attributes.actionPoints > 0;
    }

    movePlayerFromWall(room: Room, player: Player): Position {
        return this.findClosestValidTile(player, room);
    }

    findClosestValidTile(player: Player, room: Room): Position {
        const game = room.gameMap;
        this.initializeDistances(player, game);
        const priorityQueue: PointWithDistance[] = [{ x: player.position.x, y: player.position.y, distance: 0 }];

        while (priorityQueue.length > 0) {
            const nextNode = this.getNextNode(priorityQueue);
            if (!nextNode) break;

            const neighbors = this.getNeighbors(nextNode, game);
            for (const neighbor of neighbors) {
                if (this.isTileValidForPlayer(neighbor.x, neighbor.y)) {
                    return neighbor;
                }
                this.exploreNeighbors(neighbors, nextNode, priorityQueue, game);
            }
        }
        return player.position;
    }

    isTileValidForPlayer(row: number, col: number): boolean {
        if (this.gameMap.tiles[row][col] === TileType.Wall) return false;
        if (this.gameMap.tiles[row][col] === TileType.ClosedDoor) return false;
        if (this.gameMap.tiles[row][col] === TileType.OpenDoor) return false;
        if (this.hasPlayerOnTile({ x: row, y: col }, this.players)) return false;
        if (this.gameMap.itemPlacement[row][col] !== NO_ITEM) return false;
        return true;
    }

    findClosestPlayer(player: Player, players: Player[], room: Room): Player | undefined {
        const reachability = this.findReachableTiles(player, room);
        for (const tile of reachability) {
            for (const pl of players) {
                if (pl.position.x === tile.x && pl.position.y === tile.y) {
                    return pl;
                }
            }
        }
        return undefined;
    }

    hasMovementPoints(player: Player) {
        return player?.attributes.movementPointsLeft > 0;
    }

    isTileValid(row: number, col: number): boolean {
        if (this.gameMap.tiles[row][col] === TileType.Wall) return false;
        if (this.gameMap.tiles[row][col] === TileType.ClosedDoor) return false;
        if (this.gameMap.tiles[row][col] === TileType.OpenDoor) return false;
        if (this.hasPlayerOnTile({ x: row, y: col }, this.players)) return false;
        if (this.gameMap.itemPlacement[row][col] === NO_ITEM || this.gameMap.itemPlacement[row][col] === ObjectType.Spawn) return true;
        return false;
    }

    private exploreNeighborsForReachableTiles(
        neighbors: Position[],
        current: PointWithDistance,
        priorityQueue: PointWithDistance[],
        maxMovementPoints: number,
        game: Game,
    ): void {
        const { x: currentX, y: currentY, distance: currentDistance } = current;
        for (const neighbor of neighbors) {
            const { x: newX, y: newY } = neighbor;
            if (!this.isBot && this.hasPlayerOnTile(neighbor, this.players)) continue;
            const tileCost = this.getTileCost(game.tiles[newX][newY]);
            const newDistance = currentDistance + tileCost;

            if (newDistance < this.distances[newX][newY] && newDistance <= maxMovementPoints) {
                this.distances[newX][newY] = newDistance;
                this.previous[newX][newY] = { x: currentX, y: currentY };
                priorityQueue.push({ x: newX, y: newY, distance: newDistance });
            }
        }
    }

    private getNextNode(priorityQueue: PointWithDistance[]): PointWithDistance | undefined {
        priorityQueue.sort((a, b) => a.distance - b.distance);
        return priorityQueue.shift();
    }

    private isDestinationReached(position: PointWithDistance, destination: Position): boolean {
        return position.x === destination.x && position.y === destination.y;
    }

    private exploreNeighbors(neighbors: Position[], current: PointWithDistance, priorityQueue: PointWithDistance[], game: Game): void {
        const { x: currentX, y: currentY, distance: currentDistance } = current;
        for (const neighbor of neighbors) {
            const { x: newX, y: newY } = neighbor;
            if (!this.isReachableTile(newX, newY) && this.isBot) continue;
            if (!this.isBot && this.hasPlayerOnTile(neighbor, this.players)) continue;
            const tileCost = this.getTileCost(game.tiles[newX][newY]);
            const newDistance = currentDistance + tileCost;
            if (newDistance < this.distances[newX][newY]) {
                this.distances[newX][newY] = newDistance;
                this.previous[newX][newY] = { x: currentX, y: currentY };
                priorityQueue.push({ x: newX, y: newY, distance: newDistance });
            }
        }
    }

    private reconstructPath(destination: Position): Position[] {
        const path: Position[] = [];
        let current = destination;

        while (current) {
            path.push(current);
            current = this.previous[current.x][current.y];
        }
        return path.reverse();
    }

    private isValidTile(x: number, y: number, dimension: number): boolean {
        return x >= 0 && y >= 0 && x < dimension && y < dimension;
    }

    private isTileDoor(position: Position) {
        return this.gameMap.tiles[position.x][position.y] === TileType.ClosedDoor || this.gameMap.tiles[position.x][position.y] === TileType.OpenDoor;
    }

    private toggleDoorState(clickedDoor: TileType) {
        switch (clickedDoor) {
            case TileType.ClosedDoor:
                return TileType.OpenDoor;
            case TileType.OpenDoor:
                return TileType.ClosedDoor;
            default:
                return clickedDoor;
        }
    }
}
