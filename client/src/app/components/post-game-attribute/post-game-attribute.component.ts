import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { PostGameService } from '@app/services/post-game/post-game.service';
// import { LigmaPlayer } from '@app/services/post-game/post-game.service';
import { Player } from '@common/player';
@Component({
  selector: 'app-post-game-attribute',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './post-game-attribute.component.html',
  styleUrl: './post-game-attribute.component.scss'
})
export class PostGameAttributeComponent {
  @Input() attribute: keyof Player["postGameStats"];
  @Input() displayTxt: string;
  constructor(public postGameService: PostGameService){}

  isAttrRecord(){
    return this.attribute === 'victories';
  }
}
