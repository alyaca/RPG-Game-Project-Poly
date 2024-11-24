import { MILLISECONDS_IN_SECOND, SECS_IN_HOUR, MINS_IN_HOUR, SECS_IN_MIN } from '@app/constants';
export class Stopwatch {
    private startTime: number | null = null;
    private elapsedTime: number = 0;

    start() {
        if (this.startTime === null) {
            this.startTime = Date.now();
        }
    }

    stop() {
        if (this.startTime !== null) {
            const endTime = Date.now();
            this.elapsedTime = (endTime - this.startTime) / MILLISECONDS_IN_SECOND;
            this.startTime = null;
        }
    }

    getTime(): string {
        return this.formatTime(this.elapsedTime);
    }

    private formatTime(seconds: number): string {
        const hours = Math.floor(seconds / SECS_IN_HOUR);
        const minutes = Math.floor((seconds % SECS_IN_HOUR) / MINS_IN_HOUR);
        const secs = Math.floor(seconds % SECS_IN_MIN);

        return [hours.toString().padStart(1, '0') + 'h', minutes.toString().padStart(2, '0') + 'min', secs.toString().padStart(2, '0') + 's'].join(
            ' ',
        );
    }
}
