import { Position } from "./player";

export interface GlobalPostGameStats {
    gameDuration: string;
    turns: number;
    globalTilesVisited: Position[];
    doorsInteracted: number;
    nbFlagBearers: number;
}
