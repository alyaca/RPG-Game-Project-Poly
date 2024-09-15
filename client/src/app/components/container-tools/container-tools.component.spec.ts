import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContainerToolsComponent } from './container-tools.component';

describe('ContainerToolsComponent', () => {
    let component: ContainerToolsComponent;
    let fixture: ComponentFixture<ContainerToolsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ContainerToolsComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(ContainerToolsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
