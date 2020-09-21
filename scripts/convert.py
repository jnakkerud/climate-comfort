import pandas as pd

df = pd.DataFrame(pd.read_csv("../data/stations.csv", index_col = False))

df['coop'] = df['coop'].astype('Int32')
df['wban'] = df['wban'].astype('Int32')
df['wmo'] = df['wmo'].astype('Int32')

df.to_json("../data/stations.json", orient = "records")