import { TileCost, TileType } from '@app/constants';
import { ObjectType } from '@common/avatars-info';
import { Game } from '@common/game';
import { Player, Position } from '@common/player';
import { PointWithDistance } from '@common/point-distance.interface';

export class Navigation {
    gameMap: Game;
    path: Position[];
    players: Player[];
    positions: number[][];
    private reachableTiles: Position[];
    private distances: number[][];
    private previous: Position[][];

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
        return path;
    }

    movePlayerFromWall(activePlayer: Player) {
        // this.updateTile(activePlayer);
        let currentX = activePlayer.position.x;
        let loopCounter = 0;
        let currentY = activePlayer.position.y;
        let directionsIndex = 0;
        const directions = [
            { dx: 0, dy: 1 },
            { dx: 0, dy: -1 },
            { dx: 1, dy: 0 },
            { dx: -1, dy: 0 },
        ];
        while (
            this.gameMap.tiles[currentX][currentY] === TileType.Wall ||
            (this.gameMap.tiles[currentX][currentY] === TileType.ClosedDoor && this.positions[currentX][currentY] === 0)
        ) {
            currentX += loopCounter * directions[directionsIndex].dx;
            currentY += loopCounter * directions[directionsIndex].dy;
            directionsIndex = (directionsIndex + 1) % directions.length;
            loopCounter += 1;
        }
        activePlayer.position.x = currentX;
        activePlayer.position.y = currentY;
        return this.reconstructPath(activePlayer.position);
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
        const player = this.players.find((player) => player.isActive);
        switch (tileType) {
            case TileType.Ground:
                return TileCost.Ground;
            case TileType.Water:
                return TileCost.Water;
            case TileType.Ice:
                return TileCost.Ice;
            case TileType.OpenDoor:
                return TileCost.OpenDoor;
            case TileType.Wall :
                console.log('getting tile cost');
                if(player!.inventory.find((object) => object.id === ObjectType.Kunee))
                {
                    console.log("player can walk through walls");
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
                return players.find((p) => p.position.x === neighbor.x && p.position.y === neighbor.y);
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
