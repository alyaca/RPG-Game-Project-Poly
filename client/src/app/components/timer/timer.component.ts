import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { MILLISECONDS_IN_SECOND, TIMER_CENTER_POSITION, TIMER_RADIUS, WARNING_TIME } from '@app/constants';
// import { interval, Subscription } from 'rxjs';

@Component({
    selector: 'app-timer',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './timer.component.html',
    styleUrl: './timer.component.scss',
})
export class TimerComponent implements OnInit, OnDestroy {
    isTimerRunning: boolean = true;
    @Input() totalTime: number;
    @Input() isShowed: boolean = false;
    warningTime: number = WARNING_TIME;
    @Input() timeRemaining: number;
    @Output() closeTimer = new EventEmitter<void>();
    intervalId: any;

    radius = TIMER_RADIUS;
    circumference = 2 * Math.PI * this.radius;
    strokeDashoffset = 0;

    circleProperties = {
        cx: TIMER_CENTER_POSITION,
        cy: TIMER_CENTER_POSITION,
        r: TIMER_RADIUS,
        strokeWidth: 5,
    };

    ngOnInit() {
        this.startTimer();
    }

    ngOnDestroy() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }

    startTimer() {
        if (this.isTimerRunning) {
            this.intervalId = setInterval(() => {
                this.timeRemaining--;

                if (this.timeRemaining <= -1) {
                    clearInterval(this.intervalId);
                    this.timerFinished();
                }

                this.updateProgress();
            }, MILLISECONDS_IN_SECOND);
        }
    }

    updateProgress() {
        const progress = (this.timeRemaining / this.totalTime) * this.circumference;
        this.strokeDashoffset = this.circumference - progress;
    }

    timerFinished() {
        this.timeRemaining = 0;
        this.closeTimer.emit();
    }
}
