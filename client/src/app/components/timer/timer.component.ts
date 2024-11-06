import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { TIMER_ARC_WIDTH, TIMER_CENTER_POSITION, TIMER_RADIUS, WARNING_TIME } from '@app/constants';

@Component({
    selector: 'app-timer',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './timer.component.html',
    styleUrl: './timer.component.scss',
})
export class TimerComponent implements OnInit, OnDestroy {
    @Input() totalTime: number;
    @Input() timeRemaining: number;
    @Output() startTimer = new EventEmitter<void>();
    @Output() closeTimer = new EventEmitter<void>();

    intervalId: ReturnType<typeof setInterval> | null = null;
    isPaused: boolean = false;
    isTimerRunning: boolean = true;
    warningTime: number = WARNING_TIME;
    radius = TIMER_RADIUS;
    circumference = 2 * Math.PI * this.radius;
    strokeDashoffset = 0;

    circleProperties = {
        cx: TIMER_CENTER_POSITION,
        cy: TIMER_CENTER_POSITION,
        r: this.radius,
        strokeWidth: TIMER_ARC_WIDTH,
    };

    ngOnInit() {
        this.radius = TIMER_RADIUS;
        this.circumference = 2 * Math.PI * this.radius;
        this.start();
    }

    ngOnDestroy() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }

    start() {
        this.startTimer.emit();
    }

    resetTimer() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }

        this.timeRemaining = this.totalTime;
        this.updateProgress();
        this.start();
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
