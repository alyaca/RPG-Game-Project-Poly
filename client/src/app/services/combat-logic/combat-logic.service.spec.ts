import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { DiceComponent } from '@app/components/dice/dice.component';
import { COMBAT_TURN_LENGTH, DISPLAY_TEXT_DELAY, FAIL_EVASION_RANDOM_NUM, SHORT_COMBAT_TURN_LENGTH, SUCCES_EVASION_RANDOM_NUM } from '@app/constants';
import { mockLobbyPlayers } from '@app/mocks/mock-lobby-players';
import { Player } from '@common/player';
import { CombatLogicService, Roles } from './combat-logic/combat-logic.service';

describe('CombatLogicService', () => {
    let service: CombatLogicService;
    let player1: Player;
    let player2: Player;
    let dice1: DiceComponent;
    let dice2: DiceComponent;
    let fixture1: ComponentFixture<DiceComponent>;
    let fixture2: ComponentFixture<DiceComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [DiceComponent],
        });

        service = TestBed.inject(CombatLogicService);

        player1 = mockLobbyPlayers[5];
        player2 = mockLobbyPlayers[4];

        fixture1 = TestBed.createComponent(DiceComponent);
        dice1 = fixture1.componentInstance;

        fixture2 = TestBed.createComponent(DiceComponent);
        dice2 = fixture2.componentInstance;

        service.playerStat1 = 'Attaque';
        service.playerStat2 = 'Défense';

        fixture1.detectChanges();
        fixture2.detectChanges();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should initialize combat with proper values', () => {
        service.initCombat(player1, player2);
        expect(service.isGameOngoing).toBeTrue();
        expect(service.isDraw).toBeFalse();
    });

    it('should reset players HP correctly', () => {
        player1.attributes.currentHp = 5;
        player2.attributes.currentHp = 3;

        service.resetPlayerHp(player1, player2);

        expect(player1.attributes.currentHp).toEqual(player1.attributes.totalHp);
        expect(player2.attributes.currentHp).toEqual(player2.attributes.totalHp);
    });

    it('should determine the starting player based on speed - player 2 starts', () => {
        player1.attributes.speed = 1;
        player2.attributes.speed = 2;

        const startingPlayer = service.determineStartingPlayer(player1, player2);
        expect(startingPlayer).toEqual('player2turn');
    });

    it('should determine the starting player based on speed - player 1 starts', () => {
        player1.attributes.speed = 2;
        player2.attributes.speed = 1;

        const startingPlayer = service.determineStartingPlayer(player1, player2);
        expect(startingPlayer).toEqual('player1turn');
    });

    it('should deal damage correctly', () => {
        player1.attributes.currentHp = player1.attributes.totalHp;
        service.dealDamage(player1, true);

        expect(player1.attributes.currentHp).toBe(player1.attributes.totalHp - 1);
        expect(service.isPlayer1Damaged).toBeTrue();
        expect(service.isPlayer2Damaged).toBeFalse();
        service.resetPlayerHp(player1, player2);
    });

    it('should switch turns between players', () => {
        service.initCombat(player1, player2);
        service.currPlayerNum = 'player1turn';
        service.switchTurn(player1, player2);
        expect(service.currPlayerNum).toEqual('player2turn');

        service.switchTurn(player1, player2);
        expect(service.currPlayerNum).toEqual('player1turn');
    });

    it('should correctly attempt to evade', () => {
        spyOn(Math, 'random').and.returnValue(SUCCES_EVASION_RANDOM_NUM);

        service.evasionsArray1 = [1, 1];
        service.attemptEvade();
        expect(service.isDraw).toBeTrue();
    });

    it('should detect if the duel is over', () => {
        player2.attributes.currentHp = 0;
        const result = service.checkIfDuelOver(player1, player2);
        expect(result).toBe('Victoire');
    });
    describe('processAttack', () => {
        it('should process a successful attack from player 1 to player 2', () => {
            const roles: Roles = {
                player1turn: {
                    attacker: player1,
                    defender: player2,
                    activeDice: dice1,
                    inactiveDice: dice2,
                },
                player2turn: {
                    attacker: player2,
                    defender: player1,
                    activeDice: dice2,
                    inactiveDice: dice1,
                },
            };

            dice1.value = 2;
            dice2.value = 4;

            service.processAttack(roles, 'player2turn', player1, player2);

            expect(service.statValue2).toBe(dice1.value + player1.attributes.attack);
            expect(service.statValue1).toBe(dice2.value + player2.attributes.defense);
            expect(service.isPlayer1Damaged).toBeFalse();
            expect(service.isPlayer2Damaged).toBeTrue();
        });

        it('should process a failed attack from player 2 to player 1', () => {
            const roles = {
                player1turn: {
                    attacker: player1,
                    defender: player2,
                    activeDice: dice1,
                    inactiveDice: dice2,
                },
                player2turn: {
                    attacker: player2,
                    defender: player1,
                    activeDice: dice2,
                    inactiveDice: dice1,
                },
            };

            dice1.value = 2;
            dice2.value = 4;

            service.processAttack(roles, 'player1turn', player1, player2);

            expect(service.statValue2).toBe(dice1.value + player1.attributes.defense);
            expect(service.statValue1).toBe(dice2.value + player2.attributes.attack);
            expect(service.isPlayer1Damaged).toBeFalse();
            expect(service.isPlayer2Damaged).toBeFalse();
        });
    });

    describe('determineTimerLength', () => {
        it('should return 3 when evasions array is empty and currPlayerNum is not player1turn', () => {
            const timerLength = service.determineTimerLength([], 'player2turn');
            expect(timerLength).toBe(SHORT_COMBAT_TURN_LENGTH);
        });

        it('should return COMBAT_TURN_LENGTH when evasions array is not empty', () => {
            const evasions = [1, 2];
            const timerLength = service.determineTimerLength(evasions, 'player2turn');
            expect(timerLength).toBe(COMBAT_TURN_LENGTH);
        });

        it('should return COMBAT_TURN_LENGTH when currPlayerNum is player1turn', () => {
            const timerLength = service.determineTimerLength([], 'player1turn');
            expect(timerLength).toBe(COMBAT_TURN_LENGTH);
        });
    });

    it('should set displayText after 300ms', fakeAsync(() => {
        const text = 'Hello World';

        service.setDisplayText(text);
        expect(service.displayText).toBe('');
        tick(DISPLAY_TEXT_DELAY);
        expect(service.displayText).toBe(text);
    }));

    it('should display a message and return when evasionsArray1 is empty', fakeAsync(() => {
        service.evasionsArray1 = [];
        spyOn(service, 'setDisplayText');
        service.attemptEvade();
        tick(DISPLAY_TEXT_DELAY);
        expect(service.setDisplayText).toHaveBeenCalledWith("Évasion pas possible, vous n'avez plus d'évasions restantes");

        expect(service.evasionsArray1.length).toBe(0);
    }));

    it('should display "Évasion échouée" when evasion fails', fakeAsync(() => {
        service.evasionsArray1 = [1];
        spyOn(Math, 'random').and.returnValue(FAIL_EVASION_RANDOM_NUM);
        spyOn(service, 'setDisplayText');
        service.attemptEvade();
        tick(DISPLAY_TEXT_DELAY);
        expect(service.setDisplayText).toHaveBeenCalledWith('Évasion échouée');
        expect(service.evasionsArray1.length).toBe(0);
    }));

    describe('checkIfDuelOver', () => {
        it('should return "Victoire" and display winning message if player 2 HP is 0', () => {
            player2.attributes.currentHp = 0;
            spyOn(service, 'setDisplayText');

            const result = service.checkIfDuelOver(player1, player2);

            expect(result).toBe('Victoire');
            expect(service.setDisplayText).toHaveBeenCalledWith('Vous avez gagné le duel');
        });

        it('should return "Défaite" and display losing message if player 1 HP is 0', () => {
            player1.attributes.currentHp = 0;
            player2.attributes.currentHp = 1;
            spyOn(service, 'setDisplayText');

            const result = service.checkIfDuelOver(player1, player2);

            expect(result).toBe('Défaite');
            expect(service.setDisplayText).toHaveBeenCalledWith('Vous avez perdu le duel');
        });

        it('should return "Partie nulle" and display draw message if isDraw is true', () => {
            service.isDraw = true;
            player1.attributes.currentHp = 1;
            player2.attributes.currentHp = 1;
            spyOn(service, 'setDisplayText');

            const result = service.checkIfDuelOver(player1, player2);

            expect(result).toBe('Partie nulle');
            expect(service.setDisplayText).toHaveBeenCalledWith('Évasion réussie');
        });

        it('should return an empty string if duel is still ongoing', () => {
            player1.attributes.currentHp = 5;
            player2.attributes.currentHp = 5;
            service.isDraw = false;

            const result = service.checkIfDuelOver(player1, player2);

            expect(result).toBe('');
        });
    });

    describe('CombatLogicService - processTurnDialog', () => {
        it('should set playerStat1 to "Défense D" + defDiceMax if playerStat1 includes "Attaque"', () => {
            player1.attributes.defDiceMax = 4;
            service.processTurnDialog(player1, player2);

            expect(service.playerStat1).toBe('Défense D4');
        });

        it('should set playerStat2 to "Défense D" + defDiceMax if playerStat2 includes "Attaque"', () => {
            service.playerStat2 = 'Attaque';
            service.playerStat1 = 'Défense';

            player2.attributes.defDiceMax = 3;
            service.processTurnDialog(player1, player2);

            expect(service.playerStat2).toBe('Défense D3');
        });

        it('should set playerStat1 to "Attaque D" + atkDiceMax if playerStat1 does not include "Attaque"', () => {
            service.playerStat1 = 'Défense';
            player1.attributes.atkDiceMax = 5;
            service.processTurnDialog(player1, player2);

            expect(service.playerStat1).toBe('Attaque D5');
        });

        it('should set playerStat2 to "Attaque D" + atkDiceMax if playerStat2 does not include "Attaque"', () => {
            service.playerStat2 = 'Défense';
            player2.attributes.atkDiceMax = 6;
            service.processTurnDialog(player1, player2);

            expect(service.playerStat2).toBe('Attaque D6');
        });
    });

    it("should set the correct stats when it is player 1's turn", () => {
        spyOn(service, 'determineStartingPlayer').and.returnValue('player1turn');
        player1.attributes.atkDiceMax = 6;
        player2.attributes.defDiceMax = 4;
        service.initCombat(player1, player2);

        expect(service.currPlayerNum).toBe('player1turn');
        expect(service.playerStat1).toBe('Attaque D6');
        expect(service.playerStat2).toBe('Défense D4');
    });

    it("should set the correct stats when it is player 2's turn", () => {
        spyOn(service, 'determineStartingPlayer').and.returnValue('player2turn');
        player1.attributes.defDiceMax = 4;
        player2.attributes.atkDiceMax = 6;
        service.initCombat(player1, player2);

        expect(service.currPlayerNum).toBe('player2turn');
        expect(service.playerStat1).toBe('Défense D4');
        expect(service.playerStat2).toBe('Attaque D6');
    });
});
