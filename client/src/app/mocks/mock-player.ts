import { ObjectType } from '@app/constants';
import { PlayerInfo } from '@app/interfaces/playerInfo';

export const mockPlayer: PlayerInfo = {
    portrait: 'image path',
    name: 'GOB',
    hp: 6,
    currentHp: 3,
    speed: 4,
    movementPointsLeft: 2,
    maxActionPoints: 1,
    actionPoints: 1,
    attack: 4,
    atkDice: 6,
    defense: 4,
    defDice: 4,
    inventory: [
        {
            id: ObjectType.Trident,
            name: 'Trident',
            description: 'Trident de Poséidon',
            count: 1,
            image: '/assets/images/objects/poseidon-trident.jpg/',
        },
        {
            id: ObjectType.Sandal,
            name: 'Sandales ailées',
            description: 'Sandales augmentant la stat de rapidité',
            count: 1,
            image: '/assets/images/objects/winged-sandals.jpg/',
        },
    ],
};
