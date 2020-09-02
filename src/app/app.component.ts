import { Component } from '@angular/core';

import { ClimateScoreService } from './climate-score.service';
import { StationService, Station } from './station.service';

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
  stid = 'OAK';

  cards: Card[] = [];

  constructor(private climateScoreService: ClimateScoreService, private stationService: StationService) { }

  onClick(): void {

    // Validate the network and station, get the year range
    this.stationService.lookupStation(this.network, this.stid).then(station => {
      this.score(station);
    }, err => this.showError(err));

  }

  private showError(err: string): void {
    this.cards.push({
      network: this.network,
      station: this.stid,
      error: err
    });
  }

  private score(station: Station): void {

    // load the data
    this.climateScoreService.score(station).then(res => {

      const card: Card = {
        network: station.iem_network,
        station: station.station_name
      };

      for (const prop of res) {
        card[prop[0]] = prop[1];
      }

      this.cards.push(card);

    }, err => this.showError(err));
  }

}
