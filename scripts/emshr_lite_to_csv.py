import pandas as pd

df = pd.read_fwf('https://www.ncdc.noaa.gov/homr/file/emshr_lite.txt', skiprows=[1])
df['COOP'] = df['COOP'].astype('Int32')
df['WBAN'] = df['WBAN'].astype('Int32')
df['WMO'] = df['WMO'].astype('Int32')
# filter on only active stations
filtered = df[(df['END_DT']==99991231) & (df['BEG_DT']!=10101)]
filtered.to_csv('../data/emshr_lite.csv', columns=['BEG_DT','COOP','WBAN','ICAO','FAA','NWSLI','WMO','GHCND','STATION_NAME','CC','ST','LAT_DEC','LON_DEC','TYPE'], index=False)