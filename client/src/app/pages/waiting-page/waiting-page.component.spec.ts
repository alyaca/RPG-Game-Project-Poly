import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WaitingPageComponent } from './waiting-page.component';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { MAX_ACCESS_CODE_VALUE, ACCESS_CODE_LENGTH } from '@app/constants';

describe('WaitingPageComponent', () => {
    let component: WaitingPageComponent;
    let fixture: ComponentFixture<WaitingPageComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [WaitingPageComponent],
            providers: [
                {
                    provide: ActivatedRoute,
                    useValue: {
                        params: of({}),
                        snapshot: { paramMap: { get: () => null } },
                    },
                },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(WaitingPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should generate an access code on initialization', () => {
        component.ngOnInit();
        expect(component.accessCode).toBeTruthy();
    });

    it('should generate a 4-digit access code', () => {
        component.ngOnInit();
        expect(component.accessCode.length).toBe(ACCESS_CODE_LENGTH);
    });

    it('should pad access code with zeroes if necessary', () => {
        const mockRandom = 23;
        spyOn(Math, 'random').and.returnValue(mockRandom / component.maxRandom);

        component.ngOnInit();

        expect(component.accessCode).toBe('0023');
    });

    it('should generate an access code between 0000 and 9999', () => {
        for (let i = 0; i < MAX_ACCESS_CODE_VALUE; i++) {
            component.ngOnInit();
            const codeNumber = parseInt(component.accessCode, 10);
            expect(codeNumber).toBeGreaterThanOrEqual(0);
            expect(codeNumber).toBeLessThan(MAX_ACCESS_CODE_VALUE);
        }
    });
});
