import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DiceComponent } from './dice.component';
// import { INACTIVE_DICE_DELAY, ROLL_DURATION } from '@app/constants';
import { ROLL_DURATION } from '@app/constants'; // temporary

describe('DiceComponent', () => {
    let component: DiceComponent;
    let fixture: ComponentFixture<DiceComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [DiceComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(DiceComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize with default value', () => {
        expect(component.value).toBe(1);
        expect(component.isRolling).toBe(false);
    });

    it('should roll the dice and update the value', (done) => {
        const maxValue = 6;
        component.rollDice(maxValue);
        expect(component.isRolling).toBe(true);
        setTimeout(() => {
            expect(component.value).toBeGreaterThan(0);
            expect(component.value).toBeLessThanOrEqual(maxValue);
            expect(component.isRolling).toBe(false);
            done();
        }, ROLL_DURATION);
    });

    // it('should not roll if already rolling', () => {
    //     const maxValue = 6;
    //     component.isRolling = true;

    //     component.rollDice(maxValue);

    //     const previousValue = component.value;
    //     setTimeout(() => {
    //         expect(component.value).toBe(previousValue);
    //         expect(component.isRolling).toBe(true);
    //     }, INACTIVE_DICE_DELAY);
    // });

    it('should allow rolling again after completing the first roll', (done) => {
        const maxValue = 6;
        component.rollDice(maxValue);

        setTimeout(() => {
            expect(component.isRolling).toBe(false);
            component.rollDice(maxValue);
            expect(component.isRolling).toBe(true);
            done();
        }, ROLL_DURATION);
    });
});
