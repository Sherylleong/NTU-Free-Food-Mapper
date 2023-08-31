import csv 
from datetime import datetime, timedelta
import os
import pandas as pd

CHAT  = 1135894961
START_DATE = datetime(2022, 1, 1).date()
END_DATE = datetime(2023, 8, 1).date()
FILENAME = "freefooddb.csv"

df = pd.read_csv(FILENAME)
df["date"] = pd.to_datetime(df["date"])

def get_df_daterange(start, end, df):
    time_mask = df['date'].dt.date.between(start,end, inclusive='both')
    df =  df[time_mask]
    return df
    


df = get_df_daterange(START_DATE, END_DATE, df)
df.to_csv('analyser_test.csv', index=False)
# merge rows sent by same user within 1 min together

#df_date = df[df[date > START_DATE]]