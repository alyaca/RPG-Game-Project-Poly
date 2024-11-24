import { TestBed } from '@angular/core/testing';

import { PostGameService } from './post-game.service';

describe('PostGameService', () => {
    let service: PostGameService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(PostGameService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
