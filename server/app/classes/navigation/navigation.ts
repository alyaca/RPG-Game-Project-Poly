import { TileCost, TileType } from '@app/constants';
import { Game } from '@common/game';
import { Player, Position } from '@common/player';

//TODO: replacer dans un fichier commun
export interface PointWithDistance {
    x: number;
    y: number;
    distance: number;
}

export class Navigation {
    private reachableTiles: Position[];
    private distances: number[][];
    private previous: Position[][];
    positions: number[][];
    path: Position[];
    players: Player[];

    gameMap: Game;

    constructor() {}

    initializeNavigation(gameMap: Game, objects: number[][], players: Player[]): void {
        this.gameMap = gameMap;
        this.positions = objects;
        this.players = players;
    }

    findFastestPath(player: Player, destination: Position, game: Game): Position[] {
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
        //return this.reconstructPath(destination);
        return path;
    }

    isReachableTile(row: number, col: number): boolean {
        return this.reachableTiles.some((tile) => tile.x === row && tile.y === col);
    }

    initializeDistances(player: Player, game: Game): void {
        const dimension = game.dimension;
        this.distances = Array.from({ length: dimension }, () => Array(dimension).fill(Infinity));
        this.previous = Array.from({ length: dimension }, () => Array(dimension).fill(null));
        this.distances[player.position.x][player.position.y] = 0;
    }

    findReachableTiles(player: Player, game: Game): Position[] {
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
        this.reachableTiles = reachableTiles;
        return reachableTiles;
    }

    navigateToTile(player: Player, destination: Position, game: Game): Position[] {
        if (this.isReachableTile(destination.x, destination.y)) {
            this.path = this.findFastestPath(player, destination, game);
            if (this.path.length > 0) {
                this.path.shift();
                return this.path;
            }
        }
        return [];
    }

    getTileCost(tileType: number): number {
        switch (tileType) {
            case TileType.Ground:
                return TileCost.Ground;
            case TileType.Water:
                return TileCost.Water;
            case TileType.Ice:
                return TileCost.Ice;
            case TileType.OpenDoor:
                return TileCost.OpenDoor;
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
            if (game.tiles[newX][newY] === TileType.Wall) continue;
            if (this.players.some((player) => player.position.x === newX && player.position.y === newY)) continue;
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
            if (game.tiles[newX][newY] === TileType.Wall) continue;
            if (this.players.some((player) => player.position.x === newX && player.position.y === newY)) continue;
            //if (this.positions[newX][newY] >= ObjectType.Hestia) continue;
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

    haveActions(player: Player, players: Player[]): boolean {
        if (this.checkAttack(player, players) || this.checkDoor(player, players)) {
            return true;
        }
        return false;
    }

    checkAttack(player: Player, players: Player[]): Player | undefined {
        const neighbors = this.getNeighbors(player.position, this.gameMap);
        for (const neighbor of neighbors) {
            if (this.hasPlayerOnTile(neighbor, players)) {
                return players.find((player) => player.position.x === neighbor.x && player.position.y === neighbor.y);
            }
        }
        return undefined;
    }

    checkDoor(player: Player, players: Player[]): Position | undefined {
        const neighbors = this.getNeighbors(player.position, this.gameMap);
        for (const neighbor of neighbors) {
            if (this.isTileDoor(neighbor) && !this.hasPlayerOnTile(neighbor, players)) {
                return neighbor;
            }
        }
        return undefined;
    }

    hasPlayerOnTile(position: Position, players: Player[]) {
        return players.some((player) => player.position.x === position.x && player.position.y === position.y);
    }

    hasActionPoints(player: Player) {
        return player?.attributes.actionPoints > 0;
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
