import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { CreationDialogComponent } from '@app/components/creation-dialog/creation-dialog.component';
import { GameListComponent } from '@app/components/game-list/game-list.component';
import { mockGames } from '@app/mocks/mock-game';
import { GameListService } from '@app/services/game-list/game-list.service';
import { of } from 'rxjs';
import { AdministrationPageComponent } from './administration-page.component';

describe('AdministrationPageComponent', () => {
    let component: AdministrationPageComponent;
    let fixture: ComponentFixture<AdministrationPageComponent>;
    let gameListServiceSpy: jasmine.SpyObj<GameListService>;
    let routerMock: jasmine.SpyObj<Router>;
    let activatedRouteMock: jasmine.SpyObj<ActivatedRoute>;
    let dialogSpy: jasmine.SpyObj<MatDialog>;

    beforeEach(async () => {
        routerMock = jasmine.createSpyObj('Router', ['navigate']);
        dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

        gameListServiceSpy = jasmine.createSpyObj('GameListService', [
            'isListeEmpty',
            'getAllVisibleGames',
            'selectGame',
            'deselectGame',
            'getGames',
            'getAllGames',
            'setSelectedGame',
            'changeVisibility',
        ]);

        gameListServiceSpy.getGames.and.returnValue(of(mockGames));

        await TestBed.configureTestingModule({
            imports: [AdministrationPageComponent, GameListComponent, MatDialogModule],
            providers: [
                { provide: MatDialog, useValue: dialogSpy },
                { provide: GameListService, useValue: gameListServiceSpy },
                { provide: Router, useValue: routerMock },
                { provide: ActivatedRoute, useValue: activatedRouteMock },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(AdministrationPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should be created', () => {
        expect(component).toBeTruthy();
    });

    it('should open PopUpComponent when openPopUp() is called', () => {
        component.openPopUp();
        expect(dialogSpy.open).toHaveBeenCalledWith(CreationDialogComponent, { width: '40%', height: '50%' });
    });
});
