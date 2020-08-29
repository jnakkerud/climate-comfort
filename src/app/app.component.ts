import { Component } from '@angular/core';

import { ClimateScoreService } from './climate-score.service';

export interface Card {
  network: string;
  station: string;
  // scores
  [index: string]: number | string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'climate-comfort';

  network = 'CA_ASOS';
  station = 'OAK';

  cards: Card[] = [];

  constructor(private climateScoreService: ClimateScoreService) { }

  onClick(): void {

    // load the data
    this.climateScoreService.score(this.network, this.station).then(res => {

      const card: Card = {
        network: this.network,
        station: this.station
      };

      for (const prop of res) {
        card[prop[0]] = prop[1];
      }

      this.cards.push(card);

    }, err => console.log(err));
  }

}
