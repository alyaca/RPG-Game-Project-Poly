import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { DiceComponent } from './dice.component';
import { INACTIVE_DICE_DELAY, ROLL_DURATION } from '@app/constants';

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

    it('should roll the dice and update the value', fakeAsync(() => {
        const maxValue = 6;
        component.rollDice(maxValue);
        expect(component.isRolling).toBe(true);

        tick(ROLL_DURATION); // Simulate the passage of ROLL_DURATION time

        expect(component.value).toBeGreaterThan(0);
        expect(component.value).toBeLessThanOrEqual(maxValue);
        expect(component.isRolling).toBe(false);
    }));

    it('should not roll if already rolling', fakeAsync(() => {
        const maxValue = 6;
        component.isRolling = true;

        component.rollDice(maxValue);

        const previousValue = component.value;
        tick(INACTIVE_DICE_DELAY);

        expect(component.value).toBe(previousValue);
        expect(component.isRolling).toBe(true);
    }));

    it('should allow rolling again after completing the first roll', fakeAsync(() => {
        const maxValue = 6;
        component.rollDice(maxValue);

        tick(ROLL_DURATION);
        expect(component.isRolling).toBe(false);

        component.rollDice(maxValue);
        expect(component.isRolling).toBe(true);

        tick(ROLL_DURATION);
        expect(component.isRolling).toBe(false);
    }));
});
