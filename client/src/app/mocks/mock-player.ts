import { ObjectType } from '@app/constants';
import { PlayerObjects, Status } from '@app/interfaces/playerObject';

export const mockPlayer: PlayerObjects = {
    id: 0,
    avatar: './assets/images/characters/Hephaestus.webp',
    status: Status.Player,
    name: 'Jar Jar Binks',
    victories: 2,
    isActive: true,
    attributes: {
        totalHp: 6,
        currentHp: 4,
        speed: 4,
        maxActionPoints: 2,
        actionPoints: 1,
        movementPointsLeft: 1,
        attack: 4,
        atkDiceMax: 6,
        defense: 4,
        defDiceMax: 4,
        inventory: [
            {
                id: ObjectType.Trident,
                name: 'Trident',
                description: 'Trident de Poséidon',
                count: 1,
                image: './assets/images/objects/poseidon-trident.jpg/',
            },
            {
                id: ObjectType.Sandal,
                name: 'Sandales ailées',
                description: 'Sandales augmentant la stat de rapidité',
                count: 1,
                image: './assets/images/objects/winged-sandals.jpg/',
            },
        ],
    },
};
