import { LobbyPlayer, PlayerSize } from '@app/interfaces/lobbyPlayer';

export const mockLobbyPlayers: LobbyPlayer[] = [
    {
        id: 0,
        name: '* joueur1',
        avatar: '/assets/images/characters/Hephaestus.webp',
        attributes: {
            attack: 4,
            defense: 4,
            health: 4,
            speed: 4,
        },
        isAdmin: false,
        size: PlayerSize.Medium,
    },
    {
        id: 1,
        name: 'joueur2',
        avatar: '/assets/images/characters/Athena.webp',
        attributes: {
            attack: 4,
            defense: 4,
            health: 4,
            speed: 4,
        },
        isAdmin: false,
        size: PlayerSize.Medium,
    },
    {
        id: 2,
        name: 'joueur3',
        avatar: '/assets/images/characters/Zeus.webp',
        attributes: {
            attack: 4,
            defense: 4,
            health: 4,
            speed: 4,
        },
        isAdmin: true,
        size: PlayerSize.Medium,
    },
    {
        id: 3,
        name: 'joueur4',
        avatar: '/assets/images/characters/Artemis.webp',
        attributes: {
            attack: 4,
            defense: 4,
            health: 4,
            speed: 4,
        },
        isAdmin: false,
        size: PlayerSize.Medium,
    },
    {
        id: 4,
        name: 'joueur5',
        avatar: '/assets/images/characters/Apollo.webp',
        attributes: {
            attack: 4,
            defense: 4,
            health: 4,
            speed: 4,
        },
        isAdmin: false,
        size: PlayerSize.Medium,
    },
    {
        id: 5,
        name: 'joueur6',
        avatar: '/assets/images/characters/Hestia.webp',
        attributes: {
            attack: 4,
            defense: 4,
            health: 4,
            speed: 4,
        },
        isAdmin: false,
        size: PlayerSize.Medium,
    },
];
