import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MapCreationPageComponent } from './map-creation-page.component';

describe('MapCreationPageComponent', () => {
    let component: MapCreationPageComponent;
    let fixture: ComponentFixture<MapCreationPageComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MapCreationPageComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(MapCreationPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
