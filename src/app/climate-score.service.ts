import { Injectable } from '@angular/core';

import { DataLoaderService } from './data-loader.service';

import alasql from 'alasql';
import { from } from 'rxjs';

export interface ScoreStrategy {
    name(): string;
    score(data: any): Promise<number>;
}

function getHumidex(tempAveHigh: number, dewPointAveHigh: number): number {
    return tempAveHigh + 0.5555 * (6.1 * Math.exp(5417.7530 * (1 / 273.16 - 1 / (dewPointAveHigh + 273.15))) - 10);
}

function fhToCel(fh: number): number {
  return (fh - 32) * 5 / 9;
}

@Injectable({providedIn: 'root'})
export class ClimateScoreService {

    strategies: ScoreStrategy[] = [
        new NumbeoScore(),
        new PleasantDaysScore()
    ];

    constructor(private dataLoader: DataLoaderService) { }

    // return a score
    async score(): Promise<Map<string, number>> {

        const data = await this.dataLoader.load();

        const resultMap = new Map<string, number>();

        for (const strategy of this.strategies) {
            const val = await strategy.score(data);
            resultMap.set(strategy.name(), val);
        }

        return new Promise<Map<string, number>>(resolve => {
            resolve(resultMap);
        });
    }
}

class NumbeoScore implements ScoreStrategy {

    score(data: any): Promise<number> {
        return new Promise<any>(resolve => {
            alasql.promise('SELECT AVG(max_temp_f) AS avg_max_temp, AVG(min_temp_f) as avg_min_temp, AVG(max_dewpoint_f) AS avg_max_dewpoint, AVG(min_dewpoint_f) AS avg_min_dewpoint FROM ?', [data])
                .then((result) => {
                    //  TODO can dewpoint be converted to celcius ?
                    const n = this.calculateScore(fhToCel(result[0].avg_max_temp),
                    fhToCel(result[0].avg_min_temp),
                    fhToCel(result[0].avg_max_dewpoint),
                    fhToCel(result[0].avg_min_dewpoint));
                    resolve(n);
                }).catch((err) => {
                    console.log('Error:', err);
                });
        });
    }

    name(): string {
        return 'Numbeo Score';
    }

    // https://www.numbeo.com/climate/indices_explained.jsp
    private calculateScore(tempAveHigh: number, tempAveLow: number, dewPointAveHigh: number, dewPointAveLow: number): number {
        //first it is calculated in range [-30, 30] then multiplied 
        let base = 30;
        if (dewPointAveLow < 10) {
            base -= Math.pow(0.25 * (10 - dewPointAveLow), 1.2);
        }

        //26 Severely high. Even deadly for asthma related illnesses
        //24 Extremely uncomfortable, fairly oppressive	
        //21 Very humid, quite uncomfortable
        //18 Somewhat uncomfortable for most people at upper edge	
        if (dewPointAveHigh > 18) {
            base -= Math.pow((dewPointAveHigh - 18), 1.2);  // 10^1.2 = 15.8
        }

        //http://courses.washington.edu/me333afe/Comfort_Health.pdf
        //37.7 very uncomfortable
        //32 uncomfortable
        //12 uncomfortable
        //0 very uncomfortable
        if (tempAveHigh > 31) {
            base -= Math.pow(tempAveHigh - 31, 1.5);  // 10 ^ 1.4 = 25, 10 ^ 1.5 = 31.6
        }

        if (tempAveLow < 8) {
            base -= Math.pow((8 - tempAveLow) / 2, 1.55); // -20c, 30/2=15 , 15 ^ 1.6 = 76
        }

        const humidex = getHumidex(tempAveHigh, dewPointAveHigh);
        //humindex > 31 yellow
        //humindex > 40 orange
        //humindex > 46 red
        if (humidex > 31) {
            base -= (humidex - 31) / 4.0;
        }
        if (base < -30) {
            base = -30.0;
        }
        if (base > 30) {
            base = 30.0;
        }
        base = base * 100 / 30.0;
        return base;
    }
}

class PleasantDaysScore implements ScoreStrategy {

    score(data: any): Promise<number> {
        return new Promise<any>(resolve => {
            alasql.promise('SELECT AVG(cnt) as days from (SELECT COUNT(*) as cnt FROM ? WHERE max_temp_f >= 68.0 AND max_temp_f <= 85.0 AND precip_in = 0.0 GROUP BY YEAR(day))', [data])
                .then((result) => {
                    //console.log(result);

                    // https://codepen.io/yfain/pen/veKdwW?editors=1011
                    //const source = from(result).average((x) => {
                    //    return x.cnt;
                    //});

                    // const n = 124;
                    resolve(result[0].days);
                }).catch((err) => {
                    console.log('Error:', err);
                });
        });
    }

    name(): string {
        return 'Pleasant Days';
    }
}
