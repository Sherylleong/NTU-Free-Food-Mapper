import csv 
from datetime import datetime, timedelta
import os
import pandas as pd
import pytz

import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
from firebase import firebase
from google.cloud.firestore_v1.base_query import FieldFilter


# timezone
utc = pytz.utc 
sgt = pytz.timezone('Asia/Singapore') 

CHAT  = 1135894961
START_DATE = sgt.localize(datetime(2018, 1, 1))
END_DATE = sgt.localize(datetime(2024, 12, 1))

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

# Create a references collection
ori_ref = db.collection("freefoodori")
processed_ref = db.collection("freefoodprocessed")

# Create a query against the collection


def get_df_daterange(start, end):
    #start = start.strftime("%Y-%m-%dT%H:%M:%S.%fZ")
    #end = end.strftime("%Y-%m-%dT%H:%M:%S.%fZ")
    print(start)
    #query_ref = processed_ref.where(filter=FieldFilter("date", "<=", end))
    #query_ref = processed_ref.where(filter=FieldFilter("date", ">=", start))

    docs = (
        processed_ref
        #.where(filter=FieldFilter("date", "<=", end))
        .where(filter=FieldFilter("msg_first_date", ">", start))
        .where(filter=FieldFilter("msg_first_date", "<", end))
        .stream()
    )
    data = []
    for doc in docs:
        data.append(doc.to_dict())
    data = pd.DataFrame(data)
    return data

    

df = get_df_daterange(START_DATE, END_DATE)
print(df)
# merge rows sent by same user within 1 min together

#df_date = df[df[date > START_DATE]]