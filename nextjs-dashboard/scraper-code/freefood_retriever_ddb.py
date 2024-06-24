from datetime import datetime, timedelta
import pandas as pd
import pytz

import boto3

# timezone
utc = pytz.utc 
sgt = pytz.timezone('Asia/Singapore') 

CHAT  = 1135894961
START_DATE = sgt.localize(datetime(2018, 1, 1))
END_DATE = sgt.localize(datetime(2024, 12, 1))

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

def read_all_table(table):
    # Initialize starting key for paginations
    response = table.scan()
    for item in response['Items']:
        print(item['min_id'])
    data = response['Items']
    while 'LastEvaluatedKey' in response:
        print(response['LastEvaluatedKey'], 111111111111)
        response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
        for item in response['Items']:
            print(['min_id'])
        data.extend(response['Items'])
    print("All items gotten from the table.")
    print(len(data))

def get_table_daterange(start, end):
    start = start.strftime('%Y-%m-%d %H:%M:%S %z') if start is not None else START_DATE
    end = end.strftime('%Y-%m-%d %H:%M:%S %z') if end is not None else sgt.localize(datetime.now()).strftime('%Y-%m-%d %H:%M:%S %z')
    expression_attribute_values = {
        ':start_date': {'S': start},
        ':end_date': {'S': end}
    }
    
    query_expression = 'min_date BETWEEN :start_date AND :end_date'

    # Initialize an empty list to store all items
    all_items = []

    # Start pagination loop
    last_evaluated_key = {}

    # Perform the Query operation with pagination parameters
    table = db.Table('freefoodprocessed')

    # When making a Query API call, we use the KeyConditionExpression parameter to specify the partition key on which we want to query.
    # We're using the Key object from the Boto3 library to specify that we want the attribute name ("pk")
    # to equal "helga.ramirez@somewhere.com" by using the ".eq()" method.
    resp = table.query(KeyConditionExpression=Key('pk').eq('helga.ramirez@somewhere.com'))
        
#df = get_df_daterange(START_DATE, END_DATE)
read_all_table(freefoodprocessed)

# merge rows sent by same user within 1 min together

#df_date = df[df[date > START_DATE]]