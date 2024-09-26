import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { SimpleDialogComponent } from '@app/components/simple-dialog/simple-dialog.component';
import { MapValidatorService, TileType } from './map-validator.service';

describe('MapValidatorService', () => {
    let service: MapValidatorService;
    let dialogSpy: jasmine.SpyObj<MatDialog>;

    beforeEach(() => {
        dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
        TestBed.configureTestingModule({
            providers: [MapValidatorService, { provide: MatDialog, useValue: dialogSpy }],
        });
        service = TestBed.inject(MapValidatorService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('validateMap', () => {
        it('should open dialog with error message if the map has insufficient terrain tiles', () => {
            spyOn(service, 'hasSufficientTerrainTiles').and.returnValue(false);
            spyOn(service, 'validateAllDoors').and.returnValue(true);
            spyOn(service, 'isEveryTileAccessible').and.returnValue(true);
            spyOn(service, 'validateTextInput').and.returnValue(true);

            service.validateMap([[TileType.Wall]], 'validTitle', 'validDescription');

            expect(dialogSpy.open).toHaveBeenCalledWith(SimpleDialogComponent, {
                data: {
                    message: "<ul><li>il n'y a pas assez de tuiles de terrain</li></ul>",
                    title: 'Carte invalide',
                },
            });
        });

        it('should open dialog with success message if the map is valid', () => {
            spyOn(service, 'hasSufficientTerrainTiles').and.returnValue(true);
            spyOn(service, 'validateAllDoors').and.returnValue(true);
            spyOn(service, 'isEveryTileAccessible').and.returnValue(true);
            spyOn(service, 'validateTextInput').and.returnValue(true);

            service.validateMap([[TileType.Ground]], 'validTitle', 'validDescription');

            expect(dialogSpy.open).toHaveBeenCalledWith(SimpleDialogComponent, {
                data: {
                    message: 'Sauvegarde réussie',
                    title: 'Carte valide',
                },
            });
        });
    });

    describe('isDoorPlacementValid', () => {
        it('should return true for a valid door placement', () => {
            const map = [
                [TileType.Wall, TileType.Ground, TileType.Wall],
                [TileType.Wall, TileType.ClosedDoor, TileType.Wall],
                [TileType.Wall, TileType.Ground, TileType.Wall],
            ];

            expect(service.isDoorPlacementValid(map, 1, 1)).toBeTrue();
        });

        it('should return true for a valid door placement', () => {
            const map = [
                [TileType.Wall, TileType.Wall, TileType.Wall],
                [TileType.Ice, TileType.ClosedDoor, TileType.Ground],
                [TileType.Wall, TileType.Wall, TileType.Wall],
            ];

            expect(service.isDoorPlacementValid(map, 1, 1)).toBeTrue();
        });

        it('should return false for an invalid door placement', () => {
            const map = [
                [TileType.Wall, TileType.Ground, TileType.Wall],
                [TileType.Wall, TileType.ClosedDoor, TileType.Ground],
                [TileType.Wall, TileType.Wall, TileType.Wall],
            ];

            expect(service.isDoorPlacementValid(map, 1, 1)).toBeFalse();
        });
    });

    describe('validateAllDoors', () => {
        it('should return true if all doors are valid', () => {
            const map = [
                [TileType.Wall, TileType.ClosedDoor, TileType.Wall],
                [TileType.Wall, TileType.Wall, TileType.Wall],
            ];
            spyOn(service, 'isDoorPlacementValid').and.returnValue(true);

            expect(service.validateAllDoors(map)).toBeTrue();
        });

        it('should return false if any door is invalid', () => {
            const map = [
                [TileType.Wall, TileType.ClosedDoor, TileType.Ground],
                [TileType.Wall, TileType.Wall, TileType.Wall],
            ];
            spyOn(service, 'isDoorPlacementValid').and.returnValue(false);

            expect(service.validateAllDoors(map)).toBeFalse();
        });
    });

    describe('hasSufficientTerrainTiles', () => {
        it('should return true if more than half of the map contains terrain tiles', () => {
            const map = [
                [TileType.Ground, TileType.Ground],
                [TileType.Wall, TileType.Ground],
            ];

            expect(service.hasSufficientTerrainTiles(map)).toBeTrue();
        });

        it('should return false if less than half of the map contains terrain tiles', () => {
            const map = [
                [TileType.Wall, TileType.Ground],
                [TileType.Wall, TileType.Wall],
            ];

            expect(service.hasSufficientTerrainTiles(map)).toBeFalse();
        });
    });

    describe('isEveryTileAccessible', () => {
        it('should return true if all non-wall tiles are accessible', () => {
            const map = [
                [TileType.Ground, TileType.Ground],
                [TileType.Wall, TileType.Ground],
            ];

            expect(service.isEveryTileAccessible(map)).toBeTrue();
        });

        it('should return false if any non-wall tile is inaccessible', () => {
            const map = [
                [TileType.Ground, TileType.Wall],
                [TileType.Wall, TileType.Ground],
            ];

            expect(service.isEveryTileAccessible(map)).toBeFalse();
        });
    });

    describe('validateTextInput', () => {
        it('should return true if both title and description are valid', () => {
            expect(service.validateTextInput('Valid Title', 'Valid Description')).toBeTrue();
        });

        it('should return false if title is empty', () => {
            expect(service.validateTextInput('', 'Valid Description')).toBeFalse();
        });

        it('should return false if description is empty', () => {
            expect(service.validateTextInput('Valid Title', '')).toBeFalse();
        });
    });

    describe('validateMap', () => {
        it('should add error message when validateAllDoors returns false', () => {
            spyOn(service, 'validateAllDoors').and.returnValue(false);
            spyOn(service, 'isEveryTileAccessible').and.returnValue(true);
            spyOn(service, 'validateTextInput').and.returnValue(true);

            service.validateMap([[TileType.Wall]], 'validTitle', 'validDescription');

            expect(service['errorMessages']).toContain("au moins une porte n'est pas valide");
        });

        it('should add error message when isEveryTileAccessible returns false', () => {
            spyOn(service, 'validateAllDoors').and.returnValue(true);
            spyOn(service, 'isEveryTileAccessible').and.returnValue(false);
            spyOn(service, 'validateTextInput').and.returnValue(true);

            service.validateMap([[TileType.Wall]], 'validTitle', 'validDescription');

            expect(service['errorMessages']).toContain('pas toutes les tuiles de terrain sont accessibles');
        });

        it('should add error message when validateTextInput returns false', () => {
            spyOn(service, 'validateAllDoors').and.returnValue(true);
            spyOn(service, 'isEveryTileAccessible').and.returnValue(true);
            spyOn(service, 'validateTextInput').and.returnValue(false);

            service.validateMap([[TileType.Wall]], '', '');

            expect(service['errorMessages']).toContain('le titre ou la description de la carte est vide');
        });
    });
});
