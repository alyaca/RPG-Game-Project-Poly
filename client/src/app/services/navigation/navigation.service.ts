import { Injectable } from '@angular/core';
import { MapPosition } from '@app/interfaces/map-position';
import { ObjectType } from '@common/avatars-info';
import { TileType } from '@common/constants';
import { Game } from '@common/interfaces/game';
import { Player, Position } from '@common/interfaces/player';

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
    isDebugMode: boolean = false;
    reachableTiles: Position[];
    objects: number[][];

    initialize(game: Game, players: Player[], objects: number[][]): void {
        this.objects = JSON.parse(JSON.stringify(objects));
        this.gameMap = game;
        this.players = players;
        this.positions = objects;
        this.initializeObjects(objects);
    }

    updateObjects(items: number[][]) {
        this.objects = JSON.parse(JSON.stringify(items));
    }

    updateTile(activePlayer: Player): void {
        if (this.isInInitialPosition(activePlayer.position)) {
            this.positions[activePlayer.position.x][activePlayer.position.y] = ObjectType.Spawn;
        } else if (this.isObject(activePlayer.position)) {
            this.positions[activePlayer.position.x][activePlayer.position.y] = this.getObject(activePlayer.position);
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

    displayPortraitsOnSpawnPoints(players: Player[], objects: number[][]) {
        for (const player of players) {
            const { x, y } = player.position;
            if (this.isPositionWithinBounds(x, y, objects)) {
                objects[x][y] = this.getPortraitId(player.avatar?.name);
            }
        }
        return objects;
    }

    placeAvatar(playerToPlace: Player, objects: number[][]) {
        objects[playerToPlace.position.x][playerToPlace.position.y] = this.getPortraitId(playerToPlace.avatar?.name);
        return objects;
    }

    navigateToTile(position: Position, player: Player, objects: number[][]) : [number[][], Player] {
        this.reachableTiles = [];
        if (player) {
            this.updateTile(player);
            player.position = position;
            return [this.placeAvatar(player, objects), player];
        }
        return [objects, player];
    }

    respawnPlayer(position: Position, player: Player, objects: number[][]) {
        let playerToPlace = this.players.find((players) => players.id === player.id);
        if (!playerToPlace) return objects;
        playerToPlace.position = position;
        this.updateTile(playerToPlace);
        return this.placeAvatar(player, objects);
    }

    setInitialPositions(): void {
        for (const player of this.players) {
            this.initialPositions.push({ x: player.position.x, y: player.position.y });
        }
    }

    isPlayerOnTile(position: MapPosition, player: Player) {
        return player.position.x === position.row && player.position.y === position.col;
    }

    
    noInteractionPossible(position: MapPosition, tiles: number[][], player: Player) {
        return this.isReachableTile(position) && !this.isTileAClosedDoor(tiles, position)  && !this.isPlayerOnTile(position, player);
    }

    isTileAClosedDoor(tiles: number[][], position: MapPosition) {
        return tiles[position.row][position.col] === TileType.ClosedDoor;
    }

    findPath(position: MapPosition, activePlayer: Player, defaultPath: Position[]) {
        if(this.isPlayerOnTile(position, activePlayer)) {
            return [];
        }
        return defaultPath;
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

    isReachableTile(position: MapPosition): boolean {
        return this.reachableTiles.some((tile) => tile.x === position.row && tile.y === position.col);
    }

    isNeighbor({ x, y }: Position, player: Player): boolean {
        const neighbors = this.getNeighbors(player.position, this.gameMap);
        return neighbors.some((neighbor) => neighbor.x === x && neighbor.y === y);
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
