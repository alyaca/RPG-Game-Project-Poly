import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';
import { GameAdminstrationService } from '@app/services/game-adminstration.service';
import { PopUpComponent } from '../../components/popUp/popUp.component';
import { AdministrationPageComponent } from './administration-page.component';

describe('AdministrationPageComponent', () => {
    let component: AdministrationPageComponent;
    let fixture: ComponentFixture<AdministrationPageComponent>;
    let gameAdminstrationServiceSpy: jasmine.SpyObj<GameAdminstrationService>;
    let dialogSpy: jasmine.SpyObj<MatDialog>;

    beforeEach(async () => {
        dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
        gameAdminstrationServiceSpy = jasmine.createSpyObj('GameAdminstrationService', ['gameVisibility']);

        TestBed.configureTestingModule({
            imports: [MatDialogModule, RouterModule.forRoot([])],
            providers: [
                { provide: MatDialog, useValue: dialogSpy },
                { provide: GameAdminstrationService, useValue: gameAdminstrationServiceSpy },
            ],
        }).compileComponents();
        TestBed.overrideProvider(GameAdminstrationService, { useValue: gameAdminstrationServiceSpy });
        fixture = TestBed.createComponent(AdministrationPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should be created', () => {
        expect(component).toBeTruthy();
    });

    it('should call gameVisibility() on gameAdministrationService when gameVisibility() is called', () => {
        const game = { visibility: true };

        component.gameVisibility(game);

        expect(gameAdminstrationServiceSpy.gameVisibility).toHaveBeenCalledWith(game);
    });

    it('should open PopUpComponent when openPopUp() is called', () => {
        component.openPopUp();
        expect(dialogSpy.open).toHaveBeenCalledWith(PopUpComponent, { width: '30%', height: '35%' });
    });

    it('should set the hovered game when setHoveredGame() is called', () => {
        const game = {
            src: '../../../assets/images/tiles/WaterTile-test.jpg',
            name: 'Game 1',
            size: 15,
            description: 'Game test description',
            mode: 'CTF',
            date: '2024-06-18',
        };
        component.setHoveredGame(game);

        expect(component.game).toBe(game);
    });
});
