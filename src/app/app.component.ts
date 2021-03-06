import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Observable, from } from 'rxjs';
import { debounceTime, switchMap } from 'rxjs/operators';

import { ClimateScoreService } from './climate-score.service';
import { StationService, Station } from './station.service';

export interface Card {
    station: string;
    network: string;
    location: string;
    // scores
    scores: Map<string, number>;
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

    criteriaForm = new FormGroup({
        search: new FormControl(null)
    });

    constructor(private climateScoreService: ClimateScoreService, private stationService: StationService) { }

    ngOnInit(): void {
        this.filteredStations = this.criteriaForm.get('search').valueChanges
            .pipe(
                debounceTime(400),
                switchMap(value => from(this.search(value)))
            );
    }

    private score(station: Station): void {
        // load the data
        this.climateScoreService.score(station).then(scoresResult => {

            const card: Card = {
                station: station.station_name,
                network: station.station_type,
                location: `https://www.openstreetmap.org/?mlat=${station.lat_dec}&mlon=${station.lon_dec}`,
                scores: scoresResult
            };

            this.cards.push(card);

            this.reset();

        }, err => console.log(err));
    }

    selectedStation(selectedStation: Station): void {
        console.log('selected station', selectedStation);
        this.score(selectedStation);
    }

    displayFn(station: Station): string {
        return station ? station.station_name : undefined;
    }

    get dirty(): boolean {
        return this.criteriaForm.get('search').dirty;
    }

    private reset(): void {
        this.criteriaForm.get('search').reset(null, {emitEvent: false});
    }

    private search(term: string): Promise<Station[]> {
        // User selected
        if (typeof term === 'object') {
            return new Promise<any>(resolve => resolve([]));
        }

        // User backspace to empty, then reset
        if (term.trim().length === 0) {
            this.reset();
            return new Promise<any>(resolve => resolve([]));
        }

        return this.stationService.search(term);
    }
}
