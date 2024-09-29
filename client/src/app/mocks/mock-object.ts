import { ITEM_COUNT, NO_OBJECT } from '@app/constants';
import { GameObject } from '@app/interfaces/gameObject';

export const mockObjects: GameObject[] = [
    { id: 1, name: 'mock1', description: 'mock game object one count', count: ITEM_COUNT, image: 'mock1/image.png' },
    { id: 2, name: 'mock2', description: 'mock game object no count', count: NO_OBJECT, image: 'mock2/image.png' },
];
