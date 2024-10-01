import { provideHttpClient } from '@angular/common/http';
import { enableProdMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { Routes, provideRouter } from '@angular/router';
import { AdministrationPageComponent } from '@app/pages/administration-page/administration-page.component';
import { AppComponent } from '@app/pages/app/app.component';
import { CreateGamePageComponent } from '@app/pages/create-game-page/create-game-page.component';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';
import { MapEditorPageComponent } from '@app/pages/map-editor-page/map-editor-page.component';
import { MaterialPageComponent } from '@app/pages/material-page/material-page.component';
import { WaitingPageComponent } from '@app/pages/waiting-page/waiting-page.component';
import { environment } from './environments/environment';

if (environment.production) {
    enableProdMode();
}

const routes: Routes = [
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: 'game-creation', component: CreateGamePageComponent },
    { path: 'home', component: MainPageComponent },
    { path: 'administration', component: AdministrationPageComponent },
    { path: 'edit-map', component: MapEditorPageComponent },
    { path: 'material', component: MaterialPageComponent },
    { path: 'waiting-page', component: WaitingPageComponent },
    { path: '**', redirectTo: '/home' },
];

bootstrapApplication(AppComponent, {
    providers: [provideHttpClient(), provideRouter(routes), provideAnimations()],
});
