import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { JoinGameComponent } from './join-game.component';


describe('JoinGameComponent', () => {
    let component: JoinGameComponent;
    let fixture: ComponentFixture<JoinGameComponent>;
    let routerMock: jasmine.SpyObj<Router>;
    let activatedRouteMock: jasmine.SpyObj<ActivatedRoute>;

    beforeEach(async () => {
      

        await TestBed.configureTestingModule({
            imports: [JoinGameComponent],
            providers: [ { provide: Router, useValue: routerMock },
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

   it(('should return true when roomExists is called with a gode that exists'), () => {
        component.fakeCode = '1234';
        component.accessCode = '1234';
        expect(component.roomExists(component.accessCode)).toBe(true);
    });

    
   it(('should return true when roomExists is called with a code that exists'), () => {
    component.fakeCode = '1234';
    component.accessCode = '1234';
    expect(component.roomExists(component.accessCode)).toBe(true);
    });

    it(('should return false when roomExists is called with a code that does not exist'), () => {
      component.fakeCode = '1234';
      component.accessCode = '1784';
      expect(component.roomExists(component.accessCode)).toBe(false);
    });

    
    it('should set isCharacterFormVisible to false when hideCharacterForm is called', () => {
      component.hideCharacterForm();
      expect(component.isCharacterFormVisible).toBeFalse();
    });

    it(('should set isCharacterFormVisible to true when joinGame is called with a code that exists'), () => {
      component.accessCode = '7654';
      component.fakeCode = '7654';
      component.joinGame(component.accessCode);
      expect(component.isCharacterFormVisible).toBeTrue();
    });

    
    it(('should not set isCharacterFormVisible to true when joinGame is called with a code that does not exist'), () => {
      component.accessCode = '7654';
      component.fakeCode = '1111';
      component.joinGame(component.accessCode);
      expect(component.isCharacterFormVisible).toBeFalse();
    });



});
