import { provideHttpClient } from '@angular/common/http';
import { ElementRef, QueryList } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Status } from '@app/interfaces/player-object';
import { mockLobbyPlayers } from '@app/mocks/mock-lobby-players';
import { of } from 'rxjs';
import { GamePageComponent } from './game-page.component';

describe('GamePageComponent', () => {
    let component: GamePageComponent;
    let fixture: ComponentFixture<GamePageComponent>;
    let dialogSpy: jasmine.SpyObj<MatDialog>;
    let routerSpy: jasmine.SpyObj<Router>;
    let dialogRefSpy: jasmine.SpyObj<MatDialogRef<unknown>>;
    beforeEach(async () => {
        dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed', 'close']);
        dialogRefSpy.afterClosed.and.returnValue(of('left'));

        await TestBed.configureTestingModule({
            imports: [GamePageComponent],
            providers: [provideHttpClient(), { provide: MatDialog, useValue: dialogSpy }, { provide: Router, useValue: routerSpy }],
        }).compileComponents();

        fixture = TestBed.createComponent(GamePageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
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
        component.allPlayers[0].status = Status.Disconnected;
        component.determinePlayerTurn();

        const connectedPlayers = component.allPlayers.filter((player) => player.status !== Status.Disconnected);
        const disconnectedPlayers = component.allPlayers.filter((player) => player.status === Status.Disconnected);

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
        component.turnTimerComponent = jasmine.createSpyObj('TimerComponent', ['pauseTimer']);
        component.ngAfterViewInit();
        expect(component.turnTimerComponent.pauseTimer).toHaveBeenCalled();
    });

    it('should resume the turn timer when closing the turn start pop-up', () => {
        component.turnTimerComponent = jasmine.createSpyObj('TimerComponent', ['resumeTimer', 'pauseTimer']);
        component.closeTurnStartPopUp();
        expect(component.turnTimerComponent.resumeTimer).toHaveBeenCalled();
        expect(component.isTurnStartShowed).toBe(false);
    });

    it('should open the combat modal and pause the timer', () => {
        component.turnTimerComponent = jasmine.createSpyObj('TimerComponent', ['pauseTimer']);
        component.openCombatModal();
        expect(component.isInCombat).toBeTrue();
        expect(component.turnTimerComponent.pauseTimer).toHaveBeenCalled();
    });

    it('should close the combat modal and resume the timer', () => {
        component.turnTimerComponent = jasmine.createSpyObj('TimerComponent', ['resumeTimer']);
        component.closeCombatModal();
        expect(component.isInCombat).toBeFalse();
        expect(component.turnTimerComponent.resumeTimer).toHaveBeenCalled();
    });

    // it('should open a confirmation dialog and navigate when quitting the game', () => {
    //     component.handleExit();
    //     expect(dialogSpy.open).toHaveBeenCalledWith(SimpleDialogComponent, {
    //         disableClose: true,
    //         data: {
    //             title: 'Abandonner la partie?',
    //             messages: ['- Êtes-vous certains de vouloir quitter?'],
    //             options: ['Quitter', 'Rester'],
    //             confirm: true,
    //         },
    //     });
    //     expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
    // });

    // it('should not navigate if the dialog result is not "left"', () => {
    //     dialogRefSpy.afterClosed.and.returnValue(of('stay'));
    //     component.handleExit();
    //     expect(routerSpy.navigate).not.toHaveBeenCalled();
    // });
});
