import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StopwatchService {
  private startTime: number | null = null;
  private elapsedTime: number = 0;

  start(): void {
    if (this.startTime === null) {
      this.startTime = Date.now();
    }
  }

  stop(): string {
    if (this.startTime !== null) {
      const endTime = Date.now();
      this.elapsedTime = (endTime - this.startTime) / 1000; 
      this.startTime = null; 
    }
    return this.formatTime(this.elapsedTime);
  }

  private formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    return [
      hours.toString().padStart(1, '0') + 'h',
      minutes.toString().padStart(2, '0') + 'min',
      secs.toString().padStart(2, '0') + 's',
    ].join(' ');
  }
}
