import { Player, Status } from '@common/player';

export const playerNavigation: Player = {
    id: '123',
    attributes: {
        totalHp: 100,
        currentHp: 100,
        speed: 4,
        movementPointsLeft: 3,
        maxActionPoints: 1,
        actionPoints: 1,
        attack: 1,
        atkDiceMax: 1,
        defense: 1,
        defDiceMax: 1,
        evasion: 2,
    },
    avatar: { id: 20, name: 'a', src: 'a.img', isSelected: true, isTaken: true },
    isActive: true,
    name: 'Hestia',
    status: Status.Player,
    victories: 1,
    inventory: [],
    position: { x: 0, y: 0 },
    spawnPosition: { x: 0, y: 0 },
};
