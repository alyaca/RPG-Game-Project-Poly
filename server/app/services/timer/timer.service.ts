import { MILLISECONDS_IN_SECOND } from '@app/constants';
import { Injectable } from '@nestjs/common';

@Injectable()
export class TimerService {
    private intervalId: NodeJS.Timeout | null = null;
    private timeRemaining: number;
    private totalTime: number;
    private isPaused = false;
    isTimerRunning: boolean = true;

    startTimer(duration: number, onTickCallback: (timeRemaining: number) => void) {
        clearInterval(this.intervalId);
        this.totalTime = duration;
        this.timeRemaining = this.totalTime;
        onTickCallback(this.timeRemaining);

        if (this.isTimerRunning && !this.isPaused) {
            this.intervalId = setInterval(() => {
                this.timeRemaining--;
                onTickCallback(this.timeRemaining);

                if (this.timeRemaining <= -1 && this.intervalId !== null) {
                    clearInterval(this.intervalId);
                    this.timerFinished();
                }
            }, MILLISECONDS_IN_SECOND);
        }
    }

    resetTimer(duration: number, onTickCallback: (timeRemaining: number) => void) {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
        this.timeRemaining = this.totalTime;
        this.startTimer(duration, onTickCallback);
    }

    pauseTimer() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.isPaused = true;
        }
    }

    resumeTimer(onTickCallback: (timeRemaining: number) => void) {
        if (this.isPaused) {
            this.isPaused = false;
            this.startTimer(this.timeRemaining, onTickCallback);
        }
    }

    timerFinished() {
        this.timeRemaining = 0;
        this.isTimerRunning = false;
    }
}
