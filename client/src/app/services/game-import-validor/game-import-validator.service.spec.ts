import { TestBed } from '@angular/core/testing';
import {
    ErrorMessages,
    GameMode,
    INVALID_TILES_TYPE,
    MAX_PLAYER_LARGE_MAP,
    MAX_PLAYER_MEDIUM_MAP,
    MAX_PLAYER_SMALL_MAP,
    NO_OBJECT,
    ObjectType,
    SIZE_LARGE_MAP,
    SIZE_MEDIUM_MAP,
    SIZE_SMALL_MAP,
    TEST_INVALID_SIZE,
    TileType,
} from '@app/constants';
import { mockGames } from '@app/mocks/mock-game';
import { GameListService } from '@app/services/game-list/game-list.service';
import { MapValidatorService } from '@app/services/map-validator/map-validator.service';
import { Game } from '@common/interfaces/game';
import { of } from 'rxjs';
import { GameImportValidatorService } from './game-import-validator.service';

describe('GameImportValidatorService', () => {
    let service: GameImportValidatorService;
    let gameListServiceSpy: jasmine.SpyObj<GameListService>;
    let mapValidatorServiceSpy: jasmine.SpyObj<MapValidatorService>;

    beforeEach(() => {
        const gameListSpy = jasmine.createSpyObj('GameListService', ['getAllGames']);
        const mapValidatorSpy = jasmine.createSpyObj('MapValidatorService', ['isDoorPlacementValid']);

        gameListSpy.getAllGames.and.returnValue(of([...mockGames]));

        TestBed.configureTestingModule({
            providers: [
                GameImportValidatorService,
                { provide: GameListService, useValue: gameListSpy },
                { provide: MapValidatorService, useValue: mapValidatorSpy },
            ],
        });

        service = TestBed.inject(GameImportValidatorService);
        gameListServiceSpy = TestBed.inject(GameListService) as jasmine.SpyObj<GameListService>;
        mapValidatorServiceSpy = TestBed.inject(MapValidatorService) as jasmine.SpyObj<MapValidatorService>;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('validateMap', () => {
        let mockGame: Game;

        beforeEach(() => {
            mockGame = JSON.parse(JSON.stringify(mockGames[0]));
        });

        it('should return no errors for a valid game', async () => {
            const validDimension = SIZE_SMALL_MAP;

            mockGame.tiles = Array.from({ length: validDimension }, () => Array(validDimension).fill(TileType.Ground));
            mockGame.itemPlacement = Array.from({ length: validDimension }, () => Array(validDimension).fill(NO_OBJECT));

            mockGame.itemPlacement[0][0] = ObjectType.Spawn;
            mockGame.itemPlacement[0][1] = ObjectType.Spawn;
            mockGame.itemPlacement[1][0] = ObjectType.Sandal;
            mockGame.itemPlacement[1][1] = ObjectType.Trident;
            mockGame.nbPlayers = 2;

            mockGame.dimension = validDimension;

            gameListServiceSpy.getAllGames.and.returnValue(of([]));
            mapValidatorServiceSpy.isDoorPlacementValid.and.returnValue(true);

            const errors = await service.validateMap(mockGame);
            expect(errors.length).toBe(0);
        });

        it('should validate name uniqueness', async () => {
            gameListServiceSpy.getAllGames.and.returnValue(of(mockGames));

            const errors = await service.validateMap(mockGame);
            expect(errors).toContain(ErrorMessages.NameAlreadyExists);
        });

        it('should validate sufficient terrain tiles', async () => {
            mockGame.tiles = [
                [TileType.Wall, TileType.Wall],
                [TileType.Wall, TileType.Wall],
            ];

            const errors = await service.validateMap(mockGame);
            expect(errors).toContain('- Au moins la moitié des tuiles doivent être couverts de tuiles de terrain (gazon, eau, glace, eau)');
        });

        it('should validate door placement', async () => {
            mockGame.tiles = [
                [TileType.Wall, TileType.Wall, TileType.Wall],
                [TileType.Wall, TileType.OpenDoor, TileType.Wall],
            ];
            mapValidatorServiceSpy.isDoorPlacementValid.and.returnValue(false);

            const errors = await service.validateMap(mockGame);
            expect(errors).toContain("- Au moins une porte n'est pas valide: ");
        });

        it('should validate spawn points', async () => {
            mockGame.nbPlayers = 3;

            const errors = await service.validateMap(mockGame);
            expect(errors).toContain('- Tous les points de départ doivent être placés sur la carte.');
        });

        it('should add an error for invalid dimensions', async () => {
            const invalidDimension = TEST_INVALID_SIZE;

            mockGame.tiles = Array.from({ length: invalidDimension }, () => Array(invalidDimension).fill(TileType.Ground));
            mockGame.itemPlacement = Array.from({ length: invalidDimension }, () => Array(invalidDimension).fill(NO_OBJECT));

            mockGame.dimension = invalidDimension;

            gameListServiceSpy.getAllGames.and.returnValue(of([]));
            mapValidatorServiceSpy.isDoorPlacementValid.and.returnValue(true);

            const errors = await service.validateMap(mockGame);

            expect(errors).toContain(ErrorMessages.InvalidDimension);
        });

        it('should add an error if tiles dimensions are invalid', async () => {
            mockGame.tiles = [
                [TileType.Ground, TileType.Ground],
                [TileType.Ground, TileType.Ground],
            ];
            mockGame.itemPlacement = [
                [NO_OBJECT, NO_OBJECT],
                [NO_OBJECT, NO_OBJECT],
            ];
            mockGame.dimension = SIZE_SMALL_MAP;

            const errors = await service.validateMap(mockGame);
            expect(errors).toContain(ErrorMessages.InvalidTilesDimensions);
        });

        it('should validate tile dimensions', async () => {
            mockGame.tiles = [[TileType.Ground]];
            mockGame.itemPlacement = [[NO_OBJECT]];

            const errors = await service.validateMap(mockGame);
            expect(errors).toContain(ErrorMessages.InvalidTilesDimensions);
        });

        it('should validate tile types', async () => {
            mockGame.tiles = [
                [INVALID_TILES_TYPE, TileType.Wall],
                [TileType.Water, TileType.OpenDoor],
            ];

            const errors = await service.validateMap(mockGame);
            expect(errors).toContain(ErrorMessages.InvalidTileType);
        });

        it('should validate object types', async () => {
            mockGame.itemPlacement = [
                [INVALID_TILES_TYPE, NO_OBJECT],
                [NO_OBJECT, ObjectType.Spawn],
            ];

            const errors = await service.validateMap(mockGame);
            expect(errors).toContain(ErrorMessages.InvalidObjectType);
        });

        it('should validate the number of objects for a small map', async () => {
            mockGame.dimension = SIZE_SMALL_MAP;
            mockGame.itemPlacement = [
                [ObjectType.Sandal, NO_OBJECT],
                [ObjectType.Trident, ObjectType.Spawn],
            ];
            const noErrors = await service.validateMap(mockGame);
            expect(noErrors).not.toContain(ErrorMessages.InvalidNbObjects);

            mockGame.itemPlacement = [
                [ObjectType.Sandal, ObjectType.Sandal],
                [ObjectType.Trident, ObjectType.Spawn],
            ];
            const errors = await service.validateMap(mockGame);
            expect(errors).toContain(ErrorMessages.InvalidNbObjects);
        });

        it('should validate the number of objects for a medium map', async () => {
            mockGame.dimension = SIZE_MEDIUM_MAP;
            mockGame.itemPlacement = [
                [NO_OBJECT, ObjectType.Sandal, NO_OBJECT],
                [ObjectType.Trident, ObjectType.Spawn, ObjectType.Sandal],
                [NO_OBJECT, NO_OBJECT, ObjectType.Trident],
            ];
            const noErrors = await service.validateMap(mockGame);
            expect(noErrors).not.toContain(ErrorMessages.InvalidNbObjects);

            mockGame.itemPlacement = [
                [ObjectType.Sandal, ObjectType.Sandal, ObjectType.Sandal],
                [ObjectType.Trident, ObjectType.Spawn, ObjectType.Sandal],
                [ObjectType.Sandal, ObjectType.Trident, ObjectType.Sandal],
            ];
            const errors = await service.validateMap(mockGame);
            expect(errors).toContain(ErrorMessages.InvalidNbObjects);
        });

        it('should validate the number of objects for a large map', async () => {
            mockGame.dimension = SIZE_LARGE_MAP;
            mockGame.itemPlacement = Array.from({ length: SIZE_LARGE_MAP }, () => Array(SIZE_LARGE_MAP).fill(NO_OBJECT));
            mockGame.itemPlacement[0][0] = ObjectType.Sandal;
            mockGame.itemPlacement[0][1] = ObjectType.Trident;
            mockGame.itemPlacement[0][2] = ObjectType.Sandal;
            mockGame.itemPlacement[0][3] = ObjectType.Trident;
            const noErrors = await service.validateMap(mockGame);
            expect(noErrors).not.toContain(ErrorMessages.InvalidNbObjects);

            mockGame.itemPlacement[0][4] = ObjectType.Sandal;
            mockGame.itemPlacement[0][5] = ObjectType.Trident;
            mockGame.itemPlacement[0][6] = ObjectType.Sandal;
            mockGame.itemPlacement[0][7] = ObjectType.Trident;
            mockGame.itemPlacement[0][8] = ObjectType.Sandal;
            const errors = await service.validateMap(mockGame);
            expect(errors).toContain(ErrorMessages.InvalidNbObjects);
        });

        it('should validate title length and content', async () => {
            mockGame.name = '';

            const errors = await service.validateMap(mockGame);
            expect(errors).toContain(ErrorMessages.TitleInvalidLength);
        });

        it('should validate description length and content', async () => {
            mockGame.description = '';

            const errors = await service.validateMap(mockGame);
            expect(errors).toContain(
                '- La description de la carte doit avoir une longueur entre 10 et 128 charactères et ne pas uniquement contenir des espaces',
            );
        });

        it('should validate tile accessibility', async () => {
            mockGame.tiles = [
                [TileType.Ground, TileType.Wall],
                [TileType.Wall, TileType.Wall],
                [TileType.Wall, TileType.Ground],
            ];

            const errors = await service.validateMap(mockGame);
            expect(errors).toContain('- Pas toutes les tuiles de terrain sont accessibles');
        });

        it('should validate the game mode', async () => {
            mockGame.mode = 'InvalidMode';
            const errors = await service.validateMap(mockGame);
            expect(errors).toContain(ErrorMessages.InvalidMode);

            mockGame.mode = GameMode.Classic;
            const noErrors = await service.validateMap(mockGame);
            expect(noErrors).not.toContain(ErrorMessages.InvalidMode);
        });

        it('should validate the number of players for a small map', async () => {
            mockGame.dimension = SIZE_SMALL_MAP;
            mockGame.nbPlayers = MAX_PLAYER_SMALL_MAP;
            const noErrors = await service.validateMap(mockGame);
            expect(noErrors).not.toContain(ErrorMessages.InvalidNbPlayers);

            mockGame.nbPlayers = MAX_PLAYER_SMALL_MAP + 1;
            const errors = await service.validateMap(mockGame);
            expect(errors).toContain(ErrorMessages.InvalidNbPlayers);
        });

        it('should validate the number of players for a medium map', async () => {
            mockGame.dimension = SIZE_MEDIUM_MAP;
            mockGame.nbPlayers = MAX_PLAYER_MEDIUM_MAP;
            const noErrors = await service.validateMap(mockGame);
            expect(noErrors).not.toContain(ErrorMessages.InvalidNbPlayers);

            mockGame.nbPlayers = MAX_PLAYER_MEDIUM_MAP + 1;
            const errors = await service.validateMap(mockGame);
            expect(errors).toContain(ErrorMessages.InvalidNbPlayers);
        });

        it('should validate the number of players for a large map', async () => {
            mockGame.dimension = SIZE_LARGE_MAP;
            mockGame.nbPlayers = MAX_PLAYER_LARGE_MAP;
            const noErrors = await service.validateMap(mockGame);
            expect(noErrors).not.toContain(ErrorMessages.InvalidNbPlayers);

            mockGame.nbPlayers = MAX_PLAYER_LARGE_MAP + 1;
            const errors = await service.validateMap(mockGame);
            expect(errors).toContain(ErrorMessages.InvalidNbPlayers);
        });
    });

    describe('validateName', () => {
        it('should add an error message if the name already exists', async () => {
            const name = mockGames[0].name;
            gameListServiceSpy.getAllGames.and.returnValue(of(mockGames));

            await service['validateName'](name);
            expect(service.errorMessages).toContain(ErrorMessages.NameAlreadyExists);
        });

        it('should not add an error message if the name does not exist', async () => {
            const name = 'UniqueName';
            gameListServiceSpy.getAllGames.and.returnValue(of(mockGames));

            await service['validateName'](name);
            expect(service.errorMessages).not.toContain(ErrorMessages.NameAlreadyExists);
        });
    });
});
