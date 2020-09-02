import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ScoreStrategy } from './climate-score.service';

// stid,station_name,lat,lon,elev,begints,iem_network
export interface Station {
    stid: string;
    station_name: string;
    begints: Date;
    lat: number;
    lon: number;
    elev: string;
    iem_network: string;
}

@Injectable({providedIn: 'root'})
export class StationService {

    constructor(private httpClient: HttpClient) { }

    // Return a csv file
    private getStations(network: string): Promise<any> {
        // https://mesonet.agron.iastate.edu/sites/networks.php?network=IA_ASOS&format=csv&nohtml=on
        return new Promise<any>((resolve, reject) => {
            this.httpClient.get(`https://mesonet.agron.iastate.edu/sites/networks.php?network=${network}&format=csv&nohtml=on`,
                {responseType: 'text'}).subscribe((data) => {
                resolve(data);
            }, error =>  reject(error));
        });
    }

    lookupStation(network: string, station: string): Promise<Station> {
        return new Promise<Station>((resolve, reject) => {
            this.getStations(network).then(data => {
                // lookup the station
                const lines = data.split(/\r|\n|\r/);
                const headers = lines[0].split(',');

                for (let i = 1; i < lines.length - 1; i++) {
                    const obj = {};
                    const currentLine = lines[i].split(',');

                    for (let j = 0; j < headers.length; j++) {
                        obj[headers[j]] = this.convert(headers[j], currentLine[j]);
                        if (headers[j] === 'stid' && currentLine[j] === station) {
                            resolve(obj as Station);
                            // return;
                        }
                    }
                }
                reject(`${station} station not found`);
            }, err => reject(`Unable to load station data: ${err}`));
        });
    }

    convert(column: string, value: string): any {
        if (value === 'lat' || value === 'lon') {
            return parseFloat(value);
        }

        if (column === 'begints') {
            const s = value.split(' ');
            return new Date(s[0]);
        }

        return value;
    }
}
