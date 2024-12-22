import pyodbc
import pandas as pd
import os
from dotenv import load_dotenv
load_dotenv()

connection_string = os.getenv("AZURE_SQL_CONNECTIONSTRING")

conn = pyodbc.connect(connection_string)
cursor = conn.cursor()


df = pd.read_csv(r'nextjs-dashboard/scraper_code/location_coords.csv')
print(df)

# create location table if it does not exist
create_table_query = """
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'location_data')
BEGIN
    CREATE TABLE location_data (
        location VARCHAR(255),
        latitude FLOAT,
        longitude FLOAT
    );
END;
"""
cursor.execute(create_table_query)
conn.commit()

# delete all entries from the table to ensure it is empty
delete_query = "DELETE FROM location_data;"
cursor.execute(delete_query)
conn.commit()

# insert location data
for index, row in df.iterrows():
    insert_query = f"""
    INSERT INTO LOCATION_DATA (LOCATION, LATITUDE, LONGITUDE)
    VALUES (?, ?, ?)
    """
    cursor.execute(insert_query, row['location'], row['latitude'], row['longitude'])

# commit the transaction and close the connection
conn.commit()
cursor.close()
conn.close()

print("Location data uploaded successfully to Azure SQL Database.")