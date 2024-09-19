export interface Game {
    _id: string;
    name: string;
    description: string;
    visible: boolean;
    mode: string;
    nbPlayers: number;
    image: string;
    dimension: string;
    tiles: number[];
    itemPlacement: number[];
    isSelected: boolean;
    lastModification: Date;
}
