import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Map } from '@app/interfaces/map';

@Injectable({
  providedIn: 'root',
})
export class GameGridService {
  private mapToEditSubject = new Subject<Map>();

  mapToEdit$ = this.mapToEditSubject.asObservable();

  setMapToEdit(map: Map) {
    this.mapToEditSubject.next(map);
  }
}