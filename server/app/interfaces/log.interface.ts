import { Player } from '@common/player';

export interface ILogMessage {
    id: number;
    message: string;
    timestamp: Date;
    players: Player[];
}
