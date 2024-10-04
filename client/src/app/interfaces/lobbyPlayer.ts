export enum PlayerSize{
  small = 'small',
  medium = 'medium',
  big = 'big',
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