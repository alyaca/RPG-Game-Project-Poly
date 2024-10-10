import { LobbyPlayer, PlayerSize } from '@app/interfaces/lobbyPlayer';

export const mockLobbyPlayers: LobbyPlayer[] = [
    {
        id: 0,
        name: 'Jar Jar Binks',
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
        name: 'Obi-Wan Kenobi',
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
        name: 'General Grievous',
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
        name: 'Luke Skywalker',
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
        name: 'Leia Organa',
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
        name: 'Chewbacca',
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
