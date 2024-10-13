import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { JoinGameComponent } from './join-game.component';

// TODO : remake all the tests for connection
describe('JoinGameComponent', () => {
    let component: JoinGameComponent;
    let fixture: ComponentFixture<JoinGameComponent>;
    let routerMock: jasmine.SpyObj<Router>;
    let activatedRouteMock: jasmine.SpyObj<ActivatedRoute>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [JoinGameComponent],
            providers: [
                { provide: Router, useValue: routerMock },
                { provide: ActivatedRoute, useValue: activatedRouteMock },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(JoinGameComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should set isCharacterFormVisible to false when hideCharacterForm is called', () => {
        component.leaveGame('1111');
        expect(component.isCharacterFormVisible).toBeFalse();
    });

    it('should set isCharacterFormVisible to true when joinGame is called with a code that exists', () => {
        component.accessCode = '7654';
        component.joinGame(component.accessCode);
        expect(component.isCharacterFormVisible).toBeTrue();
    });

    it('should not set isCharacterFormVisible to true when joinGame is called with a code that does not exist', () => {
        component.accessCode = '7654';
        component.joinGame(component.accessCode);
        expect(component.isCharacterFormVisible).toBeFalse();
    });
});
