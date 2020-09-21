import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import alasql from 'alasql';

// import { ScoreStrategy } from './climate-score.service';

// stid,station_name,lat,lon,elev,begints,iem_network
export interface Station {
    ghcnd: string; // Global Historical Climatology Network Daily Station
    coop: number;  // NWS Cooperative network ID, assigned by NCEI
    wban: number;  // WBAN identifier (Weather-Bureau-Army-Navy), assigned by NCEI
    icao: string;  // ICAO ID, used for geographical locations throughout the world
    faa: number;   // FAA ID, alpha-numeric, managed by USDT Federal Aviation Administration
    nwsli: string; // NWS Location Identifer
    wmo: number;   //  ID assigned by World Meteorological Organization
    station_name: string;
    cc: string;    // FIPS country code
    st: string;    // USPS two character alphabetic abbreviation for each state
    lat_dec: number;
    lon_dec: number;
    station_type: string;
    start: number; // Start year for station
}

// {"ghcnd":"AQW00061705","coop":914690,"wban":61705,"icao":"NSTU","faa":"PPG","nwsli":"NSTU","wmo":91765,"station_name":"PAGO PAGO WSO AIRPORT","cc":"AQ","st":"AS","lat_dec":-14.33056,"lon_dec":-170.71361,"station_type":"COOP,PLCD","start":1996},


@Injectable({providedIn: 'root'})
export class StationService {

    constructor(private httpClient: HttpClient) { }

    private getStations(): Promise<any> {
        return new Promise<any>((resolve) => {
            this.httpClient.get('assets/stations.json').subscribe((data) => {
                resolve(data);
            });
        });
    }

    async search(term: string | number): Promise<Station[]> {
        const data = await this.getStations();
        return new Promise<any>(resolve => {
            const q = `SELECT * FROM ? WHERE station_name LIKE "${term}%"`;
            alasql.promise(q, [data])
                .then((result) => {
                    resolve(result);
                }).catch((err) => {
                    console.log('Error:', err);
                });
        });
    }

    /*private getStations(network: string): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            this.httpClient.get(`https://mesonet.agron.iastate.edu/sites/networks.php?network=${network}&format=csv&nohtml=on`,
                {responseType: 'text'}).subscribe((data) => {
                resolve(data);
            }, error =>  reject(error));
        });
    }*/

    lookupStation(network: string, station: string): Promise<Station> {
        return new Promise<Station>((resolve, reject) => {
            this.getStations().then(data => {
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
