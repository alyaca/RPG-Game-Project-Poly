import { Injectable } from '@angular/core';
import { ObjectType } from '@common/avatars-info';
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
    activePlayer: Player;
    fastestPath: Position[] = [];
    initialPositions: Position[] = [];
    positions: number[][];
    private objects: number[][];
    private reachableTiles: Position[];

    initialize(game: Game, players: Player[], objects: number[][]): void {
        this.objects = JSON.parse(JSON.stringify(objects));
        this.gameMap = game;
        this.players = players;
        this.positions = objects;
        this.initializeObjects(objects);
    }

    updateObjects(items : number[][])
    {
        this.objects = items;
    }

    updateTile(activePlayer: Player, itemToPlace: number): void {
        if (this.isInInitialPosition(activePlayer.position)) {
            this.positions[activePlayer.position.x][activePlayer.position.y] = ObjectType.Spawn;
        } else if (this.isObject(activePlayer.position)) {
            console.log()
            this.positions[activePlayer.position.x][activePlayer.position.y] = itemToPlace!;
            this.objects[activePlayer.position.x][activePlayer.position.y] = itemToPlace!;
        } else {
            this.positions[activePlayer.position.x][activePlayer.position.y] = 0;
        }
    }

    removePlayer(player: Player): void {
        this.positions[player.position.x][player.position.y] = 0;
    }

    isInInitialPosition(position: Position): boolean {
        return this.players.some((player) => player.spawnPosition.x === position.x && player.spawnPosition.y === position.y);
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

    getPortraitId(godName: string | undefined): ObjectType {
        return godNameToObjectType.get(godName || '') ?? ObjectType.Spawn;
    }

    isReachableTile(row: number, col: number): boolean {
        return this.reachableTiles.some((tile) => tile.x === row && tile.y === col);
    }

    getActivePlayer(): Player {
        return this.players.find((player) => player.isActive) || this.players[0];
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

    private isValidTile(x: number, y: number, dimension: number): boolean {
        return x >= 0 && y >= 0 && x < dimension && y < dimension;
    }
}
