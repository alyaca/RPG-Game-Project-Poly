import { Player } from './player';

export interface PostGameStat {
    id: number;
    key: keyof Player['postGameStats'];
    displayTxt: string;
    explanations: string;
}