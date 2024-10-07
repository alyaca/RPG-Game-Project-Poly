
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
//import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-timer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './timer.component.html',
  styleUrl: './timer.component.scss'
})
export class TimerComponent implements OnInit, OnDestroy {
  isTimerRunning: boolean = true;
  totalTime: number = 10;
  warningTime: number = 5;
  timeRemaining: number = this.totalTime;
  intervalId: any;
  
  radius = 45;
  circumference = 2 * Math.PI * this.radius;
  strokeDashoffset = 0;

  ngOnInit() {
    this.startTimer();
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  startTimer() {
    if(this.isTimerRunning){
      this.intervalId = setInterval(() => {
        this.timeRemaining--;
  
        if (this.timeRemaining <= -1) {
          clearInterval(this.intervalId);
          this.timerFinished();
        }
  
        this.updateProgress();
      }, 1000);
    }
  }

  updateProgress() {
    const progress = (this.timeRemaining / this.totalTime) * this.circumference;
    this.strokeDashoffset = this.circumference - progress;
  }

  timerFinished(){
    this.timeRemaining = 0;
  }
}
