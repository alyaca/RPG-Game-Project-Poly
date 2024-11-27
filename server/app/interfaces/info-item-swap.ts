import { GameObject } from '@common/game-object';
import { Player } from '@common/player';
import { Server, Socket } from 'socket.io';
export interface InfoSwap {
    server?: Server;
    client?: Socket;
    player?: Player;
    oldInventory?: GameObject[];
    modifiedInventory?: GameObject[];
    droppedItem?: number;
}
