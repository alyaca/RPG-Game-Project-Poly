import { Component } from '@angular/core';
import { TimerComponent } from '../timer/timer.component';

@Component({
    selector: 'app-turn-start',
    standalone: true,
    imports: [TimerComponent],
    templateUrl: './turn-start.component.html',
    styleUrl: './turn-start.component.scss',
})
export class TurnStartComponent {}
