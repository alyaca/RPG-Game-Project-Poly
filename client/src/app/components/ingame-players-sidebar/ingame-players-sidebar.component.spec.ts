import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IngamePlayersSidebarComponent } from './ingame-players-sidebar.component';

describe('IngamePlayersSidebarComponent', () => {
    let component: IngamePlayersSidebarComponent;
    let fixture: ComponentFixture<IngamePlayersSidebarComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [IngamePlayersSidebarComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(IngamePlayersSidebarComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
