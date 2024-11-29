import { Player, Position } from '@common/interfaces/player';

export interface DoorActionData {
    clickedPosition: Position;
    player: Player;
}
