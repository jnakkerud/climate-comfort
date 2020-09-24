import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Observable, from } from 'rxjs';
import { debounceTime, switchMap } from 'rxjs/operators';

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
export class AppComponent implements OnInit {
    title = 'climate-comfort';

    cards: Card[] = [];

    filteredStations: Observable<Station[]>;

    myForm = new FormGroup({
        search: new FormControl(null)
    });

    constructor(private climateScoreService: ClimateScoreService, private stationService: StationService) { }

    ngOnInit(): void {
        this.filteredStations = this.myForm.get('search').valueChanges
            .pipe(
                debounceTime(400),
                switchMap(value => from(this.stationService.search(value)))
            );
    }

    private score(station: Station): void {

        // load the data
        this.climateScoreService.score(station).then(res => {

            const card: Card = {
                network: station.station_type,
                station: station.station_name
            };

            for (const prop of res) {
                card[prop[0]] = prop[1];
            }

            this.cards.push(card);

            this.clearSelections();

        }, err => console.log(err));
    }

    selectedStation(selectedStation: Station): void {
        this.score(selectedStation);
    }

    displayFn(station: Station): string {
        return station ? station.station_name : undefined;
    }

    private clearSelections(): void {
        this.myForm.get('search').reset(null, {emitEvent: false});
    }
}
