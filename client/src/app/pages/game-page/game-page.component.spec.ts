// import { ComponentFixture, TestBed } from '@angular/core/testing';

// import { provideHttpClient } from '@angular/common/http';
// import { GamePageComponent } from './game-page.component';

// describe('GamePageComponent', () => {
//     let component: GamePageComponent;
//     let fixture: ComponentFixture<GamePageComponent>;

//     beforeEach(async () => {
//         await TestBed.configureTestingModule({
//             imports: [GamePageComponent],
//             providers: [provideHttpClient()],
//         }).compileComponents();

//         fixture = TestBed.createComponent(GamePageComponent);
//         component = fixture.componentInstance;
//         fixture.detectChanges();
//     });

//     it('should create', () => {
//         expect(component).toBeTruthy();
//     });

//     it('should update the value is isActionSelected', () => {
//         const mockIsActionSelected = true;
//         component.isActionSelected = mockIsActionSelected;
//         component.toggleActionSelected();
//         expect(component.isActionSelected).toBe(!mockIsActionSelected);
//     });
// });

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { GamePageComponent } from './game-page.component';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { mockLobbyPlayers } from '@app/mocks/mock-lobby-players';
import { Status } from '@app/interfaces/playerObject';
// import { TimerComponent } from '@app/components/timer/timer.component';
import { ElementRef, QueryList } from '@angular/core';

describe('GamePageComponent', () => {
    let component: GamePageComponent;
    let fixture: ComponentFixture<GamePageComponent>;
    let dialogSpy: jasmine.Spy;
    let routerSpy: jasmine.Spy;

    beforeEach(async () => {
        const mockDialog = {
            open: jasmine.createSpy().and.returnValue({
                afterClosed: () => of('left'), 
            }),
        };

        const mockRouter = {
            navigate: jasmine.createSpy('navigate'),
        };

        await TestBed.configureTestingModule({
            imports: [GamePageComponent],
            providers: [
                provideHttpClient(),
                { provide: MatDialog, useValue: mockDialog },
                { provide: Router, useValue: mockRouter },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(GamePageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();

        dialogSpy = TestBed.inject(MatDialog).open as jasmine.Spy;
        routerSpy = TestBed.inject(Router).navigate as jasmine.Spy;
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should toggle isActionSelected correctly', () => {
        const initialActionSelected = component.isActionSelected;
        component.toggleActionSelected();
        expect(component.isActionSelected).toBe(!initialActionSelected);
    });

    it('should sort players by speed and move disconnected players to the end', () => {
        component.allPlayers = [...mockLobbyPlayers];
        component.determinePlayerTurn();
        
        const connectedPlayers = component.allPlayers.filter(player => player.status !== Status.Disconnected);
        const disconnectedPlayers = component.allPlayers.filter(player => player.status === Status.Disconnected);
        
        expect(connectedPlayers.length).toBeGreaterThan(0);
        expect(disconnectedPlayers.length).toBeGreaterThan(0);
        expect(component.allPlayers).toEqual([...connectedPlayers, ...disconnectedPlayers]);
    });

    it('should set the id of the first pageDiv element to "enabled"', () => {
        const mockDivs = new QueryList<ElementRef<HTMLDivElement>>();
        const elementRef = new ElementRef(document.createElement('div'));
        mockDivs.reset([elementRef]);
        component.pageDiv = mockDivs;

        component.enableClicks();

        expect(component.pageDiv.first.nativeElement.id).toBe('enabled');
    });

    it('should pause the turn timer after view initialization', () => {
        const pauseSpy = spyOn(component.turnTimerComponent, 'pauseTimer');
        component.ngAfterViewInit();
        expect(pauseSpy).toHaveBeenCalled();
    });

    it('should resume the turn timer when closing the turn start pop-up', () => {
        component.turnTimerComponent = jasmine.createSpyObj('TimerComponent', ['resumeTimer', 'pauseTimer']);
        component.closeTurnStartPopUp();
        expect(component.turnTimerComponent.resumeTimer).toHaveBeenCalled();
        expect(component.isTurnStartShowed).toBe(false);
    });

    it('should open the combat modal and pause the timer', () => {
        const pauseSpy = spyOn(component.turnTimerComponent, 'pauseTimer');
        component.openCombatModal();
        expect(component.isInCombat).toBeTrue();
        expect(pauseSpy).toHaveBeenCalled();
    });

    it('should close the combat modal and resume the timer', () => {
        const resumeSpy = spyOn(component.turnTimerComponent, 'resumeTimer');
        component.closeCombatModal();
        expect(component.isInCombat).toBeFalse();
        expect(resumeSpy).toHaveBeenCalled();
    });

    it('should open a confirmation dialog and navigate when quitting the game', () => {
        component.handleExit();
        expect(dialogSpy).toHaveBeenCalled();
        expect(routerSpy).toHaveBeenCalledWith(['/home']);
    });
});
