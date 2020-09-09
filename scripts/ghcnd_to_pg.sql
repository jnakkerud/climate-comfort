CREATE TABLE ghcnd_stations (
    id SERIAL,
    lat DECIMAL,
    lon DECIMAL,
    station VARCHAR(11),
    start INT,
    latest INT,    
    name VARCHAR(100),
    PRIMARY KEY (id)
)