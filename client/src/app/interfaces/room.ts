import { Map } from './map';

export interface Room {
    id: string;
    map: Map;
    listPlayers: []; // Interface of Player[]
    isLocked: boolean;
}
