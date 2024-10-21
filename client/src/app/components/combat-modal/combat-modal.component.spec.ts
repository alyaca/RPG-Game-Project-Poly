import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { CombatModalComponent } from './combat-modal.component';
import { CombatLogicService } from '@app/services/combat-logic.service';
import { DiceComponent } from '@app/components/dice/dice.component';
import { TimerComponent } from '@app/components/timer/timer.component';
import { TemporaryDialogComponent } from '@app/components/temporary-dialog/temporary-dialog.component';
import { PLAYERS, INIT_DISPLAY_DELAY, EXIT_COMBAT_DELAY, COMBAT_TURN_LENGTH, INACTIVE_DICE_DELAY, TURN_DIALOG_DELAY } from '@app/constants';

describe('CombatModalComponent', () => {
    let component: CombatModalComponent;
    let fixture: ComponentFixture<CombatModalComponent>;
    let mockCombatService: jasmine.SpyObj<CombatLogicService>;

    beforeEach(async () => {
        mockCombatService = jasmine.createSpyObj('CombatLogicService', [
            'initCombat',
            'setDisplayText',
            'resetPlayerHp',
            'checkIfDuelOver',
            'processAttack',
            'processTurnDialog',
            'attemptEvade',
            'switchTurn',
            'determineTimerLength',
        ]);

        await TestBed.configureTestingModule({
            imports: [CombatModalComponent, DiceComponent, TimerComponent, TemporaryDialogComponent],
            providers: [{ provide: CombatLogicService, useValue: mockCombatService }],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(CombatModalComponent);
        component = fixture.componentInstance;
        component.player1 = PLAYERS[2];
        component.player2 = PLAYERS[5];
        fixture.detectChanges();
    });

    it('should initialize combat on ngOnInit', () => {
        component.ngOnInit();
        expect(mockCombatService.initCombat).toHaveBeenCalledWith(component.player1, component.player2);
    });

    it('should initialize display correctly when player starts', fakeAsync(() => {
        spyOn(component, 'triggerTempDialog');
        component.ngOnInit();
        component.combatService.currPlayerNum = 'player1turn';
        tick(INIT_DISPLAY_DELAY);
        expect(component.triggerTempDialog).toHaveBeenCalledWith('Votre tour');
    }));

    it('should initialize display correctly when opponent starts', fakeAsync(() => {
        spyOn(component, 'triggerTempDialog');
        component.ngOnInit();
        component.combatService.currPlayerNum = 'player2turn';
        tick(INIT_DISPLAY_DELAY);
        expect(component.triggerTempDialog).toHaveBeenCalledWith("Tour de l'adversaire");
    }));

    it('should set roles correctly on ngAfterViewInit', () => {
        component.ngAfterViewInit();
        expect(mockCombatService.roles['player1turn'].attacker).toEqual(component.player2);
        expect(mockCombatService.roles['player2turn'].attacker).toEqual(component.player1);
    });

    it('should close modal and reset combat state on closeModal', () => {
        spyOn(component.closeModalEvent, 'emit');
        component.closeModal();
        expect(mockCombatService.setDisplayText).toHaveBeenCalledWith('');
        expect(mockCombatService.resetPlayerHp).toHaveBeenCalledWith(component.player1, component.player2);
        expect(component.isInCombat).toBeFalse();
        expect(component.closeModalEvent.emit).toHaveBeenCalled();
    });

    it('should return early if the game is not ongoing', () => {
        mockCombatService.isGameOngoing = false;

        spyOn(component.dice1, 'rollDice');
        spyOn(component.dice2, 'rollDice');
        spyOn(component, 'attack');

        component.triggerAttack();
        expect(mockCombatService.switchTurn).not.toHaveBeenCalled();
        expect(component.dice1.rollDice).not.toHaveBeenCalled();
        expect(component.dice2.rollDice).not.toHaveBeenCalled();
        expect(component.attack).not.toHaveBeenCalled();
    });

    it('should trigger evasion and check for end of game', () => {
        spyOn(component, 'endGameIfNeeded');
        component.triggerEvade();
        expect(mockCombatService.attemptEvade).toHaveBeenCalled();
        expect(component.endGameIfNeeded).toHaveBeenCalled();
    });

    it('should end game if duel is over', fakeAsync(() => {
        mockCombatService.checkIfDuelOver.and.returnValue('Game Over');
        spyOn(component, 'triggerTempDialog');
        spyOn(component, 'closeModal');
        component.endGameIfNeeded();
        expect(component.triggerTempDialog).toHaveBeenCalledWith('Game Over');
        tick(EXIT_COMBAT_DELAY);
        expect(component.closeModal).toHaveBeenCalled();
    }));

    it('should trigger temporary dialog if game is ongoing', () => {
        mockCombatService.isGameOngoing = true;

        spyOn(component.temporaryDialogComponent, 'show');
        component.triggerTempDialog('Test Message');
        expect(component.temporaryDialogComponent.show).toHaveBeenCalledWith('Test Message');
    });

    it('should trigger attack on timer finished', () => {
        spyOn(component, 'triggerAttack');
        component.onTimerFinished();
        expect(component.triggerAttack).toHaveBeenCalled();
    });

    it('should trigger the turn dialog correctly when player starts', fakeAsync(() => {
        spyOn(component, 'triggerTempDialog');
        component.combatService.currPlayerNum = 'player1turn';

        component.triggerTurnDialog();
        tick(TURN_DIALOG_DELAY);
        expect(mockCombatService.processTurnDialog).toHaveBeenCalledWith(component.player1, component.player2);
        tick(TURN_DIALOG_DELAY);
        expect(component.triggerTempDialog).toHaveBeenCalledWith('Votre tour');
    }));

    it('should trigger the turn dialog correctly when opponent starts', fakeAsync(() => {
        spyOn(component, 'triggerTempDialog');
        component.combatService.currPlayerNum = 'player2turn';

        component.triggerTurnDialog();
        tick(TURN_DIALOG_DELAY);
        expect(mockCombatService.processTurnDialog).toHaveBeenCalledWith(component.player1, component.player2);
        tick(TURN_DIALOG_DELAY);
        expect(component.triggerTempDialog).toHaveBeenCalledWith("Tour de l'adversaire");
    }));

    it('should process attack and follow the flow in attack method', fakeAsync(() => {
        spyOn(component.timerComponent, 'resetTimer');
        spyOn(component, 'triggerTurnDialog');
        spyOn(component, 'endGameIfNeeded');

        component.attack();
        expect(mockCombatService.processAttack).toHaveBeenCalledWith(
            mockCombatService.roles,
            mockCombatService.currPlayerNum,
            component.player1,
            component.player2,
        );
        expect(component.timerComponent.resetTimer).toHaveBeenCalled();
        expect(component.triggerTurnDialog).toHaveBeenCalled();
        expect(component.endGameIfNeeded).toHaveBeenCalled();
    }));

    it('should handle triggerAttack flow correctly', fakeAsync(() => {
        spyOn(component.dice1, 'rollDice');
        spyOn(component.dice2, 'rollDice');
        spyOn(component, 'attack');

        mockCombatService.determineTimerLength.and.returnValue(COMBAT_TURN_LENGTH);
        mockCombatService.isGameOngoing = true;
        component.combatService.currPlayerNum = 'player1turn';
        component.combatService.roles = {
            player1turn: { attacker: component.player1, defender: component.player2, activeDice: component.dice1, inactiveDice: component.dice2 },
            player2turn: { attacker: component.player2, defender: component.player1, activeDice: component.dice2, inactiveDice: component.dice1 },
        };

        component.triggerAttack();

        expect(mockCombatService.determineTimerLength).toHaveBeenCalledWith(mockCombatService.evasionsArray1, mockCombatService.currPlayerNum);

        expect(mockCombatService.switchTurn).toHaveBeenCalledWith(component.player1, component.player2);
        expect(component.dice1.rollDice).toHaveBeenCalledWith(component.player1.attributes.atkDiceMax);
        tick(INACTIVE_DICE_DELAY);
        expect(component.dice2.rollDice).toHaveBeenCalledWith(component.player2.attributes.defDiceMax);
        tick(TURN_DIALOG_DELAY);
        expect(component.attack).toHaveBeenCalled();
    }));
});
