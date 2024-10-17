export interface Avatar {
    name: string;
    src: string;
    isSelected?: boolean;
    isTaken?: boolean;
}
export interface Player {
    id: string;
    name: string;
    avatar: Avatar;
}
