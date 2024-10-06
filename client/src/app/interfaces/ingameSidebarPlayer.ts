export enum Status{
    Player = "regular-player",
    Admin = "admin",
    Bot = "bot",
    Disconnected = "disconnected",
}

export interface IngameSidebarPlayer {
    id: number;
    avatar: string;
    status: Status;
    name: string;
    victories: number;
    isActive: boolean;
}