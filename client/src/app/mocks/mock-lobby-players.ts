import { defaultAttributes } from '@app/default-attributes';
import { avatars } from '@common/avatars-info';
import { Avatar, Player, Status } from '@common/player';

export const mockAvatar: Avatar = avatars[0];
export const mockLobbyPlayers: Player[] = [
    {
        id: 'admin',
        name: 'Jar Jar Binks',
        avatar: avatars[0],
        attributes: { ...defaultAttributes },
        status: Status.Admin,
        victories: 0,
        isActive: true,
        position: { x: 1, y: 2 },
    },
    {
        id: 'mefe',
        name: 'Obi-Wan Kenobi',
        avatar: avatars[1],
        attributes: { ...defaultAttributes },
        status: Status.Player,
        victories: 0,
        isActive: false,
        position: { x: 1, y: 2 },
    },
    {
        id: 'ur32n',
        name: 'General Grievous',
        avatar: avatars[2],
        attributes: { ...defaultAttributes },
        status: Status.Player,
        victories: 0,
        isActive: false,
        position: { x: 1, y: 2 },
    },
    {
        id: 'luke0324',
        name: 'Luke Skywalker',
        avatar: avatars[3],
        attributes: { ...defaultAttributes },
        status: Status.Player,
        victories: 0,
        isActive: false,
        position: { x: 1, y: 2 },
    },
    {
        id: 'leia1214',
        name: 'Leia Organa',
        avatar: avatars[4],
        attributes: { ...defaultAttributes },
        status: Status.Player,
        victories: 0,
        isActive: false,
        position: { x: 1, y: 2 },
    },
    {
        id: 'chew0242',
        name: 'Chewbacca',
        avatar: avatars[5],
        attributes: { ...defaultAttributes },
        status: Status.Player,
        victories: 0,
        isActive: false,
        position: { x: 1, y: 2 },
    },
];
