import { GameObject } from './interfaces/gameObject';

export const gameObjects: GameObject[] = [
    {
        id: 'item-1',
        name: 'Trident de Poséidon',
        image: 'assets/images/objects/poseidon-trident.jpg',
        description: 'Modifie le dé du joueur qui équipe cet objet : les valeurs équiprobables possibles sont 1, 2, 3, 5, 6, 6',
    },
    {
        id: 'item-2',
        name: 'Armure de Achilles',
        image: 'assets/images/objects/armor-of-achilles.jpg',
        description: '+3 défense',
    },
    {
        id: 'item-3',
        name: 'Boite de Pandora',
        image: 'assets/images/objects/pandoras-box.jpg',
        description:
            'Le joueur équipant cet objet subit -3 attaque immédiatement, cependant, à chaque tour son attribut attaque' +
            'incrémente de 2 jusqua la fin de la partie',
    },
    { id: 'item-4', name: 'Foudre de Zeus', image: 'assets/images/objects/zeus-lightning.jpg', description: 'x1.5 attaque' },
    {
        id: 'item-5',
        name: 'Xiphos',
        image: 'assets/images/objects/xiphos.jpg',
        description: 'Si les points de vie actuels du joueur qui équipe cet objet est égale ou inférieure à 50% de son PV maximal, +4 attaque',
    },
    {
        id: 'item-6',
        name: 'Lyre de Orpheus',
        image: 'assets/images/objects/lyre-of-orpheus.jpg',
        description: 'Modifie le dé du joueur qui équipe cet objet : les valeurs équiprobables possibles sont 1, 2, 3, 5, 5, 7',
    },
    {
        id: 'random-item',
        name: 'Random Item',
        image: 'assets/images/objects/helm-of-darkness.jpg',
        description: 'Random item',
    },
    {
        id: 'spawn-point',
        name: 'Point de départ',
        image: 'assets/images/objects/winged-sandals.jpg',
        description: 'Spawn point',
    },
];
