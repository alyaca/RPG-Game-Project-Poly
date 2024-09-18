import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GameListService } from '@app/services/game-list.service';
import { CreateGamePageComponent } from './create-game-page.component';

describe('CreateGamePageComponent', () => {
    let component: CreateGamePageComponent;
    let fixture: ComponentFixture<CreateGamePageComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CreateGamePageComponent],
            providers: [GameListService],
        }).compileComponents();

        fixture = TestBed.createComponent(CreateGamePageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
