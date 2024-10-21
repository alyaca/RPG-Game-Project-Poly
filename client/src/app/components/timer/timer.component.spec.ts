import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TimerComponent } from './timer.component';
// import { EventEmitter } from '@angular/core';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('TimerComponent', () => {
    let component: TimerComponent;
    let fixture: ComponentFixture<TimerComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TimerComponent],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();

        fixture = TestBed.createComponent(TimerComponent);
        component = fixture.componentInstance;
        component.totalTime = 10;
        component.timeRemaining = component.totalTime;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should start the timer and count down', (done) => {
        component.startTimer();

        setTimeout(() => {
            expect(component.timeRemaining).toBeLessThan(component.totalTime);
            expect(component.isTimerRunning).toBe(true);
            done();
        }, 2000);
    });

    it('should stop the timer when time runs out', (done) => {
        spyOn(component.closeTimer, 'emit');
        component.totalTime = 1;
        component.timeRemaining = component.totalTime;
        component.startTimer();

        setTimeout(() => {
            expect(component.timeRemaining).toBe(0);
            expect(component.closeTimer.emit).toHaveBeenCalled();
            done();
        }, 2000); // Allow time for the timer to finish
    });

    it('should pause the timer', () => {
        component.startTimer();
        component.pauseTimer();

        expect(component.isPaused).toBe(true);
        expect(component.isTimerRunning).toBe(true); // Still running, just paused
    });

    it('should resume the timer', (done) => {
        component.startTimer();
        component.pauseTimer();
        component.resumeTimer();

        setTimeout(() => {
            expect(component.isPaused).toBe(false);
            expect(component.isTimerRunning).toBe(true);
            expect(component.timeRemaining).toBeLessThan(component.totalTime); // Timer should be running again
            done();
        }, 2000); // Allow time for the timer to run again
    });

    it('should reset the timer', () => {
        component.totalTime = 10; // Set total time
        component.timeRemaining = 5; // Set current time
        component.resetTimer();

        expect(component.timeRemaining).toBe(component.totalTime); // Should reset to total time
        expect(component.isPaused).toBe(false); // Should not be paused
    });
});
