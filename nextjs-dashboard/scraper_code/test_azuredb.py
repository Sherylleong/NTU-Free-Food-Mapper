from telethon import TelegramClient, events
from telethon.errors import SessionPasswordNeededError

# to get members
from telethon.tl.functions.channels import GetParticipantsRequest
from telethon.tl.types import ChannelParticipantsSearch
from telethon.tl.types import (PeerChannel)

# to get messages
from telethon.tl.functions.messages import (GetHistoryRequest)
from telethon.tl.types import (PeerChannel)

from telethon import utils
from telethon.tl import functions, types
import pyodbc
import csv
import os
from datetime import datetime, timedelta
import pytz

from telethon.sessions import StringSession
import ntu_locations_regex

import pandas as pd


from dotenv import load_dotenv
load_dotenv()

# Get the connection string from environment variables
connection_string = os.getenv("AZURE_SQL_CONNECTIONSTRING")

# Verify the value of the connection string

if connection_string is None:
    print("Connection string not found. Please check your .env file.")
else:
    try:
        # Try to establish a connection to the database using the connection string
        connection = pyodbc.connect(connection_string)
        print("Connection successful!")

        # Optionally, you can execute a query to check the connection
        cursor = connection.cursor()
        cursor.execute("SELECT TOP 1 * FROM METADATA")  # Replace with an actual table name
        row = cursor.fetchone()

        if row:
            print("Query result:", row)
        else:
            print("No results found in the table.")

        # Close the cursor and connection
        cursor.close()
        connection.close()

    except pyodbc.Error as e:
        print("Error connecting to Azure SQL Database:", e)