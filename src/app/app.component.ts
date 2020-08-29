import { Component } from '@angular/core';

import { ClimateScoreService } from './climate-score.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'climate-comfort';

  network = 'CA_ASOS';
  station = 'OAK';

  constructor(private climateScoreService: ClimateScoreService) {}

  onClick(): void {
    // load the data

    this.climateScoreService.score(this.network, this.station)
    .then(res => {
      console.log('result', res);
    }, err => console.log(err));
  }

}
