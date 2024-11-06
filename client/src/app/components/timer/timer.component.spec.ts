// import { ComponentFixture, TestBed } from '@angular/core/testing';
// import { TimerComponent } from './timer.component';

// describe('TimerComponent', () => {
//     let component: TimerComponent;
//     let fixture: ComponentFixture<TimerComponent>;

//     beforeEach(async () => {
//         await TestBed.configureTestingModule({
//             imports: [TimerComponent],
//         }).compileComponents();

//         fixture = TestBed.createComponent(TimerComponent);
//         component = fixture.componentInstance;
//         component.totalTime = 10;
//         component.timeRemaining = component.totalTime;
//         fixture.detectChanges();
//     });

//     it('should create', () => {
//         expect(component).toBeTruthy();
//     });

//     it('should start the timer and count down', () => {
//         spyOn(component, 'updateProgress');
//         component.start();
//         expect(component.startTimer.emit).toHaveBeenCalled();
//         expect(component.updateProgress).toHaveBeenCalled();
//     });

//     it('should stop the timer when time runs out', (done) => {
//         spyOn(component.closeTimer, 'emit');

//         component.timerFinished();

//         expect(component.timeRemaining).toBe(0);
//         expect(component.closeTimer.emit).toHaveBeenCalled();
//     });
// });
