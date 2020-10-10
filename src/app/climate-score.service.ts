import { Injectable } from '@angular/core';

import { DataLoaderService } from './data-loader.service';
import { Station } from './station.service';

import alasql from 'alasql';

export interface ScoreStrategy {
    name(): string;
    score(data: any): Promise<number>;
    validate(data: any): any;
}

function getHumidex(tempAveHigh: number, dewPointAveHigh: number): number {
    return tempAveHigh + 0.5555 * (6.1 * Math.exp(5417.7530 * (1 / 273.16 - 1 / (dewPointAveHigh + 273.15))) - 10);
}

function fhToCel(fh: number): number {
    return (fh - 32) * 5 / 9;
}

@Injectable({ providedIn: 'root' })
export class ClimateScoreService {

    strategies: ScoreStrategy[] = [
        new NumbeoScore(),
        new PleasantDaysScore(),
        //new MonzingoScore()
    ];

    constructor(private dataLoader: DataLoaderService) { }

    // return a score
    async score(station: Station): Promise<Map<string, number>> {
        // Start 2010
        let year = station.start;
        if (year < 2010) {
            year = 2010;
        } else if (year >= 2010 && year < 2014) {
            year = 2011;
        } else {
            // TODO throw an exception
        }

        let network = 'DCP';
        if (station.station_type.includes('ASOS')) {
            network = 'ASOS';
        } else if (station.station_type.includes('COOP')) {
            network = 'COOP';
        }

        const stNetwork = `${station.st.toUpperCase()}_${network}`;
        const loaderData = await this.dataLoader.load(stNetwork, station.nwsli, year);

        console.log('data validity', loaderData[1]);

        const resultMap = new Map<string, number>();

        for (const strategy of this.strategies) {
            const data = strategy.validate(loaderData);
            if (data) {
                const val = await strategy.score(data);
                resultMap.set(strategy.name(), val);
            } else {
                resultMap.set(strategy.name(), 0);
            }
        }

        return new Promise<Map<string, number>>(resolve => {
            resolve(resultMap);
        });
    }
}

class NumbeoScore implements ScoreStrategy {

    requiredColumns = [
        'max_temp_f',
        'min_temp_f',
        'max_dewpoint_f',
        'min_dewpoint_f'
    ];

    validate(loaderData: any): any {
        const dataValidityCounter = loaderData[1];
        for (const c of this.requiredColumns) {
            if (dataValidityCounter[c] >= 100) {
                return null;
            }
        }
        return loaderData[0];
    }

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
        // first it is calculated in range [-30, 30] then multiplied
        let base = 30;
        if (dewPointAveLow < 10) {
            base -= Math.pow(0.25 * (10 - dewPointAveLow), 1.2);
        }

        // https://weatherworksinc.com/news/humidity-vs-dewpoint
        // 26 Severely high. Even deadly for asthma related illnesses
        // 24 Extremely uncomfortable, fairly oppressive
        // 21 Very humid, quite uncomfortable
        // 18 Somewhat uncomfortable for most people at upper edge
        if (dewPointAveHigh > 18) {
            base -= Math.pow((dewPointAveHigh - 18), 1.2);  // 10^1.2 = 15.8
        }

        // http://courses.washington.edu/me333afe/Comfort_Health.pdf
        // 37.7 very uncomfortable
        // 32 uncomfortable
        // 12 uncomfortable
        // 0 very uncomfortable
        if (tempAveHigh > 31) {
            base -= Math.pow(tempAveHigh - 31, 1.5);  // 10 ^ 1.4 = 25, 10 ^ 1.5 = 31.6
        }

        if (tempAveLow < 8) {
            base -= Math.pow((8 - tempAveLow) / 2, 1.55); // -20c, 30/2=15 , 15 ^ 1.6 = 76
        }

        const humidex = getHumidex(tempAveHigh, dewPointAveHigh);
        // humindex > 31 yellow
        // humindex > 40 orange
        // humindex > 46 red
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

/*
*  See https://taraskaduk.com/posts/2019-02-18-weather/
*  Max temp between 60 and 90
*  Min temp between 40 and 70
*  Mean temp between 55 and 75
*  No percipitation
*/
class PleasantDaysScore implements ScoreStrategy {

    SQL = `
    SELECT Avg(cnt) AS days
    FROM (SELECT Count(*) AS cnt
        FROM ?
        WHERE  mean_temp_f BETWEEN 55.0 AND 75.0
               AND max_temp_f BETWEEN 60.0 AND 90.0
               AND min_temp_f BETWEEN 40.0 AND 70.0
               AND precip_in = 0
        GROUP  BY Year(day))
    `;


    requiredColumns = [
        'max_temp_f',
        'min_temp_f',
        'precip_in'
    ];

    validate(loaderData: any): any {
        const dataValidityCounter = loaderData[1];
        for (const c of this.requiredColumns) {
            if (dataValidityCounter[c] >= 100) {
                return null;
            }
        }
        return loaderData[0];
    }

    score(data: any): Promise<number> {
        return new Promise<any>(resolve => {
            alasql.promise(this.SQL, [data])
                .then((result) => {
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

// Monzingo score of 120 - 130 is ideal
class MonzingoScore implements ScoreStrategy {

    // TODO BUG in typedef file for alasql
	/*interface userDefinedFunction {
		(...args: any[]): any;
    }*/

    SQL = 'SELECT AVG(monzingo(max_temp_f,max_dewpoint_f,avg_wind_speed_kts)) AS avg_monzingo  FROM ?';

    requiredColumns = [
        'max_dewpoint_f',
        'max_temp_f',
        'avg_wind_speed_kts'
    ];

    constructor() {
        /*alasql.fn.monzingo = (temp: any, dewpoint: any, windSpeed): any => {
            return (temp + dewpoint) - windSpeed;
        };*/
    }

    validate(loaderData: any): any {
        const dataValidityCounter = loaderData[1];
        for (const c of this.requiredColumns) {
            if (dataValidityCounter[c] >= 100) {
                return null;
            }
        }
        return loaderData[0];
    }

    score(data: any): Promise<number> {
        return new Promise<any>(resolve => {
            alasql.promise(this.SQL, [data])
                .then((result) => {
                    resolve(result[0].avg_monzingo);
                }).catch((err) => {
                    console.log('Error:', err);
                });
        });
    }

    name(): string {
        return 'Monzingo Score';
    }
}
