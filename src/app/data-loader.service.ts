import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

const TEST = false;

const MAX_TEMP_F = 'max_temp_f';
const MIN_TEMP_F = 'min_temp_f';
const MEAN_TEMP_F = 'mean_temp_f';
const PRECIP_IN = 'precip_in';
const SNOW_IN = 'snow_in';

const REQUIRED_COLUMNS = [
    'day',
    'max_temp_f',
    'min_temp_f',
    'max_dewpoint_f',
    'min_dewpoint_f',
    'precip_in',
    'snow_in',
    'avg_wind_speed_kts'
];

function calcMean(maxTemp: number, minTemp: number): number {
    if (maxTemp === null || minTemp === null) {
        return null;
    }
    return (maxTemp + minTemp) / 2;
}

@Injectable({providedIn: 'root'})
export class DataLoaderService {

    constructor(private httpClient: HttpClient) { }

    load(network: string, station: string, year: number): Promise<any> {
        // TEST
        if (TEST) {
            return new Promise<any>(resolve => {
                this.httpClient.get('assets/daily-test.csv', {responseType: 'text'}).subscribe((data) => {
                    const processed = this.convertCSV(data);
                    resolve(processed);
                });
            });
        } else {
            return new Promise<any>((resolve, reject) => {
                this.httpClient.get(`https://mesonet.agron.iastate.edu/cgi-bin/request/daily.py?network=${network}&stations=${station}&year1=${year}&month1=1&day1=1&year2=2020&month2=1&day2=1`, {responseType: 'text'}).subscribe((data) => {
                    try {
                        const processed = this.convertCSV(data);
                        resolve(processed);
                    } catch (ex) {
                        reject(ex);
                    }
                }, error =>  reject(error));
            });
        }
    }

    // Convert CSV to array of objects
    convertCSV(data: string): any[] {
        const lines = data.split(/\r|\n|\r/);
        const headers = lines[0].split(',');
        const converted = [];

        if (lines.length < 365) {
            throw new Error('Invalid data');
        }

        const dataValidityCounter = {};
        for (const c of REQUIRED_COLUMNS) {
            dataValidityCounter[c] = 0;
        }

        for (let i = 1; i < lines.length - 1; i++) {

            const obj = {};
            const currentLine = lines[i].split(',');

            for (let j = 0; j < headers.length; j++) {
                const column = headers[j];
                if (REQUIRED_COLUMNS.indexOf(column) > -1) {
                    const val = this.convert(column, currentLine[j]);
                    if (val === null) {
                        // counter
                        dataValidityCounter[column]++;
                    }
                    obj[column] = val;
                }
            }

            // add a mean temp
            obj[MEAN_TEMP_F] = calcMean(obj[MAX_TEMP_F], obj[MIN_TEMP_F]);

            // Coalesce snow and precip. TODO try in SQL using the COALESCE function
            obj[PRECIP_IN] = Math.max(obj[PRECIP_IN], obj[SNOW_IN]);

            converted.push(obj);
        }

        const result = [];
        result[0] = converted;
        result[1] = dataValidityCounter;

        return result;
    }

    convert(column: string, value: any): any {
        if (value === 'None') {
            return null;
        }

        if (column === 'day') {
            return new Date(value);
        }

        // Note that value can be negative in some cases, which for reporting is 0
        if (column === 'precip_in' || column === 'snow_in') {
            return Math.max(value, 0.0);
        }

        // all other values should be floats
        return parseFloat(value);
    }

}
