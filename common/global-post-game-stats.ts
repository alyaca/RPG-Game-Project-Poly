import { Position } from "./player";
import { PostGameStat } from "./post-game-stat";

export interface GlobalPostGameStats {
    gameDuration: string;
    turns: number;
    globalTilesVisited: Position[];
    doorsInteracted: Position[];
    nbFlagBearers: number;
}

export interface GlobalPostGameStat extends Omit<PostGameStat, 'key'> {
    key: keyof GlobalPostGameStats;
}