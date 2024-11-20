import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { SimpleDialogMessageComponent } from '@app/components/simple-dialog-message/simple-dialog-message.component';
import { DialogData } from '@app/interfaces/dialog-data';
import { ItemSwap } from '@common/item-swap';

@Component({
    selector: 'app-simple-dialog',
    standalone: true,
    imports: [CommonModule, MatDialogModule, MatButtonModule, SimpleDialogMessageComponent],
    templateUrl: './simple-dialog.component.html',
    styleUrl: './simple-dialog.component.scss',
})
export class SimpleDialogComponent {
    dialogTitle: string = '';
    options: string[] = ['', ''];

    constructor(
        private dialogRef: MatDialogRef<SimpleDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: DialogData,
        private router: Router,
    ) {
        this.options = data.options;
    }

    onClose() {
        this.dialogRef.close(this.data.confirm ? 'left' : 'close');
        if (this.data.title === 'Sauvegarde réussie') {
            this.router.navigate(['/administration']);
        }
    }

    onCancel() {
        this.dialogRef.close('right');
    }

    swapItems(isSwappedItemFirst: boolean, itemSwap: ItemSwap): ItemSwap | null {
        if (this.data.itemSwap) {
            const swappedItem = isSwappedItemFirst ? itemSwap.currentItem1 : itemSwap.currentItem2;
            const temp = { ...swappedItem };
            Object.assign(swappedItem, this.data.itemSwap.pickedUpItem);
            Object.assign(this.data.itemSwap.pickedUpItem, temp);
            return this.data.itemSwap;
        }
        return null;
    }

    close() {
        this.dialogRef.close();
    }
}
