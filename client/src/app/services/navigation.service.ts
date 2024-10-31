import { Injectable } from '@angular/core';
import { Game } from '@common/game';
import { Player, Position } from '@common/player';

// TEMPORAIRE:
enum TileType {
    Ground = 1,
    Ice = 2,
    Water = 3,
    Wall = 4,
    ClosedDoor = 5,
    OpenDoor = 6,
}
// Doivent etre dans un fichier commun

interface PointWithDistance {
    x: number;
    y: number;
    distance: number;
}
@Injectable({
    providedIn: 'root',
})
export class NavigationService {
    private distances: number[][];
    private previous: Position[][];
    // private game: Game;
    constructor() {}

    /// ///////////////////////////////////////////////////////////////
    // Djikstra
    // Trouver le chemin le plus rapide
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

    private initializeDistances(player: Player, game: Game): void {
        const dimension = game.dimension;
        this.distances = Array.from({ length: dimension }, () => Array(dimension).fill(Infinity));
        this.previous = Array.from({ length: dimension }, () => Array(dimension).fill(null));
        this.distances[player.position.x][player.position.y] = 0;
    }

    private getNextNode(priorityQueue: PointWithDistance[]): PointWithDistance | undefined {
        priorityQueue.sort((a, b) => a.distance - b.distance);
        return priorityQueue.shift();
    }

    private isDestinationReached(position: PointWithDistance, destination: Position): boolean {
        return position.x === destination.x && position.y === destination.y;
    }

    private getNeighbors(position: PointWithDistance, game: Game): Position[] {
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

    // Prévisualisation des cases atteignables
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
        return reachableTiles;
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

            const tileCost = this.getTileCost(game.tiles[newX][newY]);
            const newDistance = currentDistance + tileCost;

            if (newDistance < this.distances[newX][newY] && newDistance <= maxMovementPoints) {
                this.distances[newX][newY] = newDistance;
                this.previous[newX][newY] = { x: currentX, y: currentY };
                priorityQueue.push({ x: newX, y: newY, distance: newDistance });
            }
        }
    }
}
