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

import boto3

from dotenv import load_dotenv
load_dotenv()

db = boto3.resource(
    "dynamodb",
    region_name='ap-southeast-1',
    # aws_access_key_id=session.get_credentials().access_key,
    # aws_secret_access_key=session.get_credentials().secret_key,
)

freefoodori = db.Table('freefoodori')
freefoodprocessed = db.Table('freefoodprocessed')
freefoodmetadata = db.Table('freefoodmetadata')

CHAT  = '@freefoodntu'
END_DATE = datetime.now()
EARLIEST_DATE = datetime(2018, 1, 1, 0, 0, 0)
# datetime object containing current date and time

api_id = os.getenv('API_ID')
api_hash = os.getenv('API_HASH')
phone = os.getenv('PHONE')
# Create the client and connect
client = TelegramClient('anon', api_id, api_hash)


# timezone
utc = pytz.utc 
sgt = pytz.timezone('Asia/Singapore') 


async def scrape_tele_all(chat, client, startdate=EARLIEST_DATE):
    end_date = datetime.now()
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
    max_id = msg_id
    max_date = msg_date.strftime('%Y-%m-%d %H:%M:%S %z')

    # format data (combine)
    data = pd.DataFrame(data)
    df = data.copy()
    data['date'] = data['date'].apply(lambda x: x.strftime('%Y-%m-%d %H:%M:%S %z'))
    #start = start.strftime("%Y-%m-%dT%H:%M:%S.%fZ")o
    print('db start')
    drop_table_db('id', freefoodori)
    drop_table_db('min_id', freefoodprocessed)
    drop_table_db('max_id', freefoodmetadata)
    set_db(data.to_dict('records'), freefoodori)
    
    df = combine_msg_blocks(df)
    df['msg_first_date'] = df['msg_first_date'].apply(lambda x: x.strftime('%Y-%m-%d %H:%M:%S %z'))
    df['msg_last_date'] = df['msg_last_date'].apply(lambda x: x.strftime('%Y-%m-%d %H:%M:%S %z'))
    set_db(df.to_dict('records'), freefoodprocessed)

    set_db([{'max_id': max_id, 'max_date': max_date, 'latest_update_time': end_date.strftime('%Y-%m-%d %H:%M:%S %z')}], freefoodmetadata)

def set_db(data, table):
    for item in data:
        print(item)
        table.put_item(
            Item=item
        )

def delete_db(keyname, key, table):
    table.delete_item(Key={keyname: key})

def drop_table_db(keyname, table):
    # Initialize starting key for paginations
    response = table.scan()
    for item in response['Items']:
        print(item[keyname])
        table.delete_item(Key={keyname: item[keyname]})
    while 'LastEvaluatedKey' in response:
        print(response['LastEvaluatedKey'])
        response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
        print(item[keyname])
        for item in response['Items']:
            table.delete_item(Key={keyname: item[keyname]})
    print("All items deleted from the table.")



async def scrape_tele_latest(chat, client):
    data = []
    end_date = datetime.now().astimezone(sgt)
    response = freefoodmetadata.scan()
    print(response)
    # Check if the item was found
    if 'Items' in response:
        max_id = response['Items'][0]['max_id']
        msg_date = response['Items'][0]['max_date']
    else:
        return
    async for message in client.iter_messages(chat, offset_id=int(max_id), reverse=True): # get all messages after specified id
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
        
        data.append({'id': msg_id, 'date': msg_date, 'sender': str(msg_sender), 'text':str(msg_text)})

    if len(data) == 0:
        set_db([{'max_id': max_id, 'max_date': msg_date, 'latest_update_time': end_date.strftime('%Y-%m-%d %H:%M:%S %z')}], freefoodmetadata)
        print('no data')
        return
        
    max_date = msg_date.strftime('%Y-%m-%d %H:%M:%S %z')
    # format data (combine)
    data = pd.DataFrame(data)
    df = data.copy()
    data['date'] = data['date'].apply(lambda x: x.strftime('%Y-%m-%d %H:%M:%S %z'))
    set_db(data.to_dict('records'), freefoodori)
    df = combine_msg_blocks(df)
    df['msg_first_date'] = df['msg_first_date'].apply(lambda x: x.strftime('%Y-%m-%d %H:%M:%S %z'))
    df['msg_last_date'] = df['msg_last_date'].apply(lambda x: x.strftime('%Y-%m-%d %H:%M:%S %z'))
    set_db(df.to_dict('records'), freefoodprocessed)
    set_db([{'max_id': max_id, 'max_date': max_date, 'latest_update_time': end_date.strftime('%Y-%m-%d %H:%M:%S %z')}], freefoodmetadata)
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

    #await scrape_tele_latest(chat, client)
    await scrape_tele_latest(chat, client)

with client:
    client.loop.run_until_complete(main())
