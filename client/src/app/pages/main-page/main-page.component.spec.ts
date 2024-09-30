import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Routes, provideRouter } from '@angular/router';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';

const routes: Routes = [];
const NUMBER_OF_TEAM_MEMBERS = 6;

describe('MainPageComponent', () => {
    let fixture: ComponentFixture<MainPageComponent>;
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MainPageComponent],
            providers: [provideHttpClientTesting(), provideRouter(routes)],
        }).compileComponents();
    });
    beforeEach(() => {
        fixture = TestBed.createComponent(MainPageComponent);
        fixture.detectChanges();
    });
    it('should contain a <p> tag with text "Créer une partie"', () => {
        const compiled = fixture.nativeElement as HTMLElement;
        const pTag = compiled.querySelector('p');
        expect(pTag?.textContent).toContain('Créer une partie');
    });
    it('should verify that the second <p> tag contains "Administrer les jeux"', () => {
        const compiled = fixture.nativeElement as HTMLElement;
        const pElements = compiled.querySelectorAll('p');
        expect(pElements.length).toBeGreaterThanOrEqual(2);
        expect(pElements[1].textContent).toContain('Administrer les jeux');
    });
    it('should verify that the third <p> tag contains "Joindre une partie"', () => {
        const compiled = fixture.nativeElement as HTMLElement;
        const pElements = compiled.querySelectorAll('p');
        expect(pElements[2].textContent).toContain('Joindre une partie');
    });
    it('should contain an <img> tag with class "game-logo"', () => {
        const compiled = fixture.nativeElement as HTMLElement;
        const imgElement = compiled.querySelector('img.game-logo');
        expect(imgElement).toBeTruthy();
    });
    it('should contain an <h4> with class "team-name" followed by a <p> with 6 <span> elements', () => {
        const compiled = fixture.nativeElement as HTMLElement;
        const h4Element = compiled.querySelector('h4.team-name');
        expect(h4Element).toBeTruthy();
        const pElement = h4Element?.nextElementSibling as HTMLElement;
        expect(pElement?.tagName.toLowerCase()).toBe('p');
        const spanElements = pElement?.querySelectorAll('span');
        expect(spanElements?.length).toBe(NUMBER_OF_TEAM_MEMBERS);
    });
});
