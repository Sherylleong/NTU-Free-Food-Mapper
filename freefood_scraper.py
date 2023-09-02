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


import os
from datetime import datetime, timedelta

from telethon.sessions import StringSession
import ntu_locations_regex

import pandas as pd
import csv 

CHAT  = '@freefoodntu'
TEST_DATE = datetime(2022, 1, 1, 0, 0, 0)
EARLIEST_DATE = datetime(2021, 1, 1, 0, 0, 0)


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
# retrieve environment variables from heroku
from dotenv import load_dotenv
load_dotenv()
api_id = os.getenv('API_ID')
api_hash = os.getenv('API_HASH')
phone = os.getenv('PHONE')
# Create the client and connect
client = TelegramClient('anon', api_id, api_hash)

async def scrape_tele_all(chat, client, startdate):
    data = []
    async for message in client.iter_messages(chat, offset_date=startdate, reverse=True): # get all messages after specified date
        msg_text =  message.text.replace('\n', ' ').replace('"', '').replace('@', ' ').lower()
        if message.is_reply or msg_text == '': # omit replies and images
            continue
        msg_sender = message.forward.from_name if message.forward else 'NTUFreeFood'
        msg_date = message.date
        msg_id = message.id
        msg_location = ntu_locations_regex.determine_location_ntu(msg_text)
        if msg_location == 'Unknown' and ntu_locations_regex.has_cleared_msg(msg_text): # ensure messages are not clearing messages
            continue
        #writer.writerow([msg_date, msg_sender, msg_location, msg_text])
        data.append({'id': msg_id, 'date': msg_date, 'sender': msg_sender, 'text':msg_text})
    data = pd.DataFrame(data)
    #data = data.reset_index(drop=True)
    data.to_csv('freefoodori.csv', index=False)

    # format data (combine)
    df = data.copy()
    df = combine_msg_blocks(df)
    df.to_csv('freefooddb.csv', index=False)


async def scrape_tele_latest(chat, client, startdate):
    data = []
    prev_df = pd.read_csv('freefooddb.csv')
    max_id = prev_df['id'].max()
    async for message in client.iter_messages(chat, offset_id=max_id, reverse=True): # get all messages after specified id
        msg_text =  message.text.replace('\n', ' ').replace('"', '').replace('@', ' ').lower()
        if message.is_reply or msg_text == '': # omit replied and images
            continue
        msg_sender = message.forward.from_name if message.forward else 'NTUFreeFood'
        msg_date = message.date
        msg_id = message.id
        msg_location = ntu_locations_regex.determine_location_ntu(msg_text)
        if msg_location == 'Unknown' and ntu_locations_regex.has_cleared_msg(msg_text): # ensure messages are not clearing messages
            continue
        #writer.writerow([msg_date, msg_sender, msg_location, msg_text])
        data.append({'id': msg_id, 'date': msg_date, 'sender': msg_sender, 'text':msg_text})
    data = pd.DataFrame(data)
    #data = data.reset_index(drop=True)
    data.to_csv('freefoodori.csv', mode='a', index=False, header=False)
    # format data (combine)
    df = data.copy()
    df = combine_msg_blocks(df)   
    df.to_csv('freefooddb.csv', mode='a', index=False, header=False)

def combine_msg_blocks(df):
    df['lagdate'] = df['date'].shift(1)
    df['timebetween'] = df['date'] - df['lagdate']
    # combine messages if by same person and less than 5 mins apart
    df['fartimebetween'] = ~ (df['timebetween'] < timedelta(minutes = 5)) 
    df['blocks'] = df['fartimebetween'].cumsum()
    df['msg_block'] = df.groupby(["sender", 'blocks'])['text'].transform(lambda x : ';'.join(x)) 
    df['location'] = df['text'].map(lambda x: ntu_locations_regex.determine_location_ntu(x))
    df = df.drop_duplicates(subset=['blocks'], keep='last')
    df = df[['id','date', 'sender', 'msg_block']]
    #df = df.reset_index(drop=True)
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

    await scrape_tele_all(chat, client, TEST_DATE)

with client:
    client.loop.run_until_complete(main())
