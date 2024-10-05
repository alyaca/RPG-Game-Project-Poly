export enum PlayerSize {
    Small = 'small',
    Medium = 'medium',
    Big = 'big',
}

export interface LobbyPlayer {
    id: number;
    name: string;
    avatar: string;
    attributes: {
        attack: number;
        defense: number;
        health: number;
        speed: number;
    };
    isAdmin: boolean;
    size: PlayerSize;
}
