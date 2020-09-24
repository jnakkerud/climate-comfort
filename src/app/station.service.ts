import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import alasql from 'alasql';

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

    stations: Station[];

    constructor(private httpClient: HttpClient) { }

    private getStations(): Promise<any> {
        return new Promise<any>((resolve) => {
            this.httpClient.get('assets/stations.json').subscribe((data) => {
                resolve(data);
            });
        });
    }

    async search(term: string | number): Promise<Station[]> {

        if (typeof term === 'object') {
            return new Promise<any>(resolve => resolve([]));
        }

        if (!this.stations) {
            this.stations = await this.getStations();
        }
        return new Promise<any>(resolve => {
            const q = `SELECT * FROM ? WHERE station_name LIKE "${term}%"`;
            alasql.promise(q, [this.stations])
                .then((result) => {
                    resolve(result);
                }).catch((err) => {
                    console.log('Error:', err);
                });
        });
    }
}
