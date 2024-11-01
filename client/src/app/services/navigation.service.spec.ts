import { TestBed } from '@angular/core/testing';
import { Game } from '@common/game';
import { Player, Status } from '@common/player';
import { NavigationService } from './navigation.service';

describe('NavigationServiceService', () => {
    let service: NavigationService;

    //TODO : placer ca dans un fichier Mock
    const player: Player = {
        id: '123',
        attributes: {
            totalHp: 100,
            currentHp: 100,
            speed: 1,
            movementPointsLeft: 1,
            maxActionPoints: 1,
            actionPoints: 1,
            attack: 1,
            atkDiceMax: 1,
            defense: 1,
            defDiceMax: 1,
        },
        avatar: { name: 'a', src: 'a.img', isSelected: true, isTaken: true },
        isActive: true,
        name: 'abc',
        status: Status.Player,
        victories: 1,
        inventory: [],
        position: { x: 0, y: 0 },
    };
    const mockGame: Game = {
        _id: '1',
        name: 'Mock Game',
        description: 'This is a mock game for testing purposes.',
        visible: true,
        mode: 'single-player',
        nbPlayers: 1,
        image: 'mock-image.png',
        tiles: [
            [1, 3, 3],
            [2, 6, 4],
            [2, 2, 2],
        ],
        dimension: 3,
        itemPlacement: [
            [1, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
        ],
        isSelected: false,
        lastModification: new Date(),
    };

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(NavigationService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should ', () => {
        const path = service.findFastestPath(player, { x: 2, y: 0 }, mockGame);
        expect(path).toEqual([
            { x: 0, y: 0 },
            { x: 1, y: 0 },
            { x: 2, y: 0 },
        ]);
    });
});
