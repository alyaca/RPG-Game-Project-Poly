import { TestBed } from '@angular/core/testing';

import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { NB_ITEMS_LARGE_MAP, NB_ITEMS_MEDIUM_MAP, NB_ITEMS_SMALL_MAP, SIZE_LARGE_MAP, SIZE_MEDIUM_MAP, SIZE_SMALL_MAP } from '@app/constants';
import { dummyInfo, dummyMap } from '@app/mocks/mock-map';
import { SaveGameService } from './save-game.service';

describe('SaveGameService', () => {
    let service: SaveGameService;
    let httpMock: HttpTestingController;

    beforeEach(async () => {
        TestBed.configureTestingModule({
            providers: [provideHttpClient(), provideHttpClientTesting()],
        });
        httpMock = TestBed.inject(HttpTestingController);
        service = TestBed.inject(SaveGameService);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should create a POST request if the selected game is null', () => {
        dummyInfo.height = SIZE_MEDIUM_MAP;
        service.saveGame(dummyInfo, null);

        const request = httpMock.expectOne(`${service.apiURL}`);
        expect(request.request.method).toBe('POST');
        expect(request.request.body).toEqual({
            name: dummyInfo.name,
            description: dummyInfo.description,
            visible: true,
            mode: 'normal',
            nbPlayers: NB_ITEMS_MEDIUM_MAP,
            image: dummyInfo.image,
            tiles: dummyInfo.grid,
            dimension: dummyMap.dimension,
            itemPlacement: dummyInfo.items,
            isSelected: false,
            lastModification: jasmine.any(Date),
        });
    });

    it('should create a PUT request if there is a selected game', () => {
        dummyInfo.height = SIZE_MEDIUM_MAP;
        service.saveGame(dummyInfo, dummyMap);

        const request = httpMock.expectOne(`${service.apiURL}`);
        expect(request.request.method).toBe('PUT');
        expect(request.request.body).toEqual({
            _id: dummyMap._id,
            name: dummyInfo.name,
            description: dummyInfo.description,
            visible: dummyMap.visible,
            mode: dummyMap.mode,
            nbPlayers: dummyMap.nbPlayers,
            image: dummyInfo.image,
            tiles: dummyInfo.grid,
            dimension: dummyMap.dimension,
            itemPlacement: dummyInfo.items,
            isSelected: false,
            lastModification: jasmine.any(Date),
        });
    });

    it('should have the correct number of players', () => {
        dummyInfo.height = SIZE_SMALL_MAP;
        service.saveGame(dummyInfo, null);
        const request = httpMock.expectOne(`${service.apiURL}`);
        expect(request.request.method).toBe('POST');
        expect(request.request.body.nbPlayers).toEqual(NB_ITEMS_SMALL_MAP);

        dummyInfo.height = SIZE_LARGE_MAP;
        service.saveGame(dummyInfo, null);
        const secondRequest = httpMock.expectOne(`${service.apiURL}`);
        expect(secondRequest.request.method).toBe('POST');
        expect(secondRequest.request.body.nbPlayers).toEqual(NB_ITEMS_LARGE_MAP);
    });
});
