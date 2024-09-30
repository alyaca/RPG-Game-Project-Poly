import { TestBed } from '@angular/core/testing';
import { ToolService } from './tool.service';

describe('ToolService', () => {
    let service: ToolService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(ToolService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('setSelectedTile', () => {
        it('should set the selectedTile to the given tile if it is not already selected', () => {
            service.setSelectedTile('water-tile');
            expect(service.getSelectedTile()).toBe('water-tile');
        });

        it('should set the selectedTile to an empty string if the same tile is selected again', () => {
            service.setSelectedTile('water-tile');
            service.setSelectedTile('water-tile');
            expect(service.getSelectedTile()).toBe('');
        });

        it('should allow selecting a different tile', () => {
            service.setSelectedTile('water-tile');
            service.setSelectedTile('ice-tile');
            expect(service.getSelectedTile()).toBe('ice-tile');
        });
    });

    describe('getSelectedTile', () => {
        it('should return the current selected tile', () => {
            service.setSelectedTile('wall-tile');
            expect(service.getSelectedTile()).toBe('wall-tile');
        });

        it('should return undefined if no tile has been selected', () => {
            expect(service.getSelectedTile()).toBeUndefined();
        });
    });
});
