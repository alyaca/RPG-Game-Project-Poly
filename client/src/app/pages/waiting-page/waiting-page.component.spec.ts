import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { SimpleDialogComponent } from '@app/components/simple-dialog/simple-dialog.component';
import { ACCESS_CODE_LENGTH, MAX_ACCESS_CODE_VALUE } from '@app/constants';
import { Map } from '@app/interfaces/map';
import { mockGames } from '@app/mocks/mock-game';
import { GameListService } from '@app/services/game-list.service';
import { BehaviorSubject, of } from 'rxjs';
import { WaitingPageComponent } from './waiting-page.component';
import { mockPlayer } from '@app/mocks/mock-player';

describe('WaitingPageComponent', () => {
    let component: WaitingPageComponent;
    let fixture: ComponentFixture<WaitingPageComponent>;
    let gameListServiceSpy: jasmine.SpyObj<GameListService>;
    let routerSpy: jasmine.SpyObj<Router>;
    let dialogSpy: jasmine.SpyObj<MatDialog>;
    beforeEach(async () => {
        gameListServiceSpy = jasmine.createSpyObj('GameListService', ['chosenGameSubject']);
        gameListServiceSpy.chosenGameSubject = new BehaviorSubject<Map | null>(mockGames[0]);
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

        await TestBed.configureTestingModule({
            imports: [WaitingPageComponent],
            providers: [
                {
                    provide: ActivatedRoute,
                    useValue: {
                        params: of({}),
                        snapshot: { paramMap: { get: () => null } },
                    },
                },
                {
                    provide: GameListService,
                    useValue: gameListServiceSpy,
                },
                {
                    provide: Router,
                    useValue: routerSpy,
                },
                {
                    provide: MatDialog,
                    useValue: dialogSpy,
                },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(WaitingPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterAll(() => {
        gameListServiceSpy.chosenGameSubject.complete();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should navigate to /game-creation if no game is selected', () => {
        gameListServiceSpy.chosenGameSubject.next(null);
        component.ngOnInit();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/game-creation']);
    });

    it('should set chosenGame when a game is selected', () => {
        const mockGame: Map = mockGames[0];
        gameListServiceSpy.chosenGameSubject.next(mockGame);
        fixture.detectChanges();
        expect(component.chosenGame).toEqual(mockGame);
    });

    it('should generate an access code on initialization', () => {
        component.ngOnInit();
        expect(component.accessCode).toBeTruthy();
    });

    it('should generate a 4-digit access code', () => {
        component.ngOnInit();
        expect(component.accessCode.length).toBe(ACCESS_CODE_LENGTH);
    });

    it('should pad access code with zeroes if necessary', () => {
        const mockRandom = 23;
        spyOn(Math, 'random').and.returnValue(mockRandom / component.maxRandom);

        component.ngOnInit();

        expect(component.accessCode).toBe('0023');
    });

    it('should generate an access code between 0000 and 9999', () => {
        for (let i = 0; i < MAX_ACCESS_CODE_VALUE; i++) {
            component.ngOnInit();
            const codeNumber = parseInt(component.accessCode, 10);
            expect(codeNumber).toBeGreaterThanOrEqual(0);
            expect(codeNumber).toBeLessThan(MAX_ACCESS_CODE_VALUE);
        }
    });
    it('should return correct size for values in getSizeClass', () => {
        expect(component.getSizeClass(2)).toBe("big");
        expect(component.getSizeClass(1)).toBe("medium");
        expect(component.getSizeClass(0)).toBe("small");
        expect(component.getSizeClass(-1)).toBe("");
    });

    it('should return correct size for 3 players', () => {
        component.players = [mockPlayer, mockPlayer, mockPlayer];  // 3 players
        expect(component.getPlayerSize(0)).toBe("medium");  // First player
        expect(component.getPlayerSize(1)).toBe("big"); // Middle player
        expect(component.getPlayerSize(2)).toBe("medium");    // Last player
    });

    it('should return correct size for 4 players', () => {
        component.players = [mockPlayer, mockPlayer, mockPlayer, mockPlayer];  // 4 players
        expect(component.getPlayerSize(0)).toBe("medium");  // First player
        expect(component.getPlayerSize(1)).toBe("big");  // Second player
        expect(component.getPlayerSize(2)).toBe("big");    // Third player
        expect(component.getPlayerSize(3)).toBe("medium");    // Fourth player
    });

    it('should return correct size for 5 players', () => {
        component.players = [mockPlayer, mockPlayer, mockPlayer, mockPlayer, mockPlayer];  // 5 players
        expect(component.getPlayerSize(0)).toBe("small");  // First player
        expect(component.getPlayerSize(1)).toBe("medium");  // Second player
        expect(component.getPlayerSize(2)).toBe("big"); // Middle player
        expect(component.getPlayerSize(3)).toBe("medium");    // Fourth player
        expect(component.getPlayerSize(4)).toBe("small");    // Fifth player
    });

    it('should return correct size for 6 players', () => {
        component.players = [mockPlayer, mockPlayer, mockPlayer, mockPlayer, mockPlayer, mockPlayer];  // 6 players
        expect(component.getPlayerSize(0)).toBe("small");  // First player
        expect(component.getPlayerSize(1)).toBe("medium"); // Second player
        expect(component.getPlayerSize(2)).toBe("big");    // Third player
        expect(component.getPlayerSize(3)).toBe("big");    // Fourth player
        expect(component.getPlayerSize(4)).toBe("medium"); // Fifth player
        expect(component.getPlayerSize(5)).toBe("small");  // Sixth player
    });


    it('should open the dialog and navigate to /home if confirmed', () => {
        const dialogRefSpy = jasmine.createSpyObj('DialogRef', ['afterClosed']);
        dialogRefSpy.afterClosed.and.returnValue(of('left'));
        dialogSpy.open.and.returnValue(dialogRefSpy);
        component.handleExit();

        expect(dialogSpy.open).toHaveBeenCalledWith(SimpleDialogComponent, {
            disableClose: true,
            data: {
                title: 'Abandonner la partie?',
                messages: ["- Vous quitteriez la page d'attente"],
                confirm: true,
            },
        });

        expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
    });

    it('should not navigate if dialog result is not left', () => {
        const dialogRefSpy = jasmine.createSpyObj('DialogRef', ['afterClosed']);
        dialogRefSpy.afterClosed.and.returnValue(of('stay'));
        dialogSpy.open.and.returnValue(dialogRefSpy);

        component.handleExit();

        expect(routerSpy.navigate).not.toHaveBeenCalled();
    });
});
