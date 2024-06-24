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

import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
from firebase import firebase


CHAT  = '@freefoodntu'
TEST_DATE = datetime(2022, 1, 1, 0, 0, 0)
EARLIEST_DATE = datetime(2018, 1, 1, 0, 0, 0)


'''
FILENAME = "freefooddb.csv"
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
dir = 'nextjs-dashboard/scraper-code/'
from dotenv import load_dotenv
load_dotenv()
cred = credentials.Certificate({
  "type": "service_account",
  "project_id": "ntu-free-food-mapper",
  "private_key_id": os.getenv('FIRESTORE_PRIVATE_KEY_ID'),
  "private_key": os.getenv('FIRESTORE_PRIVATE_KEY').replace(r'\n', '\n'),
  "client_email": os.getenv('FIRESTORE_CLIENT_EMAIL'),
  "client_id": "110149797684249676959",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-ber66%40ntu-free-food-mapper.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
})
default_app = firebase_admin.initialize_app(cred)
db = firestore.client()


api_id = os.getenv('API_ID')
api_hash = os.getenv('API_HASH')
phone = os.getenv('PHONE')
# Create the client and connect
client = TelegramClient('anon', api_id, api_hash)


# timezone
utc = pytz.utc 
sgt = pytz.timezone('Asia/Singapore') 


async def scrape_tele_all(chat, client, startdate=EARLIEST_DATE):
    data = []
    async for message in client.iter_messages(chat, offset_date=startdate, reverse=True): # get all messages after specified date
        msg_text = message.text
        if msg_text == '' or msg_text is None: # omit sole images
            continue
        msg_text =  msg_text.replace('\n', ' ').replace('"', '').replace('@', ' ').replace('!', ' ').lower()
        is_clearing_text = -2

        if message.is_reply and ntu_locations_regex.has_cleared_msg(msg_text):
            is_clearing_text = await message.get_reply_message()
            is_clearing_text = is_clearing_text.id
        elif ntu_locations_regex.has_cleared_msg(msg_text):
             is_clearing_text=-1
        msg_sender = (message.forward.from_name if message.forward.from_name else message.forward.from_id) if message.forward else 'NTUFreeFood'
        msg_date = message.date
        #msg_date = datetime.fromisoformat(msg_date)
        msg_date = msg_date.astimezone(sgt)
        msg_id = message.id
        data.append({'id': msg_id, 'date': msg_date, 'sender': str(msg_sender), 'text':msg_text, 'clearedmsg': is_clearing_text})
    
    #data.to_csv(dir+'freefoodori.csv', index=False)
    

    # format data (combine)
    data = pd.DataFrame(data)
    batch_crud_db(data.to_dict('records'), 'set', db.collection('freefoodori'), key='id')
    df = data.copy()
    df = combine_msg_blocks(df)
    batch_crud_db(df.to_dict('records'), 'set', db.collection('freefoodprocessed'), key='min_id')
    #df.to_csv(dir +'freefooddb.csv', index=False)

def batch_crud_db(data, action, db_col, key):
    # Split List in lists containing 500 items per list
    list_to_batch = [data[item:item+500] for item in range(0, len(data), 500)]
    # Finally iterate through the 'list_to_batch' add each item to the batch and commit using a for loop
    for item in list_to_batch:
        batch = db.batch()
        for document in item:
            print(999)
            print(document)
            if action == 'set':
                batch.set(db_col.document(str(document[key])), document)
            elif action == 'update':
                batch.update(db_col.document(str(document[key])), document)
            else:
                batch.delete(db_col.document(str(document[key])), document)
        # Finally commit the batch
        batch.commit()

async def scrape_tele_latest(chat, client):
    data = []
    try:
       prev_df = pd.read_csv(dir+'freefoodori.csv')
    except pd.errors.EmptyDataError:
        print('empty database, scraping all')
        return await scrape_tele_all(chat, client, TEST_DATE)
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
        if msg_text == '': # omit sole images
            continue
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
    prevdata = pd.read_csv(dir+'freefooddb.csv')
    prevdata = prevdata.iloc[-1]
    data = pd.concat([prevdata, data])
    data = combine_msg_blocks(data)
    # delete last line
    
    data.to_csv(dir+'freefooddb.csv', index=False, header=False)


def combine_msg_blocks(df):
    # get clearedmsg with known or likely reference
    clears = df[df['clearedmsg'] >-2].copy()
    # drop messages that are only clears
    df = df[df['clearedmsg'] == -2]
    df.loc[:, 'date'] = pd.to_datetime(df['date'])
    df.loc[:, 'text'] = df['text'].astype(str)
    df.loc[:, 'lagdate'] = df['date'].shift(1)
    df.loc[:, 'timebetween'] = df['date'] - df['lagdate']
    # combine messages if by same person and less than 25 mins apart
    df.loc[:, 'fartimebetween'] = ~ (df['timebetween'] < timedelta(minutes = 25))
    df.loc[:, 'blocks'] = df['fartimebetween'].cumsum()
    
    #df['msg_block'] = df.groupby(["sender", 'blocks'])['text'].transform(lambda x : ';'.join(x))
    #df = df.groupby(["sender", 'blocks']).agg({'min_id': 'first', 'msg_first_date': 'last', 'msg_last_date': 'last', 'sender': 'first', 'text': lambda x : ';'.join(x)})
    df = df.groupby(["blocks", 'sender'], as_index=False).agg(min_id=('id', 'first'), max_id=('id', 'last'), msg_first_date=('date', 'first'), msg_last_date=('date', 'last'), sender=('sender', 'first'), text=('text', lambda x : ';'.join(x)))
    # calculate timetoclear
    # if id is known, then timetoclear = clearedtime - firstmsgtime
    df.loc[:, 'location'] = df['text'].map(ntu_locations_regex.determine_location_ntu)
    df['time_to_clear'] = 'None'
    df.loc[:, 'cleared_confirmed'] = False
    for index, row in clears.iterrows():
        if row['clearedmsg'] > 0: # relevant msg known in reply
            # Filter main_df for matching sender and id occuring <= the id of the cleared message reply. get the first entry that occurs this way
            filtered = df[((df['sender'] == row['sender']) | (row['sender'] == 'NTUFreeFood')) & (df['min_id'] <= row['clearedmsg']) & (df['max_id'] >= row['clearedmsg']) & (df['max_id'] < row['id']) & (row['date'] - df['msg_first_date'] < timedelta(hours = 24)) & ~(df['cleared_confirmed'])]
            # Find the row in filtered with the maximum 'first_date'
            if not filtered.empty:
                block_containing_clear_earliest_id = filtered['min_id'].max()
                block_containing_clear_earliest_time = filtered.loc[df['min_id'] == block_containing_clear_earliest_id, 'msg_first_date'].iloc[0]
                timediff = row['date'] - block_containing_clear_earliest_time
                df.loc[df['min_id'] == block_containing_clear_earliest_id, 'time_to_clear'] = round(timediff.total_seconds() / 60)
                df.loc[df['min_id'] == block_containing_clear_earliest_id, 'text'] += ';' + row['text']
                df.loc[df['min_id'] == block_containing_clear_earliest_id, 'msg_last_date'] = row['date']
                df.loc[df['min_id'] == block_containing_clear_earliest_id, 'max_id'] = row['id']
                df.loc[df['min_id'] == block_containing_clear_earliest_id, 'cleared_confirmed'] = True

        elif row['clearedmsg'] == -1: # ori msg not known
            # filter main_df for matching sender and message chain occuring <= id of cleared message. if already filled (eg via replied msg previously) then pass
            filtered = df[((df['sender'] == row['sender']) | (row['sender'] == 'NTUFreeFood')) & (df['max_id'] < row['id']) & (row['date'] - df['msg_first_date'] < timedelta(hours = 24)) & ~(df['cleared_confirmed'])]
            if not filtered.empty:
                block_containing_clear_earliest_id = filtered['min_id'].max()
                block_containing_clear_earliest_time = filtered.loc[df['min_id'] == block_containing_clear_earliest_id, 'msg_first_date'].iloc[0]
                timediff = row['date'] - block_containing_clear_earliest_time
                df.loc[df['min_id'] == block_containing_clear_earliest_id, 'time_to_clear'] =  round(timediff.total_seconds() / 60)
                df.loc[df['min_id'] == block_containing_clear_earliest_id, 'text'] += ';' + row['text']
                df.loc[df['min_id'] == block_containing_clear_earliest_id, 'msg_last_date'] = row['date']
                df.loc[df['min_id'] == block_containing_clear_earliest_id, 'max_id'] = row['id']
                df.loc[df['min_id'] == block_containing_clear_earliest_id, 'cleared_confirmed'] = True
    df = df[['min_id', 'max_id', 'msg_first_date', 'msg_last_date', 'sender', 'location', 'text', 'time_to_clear', 'cleared_confirmed']]
    return df




client.start()
# Ensure you're authorized
if not client.is_user_authorized():
    client.send_code_request(phone)
    try:
        client.sign_in(phone, input('Enter the code: '))
    except SessionPasswordNeededError:
        client.sign_in(password=input('Password: '))

async def main():
    chat  = await client.get_input_entity(CHAT)

    await scrape_tele_all(chat, client)

with client:
    client.loop.run_until_complete(main())
