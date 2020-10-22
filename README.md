# Climate Comfort

Web application that uses weather data to derive a score for a location.  The location is the name of the weather station that should contain minimal metrics like max and min daily temperature and precipitation.  Currently locations are US only.  Daily weather data is curtesy of [Iowa State University](https://mesonet.agron.iastate.edu/)

Scores for climate comfort are:

* [Numbeo](https://www.numbeo.com/climate/indices_explained.jsp):  (requires min and max dew point)
* [Pleasant days in the year](https://taraskaduk.com/posts/2019-02-18-weather/)
* [Monzingo](http://www.city-data.com/forum/weather/1180993-us-cities-comfortable-dew-points-year-2.html)

Scores are calculated in the browser:

* Fetch daily weather data for the last ten years if possible
* Convert the data from CSV to json
* Load the data into alasql and use sql to get a result
* Apply a calculation function if needed

## Getting started

### Prerequisites

Latest [Node.js](https://www.nodejs.org/) is installed.

**1. Install Angular CLI**:
```
npm install -g @angular/cli
```
**2. Run**:
```
Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`
```

## Technology

* Angular
* Angular Material
* alasql

## TODO

There is a bug in alasql where user defined functions are not accepting multiple parameters.  Quick and dirty fix is to change interface userDefinedFunction in the node_modules/alasql/dist/alasql.d.ts file:

```
	interface userDefinedFunction {
		(...args: any[]): any;
	}
```

