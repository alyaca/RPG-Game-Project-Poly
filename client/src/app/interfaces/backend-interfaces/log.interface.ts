import { Player } from '@common/player';

export interface ILogMessage {
    message: string;
    timestamp: Date;
    players: Player[];
}
