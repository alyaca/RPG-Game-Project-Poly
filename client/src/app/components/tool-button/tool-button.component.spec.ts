import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ContainerToolsComponent } from '../container-tools/container-tools.component';
import { ToolButtonComponent } from './tool-button.component';

// @Component({
//     selector: 'app-container-tools',
//     standalone: true,
//     imports: [],
//     templateUrl: './container-tools.component.html',
//     styleUrl: './container-tools.component.scss',
// })
// class MockContainerToolsComponent {}

describe('ToolButtonComponent', () => {
    let component: ToolButtonComponent;
    let fixture: ComponentFixture<ToolButtonComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ContainerToolsComponent, ToolButtonComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(ToolButtonComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
