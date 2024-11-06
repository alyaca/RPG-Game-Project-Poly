import { Player } from '@common/player';

export interface LogMessage {
    id: number;
    timestamp: Date;
    message: string;
    players: Player[];
}
