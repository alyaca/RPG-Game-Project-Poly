import { CommonModule, NgClass } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-join-game',
  standalone: true,
  imports: [FormsModule, NgClass, CommonModule],
  templateUrl: './join-game.component.html',
  styleUrl: './join-game.component.scss'
})
export class JoinGameComponent {
  accessCode: string;
  fakeCode: string = "7867";
  submit: boolean;

  constructor(
    public snackBar: MatSnackBar,
  ) { }


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
        this.snackBar.open("Game joined", "Close", {
          duration: 2000,
        });
        //this.gameListervice.getGameId(this.accessCode); //mhhhh
        //utiliser socket
      }


      //this.accessCode = this.gameListervice.getGameId(this.accessCode); //mhhhh
      //utiliser socket
    }
   // else{
     // gameInvalide();


    }
  
  }