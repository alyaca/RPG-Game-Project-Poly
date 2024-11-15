import { ItemSwap } from '@common/item-swap';

export interface DialogData {
    title: string;
    messages: string[];
    options: string[];
    confirm: boolean;
    itemSwap: ItemSwap | null;
}
