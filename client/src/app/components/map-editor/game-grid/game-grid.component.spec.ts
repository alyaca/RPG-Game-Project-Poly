import { SimpleChange, SimpleChanges } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GameObjectsContainerComponent } from '@app/components/map-editor/game-objects-container/game-objects-container.component';
import { NO_OBJECT, SIZE_SMALL_MAP } from '@app/constants';
import { mockLobbyPlayers } from '@app/mocks/mock-lobby-players';
import { mockGameNavigation, mockPositions } from '@app/mocks/mock-map';
import { mockObjects } from '@app/mocks/mock-object';
import { mockPlayer } from '@app/mocks/mock-player';
import { mockPlayers } from '@app/mocks/mock-players';
import { mockRoom } from '@app/mocks/mock-room';
import { mockValidationInfo } from '@app/mocks/mock-validation';
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
import { TileType } from '@common/constants';
import { Player, Position, Status } from '@common/interfaces/player';
import { ServerToClientEvent } from '@common/socket.events';
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
        gameTileInfoServiceSpy = jasmine.createSpyObj('GameTileInfoService', ['transferRoomData', 'tileId', 'itemId', 'selectedRow', 'selectedCol']);
        mockSocket = { data: { roomCode: '1234' }, id: 'admin' } as unknown as Socket;
        tileServiceSpy = jasmine.createSpyObj('TileService', ['setTile', 'resetGrid', 'removeTile']);
        gameObjectsContainerSpy = jasmine.createSpyObj('GameObjectsContainerComponent', ['objects']);
        toolServiceSpy = jasmine.createSpyObj('ToolService', ['getSelectedTile', 'setSelectedTile', 'deactivateTileApplicator']);
        toolButtonServiceSpy = jasmine.createSpyObj('ToolButtonService', [], { selectedButton: null });
        mapValidatorServiceSpy = jasmine.createSpyObj('MapValidatorService', ['validateMap']);
        gameCreationServiceSpy = jasmine.createSpyObj('GameCreationService', ['resetGrid', 'loadExistingTiles', 'loadExistingObjects', 'rightClick', 'showDetails', 'updateDimensions']);
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
            'handleTileClick',
            'loadExistingGame',
            'startMouseDrag',
            'startDropItem',
            'removeOnRightClick',
        ]);
        navigationServiceSpy = jasmine.createSpyObj('NavigationService', [
            'initialize',
            'getPortraitId',
            'isPositionWithinBounds',
            'isReachableTile',
            'removePlayer',
            'gameMap',
            'isNeighbor',
            'updateTile',
            'isOnWall',
            'respawnPlayer',
            'handleInventoryEvent',
            'updateObjects',
        ]);
        gameServiceSpy = jasmine.createSpyObj('GameService', ['hasActionPoints']);
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
        component['gridSize'] = SIZE_SMALL_MAP;
        component['objectsArray'] = gameObjectServiceMock.initObjectsArray();
        gameObjectManagerServiceSpy['gridSize'] = SIZE_SMALL_MAP;
        spyOn(component, 'sendInfoToMapCreationPage');
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize properties correctly', () => {
        expect(component['isMouseDown']).toBeFalse();
    });

    it('should call getSelectedTile', () => {
        component.getSelectedTile();
        expect(toolServiceSpy.getSelectedTile).toHaveBeenCalled();
    });

    describe('ngOnInit', () => {
        it('should call connect on ngOnInit', () => {
            component.ngOnInit();
            expect(socketCommunicationServiceSpy.connect).toHaveBeenCalled();
        });
    });

    it('closeTileDescription should set isPopUpVisible to false', () => {
        component.closeTileDescription();
        expect(component['tileInfoVisible']).toBeFalse();
    });

    it('should call transferRoomData', () => {
        socketCommunicationServiceSpy.on.and.callFake(<T>(event: string, callback: (data: T) => void) => {
            if (event === ServerToClientEvent.ObtainRoomInfo) {
                callback(mockRoom as T);
            }
        });
        component.ngOnInit();
        expect(gameTileInfoServiceSpy.transferRoomData).toHaveBeenCalledWith(mockRoom);
    });

    it('should call handleTeleport on TeleportPlayer event', () => {
        const data = { position: { x: 0, y: 0 }, player: { ...mockPlayers[0] }};
        socketCommunicationServiceSpy.on.and.callFake(<T>(event: string, callback: (data: T) => void) => {
            if (event === ServerToClientEvent.TeleportPlayer) {
                callback(data as T);
            }
        });
        spyOn(component, 'handleTeleport');
        component.initMovementListeners();
        expect(component.handleTeleport).toHaveBeenCalled();
    });

    describe('socket listener', () => {
        it('should listen to mapInformation event onInit', () => {
            spyOn(component, 'displayPortraitOnSpawnPoints');
            socketCommunicationServiceSpy.on.and.callFake(<Room>(event: string, callback: (data: Room) => void) => {
                if (event === ServerToClientEvent.GameGridMapInfo) {
                    callback(mockRoom as Room);
                }
            });

            component.ngOnInit();
            expect(component.displayPortraitOnSpawnPoints).toHaveBeenCalled();
            expect(navigationServiceSpy.initialize).toHaveBeenCalled();
        });

        it('should decrease action points on combatEnd', () => {
            socketCommunicationServiceSpy.on.and.callFake(<T>(event: string, callback: (data: T) => void) => {
                if (event === ServerToClientEvent.CombatEnd) {
                    callback({} as T);
                }
            });
            component['activePlayer'] = { ...mockPlayers[0] };
            component['activePlayer'].attributes.actionPoints = 1;
            component.initGameListeners();
            expect(component['activePlayer'].attributes.actionPoints).toEqual(0);
        });

        it('should set fastestPath', () => {
            socketCommunicationServiceSpy.on.and.callFake(<T>(event: string, callback: (data: T) => void) => {
                if (event === ServerToClientEvent.PathFound) {
                    callback([ { x: 0, y: 0 }] as T);
                }
            });
            component.initMovementListeners();
            expect(component.fastestPath).toEqual([ { x: 0, y: 0 }]);
        });

        it('should set activePlayer if handleInventoryEvent is defined', () => {
            socketCommunicationServiceSpy.on.and.callFake(<T>(event: string, callback: (data: T) => void) => {
                if (event === ServerToClientEvent.UpdatedInventory) {
                    callback({ ...mockPlayers[0]} as T);
                }
            });
            navigationServiceSpy.handleInventoryEvent.and.returnValue({ ...mockPlayers[0]});
            component.initObjectsListeners();
            expect(component['activePlayer']).toEqual(mockPlayers[0]);
        });

        it('should call updateObjects on UpdateObjects event', () => {
            const items = [[1,0]];
            socketCommunicationServiceSpy.on.and.callFake(<T>(event: string, callback: (data: T) => void) => {
                if (event === ServerToClientEvent.UpdateObjects) {
                    callback(items as T);
                }
            });
            component.initObjectsListeners();
            expect(navigationServiceSpy.updateObjects).toHaveBeenCalledWith(items);
        });

        it('should call updateObjects and modify this.objectsArray on UpdateObjectsAfterCombat', () => {
            component.objectsArray = [[0, 0]];
            const data = { newGrid: [[1,1]], position: { x: 0, y: 0 }};
            socketCommunicationServiceSpy.on.and.callFake(<T>(event: string, callback: (data: T) => void) => {
                if (event === ServerToClientEvent.UpdateObjectsAfterCombat) {
                    callback(data as T);
                }
            });
            component.initObjectsListeners();
            expect(navigationServiceSpy.updateObjects).toHaveBeenCalledWith(data.newGrid);
            expect(component.objectsArray[data.position.x][data.position.y]).toEqual(data.newGrid[data.position.x][data.position.y]);
        });

        it('should set reachableTiles on reachableTiles event', () => {
            socketCommunicationServiceSpy.on.and.callFake(<T>(event: string, callback: (data: T) => void) => {
                if (event === 'reachableTiles') {
                    callback(mockPositions as T);
                }
            });
            component.ngOnInit();
            expect(navigationServiceSpy.reachableTiles).toEqual(mockPositions);
        });

        it('should listen to doorClicked event onInit', () => {
            socketCommunicationServiceSpy.on.and.callFake(<T>(event: string, callback: (data: T) => void) => {
                if (event === 'doorClicked') {
                    callback(mockGameNavigation.tiles as T);
                }
            });

            component.ngOnInit();
            expect(gameServiceSpy.isActionDoorSelected).toBe(false);
            expect(component['tilesGrid']).toEqual(mockGameNavigation.tiles);
        });

        it('should listen to isActive event onInit', () => {
            const player = mockLobbyPlayers[0];
            socketCommunicationServiceSpy.socket.id = player.id;
            navigationServiceSpy.players = mockLobbyPlayers;

            socketCommunicationServiceSpy.on.and.callFake(<T>(event: string, callback: (data: T) => void) => {
                if (event === ServerToClientEvent.ActivePlayer) {
                    callback(player as T);
                }
            });

            component.ngOnInit();
            expect(component.currentPlayer).toEqual(player);
        });

        it('should set isActivePlayer and currentPlayer when playerId matches socket ID', () => {
            socketCommunicationServiceSpy.socket.id = mockLobbyPlayers[0].id;
            navigationServiceSpy.players = mockLobbyPlayers;
            socketCommunicationServiceSpy.on.and.callFake(<T>(event: string, callback: (data: T) => void) => {
                if (event === ServerToClientEvent.ActivePlayer) {
                    callback(mockLobbyPlayers[0] as T);
                }
            });
            component.ngOnInit();
            expect(component['currentPlayer']).toEqual(mockLobbyPlayers[0]);
        });

        it('closeTileDescription should set isPopUpVisible to false', () => {
            component.closeTileDescription();
            expect(component['tileInfoVisible']).toBeFalse();
        });

        it('should listen to endMovement event onInit', () => {
            socketCommunicationServiceSpy.on.and.callFake(<T>(event: string, callback: (data: T) => void) => {
                if (event === 'endMovement') {
                    callback({} as T);
                }
            });

            component.ngOnInit();
            expect(component['isMoving']).toBe(false);
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
            expect(component.respawnPlayer).toHaveBeenCalled();
        });
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

    it('sendNavigation should call navigateToTile in navigationService', () => {
        gameCreationServiceSpy.isModifiable = false;
        component.isActivePlayer = true;
        component.hasStarted = true;
        component['isMoving'] = false;
        component.sendNavigation();
        expect(component['isMoving']).toBeTrue();
        expect(socketCommunicationServiceSpy.send).toHaveBeenCalled();
    });

    describe('ngOnChanges', () => {
        it('should reset the grid when resetTrigger changes to true', () => {
            component['tilesGrid'] = mockRoom.gameMap.tiles;
            component['oldMapName'] = mockValidationInfo.oldMapName;
            component['tilesGrid'][0][0] = TileType.Water;
            const changes: SimpleChanges = {
                resetTrigger: new SimpleChange(false, true, false),
            };

            component.ngOnChanges(changes);
            expect(component['tilesGrid']).toBeUndefined();
        });

        it('should validate the map when saveTrigger changes to true', () => {
            component['oldMapName'] = mockValidationInfo.oldMapName;
            component.mapName = mockValidationInfo.title;
            component.mapDescription = mockValidationInfo.description;
            component['tilesGrid'] = mockValidationInfo.tiles;
            gameCreationServiceSpy.isNewGame = mockValidationInfo.isNewMap;
            const changes: SimpleChanges = {
                saveTrigger: new SimpleChange(false, true, false),
            };
            component.saveTrigger = true;
            component.ngOnChanges(changes);
            expect(mapValidatorServiceSpy.validateMap).toHaveBeenCalledWith(mockValidationInfo);
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

    // it('should call the methods to remove the tile on right click', () => {
    //     gameCreationServiceSpy.isModifiable = true;
    //     const event = new MouseEvent('click', { button: 2 });
    //     component.removeOnRightClick(event, 0, 0);
    //     expect(tileServiceSpy.removeTile).toHaveBeenCalled();
    //     expect(gameObjectManagerServiceSpy.removeObjectByClick).toHaveBeenCalledWith(event,  {row: 0, col: 0 });
    //     expect(component.sendInfoToMapCreationPage).toHaveBeenCalled();
    // });

    describe('mouse events', () => {
        it('should set isMouseDown to false on mouse up', () => {
            component['isMouseDown'] = true;
            component.onMouseUp();
            expect(component['isMouseDown']).toBeFalse();
        });
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
        component['previousRow'] = 1;
        component['previousCol'] = 1;
        spyOn(component, 'onTileClick').and.callThrough();

        component.onTileClick(1, 1);
        expect(component.onTileClick).toHaveBeenCalledTimes(1);
    });

    // it('onDrop should call the correct methods', () => {
    //     component['isMouseDown'] = true;
    //     const mockEvent = new DragEvent('drop');
    //     component.onDrop(mockEvent, 1, 1);
    //     expect(gameObjectManagerServiceSpy.onDrop).toHaveBeenCalledWith(mockEvent, {
    //         position: { x: 1, y: 1 },
    //         tiles: component['tilesGrid'],
    //         objects: component['objectsArray'],
    //     });
    //     expect(component['isMouseDown']).toBeFalse();
    //     expect(toolServiceSpy.setSelectedTile).toHaveBeenCalledWith('');
    //     expect(component.sendInfoToMapCreationPage).toHaveBeenCalled();
    // });

    it('should not call the other methods if the condition is met in onTileClick', () => {
        component['isMouseDown'] = true;
        component['previousRow'] = 1;
        component['previousCol'] = 1;
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
            component['isMouseDown'] = false;
            const mockEvent = new MouseEvent('click', { button: 0 });
            component.onMouseDown(mockEvent, 0, 0);
            expect(component['isMouseDown']).toBeTrue();
            expect(component.onTileClick).toHaveBeenCalled();
        });

        it('should not call onTileClick if the event button is not 0', () => {
            component['isMouseDown'] = false;
            const mockEvent = new MouseEvent('click', { button: 1 });
            component.onMouseDown(mockEvent, 0, 0);
            expect(component['isMouseDown']).toBeFalse();
            expect(component.onTileClick).not.toHaveBeenCalled();
        });

        it('should call onTileClick if isMouseDown is true', () => {
            component['isMouseDown'] = true;
            component.onMouseMove(0, 0);
            expect(component.onTileClick).toHaveBeenCalledWith(0, 0);
        });

        it('should not call onTileClick if isMouseDown is false', () => {
            component['isMouseDown'] = false;
            component.onMouseMove(0, 0);
            expect(component.onTileClick).not.toHaveBeenCalled();
        });
    });

    it('should set the tile to Ground if conditions are met', () => {
        const event = new MouseEvent('click');
        component.removeTile(event, 0, 0);
        expect(tileServiceSpy.removeTile).toHaveBeenCalled
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

    // it('should call showDetails if debug mode is disabled', () => {
    //     navigationServiceSpy.isDebugMode = false;
    //     spyOn(component, 'showDetails');
    //     const event = new MouseEvent('click');
    //     component.handleRightClick(event, 0, 0);
    //     expect(component.showDetails).toHaveBeenCalled();
    // });
});
