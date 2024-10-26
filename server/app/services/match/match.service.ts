import { Game } from '@common/game';
import { Player } from '@common/player';
import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { RoomService } from '../room/room.service';

//TEMPORAIRE:
enum TileType {
    Ground = 1,
    Ice = 2,
    Water = 3,
    Wall = 4,
    ClosedDoor = 5,
    OpenDoor = 6,
}
//Doivent etre dans un fichier commun
interface Position {
    x: number;
    y: number;
}
interface PointWithDistance {
    x: number;
    y: number;
    distance: number;
}

@Injectable()
export class MatchService {
    private io: Server;
    private game: Game;
    private distances: number[][];
    private previous: Position[][];

    constructor(private roomService: RoomService) {}

    setServer(server: Server): void {
        this.io = server;
    }

    //TODO: retourner la liste des joueurs avec leur position
    processMapObjects(client: Socket): void {
        const players = this.roomService.getRoom(client).listPlayers;
        this.game = this.roomService.getRoom(client).gameMap;
        const spawnPoints = this.getSpawnPoints(this.game.itemPlacement);
        this.assignPlayersToSpawnPoints(players, spawnPoints);

        //TEMPORAIRE:
        console.log('MAP : ', this.game.tiles);

        // players[0].position = { x: 9, y: 0 };
        console.log('Position du joueur : ', players[0].position, 'Destination : ', { x: 0, y: 9 });
        this.findFastestPath(client, players[0], { x: 0, y: 9 });

        console.log('Position du joueur : ', players[0].position, 'Points de mouvement : ', 5);
        this.findReachableTiles(client, players[0], this.game, 5);
        //Fin TEMPORAIRE
    }

    private getSpawnPoints(mapObjects: number[][]): Position[] {
        const spawnPoints: Position[] = [];
        for (let x = 0; x < mapObjects.length; x++) {
            for (let y = 0; y < mapObjects[x].length; y++) {
                if (mapObjects[x][y] === 8) {
                    spawnPoints.push({ x, y });
                }
            }
        }
        return spawnPoints;
    }

    private assignPlayersToSpawnPoints(players: Player[], spawnPoints: Position[]): void {
        players.forEach((player) => {
            const randomIndex = this.getRandomIndex(spawnPoints.length);
            const selectedSpawnPoint = spawnPoints[randomIndex];
            player.position = { x: selectedSpawnPoint.x, y: selectedSpawnPoint.y };
            spawnPoints.splice(randomIndex, 1); //A verfier
            //Il faut aussi voir si on retourne les point non utilise pour pas les afficher
        });
    }

    private getRandomIndex(max: number): number {
        return Math.floor(Math.random() * max);
    }

    //////////////////////////////////////////////////////////////////
    //Djikstra

    findFastestPath(client: Socket, player: Player, destination: Position): void {
        const grid = this.game.tiles;
        this.initializeDistances(player);

        const priorityQueue: PointWithDistance[] = [];
        priorityQueue.push({ x: player.position.x, y: player.position.y, distance: 0 });

        while (priorityQueue.length > 0) {
            const { x: currentX, y: currentY, distance: currentDistance } = this.getNextNode(priorityQueue);

            if (this.isDestinationReached(currentX, currentY, destination)) break;

            const neighbors = this.getNeighbors(currentX, currentY);
            const currentPosition: PointWithDistance = { x: currentX, y: currentY, distance: currentDistance };
            this.exploreNeighbors(neighbors, currentPosition, priorityQueue);
        }

        const path = this.reconstructPath(destination);
        this.sendPathToClient(client, path);
        //TEST
        console.log('Chemin le plus rapide : ', path);
    }

    private initializeDistances(player: Player): void {
        const dimension = this.game.dimension;
        this.distances = Array.from({ length: dimension }, () => Array(dimension).fill(Infinity));
        this.previous = Array.from({ length: dimension }, () => Array(dimension).fill(null));
        this.distances[player.position.x][player.position.y] = 0;
    }

    private getNextNode(priorityQueue: PointWithDistance[]): PointWithDistance {
        priorityQueue.sort((a, b) => a.distance - b.distance);
        return priorityQueue.shift();
    }

    private isDestinationReached(currentX: number, currentY: number, destination: Position): boolean {
        return currentX === destination.x && currentY === destination.y;
    }

    private getNeighbors(x: number, y: number): Position[] {
        const dimension = this.game.dimension;
        const directions = [
            { dx: 0, dy: 1 }, // Droite
            { dx: 0, dy: -1 }, // Gauche
            { dx: 1, dy: 0 }, // Bas
            { dx: -1, dy: 0 }, // Haut
        ];

        return directions
            .map(({ dx, dy }) => ({ x: x + dx, y: y + dy }))
            .filter(({ x: newX, y: newY }) => this.isValidTile(newX, newY, dimension, dimension));
    }

    private exploreNeighbors(neighbors: Position[], actualPosition: PointWithDistance, priorityQueue: PointWithDistance[]): void {
        const grid = this.game.tiles;
        const { x: currentX, y: currentY, distance: currentDistance } = actualPosition;
        for (const { x: newX, y: newY } of neighbors) {
            if (grid[newX][newY] !== TileType.Wall) {
                const tileCost = this.getTileCost(grid[newX][newY]);
                const newDistance = currentDistance + tileCost;

                if (newDistance < this.distances[newX][newY]) {
                    this.distances[newX][newY] = newDistance;
                    this.previous[newX][newY] = { x: currentX, y: currentY };
                    priorityQueue.push({ x: newX, y: newY, distance: newDistance });
                }
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

    private sendPathToClient(client: Socket, path: Position[]): void {
        client.emit('fastestPath', path);
    }

    private isValidTile(x: number, y: number, numRows: number, numCols: number): boolean {
        return x >= 0 && x < numRows && y >= 0 && y < numCols;
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

    /////////////////////////////
    //prévisualisation des cases atteignables
    findReachableTiles(client: Socket, player: Player, game: Game, maxMovementPoints: number): void {
        this.initializeDistances(player);

        const reachableTiles: Position[] = [];
        const priorityQueue: PointWithDistance[] = [];
        priorityQueue.push({ x: player.position.x, y: player.position.y, distance: 0 });

        while (priorityQueue.length > 0) {
            const { x: currentX, y: currentY, distance: currentDistance } = this.getNextNode(priorityQueue);

            if (currentDistance > maxMovementPoints) continue;
            reachableTiles.push({ x: currentX, y: currentY });
            const neighbors = this.getNeighbors(currentX, currentY);
            const currentPosition: PointWithDistance = { x: currentX, y: currentY, distance: currentDistance };
            this.exploreNeighborsForReachableTiles(neighbors, currentPosition, priorityQueue, maxMovementPoints);
        }

        this.sendReachableTilesToClient(client, reachableTiles);
        /////////////////////////////
        //TEST
        console.log('Cases atteignables : ', reachableTiles);
    }

    private exploreNeighborsForReachableTiles(
        neighbors: Position[],
        currentPosition: PointWithDistance,
        priorityQueue: PointWithDistance[],
        maxMovementPoints: number,
    ): void {
        const grid = this.game.tiles;
        const { x: currentX, y: currentY, distance: currentDistance } = currentPosition;
        for (const { x: newX, y: newY } of neighbors) {
            if (grid[newX][newY] === TileType.Wall) {
                console.log('TileType : ', newX, ' ', newY, ' ', grid[newX][newY]);
            }
            if (grid[newX][newY] !== TileType.Wall) {
                const tileCost = this.getTileCost(grid[newX][newY]);
                const newDistance = currentDistance + tileCost;

                if (newDistance < this.distances[newX][newY] && newDistance <= maxMovementPoints) {
                    this.distances[newX][newY] = newDistance;
                    this.previous[newX][newY] = { x: currentX, y: currentY };
                    priorityQueue.push({ x: newX, y: newY, distance: newDistance });
                }
            }
        }
    }

    private sendReachableTilesToClient(client: Socket, reachableTiles: Position[]): void {
        client.emit('reachableTiles', reachableTiles);
    }
}
