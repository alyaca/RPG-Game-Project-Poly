import { ITEM_COUNT, ObjectType } from '@app/constants';
import { GameObject } from './interfaces/game-object';

export const gameObjects: GameObject[] = [
    {
        id: ObjectType.Trident,
        name: 'Trident de Poséidon',
        image: '/assets/images/objects/poseidon-trident.jpg',
        description: 'Modifie le dé du joueur qui équipe cet objet : les valeurs équiprobables possibles sont 1, 2, 3, 5, 6, 6',
        count: ITEM_COUNT,
    },
    {
        id: ObjectType.Armor,
        name: 'Armure de Achilles',
        image: '/assets/images/objects/armor-of-achilles.jpg',
        description: '+3 défense',
        count: ITEM_COUNT,
    },
    {
        id: ObjectType.Sandal,
        name: 'Sandales ailées',
        image: '/assets/images/objects/winged-sandals.jpg',
        description: 'x2 rapidité si les points de vie actuels du jouer est inférieur ou égal à 33% de ses points de vie totaux',
        count: ITEM_COUNT,
    },
    {
        id: ObjectType.Lightning,
        name: 'Foudre de Zeus',
        image: '/assets/images/objects/zeus-lightning.jpg',
        description: 'x1.5 attaque',
        count: ITEM_COUNT,
    },
    {
        id: ObjectType.Xiphos,
        name: 'Xiphos',
        image: '/assets/images/objects/xiphos.jpg',
        description: 'Si les points de vie actuels du joueur qui équipe cet objet est égale ou inférieure à 50% de son PV maximal, +4 attaque',
        count: ITEM_COUNT,
    },
    {
        id: ObjectType.Kunee,
        name: 'kunée',
        image: '/assets/images/objects/helm-of-darkness.jpg',
        description: 'Vole 1 vie de chaque autre joueur',
        count: ITEM_COUNT,
    },
    {
        id: ObjectType.Random,
        name: 'Random Item',
        image: '/assets/images/objects/dice.jpg',
        description: 'Ajoute un item aléatoire',
        count: -1,
    },
    {
        id: ObjectType.Spawn,
        name: 'Point de départ',
        image: '/assets/images/objects/tree.jpg',
        description: 'Désigne le point de départ du jouer',
        count: -1,
    },
];
