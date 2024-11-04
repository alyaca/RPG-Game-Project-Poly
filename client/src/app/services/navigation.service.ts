import { Injectable } from '@angular/core';
import { FELLING_PROBABILITY, ObjectType, TileType } from '@app/constants';
import { PointWithDistance } from '@app/interfaces/map-position';
import { Game } from '@common/game';
import { Player, Position } from '@common/player';

const godNameToObjectType = new Map<string, ObjectType>([
    ['Hestia', ObjectType.Hestia],
    ['Zeus', ObjectType.Zeus],
    ['Hera', ObjectType.Hera],
    ['Poseidon', ObjectType.Poseidon],
    ['Artemis', ObjectType.Artemis],
    ['Demeter', ObjectType.Demeter],
    ['Hermes', ObjectType.Hermes],
    ['Athena', ObjectType.Athena],
    ['Hephaestus', ObjectType.Hephaestus],
    ['Apollo', ObjectType.Apollo],
    ['Ares', ObjectType.Ares],
    ['Aphrodite', ObjectType.Aphrodite],
]);

@Injectable({
    providedIn: 'root',
})
export class NavigationService {
    path: Position[];
    players: Player[];
    gameMap: Game;
    fastestPath: Position[] = [];
    initialPositions: Position[] = [];
    positions: number[][];
    private objects: number[][];
    private distances: number[][];
    private previous: Position[][];
    private reachableTiles: Position[];

    initialize(game: Game, players: Player[], objects: number[][]): void {
        this.objects = JSON.parse(JSON.stringify(objects));
        this.gameMap = game;
        this.players = players;
        this.positions = objects;
        this.initializeObjects(objects);
    }

    removePlayer(player: Player): void {
        this.players = this.players.filter((p) => p.id !== player.id);
        this.positions[player.position.x][player.position.y] = 0;
    }

    isInInitialPosition(position: Position): boolean {
        return this.initialPositions.some((initialPosition) => initialPosition.x === position.x && initialPosition.y === position.y);
    }

    isObject(position: Position): boolean {
        return this.objects[position.x][position.y] >= ObjectType.Trident && this.objects[position.x][position.y] <= ObjectType.Spawn;
    }

    getObject(position: Position): number {
        return this.objects[position.x][position.y];
    }

    initializeObjects(objects: number[][]): void {
        for (let i = 0; i < this.objects.length; i++) {
            for (let j = 0; j < this.objects[i].length; j++) {
                if (this.objects[i][j] === ObjectType.Spawn) {
                    this.objects[i][j] = 0;
                    objects[i][j] = 0;
                }
            }
        }
        this.setInitialPositions();
    }

    setInitialPositions(): void {
        for (const player of this.players) {
            this.initialPositions.push({ x: player.position.x, y: player.position.y });
        }
    }

    placePlayers(): Position[] {
        return this.players.map((player) => player.position);
    }

    isPositionWithinBounds(x: number, y: number, array: number[][]): boolean {
        return x >= 0 && y >= 0 && x < array.length && y < array[0].length;
    }

    getActivePlayer(): Player {
        return this.players.find((player) => player.isActive) || this.players[0];
    }

    getPortraitId(godName: string | undefined): ObjectType {
        return godNameToObjectType.get(godName || '') ?? ObjectType.Spawn;
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
        return this.reconstructPath(destination);
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

    findReachableTiles(player: Player, game: Game, maxMovementPoints: number): Position[] {
        this.initializeDistances(player, game);

        const reachableTiles: Position[] = [];
        const priorityQueue: PointWithDistance[] = [{ x: player.position.x, y: player.position.y, distance: 0 }];

        while (priorityQueue.length > 0) {
            const nextNode = this.getNextNode(priorityQueue);
            if (!nextNode || nextNode.distance > maxMovementPoints) continue;

            reachableTiles.push({ x: nextNode.x, y: nextNode.y });
            const neighbors = this.getNeighbors(nextNode, game);
            this.exploreNeighborsForReachableTiles(neighbors, nextNode, priorityQueue, maxMovementPoints, game);
        }
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

    //A enlever peut etre (probalbement)
    checkFell(): boolean {
        const randomValue = Math.random();
        return randomValue > FELLING_PROBABILITY;
    }

    /* TEMPORAIRE
    checkAttack(): boolean {
        console.log(this.getNeighbors(this.getActivePlayer().position, this.gameMap));
        return true;
    }
    */

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
            if (this.positions[newX][newY] >= ObjectType.Hestia) continue;
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

    private getNeighbors(position: Position, game: Game): Position[] {
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

    private exploreNeighbors(neighbors: Position[], current: PointWithDistance, priorityQueue: PointWithDistance[], game: Game): void {
        const { x: currentX, y: currentY, distance: currentDistance } = current;
        for (const neighbor of neighbors) {
            const { x: newX, y: newY } = neighbor;
            if (game.tiles[newX][newY] === TileType.Wall) continue;
            if (this.positions[newX][newY] >= ObjectType.Hestia) continue;
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

    private getTileCost(tileType: number): number {
        switch (tileType) {
            case TileType.Ground:
                return 1;
            case TileType.Water:
                return 2;
            case TileType.Ice:
                return 0;
            case TileType.OpenDoor:
                return 1;
            default:
                return Infinity;
        }
    }
}
