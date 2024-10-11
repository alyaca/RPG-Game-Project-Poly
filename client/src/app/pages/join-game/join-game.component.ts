import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CharacterCreatorComponent } from '@app/components/character-creator/character-creator.component';


@Component({
  selector: 'app-join-game',
  standalone: true,
  imports: [FormsModule, CommonModule, CharacterCreatorComponent,RouterLink],
  templateUrl: './join-game.component.html',
  styleUrl: './join-game.component.scss'
})
export class JoinGameComponent {
  accessCode: string;
  fakeCode: string = "1111";
  submit: boolean;
  isCharacterFormVisible: boolean = false;

  constructor() { }


  isCodeValid(accessCode: string): boolean{
    return !isNaN(Number(accessCode))
  }


  roomExists(accessCode: string): boolean{
    return accessCode == this.fakeCode;
  }

//revoir tout ca
  joinGame(accessCode: string) {
    this.submit = true;
    if(this.isCodeValid(accessCode)){
      if(this.roomExists(accessCode)){
        this.isCharacterFormVisible = true;
        //this.gameListervice.getGameId(this.accessCode); //mhhhh
        //utiliser socket
      }
    }
  
    }

    hideCharacterForm() {
      this.isCharacterFormVisible = false;
  }
  
  }