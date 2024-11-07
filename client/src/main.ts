import { provideHttpClient } from '@angular/common/http';
import { enableProdMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { Routes, provideRouter } from '@angular/router';
import { AdministrationPageComponent } from '@app/pages/administration-page/administration-page.component';
import { AppComponent } from '@app/pages/app/app.component';
import { CreateGamePageComponent } from '@app/pages/create-game-page/create-game-page.component';
import { GamePageComponent } from '@app/pages/game-page/game-page.component';
import { JoinGameComponent } from '@app/pages/join-game/join-game.component';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';
import { MapEditorPageComponent } from '@app/pages/map-editor-page/map-editor-page.component';
import { WaitingPageComponent } from '@app/pages/waiting-page/waiting-page.component';
import { PostGamePageComponent } from '@app/pages/post-game-page/post-game-page.component';
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
    { path: 'waiting-page', component: WaitingPageComponent },
    { path: 'join-game', component: JoinGameComponent },
    { path: 'game-page', component: GamePageComponent },
    { path: 'post-game-lobby', component: PostGamePageComponent },
    { path: '**', redirectTo: '/home' },
];

bootstrapApplication(AppComponent, {
    providers: [provideHttpClient(), provideRouter(routes), provideAnimations()],
});
