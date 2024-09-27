import { HttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { GameListComponent } from '@app/components/game-list/game-list.component';
import { NB_ITEMS_LARGE_MAP, NB_ITEMS_MEDIUM_MAP, NB_ITEMS_SMALL_MAP } from '@app/constants';
import { SaveGameService } from '@app/services/save-game.service';
import { of } from 'rxjs';
import { MapCreationPageComponent } from './map-creation-page.component';

describe('MapCreationPageComponent', () => {
    let saveGameService: SaveGameService;
    let component: MapCreationPageComponent;
    let fixture: ComponentFixture<MapCreationPageComponent>;
    let gameList: GameListComponent;
    let http: HttpClient;

    beforeEach(async () => {
        saveGameService = new SaveGameService(http);
        component = new MapCreationPageComponent(gameList, saveGameService);
        await TestBed.configureTestingModule({
            imports: [MapCreationPageComponent, HttpClient],
            providers: [
                {
                    provide: ActivatedRoute,
                    useValue: {
                        paramMap: of({}),
                        snapshot: { paramMap: { get: () => 'map' } },
                    },
                },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(MapCreationPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('Selected map size', () => {
        it('should update selectedSize and call updateItemCount on selection change', () => {
            spyOn(component, 'updateItemCount');

            const mockEvent = { value: 'medium' };
            component.onSelectionChange(mockEvent);

            expect(component.selectedSize).toBe('medium');
            expect(component.updateItemCount).toHaveBeenCalled();
        });

        it('should set randomItemCount and spawnPointCount to NB_OBJECTS_SMALL_MAP when selectedSize is small', () => {
            component.selectedSize = 'small';
            component.updateItemCount();
            expect(component.randomItemCount).toBe(NB_ITEMS_SMALL_MAP);
            expect(component.spawnPointCount).toBe(NB_ITEMS_SMALL_MAP);
        });

        it('should set randomItemCount and spawnPointCount to NB_OBJECTS_MEDIUM_MAP when selectedSize is medium', () => {
            component.selectedSize = 'medium';
            component.updateItemCount();
            expect(component.randomItemCount).toBe(NB_ITEMS_MEDIUM_MAP);
            expect(component.spawnPointCount).toBe(NB_ITEMS_MEDIUM_MAP);
        });

        it('should set randomItemCount and spawnPointCount to NB_OBJECTS_LARGE_MAP when selectedSize is large', () => {
            component.selectedSize = 'large';
            component.updateItemCount();
            expect(component.randomItemCount).toBe(NB_ITEMS_LARGE_MAP);
            expect(component.spawnPointCount).toBe(NB_ITEMS_LARGE_MAP);
        });
    });
});
