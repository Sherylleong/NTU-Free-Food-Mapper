import pyodbc
import pandas as pd
import os
from dotenv import load_dotenv
load_dotenv()

connection_string = os.getenv("AZURE_SQL_CONNECTIONSTRING")

conn = pyodbc.connect(connection_string)
cursor = conn.cursor()


df = pd.read_csv('locations.csv')

# create location table if it does not exist
create_table_query = """
CREATE TABLE IF NOT EXISTS LOCATION_DATA (
    LOCATION VARCHAR(255),
    LATITUDE FLOAT,
    LONGITUDE FLOAT
);
"""
cursor.execute(create_table_query)
conn.commit()

# delete all entries from the table to ensure it is empty
delete_query = "DELETE FROM LOCATION_DATA;"
cursor.execute(delete_query)
conn.commit()

# insert location data
for index, row in df.iterrows():
    insert_query = f"""
    INSERT INTO LOCATION_DATA (LOCATION, LATITUDE, LONGITUDE)
    VALUES (?, ?, ?)
    """
    cursor.execute(insert_query, row['Location'], row['Latitude'], row['Longitude'])

# commit the transaction and close the connection
conn.commit()
cursor.close()
conn.close()

print("Location data uploaded successfully to Azure SQL Database.")