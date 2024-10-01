import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { ACCESS_CODE_LENGTH, MAX_ACCESS_CODE_VALUE } from '@app/constants';
import { Map } from '@app/interfaces/map';
import { mockGames } from '@app/mocks/mock-game';
import { GameListService } from '@app/services/game-list.service';
import { BehaviorSubject, of } from 'rxjs';
import { WaitingPageComponent } from './waiting-page.component';

describe('WaitingPageComponent', () => {
    let component: WaitingPageComponent;
    let fixture: ComponentFixture<WaitingPageComponent>;
    let gameListServiceSpy: jasmine.SpyObj<GameListService>;
    let routerSpy: jasmine.SpyObj<Router>;

    beforeEach(async () => {
        gameListServiceSpy = jasmine.createSpyObj('GameListService', ['chosenGameSubject']);
        gameListServiceSpy.chosenGameSubject = new BehaviorSubject<Map | null>(mockGames[0]);
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);

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
});
