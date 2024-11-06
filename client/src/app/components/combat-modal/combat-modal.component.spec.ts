import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DiceComponent } from '@app/components/dice/dice.component';
import { TemporaryDialogComponent } from '@app/components/temporary-dialog/temporary-dialog.component';
import { TimerComponent } from '@app/components/timer/timer.component';
import { mockLobbyPlayers } from '@app/mocks/mock-lobby-players';
import { CombatLogicService } from '@app/services/combat-logic/combat-logic.service';
import { CombatModalComponent } from './combat-modal.component';

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
        component.player1 = mockLobbyPlayers[2];
        component.player2 = mockLobbyPlayers[5];
        fixture.detectChanges();
    });

    it('should initialize combat on ngOnInit', () => {
        component.ngOnInit();
        expect(mockCombatService.initCombat).toHaveBeenCalledWith(component.player1, component.player2);
    });

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

        component.triggerAttack();
        expect(mockCombatService.switchTurn).not.toHaveBeenCalled();
        expect(component.dice1.rollDice).not.toHaveBeenCalled();
        expect(component.dice2.rollDice).not.toHaveBeenCalled();
    });

    it('should trigger evasion and check for end of game', () => {
        component.triggerEvade();
        expect(mockCombatService.attemptEvade).toHaveBeenCalled();
    });
});
