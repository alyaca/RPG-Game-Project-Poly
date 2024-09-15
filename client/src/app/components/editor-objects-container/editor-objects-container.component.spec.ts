import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditorObjectsContainerComponent } from './editor-objects-container.component';

describe('EditorObjectsContainerComponent', () => {
    let component: EditorObjectsContainerComponent;
    let fixture: ComponentFixture<EditorObjectsContainerComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [EditorObjectsContainerComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(EditorObjectsContainerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
