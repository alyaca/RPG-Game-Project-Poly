import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatBoxComponent } from './chat-box.component';

describe('ChatBoxComponent', () => {
    let component: ChatBoxComponent;
    let fixture: ComponentFixture<ChatBoxComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ChatBoxComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(ChatBoxComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should toggle chat visibility', () => {
        component.isChatVisible = false;
        component.toggleChatVisibility();
        expect(component.isChatVisible).toBe(true);
        component.toggleChatVisibility();
        expect(component.isChatVisible).toBe(false);
    });
});
