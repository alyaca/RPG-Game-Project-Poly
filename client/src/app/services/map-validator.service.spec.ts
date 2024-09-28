import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { SimpleDialogComponent } from '@app/components/simple-dialog/simple-dialog.component';
import { MapValidatorService, TileType } from './map-validator.service';
import { MAX_LEN_MAP_TITLE, MAX_LEN_MAP_DESCRIPTION } from '@app/constants';

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
            spyOn(service, 'validateTitleLength').and.returnValue(true);
            spyOn(service, 'validateDescriptionLength').and.returnValue(true);

            service.validateMap([[TileType.Wall]], 'validTitle', 'validDescription');

            expect(dialogSpy.open).toHaveBeenCalledWith(SimpleDialogComponent, {
                data: {
                    messages: ['- Au moins la moitié des tuiles doivent être couverts de tuiles de terrain (gazon, eau, glace, eau)'],
                    title: 'Carte invalide',
                },
            });
        });

        it('should open dialog with success message if the map is valid', () => {
            spyOn(service, 'hasSufficientTerrainTiles').and.returnValue(true);
            spyOn(service, 'validateAllDoors').and.returnValue(true);
            spyOn(service, 'isEveryTileAccessible').and.returnValue(true);
            spyOn(service, 'validateTitleLength').and.returnValue(true);
            spyOn(service, 'validateDescriptionLength').and.returnValue(true);

            service.validateMap([[TileType.Ground]], 'validTitle', 'validDescription');

            expect(dialogSpy.open).toHaveBeenCalledWith(SimpleDialogComponent, {
                data: {
                    messages: ["Vous allez être redirigé vers la page d'administration"],
                    title: 'Sauvegarde réussie',
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

    describe('validateMap', () => {
        it('should add error message when validateAllDoors returns false', () => {
            spyOn(service, 'validateAllDoors').and.returnValue(false);
            spyOn(service, 'isEveryTileAccessible').and.returnValue(true);
            spyOn(service, 'validateTitleLength').and.returnValue(true);
            spyOn(service, 'validateDescriptionLength').and.returnValue(true);

            service.validateMap([[TileType.Wall]], 'validTitle', 'validDescription');

            expect(service['errorMessages']).toContain("- Au moins une porte n'est pas valide: ");
        });

        it('should add error message when isEveryTileAccessible returns false', () => {
            spyOn(service, 'validateAllDoors').and.returnValue(true);
            spyOn(service, 'isEveryTileAccessible').and.returnValue(false);
            spyOn(service, 'validateTitleLength').and.returnValue(true);
            spyOn(service, 'validateDescriptionLength').and.returnValue(true);

            service.validateMap([[TileType.Wall]], 'validTitle', 'validDescription');

            expect(service['errorMessages']).toContain('- Pas toutes les tuiles de terrain sont accessibles');
        });

        it('should add error message when validateTitleLength returns false', () => {
            spyOn(service, 'validateAllDoors').and.returnValue(true);
            spyOn(service, 'isEveryTileAccessible').and.returnValue(true);
            spyOn(service, 'validateTitleLength').and.returnValue(false);
            spyOn(service, 'validateDescriptionLength').and.returnValue(true);

            service.validateMap([[TileType.Wall]], '', '');

            expect(service['errorMessages']).toContain(
                '- Le titre de la carte doit avoir une longueur entre 3 et 30 charactères et ne pas uniquement contenir des espaces',
            );
        });

        it('should add error message when validateDescriptionLength returns false', () => {
            spyOn(service, 'validateAllDoors').and.returnValue(true);
            spyOn(service, 'isEveryTileAccessible').and.returnValue(true);
            spyOn(service, 'validateTitleLength').and.returnValue(true);
            spyOn(service, 'validateDescriptionLength').and.returnValue(false);

            service.validateMap([[TileType.Wall]], '', '');

            expect(service['errorMessages']).toContain(
                '- La description de la carte doit avoir une longueur entre 10 et 256 charactères et ne pas uniquement contenir des espaces',
            );
        });

        describe('containsAcharacter', () => {
            it('should return true for non-empty strings', () => {
                expect(service.containsAcharacter('Hello')).toBeTrue();
                expect(service.containsAcharacter(' A ')).toBeTrue();
            });

            it('should return false for empty strings', () => {
                expect(service.containsAcharacter('')).toBeFalse();
                expect(service.containsAcharacter('   ')).toBeFalse();
            });
        });

        describe('validateTitleLength', () => {
            it('should return true for valid titles', () => {
                expect(service.validateTitleLength('Valid Title')).toBeTrue();
                expect(service.validateTitleLength('Another Title')).toBeTrue();
            });

            it('should return false for titles that are too short', () => {
                expect(service.validateTitleLength('A')).toBeFalse();
                expect(service.validateTitleLength('AB')).toBeFalse();
            });

            it('should return false for titles that are too long', () => {
                const longTitle = 'A'.repeat(MAX_LEN_MAP_TITLE + 1); // Generate a string longer than max
                expect(service.validateTitleLength(longTitle)).toBeFalse();
            });

            it('should return false for titles that do not contain a character', () => {
                expect(service.validateTitleLength('   ')).toBeFalse();
            });
        });

        describe('validateDescriptionLength', () => {
            it('should return true for valid descriptions', () => {
                expect(service.validateDescriptionLength('This is a valid description.')).toBeTrue();
            });

            it('should return false for descriptions that are too short', () => {
                expect(service.validateDescriptionLength('Too short')).toBeFalse();
            });

            it('should return false for descriptions that are too long', () => {
                const longDescription = 'A'.repeat(MAX_LEN_MAP_DESCRIPTION + 1); // Generate a string longer than max
                expect(service.validateDescriptionLength(longDescription)).toBeFalse();
            });

            it('should return false for descriptions that do not contain a character', () => {
                expect(service.validateDescriptionLength('   ')).toBeFalse();
            });
        });
    });
});
