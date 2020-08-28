import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

const REQUIRED_COLUMNS = [
    'day',
    'max_temp_f',
    'min_temp_f',
    'max_dewpoint_f',
    'min_dewpoint_f',
    'precip_in',
    'avg_wind_speed_kts'
];

@Injectable({providedIn: 'root'})
export class DataLoaderService {

    constructor(private httpClient: HttpClient) { }

    load(): Promise<any> {
        // get the data
        return new Promise<any>(resolve => {
            this.httpClient.get('https://mesonet.agron.iastate.edu/cgi-bin/request/daily.py?network=KS_ASOS&stations=LWC&year1=2010&month1=1&day1=1&year2=2020&month2=1&day2=1', {responseType: 'text'}).subscribe((data) => {
                const processed = this.convertCSV(data);
                resolve(processed);
            });
        });

        // process

        // TEST
        /*return new Promise<any>(resolve => {
            this.httpClient.get('assets/daily-test.csv', {responseType: 'text'}).subscribe((data) => {
                const processed = this.convertCSV(data);
                resolve(processed);
            });
        });*/

    }

    // Convert CSV to array of objects
    convertCSV(data: string): any[] {
        const lines = data.split(/\r|\n|\r/);
        const headers = lines[0].split(',');
        const result = [];

        for (let i = 1; i < lines.length - 1; i++) {

            const obj = {};
            const currentLine = lines[i].split(',');

            for (let j = 0; j < headers.length; j++) {
                if (REQUIRED_COLUMNS.indexOf(headers[j]) > -1) {
                    obj[headers[j]] = this.convert(headers[j], currentLine[j]);
                }
            }

            // Remove missing values
            //if (obj['max_temp_f'] !== 'None') {
                result.push(obj);
            //}

        }

        return result;
    }


    convert(column: string, value: any): any {
        if (value === 'None') {
            return null;
        }

        if (column === 'day') {
            return new Date(value);
        }

        // all other values should be floats
        return parseFloat(value);
    }

}
