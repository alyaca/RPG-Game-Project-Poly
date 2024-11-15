import { SimpleChange, SimpleChanges } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GameObjectsContainerComponent } from '@app/components/map-editor/game-objects-container/game-objects-container.component';
import { NO_OBJECT, ObjectType, SIZE_SMALL_MAP, TileType } from '@app/constants';
import { mockLobbyPlayers } from '@app/mocks/mock-lobby-players';
import { mockGameNavigation } from '@app/mocks/mock-map';
import { mockObjects } from '@app/mocks/mock-object';
import { mockPlayer, playerNavigation } from '@app/mocks/mock-player';
import { mockPlayers } from '@app/mocks/mock-players';
import { mockRoom } from '@app/mocks/mock-room';
import { GameCreationService } from '@app/services/game-creation/game-creation.service';
import { GameObjectService } from '@app/services/game-object/game-object.service';
import { GameTileInfoService } from '@app/services/game-tile-info/game-tile-info.service';
import { MapValidatorService } from '@app/services/map-validator/map-validator.service';
import { NavigationService } from '@app/services/navigation/navigation.service';
import { GameService } from '@app/services/sockets/game/game.service';
import { SocketCommunicationService } from '@app/services/sockets/socket-communication/socket-communication.service';
import { TileService } from '@app/services/tile/tile.service';
import { ToolButtonService } from '@app/services/tool-button/tool-button.service';
import { ToolService } from '@app/services/tool/tool.service';
import { Player, Position, Status } from '@common/player';
import { Socket } from 'socket.io-client';
import { GameGridComponent } from './game-grid.component';

/* eslint-disable max-lines */
describe('GameGridComponent', () => {
    let component: GameGridComponent;
    let fixture: ComponentFixture<GameGridComponent>;
    let toolServiceSpy: jasmine.SpyObj<ToolService>;
    let mapValidatorServiceSpy: jasmine.SpyObj<MapValidatorService>;
    let gameObjectManagerServiceSpy: jasmine.SpyObj<GameObjectService>;
    let toolButtonServiceSpy: jasmine.SpyObj<ToolButtonService>;
    let gameCreationServiceSpy: jasmine.SpyObj<GameCreationService>;
    let tileServiceSpy: jasmine.SpyObj<TileService>;
    let gameObjectsContainerSpy: jasmine.SpyObj<GameObjectsContainerComponent>;
    let socketCommunicationServiceSpy: jasmine.SpyObj<SocketCommunicationService>;
    let navigationServiceSpy: jasmine.SpyObj<NavigationService>;
    let mockSocket: Socket;
    let gameServiceSpy: jasmine.SpyObj<GameService>;
    let gameTileInfoServiceSpy: jasmine.SpyObj<GameTileInfoService>;

    beforeEach(async () => {
        gameTileInfoServiceSpy = jasmine.createSpyObj('GameTileInfoService', ['tileId', 'itemId', 'selectedRow', 'selectedCol']);
        mockSocket = { data: { roomCode: '1234' }, id: 'admin' } as unknown as Socket;
        tileServiceSpy = jasmine.createSpyObj('TileService', ['setTile', 'resetGrid', 'removeTile', 'toggleDoorState']);
        gameObjectsContainerSpy = jasmine.createSpyObj('GameObjectsContainerComponent', ['objects']);
        toolServiceSpy = jasmine.createSpyObj('ToolService', ['getSelectedTile', 'setSelectedTile', 'deactivateTileApplicator']);
        toolButtonServiceSpy = jasmine.createSpyObj('ToolButtonService', [], { selectedButton: null });
        mapValidatorServiceSpy = jasmine.createSpyObj('MapValidatorService', ['validateMap']);
        gameCreationServiceSpy = jasmine.createSpyObj('GameCreationService', ['updateDimensions']);
        socketCommunicationServiceSpy = jasmine.createSpyObj('SocketCommunicationService', ['isSocketAlive', 'connect', 'on', 'send', 'once']);
        gameObjectManagerServiceSpy = jasmine.createSpyObj('GameObjectService', [
            'initObjectsArray',
            'resetObjectsCount',
            'getObjectById',
            'getGameObjectOnTile',
            'updateObjectGridPosition',
            'removeObjectFromGrid',
            'removeObjectByClick',
            'resetDrag,',
            'loadMapObjectCount',
            'ngOnDestroy',
            'resetObjectsCount',
            'checkGameObject',
            'onDrop',
            'handleGameObjectOnTile',
            'isValidTileForObject',
            'onDragStart',
            'objects',
        ]);
        navigationServiceSpy = jasmine.createSpyObj('NavigationService', [
            'initialize',
            'findReachableTiles',
            'findFastestPath',
            'navigateToTile',
            'checkFell',
            'getPortraitId',
            'isPositionWithinBounds',
            'isReachableTile',
            'removePlayer',
            'showDetails',
            'haveActions',
            'gameMap',
            'isNeighbor',
            'updateTile',
            'getTileCost',
        ]);
        gameServiceSpy = jasmine.createSpyObj('GameService', ['hasActionPoints']);

        tileServiceSpy.resetGrid.and.callFake((gridSize: number) => {
            return Array.from({ length: gridSize }, () => Array.from({ length: SIZE_SMALL_MAP }, () => TileType.Ground));
        });
        socketCommunicationServiceSpy.socket = mockSocket;

        const gameObjectServiceMock = {
            initObjectsArray: jasmine.createSpy('initObjectsArray').and.callFake(() => {
                return Array.from({ length: SIZE_SMALL_MAP }, () => Array.from({ length: SIZE_SMALL_MAP }, () => NO_OBJECT));
            }),
        };

        await TestBed.configureTestingModule({
            declarations: [],
            providers: [
                { provide: ToolService, useValue: toolServiceSpy },
                { provide: ToolButtonService, useValue: toolButtonServiceSpy },
                { provide: MapValidatorService, useValue: mapValidatorServiceSpy },
                { provide: GameObjectService, useValue: gameObjectManagerServiceSpy },
                { provide: GameCreationService, useValue: gameCreationServiceSpy },
                { provide: TileService, useValue: tileServiceSpy },
                { provide: GameObjectsContainerComponent, useValue: gameObjectsContainerSpy },
                { provide: SocketCommunicationService, useValue: socketCommunicationServiceSpy },
                { provide: NavigationService, useValue: navigationServiceSpy },
                { provide: GameService, useValue: gameServiceSpy },
                { provide: GameTileInfoService, useValue: gameTileInfoServiceSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(GameGridComponent);
        component = fixture.componentInstance;
        gameObjectManagerServiceSpy.objects = mockObjects;
        gameObjectsContainerSpy.gameObjects = mockObjects;
        component.gridSize = SIZE_SMALL_MAP;
        component.tilesGrid = tileServiceSpy.resetGrid(component.gridSize, component.tilesGrid);
        component.objectsArray = gameObjectServiceMock.initObjectsArray();
        gameObjectManagerServiceSpy['gridSize'] = SIZE_SMALL_MAP;
        spyOn(component, 'sendInfoToMapCreationPage');
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize properties correctly', () => {
        expect(component.selectedRow).toBe(0);
        expect(component.selectedCol).toBe(0);
        expect(component.isMouseDown).toBeFalse();
    });

    it('should call getSelectedTile', () => {
        component.getSelectedTile();
        expect(toolServiceSpy.getSelectedTile).toHaveBeenCalled();
    });

    describe('ngOnInit', () => {
        it('should initialize tiles and objects from loaded data for an existing game', () => {
            gameCreationServiceSpy.updateDimensions.and.returnValue(SIZE_SMALL_MAP);
            gameCreationServiceSpy.isNewGame = false;
            gameCreationServiceSpy.loadedTiles = [
                [1, 1],
                [0, 0],
            ];
            gameCreationServiceSpy.loadedObjects = [
                [ObjectType.Armor, ObjectType.Armor],
                [0, 0],
            ];

            component.ngOnInit();

            expect(gameCreationServiceSpy.updateDimensions).toHaveBeenCalled();
            expect(component.gridSize).toBe(SIZE_SMALL_MAP);
            expect(component.tilesGrid).toEqual([
                [1, 1],
                [0, 0],
            ]);
            expect(component.objectsArray).toEqual([
                [ObjectType.Armor, ObjectType.Armor],
                [0, 0],
            ]);
            expect(gameObjectManagerServiceSpy.objectsArray).toEqual([
                [ObjectType.Armor, ObjectType.Armor],
                [0, 0],
            ]);
        });
    });

    it('showDetails should set attributes', () => {
        component.tilesGrid = mockGameNavigation.tiles;
        component.objectsArray = mockGameNavigation.itemPlacement;
        gameCreationServiceSpy.isModifiable = false;
        component.isActivePlayer = true;
        const event = new MouseEvent('click', { button: 2 });
        component.showDetails(event, 0, 0);
        expect(component.isPopupVisible).toBeTrue();
        expect(gameTileInfoServiceSpy.tileId).toEqual(component.tilesGrid[0][0]);
        expect(gameTileInfoServiceSpy.itemId).toEqual(component.objectsArray[0][0]);
        expect(gameTileInfoServiceSpy.selectedCol).toEqual(0);
        expect(gameTileInfoServiceSpy.selectedRow).toEqual(0);
    });

    it('closeTileDescription should set isPopUpVisible to false', () => {
        component.closeTileDescription();
        expect(component.isPopupVisible).toBeFalse();
    });

    describe('socket listener', () => {
        it('should listen to mapInformation event onInit', () => {
            spyOn(component, 'displayPortraitOnSpawnPoints');
            socketCommunicationServiceSpy.on.and.callFake(<Room>(event: string, callback: (data: Room) => void) => {
                if (event === 'mapInformation') {
                    callback(mockRoom as Room);
                }
            });

            component.ngOnInit();
            expect(component.displayPortraitOnSpawnPoints).toHaveBeenCalled();
            expect(navigationServiceSpy.initialize).toHaveBeenCalled();
        });

        it('should listen to toggleDoor event onInit', () => {
            socketCommunicationServiceSpy.on.and.callFake(<T>(event: string, callback: (data: T) => void) => {
                if (event === 'toggleDoor') {
                    callback(mockGameNavigation.tiles as T);
                }
            });

            component.ngOnInit();
            expect(navigationServiceSpy.gameMap.tiles).toEqual(mockGameNavigation.tiles);
            expect(component.tilesGrid).toEqual(mockGameNavigation.tiles);
        });

        it('should listen to isActive event onInit', () => {
            const player = mockLobbyPlayers[0];
            socketCommunicationServiceSpy.socket.id = player.id;
            navigationServiceSpy.players = mockLobbyPlayers;
            spyOn(component, 'findReachableTiles');

            socketCommunicationServiceSpy.on.and.callFake(<T>(event: string, callback: (data: T) => void) => {
                if (event === 'isActive') {
                    callback(player as T);
                }
            });

            component.ngOnInit();
            expect(component.findReachableTiles).toHaveBeenCalled();
        });

        it('should set isActivePlayer and currentPlayer when playerId matches socket ID', () => {
            socketCommunicationServiceSpy.socket.id = mockLobbyPlayers[0].id;
            navigationServiceSpy.players = mockLobbyPlayers;
            const findReachablesTileSpy = spyOn(component, 'findReachableTiles');
            socketCommunicationServiceSpy.on.and.callFake(<T>(event: string, callback: (data: T) => void) => {
                if (event === 'isActive') {
                    callback(mockLobbyPlayers[0].id as T);
                }
            });
            component.ngOnInit();
            expect(component.currentPlayer).toEqual(mockLobbyPlayers[0]);
            expect(findReachablesTileSpy).toHaveBeenCalled();
        });

        it('showDetails should set attributes', () => {
            component.tilesGrid = mockGameNavigation.tiles;
            component.objectsArray = mockGameNavigation.itemPlacement;
            gameCreationServiceSpy.isModifiable = false;
            component.isActivePlayer = true;
            const event = new MouseEvent('click', { button: 2 });
            component.showDetails(event, 0, 0);
            expect(component.isPopupVisible).toBeTrue();
            expect(gameTileInfoServiceSpy.tileId).toEqual(component.tilesGrid[0][0]);
            expect(gameTileInfoServiceSpy.itemId).toEqual(component.objectsArray[0][0]);
            expect(gameTileInfoServiceSpy.selectedCol).toEqual(0);
            expect(gameTileInfoServiceSpy.selectedRow).toEqual(0);
        });

        it('closeTileDescription should set isPopUpVisible to false', () => {
            component.closeTileDescription();
            expect(component.isPopupVisible).toBeFalse();
        });

        it('should listen to endMovement event onInit', () => {
            socketCommunicationServiceSpy.on.and.callFake(<T>(event: string, callback: (data: T) => void) => {
                if (event === 'endMovement') {
                    callback({} as T);
                }
            });

            component.ngOnInit();
            expect(component.isMoving).toBe(false);
        });

        it('should listen to playerNavigation event onInit', () => {
            const mockPosition: Position = { x: 3, y: 4 };
            spyOn(component, 'navigateToTile');
            socketCommunicationServiceSpy.on.and.callFake(<T>(event: string, callback: (data: T) => void) => {
                if (event === 'playerNavigation') {
                    callback(mockPosition as T);
                }
            });
            component.ngOnInit();
            expect(component.navigateToTile).toHaveBeenCalledWith(mockPosition);
        });

        it('should listen to playerDisconnected event onInit', () => {
            const mockDisconnectedPlayer = { ...mockPlayer, status: Status.Disconnected };
            socketCommunicationServiceSpy.on.and.callFake(<T>(event: string, callback: (data: T) => void) => {
                if (event === 'playerDisconnected') {
                    callback(mockDisconnectedPlayer as T);
                }
            });
            component.ngOnInit();
            expect(navigationServiceSpy.removePlayer).toHaveBeenCalled();
        });

        it('should listen to respawnPlayer event onInit and call respawnPlayer with the correct data', () => {
            const mockPosition = { x: 1, y: 2 };
            const mockPlayerToReplace = { id: 1, status: Status.Player } as unknown as Player;
            spyOn(component, 'respawnPlayer');

            socketCommunicationServiceSpy.on.and.callFake(<T>(event: string, callback: (data: T) => void) => {
                if (event === 'respawnPlayer') {
                    callback({ newPosition: mockPosition, playerToReplace: mockPlayerToReplace } as T);
                }
            });

            component.ngOnInit();
            expect(component.respawnPlayer).toHaveBeenCalledWith(mockPosition, mockPlayerToReplace);
        });

        it('should listen to combatEnd event and set actionPoints to 0, then call checkEndTurn', () => {
            spyOn(component, 'checkEndTurn');
            component.activePlayer = mockPlayers[0];

            socketCommunicationServiceSpy.on.and.callFake(<T>(event: string, callback: (data: T) => void) => {
                if (event === 'combatEnd') {
                    callback({} as T);
                }
            });

            component.ngOnInit();
            expect(component.checkEndTurn).toHaveBeenCalled();
        });
    });

    it('findReachableTiles should call findReachablesTiles in navigation service', () => {
        component.isActivePlayer = true;
        component.activePlayer = mockLobbyPlayers[0];
        navigationServiceSpy.gameMap = mockGameNavigation;
        component.findReachableTiles();
        expect(navigationServiceSpy.findReachableTiles).toHaveBeenCalledWith(
            component.activePlayer,
            navigationServiceSpy.gameMap,
            component.activePlayer.attributes.movementPointsLeft,
        );
    });

    it('should not call findReachableTiles if the player is not active', () => {
        component.isActivePlayer = false;
        component.findReachableTiles();
        expect(navigationServiceSpy.findReachableTiles).not.toHaveBeenCalled();
    });

    it('findPath should call findFastestPath', () => {
        navigationServiceSpy.isReachableTile.and.returnValue(true);
        component.findPath(1, 1);
        expect(navigationServiceSpy.findFastestPath).toHaveBeenCalled();
    });

    it('should not call findFastestPath if tile is not reachable', () => {
        navigationServiceSpy.isReachableTile.and.returnValue(false);
        component.findPath(1, 1);
        expect(navigationServiceSpy.findFastestPath).not.toHaveBeenCalled();
    });

    it('isOnFastestPath should return true if a tile matches', () => {
        component.fastestPath = [{ x: 1, y: 1 }];
        const result = component.isOnFastestPath(1, 1);
        expect(result).toBeTrue();
    });

    it('isOnFastestPath should return false if tile is not on fastest path', () => {
        component.fastestPath = [{ x: 1, y: 1 }];
        const result = component.isOnFastestPath(2, 1);
        expect(result).toBeFalse();
    });

    it('handleTileClick should call handleDoorAction', () => {
        gameServiceSpy.isActionDoorSelected = true;
        component.activePlayer = mockLobbyPlayers[0];
        gameServiceSpy.hasActionPoints.and.returnValue(true);
        const handleDoorActionSpy = spyOn(component, 'handleDoorAction');
        component.handleTileClick(1, 1);
        expect(handleDoorActionSpy).toHaveBeenCalledWith(1, 1);
    });

    it('handleTileClick should call handleFightAction', () => {
        gameServiceSpy.isActionCombatSelected = true;
        component.activePlayer = mockLobbyPlayers[0];
        gameServiceSpy.hasActionPoints.and.returnValue(true);
        const handleFightActionSpy = spyOn(component, 'handleFightAction');
        component.handleTileClick(1, 1);
        expect(handleFightActionSpy).toHaveBeenCalledWith(1, 1);
    });

    it('handleTileClick should call sendNavigation', () => {
        gameServiceSpy.isActionDoorSelected = false;
        component.tilesGrid = [
            [0, 0],
            [0, 0],
        ];
        const sendNavigationSpy = spyOn(component, 'sendNavigation');
        component.handleTileClick(0, 0);
        expect(sendNavigationSpy).toHaveBeenCalledWith(0, 0);
    });

    it('handleDoorAction should call everything', () => {
        const findReachablesTileSpy = spyOn(component, 'findReachableTiles');
        component.activePlayer = mockLobbyPlayers[0];
        component.activePlayer.attributes.actionPoints = 1;
        navigationServiceSpy.gameMap.itemPlacement = mockGameNavigation.itemPlacement;
        navigationServiceSpy.gameMap.tiles = mockGameNavigation.tiles;
        navigationServiceSpy.isNeighbor.and.returnValue(true);
        component.handleDoorAction(0, 0);
        expect(component.tilesGrid).toEqual(navigationServiceSpy.gameMap.tiles);
        expect(component.activePlayer.attributes.actionPoints).toEqual(0);
        expect(gameServiceSpy.isActionDoorSelected).toBeFalse();
        expect(socketCommunicationServiceSpy.send).toHaveBeenCalledWith('doorClicked', navigationServiceSpy.gameMap.tiles);
        expect(findReachablesTileSpy).toHaveBeenCalled();
    });

    // it('handleFightAction should call everything', () => {
    //     const findReachablesTileSpy = spyOn(component, 'findReachableTiles');
    //     component.activePlayer = mockLobbyPlayers[0];
    //     component.activePlayer.attributes.actionPoints = 1;
    //     navigationServiceSpy.gameMap.itemPlacement = mockGameNavigation.itemPlacement;
    //     navigationServiceSpy.gameMap.tiles = mockGameNavigation.tiles;
    //     navigationServiceSpy.isNeighbor.and.returnValue(true);
    //     component.handleFightAction(0, 0);
    //     expect(component.activePlayer.attributes.actionPoints).toEqual(0);
    //     expect(gameServiceSpy.isActionCombatSelected).toBeFalse();
    //     expect(socketCommunicationServiceSpy.send).toHaveBeenCalled();
    //     expect(findReachablesTileSpy).toHaveBeenCalled();
    // });

    it('sendNavigation should call navigateToTile in navigationService', () => {
        gameCreationServiceSpy.isModifiable = false;
        component.isActivePlayer = true;
        component.hasStarted = true;
        component.isMoving = false;
        component.sendNavigation(0, 0);
        expect(component.isMoving).toBeTrue();
        expect(navigationServiceSpy.navigateToTile).toHaveBeenCalled();
        expect(socketCommunicationServiceSpy.send).toHaveBeenCalled();
    });

    it('navigateToTile should call everything', () => {
        const displayPortraitOnSpawnPointsSpy = spyOn(component, 'displayPortraitOnSpawnPoints');
        const findReachablesTileSpy = spyOn(component, 'findReachableTiles');
        component.activePlayer = mockLobbyPlayers[0];
        component.navigateToTile({ x: 0, y: 0 });
        expect(findReachablesTileSpy).toHaveBeenCalled();
        expect(displayPortraitOnSpawnPointsSpy).toHaveBeenCalled();
        expect(navigationServiceSpy.updateTile).toHaveBeenCalled();
        expect(navigationServiceSpy.getTileCost).toHaveBeenCalled();
        expect(component.activePlayer.attributes.movementPointsLeft).toEqual(component.activePlayer.attributes.movementPointsLeft - 1);
        expect(component.activePlayer.position).toEqual({ x: 0, y: 0 });
    });

    it('checkEndTurn should return if activePlayer is undefined or it is not his turn', () => {
        component.activePlayer = undefined;
        component.checkEndTurn();
        expect(navigationServiceSpy.findReachableTiles).not.toHaveBeenCalled();
        expect(navigationServiceSpy.haveActions).not.toHaveBeenCalled();
        expect(socketCommunicationServiceSpy.send).not.toHaveBeenCalled();

        component.activePlayer = mockLobbyPlayers[0];
        component.currentPlayer = mockLobbyPlayers[1];
        component.checkEndTurn();
        expect(navigationServiceSpy.findReachableTiles).not.toHaveBeenCalled();
        expect(navigationServiceSpy.haveActions).not.toHaveBeenCalled();
        expect(socketCommunicationServiceSpy.send).not.toHaveBeenCalled();
    });

    it('should call everything if conditions are met', () => {
        component.activePlayer = mockLobbyPlayers[0];
        component.isActivePlayer = true;
        component.currentPlayer = mockLobbyPlayers[0];

        navigationServiceSpy.haveActions.and.returnValue(false);
        navigationServiceSpy.findReachableTiles.and.returnValue([]);
        component.checkEndTurn();
        expect(navigationServiceSpy.findReachableTiles).toHaveBeenCalled();

        navigationServiceSpy.haveActions.and.returnValue(false);
        navigationServiceSpy.findReachableTiles.and.returnValue([{ x: 1, y: 1 }]);
        component.activePlayer.attributes.movementPointsLeft = 0;
        component.checkEndTurn();
        expect(socketCommunicationServiceSpy.send).toHaveBeenCalled();

        component.activePlayer.attributes.movementPointsLeft = 0;
        navigationServiceSpy.haveActions.and.returnValue(true);
        gameServiceSpy.hasActionPoints.and.returnValue(false);
        component.checkEndTurn();
        expect(socketCommunicationServiceSpy.send).toHaveBeenCalled();
    });

    describe('deepCopyMatrix', () => {
        it('should return a deep copy of the matrix', () => {
            const matrix = [
                [1, 2],
                [2, 0],
            ];
            const result = component.deepCopyMatrix(matrix);
            expect(result).toEqual(matrix);
            expect(result).not.toBe(matrix);
        });

        it('should return an empty array if matrix is undefined', () => {
            const result = component.deepCopyMatrix(null);
            expect(result).toEqual([]);
        });
    });

    describe('ngOnChanges', () => {
        it('should reset the grid when resetTrigger changes to true', () => {
            component.tilesGrid[0][0] = TileType.Water;
            const changes: SimpleChanges = {
                resetTrigger: new SimpleChange(false, true, false),
            };

            component.ngOnChanges(changes);
            expect(component.tilesGrid).toEqual([]);
        });

        it('should validate the map when saveTrigger changes to true', () => {
            component.mapName = 'Test Map';
            component.mapDescription = 'Description';
            component.tilesGrid = [[TileType.Ground]];
            gameCreationServiceSpy.isNewGame = true;
            const changes: SimpleChanges = {
                saveTrigger: new SimpleChange(false, true, false),
            };
            component.saveTrigger = true;
            component.ngOnChanges(changes);
            expect(mapValidatorServiceSpy.validateMap).toHaveBeenCalledWith(
                component.tilesGrid,
                component.mapName,
                component.mapDescription,
                true,
                component.oldMapName,
            );
        });

        it('should reset objectsArray and tilesGrid when resetTrigger changes and isNewGame is true', () => {
            gameCreationServiceSpy.isNewGame = true;
            const changes: SimpleChanges = {
                resetTrigger: new SimpleChange(false, true, false),
            };
            component.ngOnChanges(changes);
            expect(gameObjectManagerServiceSpy.initObjectsArray).toHaveBeenCalled();
            expect(gameObjectManagerServiceSpy.resetObjectsCount).toHaveBeenCalled();
            expect(component.sendInfoToMapCreationPage).toHaveBeenCalled();
        });
    });

    it('should call the methods to remove the tile on right click', () => {
        gameCreationServiceSpy.isModifiable = true;
        const event = new MouseEvent('click', { button: 2 });
        component.removeOnRightClick(event, 0, 0);
        expect(tileServiceSpy.removeTile).toHaveBeenCalled();
        expect(gameObjectManagerServiceSpy.removeObjectByClick).toHaveBeenCalledWith(event, 0, 0);
        expect(component.sendInfoToMapCreationPage).toHaveBeenCalled();
    });

    describe('mouse events', () => {
        it('should set isMouseDown to false on mouse up', () => {
            component.isMouseDown = true;
            component.onMouseUp();
            expect(component.isMouseDown).toBeFalse();
        });
    });

    it('should call navigationService.isReachableTile with the correct row and column', () => {
        const row = 2;
        const col = 3;
        component.isReachableTile(row, col);
        expect(navigationServiceSpy.isReachableTile).toHaveBeenCalledWith(row, col);
    });

    describe('drag event', () => {
        it('should prevent default behaviour on drag over ', () => {
            const mockEvent = jasmine.createSpyObj('DragEvent', ['preventDefault']);
            component.onDragOver(mockEvent);
            expect(mockEvent.preventDefault).toHaveBeenCalled();
        });
    });

    it('should return the correct image path for an existing object', () => {
        const mockGameObject = { id: 1, name: 'mock', description: 'mock game object for test', count: 5, image: 'mock/image.png' };
        gameObjectManagerServiceSpy.getObjectById.and.returnValue(mockGameObject);
        const result = component.getObjectImage(mockGameObject.id);
        expect(result).toBe(mockGameObject.image);
    });

    it('should return an empty string for a non-existing object', () => {
        gameObjectManagerServiceSpy.getObjectById.and.returnValue(undefined);
        const result = component.getObjectImage(NO_OBJECT);
        expect(result).toBe('');
    });

    it('should call toolService to reset selectedTile on destroy', () => {
        component.ngOnDestroy();
        expect(toolServiceSpy.selectedTile).toBe('');
    });

    it('should return early when mouse is down and previousRow and previousCol match', () => {
        component.previousRow = 1;
        component.previousCol = 1;
        spyOn(component, 'onTileClick').and.callThrough();

        component.onTileClick(1, 1);
        expect(component.onTileClick).toHaveBeenCalledTimes(1);
    });

    it('onDragStart should call and set the correct methods', () => {
        component.isMouseDown = true;
        gameCreationServiceSpy.isModifiable = true;
        component.onDragStart(1, 1);
        expect(toolServiceSpy.deactivateTileApplicator).toHaveBeenCalled();
        expect(component.isMouseDown).toBeFalse();
        expect(gameObjectManagerServiceSpy.onDragStart).toHaveBeenCalled();
    });

    it('onDrop should call the correct methods', () => {
        component.isMouseDown = true;
        const mockEvent = new DragEvent('drop');
        component.onDrop(mockEvent, 1, 1);
        expect(gameObjectManagerServiceSpy.onDrop).toHaveBeenCalledWith(mockEvent, 1, 1, component.objectsArray, component.tilesGrid);
        expect(component.isMouseDown).toBeFalse();
        expect(toolServiceSpy.setSelectedTile).toHaveBeenCalledWith('');
        expect(component.sendInfoToMapCreationPage).toHaveBeenCalled();
    });

    it('should call isValidTileForObject when calling the component function', () => {
        component.tilesGrid = [
            [1, 1],
            [1, 1],
        ];
        component.isValidTileForObject(1, 1);
        expect(gameObjectManagerServiceSpy.isValidTileForObject).toHaveBeenCalledWith(1, 1, component.tilesGrid);
    });

    it('should not call the other methods if the condition is met in onTileClick', () => {
        component.isMouseDown = true;
        component.previousRow = 1;
        component.previousCol = 1;
        component.onTileClick(1, 1);
        expect(tileServiceSpy.setTile).not.toHaveBeenCalled();
        expect(gameObjectManagerServiceSpy.handleGameObjectOnTile).not.toHaveBeenCalled();
        expect(component.sendInfoToMapCreationPage).not.toHaveBeenCalled();
    });

    describe('onMouseDown and onMouseMove', () => {
        beforeEach(() => {
            spyOn(component, 'onTileClick');
        });

        it('should call onTileClick is button is 0', () => {
            component.isMouseDown = false;
            const mockEvent = new MouseEvent('click', { button: 0 });
            component.onMouseDown(mockEvent, 0, 0);
            expect(component.isMouseDown).toBeTrue();
            expect(component.onTileClick).toHaveBeenCalled();
        });

        it('should not call onTileClick if the event button is not 0', () => {
            component.isMouseDown = false;
            const mockEvent = new MouseEvent('click', { button: 1 });
            component.onMouseDown(mockEvent, 0, 0);
            expect(component.isMouseDown).toBeFalse();
            expect(component.onTileClick).not.toHaveBeenCalled();
        });

        it('should call onTileClick if isMouseDown is true', () => {
            component.isMouseDown = true;
            component.onMouseMove(0, 0);
            expect(component.onTileClick).toHaveBeenCalledWith(0, 0);
        });

        it('should not call onTileClick if isMouseDown is false', () => {
            component.isMouseDown = false;
            component.onMouseMove(0, 0);
            expect(component.onTileClick).not.toHaveBeenCalled();
        });
    });

    it('should set the correct portrait ID for each player at their position', () => {
        navigationServiceSpy.players = [playerNavigation];
        navigationServiceSpy.isPositionWithinBounds.and.returnValue(true);
        navigationServiceSpy.getPortraitId.and.callFake((godName: string | undefined) => {
            switch (godName) {
                case 'Hestia':
                    return ObjectType.Hestia;
                default:
                    return ObjectType.Spawn;
            }
        });
        component.displayPortraitOnSpawnPoints();
        expect(component.objectsArray[0][0]).toBe(ObjectType.Spawn);
    });

    it('should set the tile to Ground if conditions are met', () => {
        component.tilesGrid = [
            [TileType.Water, TileType.Ground],
            [TileType.Ground, TileType.Ground],
        ];
        component.objectsArray = [
            [NO_OBJECT, NO_OBJECT],
            [NO_OBJECT, NO_OBJECT],
        ];

        const event = new MouseEvent('click');
        component.removeTile(event, 0, 0);

        expect(component.tilesGrid[0][0]).toBe(TileType.Ground);
    });

    it('should call updateTile and update position if the player is found', () => {
        const mockPosition = { x: 1, y: 1 };
        const player = { id: 1, position: { x: 0, y: 0 } } as unknown as Player;
        navigationServiceSpy.players = [player];
        spyOn(component, 'displayPortraitOnSpawnPoints');

        component.respawnPlayer(mockPosition, player);

        expect(navigationServiceSpy.updateTile).toHaveBeenCalledWith(player);
        expect(player.position).toEqual(mockPosition);
        expect(component.displayPortraitOnSpawnPoints).toHaveBeenCalled();
    });

    it('should do nothing if the player is not found', () => {
        const mockPosition = { x: 1, y: 1 };
        const player = { id: 1, position: { x: 0, y: 0 } } as unknown as Player;
        navigationServiceSpy.players = [];
        spyOn(component, 'displayPortraitOnSpawnPoints');

        component.respawnPlayer(mockPosition, player);
        expect(navigationServiceSpy.updateTile).not.toHaveBeenCalled();
        expect(component.displayPortraitOnSpawnPoints).not.toHaveBeenCalled();
    });

    it('should return undefined if there is no game object with the specified id', () => {
        const result = component.getPlayerByAvatarName(mockPlayers, ObjectType.Armor);
        expect(result).toBeUndefined();
    });
});
