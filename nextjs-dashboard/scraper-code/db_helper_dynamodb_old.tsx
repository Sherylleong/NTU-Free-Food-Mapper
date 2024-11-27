require('dotenv').config();
// Load the AWS SDK for Node.js
var AWS = require("aws-sdk");
// Set the region
AWS.config.update({ region: "ap-southeast-1" });

export const scanTable = async (tablename : string) => {
  try {
    var ddb = new AWS.DynamoDB.DocumentClient();
    let items : object[] = [];
    let params = {
      TableName: tablename,
      ExclusiveStartKey: null
    };
    let scanningFinished = false;
    
    while (!scanningFinished) {
        const data = await ddb.scan(params).promise();
        
        items = items.concat(data.Items);

        // check if there are more items to scan
        if (data.LastEvaluatedKey) {
            params.ExclusiveStartKey = data.LastEvaluatedKey;
        } else {
            scanningFinished = true;
        }
    }

    // return all scanned items
    console.log(items);
    return items;
} catch (err) {
    console.error('Unable to scan the table. Error JSON:', JSON.stringify(err, null, 2));
    throw err;
  }
}

export const getLastUpdatedTime = async () => {
  try {
    var ddb = new AWS.DynamoDB.DocumentClient();
    let items : object[] = [];
    let params = {
      TableName: 'freefoodmetadata'
    };
    const data = await ddb.scan(params).promise().Items;
    
    // Return all scanned items
    return data.latest_update_time;
} catch (err) {
    console.error('Unable to scan the table. Error JSON:', JSON.stringify(err, null, 2));
    throw err; // Rethrow the error for handling upstream
  }
}



interface FilterParams {
  min_date?: string | null;
  max_date?: string | null;
  locations?: string[] | null;
}

interface DataRow {
  min_id: number;
  cleared_confirmed: boolean;
  location: string;
  max_id: number;
  msg_first_date: string;
  msg_last_date: string;
  sender: string;
  text: string;
  time_to_clear: string | null;
}
export const filterData = (data : DataRow[], min_date : string, max_date : string, locations : string[]) => {
  const filterParams: FilterParams = {
    min_date: min_date,
    max_date: max_date,
    locations: locations
};
  return data.filter(row => {
    // Check each filter parameter
    for (let key in filterParams) {
      const filterValue = filterParams[key as keyof FilterParams];

    }
    // if all filter parameters are null or match, include the car
    return true;
  });
}
