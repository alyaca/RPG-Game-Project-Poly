import { SPAWN_POINT_ID } from '@app/constants';
import { RoomService } from '@app/services/room/room.service';
import { Game } from '@common/interfaces/game';
import { Player, Position } from '@common/interfaces/player';
import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';

@Injectable()
export class MatchService {
    private game: Game;

    constructor(private roomService: RoomService) {}

    processMapObjects(client: Socket): void {
        const players = this.roomService.getRoom(client).listPlayers;
        this.game = this.roomService.getRoom(client).gameMap;
        const spawnPoints = this.getSpawnPoints(this.game.itemPlacement);
        this.assignPlayersToSpawnPoints(players, spawnPoints);
    }

    private getSpawnPoints(mapObjects: number[][]): Position[] {
        const spawnPoints: Position[] = [];
        for (let x = 0; x < mapObjects.length; x++) {
            for (let y = 0; y < mapObjects[x].length; y++) {
                if (mapObjects[x][y] === SPAWN_POINT_ID) {
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
            player.spawnPosition = player.position;
            spawnPoints.splice(randomIndex, 1);
        });
    }

    private getRandomIndex(max: number): number {
        return Math.floor(Math.random() * max);
    }
}
