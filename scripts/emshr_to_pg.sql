CREATE TABLE emshr_stations (
    id SERIAL,
    BEG_DT DATE,
    COOP INTEGER,
    WBAN INTEGER,
    ICAO VARCHAR(4),
    FAA VARCHAR(5),
    NWSLI VARCHAR(5),
    WMO INTEGER,
    GHCND VARCHAR(11),
    STATION_NAME VARCHAR(100),
    CC VARCHAR(2),
    ST VARCHAR(2),
    LAT_DEC DECIMAL,
    LON_DEC DECIMAL,
    TYPE VARCHAR(100),
    PRIMARY KEY (id)
)