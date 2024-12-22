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

import csv
import os
from datetime import datetime, timedelta
import pytz

from telethon.sessions import StringSession
import ntu_locations_regex

import pandas as pd
import csv 

CHAT  = '@freefoodntu'
EARLIEST_DATE = datetime(2018, 1, 1, 0, 0, 0)

import pyodbc

'''
FILENAME = "freefoodprocessed.csv"
if not os.path.isfile(FILENAME):
    LATEST_DATE = EARLIEST_DATE
    fields = ['date', 'sender', 'location', 'text']
    with open(FILENAME, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(fields)
else:
    LATEST_DATE = TEST_DATE # get max date from csv

'''
# retrieve environment variables
dir = 'nextjs-dashboard/scraper_code/'
from dotenv import load_dotenv
load_dotenv()

connection_string = os.getenv("AZURE_SQL_CONNECTIONSTRING")
api_id = os.getenv('API_ID')
print(api_id)
api_hash = os.getenv('API_HASH')
phone = os.getenv('PHONE')
session_string  = os.getenv('SESSION_STRING')
# Create the client and connect
client = TelegramClient(StringSession(session_string), api_id, api_hash)

# timezone
utc = pytz.utc 
sgt = pytz.timezone('Asia/Singapore') 
print(sgt)
async def scrape_tele_all(chat, client, startdate=EARLIEST_DATE):
    data = []
    async for message in client.iter_messages(chat, offset_date=startdate, reverse=True): # get all messages after specified date
        msg_text = message.text
        if msg_text == '' or msg_text is None: # omit sole images
            continue
        msg_text =  message.text.replace('\n', ' ').replace('"', '').replace('@', ' ').replace('!', ' ').lower()
        is_clearing_text = -2
        if msg_text == '': # omit sole images
            continue
        if message.is_reply and ntu_locations_regex.has_cleared_msg(msg_text):
            is_clearing_text = await message.get_reply_message()
            is_clearing_text = is_clearing_text.id
            # print(message.id)
        elif ntu_locations_regex.has_cleared_msg(msg_text):
             is_clearing_text=-1
        msg_sender = (message.forward.from_name if message.forward.from_name else message.forward.from_id) if message.forward else 'NTUFreeFood'
        msg_date = message.date
        #msg_date = datetime.fromisoformat(msg_date)
        msg_date = msg_date.astimezone(sgt)
        msg_id = message.id

        #writer.writerow([msg_date, msg_sender, msg_location, msg_text])
        data.append({'id': msg_id, 'date': msg_date, 'sender': str(msg_sender), 'text':msg_text, 'clearedmsg': is_clearing_text})
    


    # format data (combine)
    df = pd.DataFrame(data)
    df = combine_msg_blocks(df)
    print(df)

    sql_insert_ori_data = """
            INSERT INTO ORI_DATA (id, date, sender, text, clearedmsg)
            VALUES (?, ?, ?, ?, ?)
            """
    sql_insert_processed_data = """
            INSERT INTO PROCESSED_DATA (min_id, max_id, min_date, max_date, msg_sender, location, categories, main_category, sub_category, text, time_to_clear)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """
    sql_update_metadata = """
            INSERT INTO METADATA (max_id, max_date, latest_update_time, total_events)
            VALUES (?, ?, ?, ?)
            """
    try:
        conn = pyodbc.connect(connection_string)
        cursor = conn.cursor()

        # delete all entries from the table to ensure it is empty
        cursor.execute("DELETE FROM ORI_DATA;")
        cursor.execute("DELETE FROM PROCESSED_DATA;")
        cursor.execute("DELETE FROM METADATA;")
        conn.commit()
        for record in data:
            msg_id = record['id']
            msg_date = record['date']
            msg_sender = record['sender']
            msg_text = record['text']
            is_clearing_text = record['clearedmsg']
            cursor.execute(sql_insert_ori_data, (msg_id, msg_date, msg_sender, msg_text, is_clearing_text))

        for index, record in df.iterrows():
            min_id = int(record['min_id'])
            max_id = int(record['max_id'])
            msg_first_date = record['msg_first_date']
            msg_last_date = record['msg_last_date']
            msg_sender = record['sender']
            location = record['location']
            categories = record['categories']
            main_category = record['main_category']
            sub_category = record['sub_category']
            msg_text = record['text']
            time_to_clear = int(record['time_to_clear']) if record['time_to_clear'] else None
            cursor.execute(sql_insert_processed_data, (min_id, max_id, msg_first_date, msg_last_date, msg_sender, location, categories, main_category, sub_category, msg_text, time_to_clear))
        cursor.execute(sql_update_metadata, (int(df['min_id'].max()), df['msg_last_date'].max(), datetime.now().astimezone(sgt)), df.shape[0])

        conn.commit()
        cursor.close()
        conn.close()
        print("Data inserted successfully.")

    except pyodbc.Error as e:
        print("Error connecting to Azure SQL Database:", e)

    

# todo: finish code
async def scrape_tele_latest(chat, client):
    data = []
    try:
       prev_df = pd.read_csv(dir+'freefoodori.csv')
    except pd.errors.EmptyDataError:
        print('empty database, scraping all')
        return await scrape_tele_all(chat, client, EARLIEST_DATE)
    max_id = prev_df['id'].max()
    async for message in client.iter_messages(chat, offset_id=max_id, reverse=True): # get all messages after specified id
    #    if message==None:
    #        print('no new messages')
    #        return
        msg_text = message.text
        if msg_text == '' or msg_text is None: # omit sole images
            continue
        msg_text =  message.text.replace('\n', ' ').replace('"', '').replace('@', ' ').replace('!', ' ').lower()
        is_clearing_text = -2
        if message.is_reply and ntu_locations_regex.has_cleared_msg(msg_text):
            is_clearing_text = await message.get_reply_message()
            is_clearing_text = is_clearing_text.id
        elif ntu_locations_regex.has_cleared_msg(msg_text):
             is_clearing_text=-1
        msg_sender = (message.forward.from_name if message.forward.from_name else message.forward.from_id) if message.forward else 'NTUFreeFood'
        msg_date = message.date
        msg_date = msg_date.astimezone(sgt)
        msg_id = message.id
        #writer.writerow([msg_date, msg_sender, msg_location, msg_text])
        data.append({'id': msg_id, 'date': msg_date, 'sender': str(msg_sender), 'text':str(msg_text)})
    if data == []:
        print('no new data')
        return

    data = pd.DataFrame(data)
    data.to_csv(dir+'freefoodori.csv', mode='a', index=False, header=False)
    
    # format data (combine)
    prevdata = pd.read_csv(dir+'freefoodprocessed.csv')
    prevdata = prevdata.iloc[-1]
    data = pd.concat([prevdata, data])
    data = combine_msg_blocks(data)
    # delete last line
    
    data.to_csv(dir +'freefoodprocessed.csv', index=False, header=False)


def combine_msg_blocks(df):
    # get clearedmsg with known or likely reference
    clears = df[df['clearedmsg'] >-2].copy()
    # drop messages that are only clears
    df = df[df['clearedmsg'] == -2]
    df['date'] = pd.to_datetime(df['date'])
    df['day_of_week'] = df['date'].apply(lambda date: date.weekday())
    df['text'] = df['text'].astype(str)
    df['lagdate'] = df['date'].shift(1)
    df['timebetween'] = df['date'] - df['lagdate']
    # combine messages if by same person and less than 25 mins apart
    df['fartimebetween'] = ~ (df['timebetween'] < timedelta(minutes = 25))
    df['blocks'] = df['fartimebetween'].cumsum()
    

    df = df.groupby(["blocks", 'sender'], as_index=False).agg(min_id=('id', 'first'), max_id=('id', 'last'), msg_first_date=('date', 'first'), msg_last_date=('date', 'last'), sender=('sender', 'first'), text=('text', lambda x : ';'.join(x)))
    # calculate timetoclear
    # if id is known, then timetoclear = clearedtime - firstmsgtime
    #df['time_to_clear'] = 
    df['location'] = df['text'].map(ntu_locations_regex.determine_location_ntu)
    df['categories'] = df['text'].map(ntu_locations_regex.determine_categories_ntu)
    df['main_category'] = df['text'].map(ntu_locations_regex.determine_main_category_ntu)
    df['sub_category'] = df['text'].map(ntu_locations_regex.determine_sub_category_ntu)
    df['time_to_clear'] = None
    df.loc[:, 'cleared_confirmed'] = False
    for index, row in clears.iterrows():
        if row['clearedmsg'] > 0: # relevant msg known in reply
            # filter main_df for matching sender and id occuring <= the id of the cleared message reply. get the first entry that occurs this way
            filtered = df[((df['sender'] == row['sender']) | (row['sender'] == 'NTUFreeFood')) & (df['min_id'] <= row['clearedmsg']) & (df['max_id'] >= row['clearedmsg']) & (df['max_id'] < row['id']) & (row['date'] - df['msg_first_date'] < timedelta(hours = 24)) & ~(df['cleared_confirmed'])]
            

        elif row['clearedmsg'] == -1: # ori msg not known
            # filter main_df for matching sender and message chain occuring <= id of cleared message. if already filled (eg via replied msg previously) then pass
            filtered = df[((df['sender'] == row['sender']) | (row['sender'] == 'NTUFreeFood')) & (df['max_id'] < row['id']) & (row['date'] - df['msg_first_date'] < timedelta(hours = 24)) & ~(df['cleared_confirmed'])]
        
        # find the row in filtered with the maximum 'first_date'
        if not filtered.empty:
            block_containing_clear_earliest_id = filtered['min_id'].max()
            block_containing_clear_earliest_time = filtered.loc[df['min_id'] == block_containing_clear_earliest_id, 'msg_first_date'].iloc[0]
            timediff = row['date'] - block_containing_clear_earliest_time
            df.loc[df['min_id'] == block_containing_clear_earliest_id, 'time_to_clear'] = round(timediff.total_seconds() / 60)
            df.loc[df['min_id'] == block_containing_clear_earliest_id, 'text'] += ';' + row['text']
            df.loc[df['min_id'] == block_containing_clear_earliest_id, 'msg_last_date'] = row['date']
            df.loc[df['min_id'] == block_containing_clear_earliest_id, 'max_id'] = row['id']
            df.loc[df['min_id'] == block_containing_clear_earliest_id, 'cleared_confirmed'] = True
    df = df[['min_id', 'max_id', 'msg_first_date', 'msg_last_date', 'sender', 'location', 'categories', 'main_category', 'sub_category', 'text', 'time_to_clear']]
    return df




client.start()
# Ensure you're authorized
if not client.is_user_authorized():
    client.send_code_request(phone)
    try:
        client.sign_in(phone, input('Enter the code: '))
    except SessionPasswordNeededError:
        client.sign_in(password=input('Password: '))
print(client.session.save())
async def main():
    chat  = await client.get_input_entity(CHAT)

    await scrape_tele_all(chat, client)

with client:
    client.loop.run_until_complete(main())
