require('dotenv').config();
// Load the AWS SDK for Node.js
var AWS = require("aws-sdk");
// Set the region
AWS.config.update({ region: "ap-southeast-1" });

const scanTable = async (tablename : string) => {
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

        // Check if there are more items to scan
        if (data.LastEvaluatedKey) {
            params.ExclusiveStartKey = data.LastEvaluatedKey;
        } else {
            scanningFinished = true;
        }
    }

    // Return all scanned items
    return items;
} catch (err) {
    console.error('Unable to scan the table. Error JSON:', JSON.stringify(err, null, 2));
    throw err; // Rethrow the error for handling upstream
  }
}

const getLastUpdatedTime = async () => {
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




const filterData = (data : object[], min_date : string, max_date : string, locations : string[]) => {
  const filterParams = {
    data: data,
    min_date: min_date,
    max_date: max_date,
    locations: locations
  }
  return data.filter(row => {
    // Check each filter parameter
    for (let key in filterParams) {
        // If filterParam[key] is not null and car[key] does not match, exclude the car
        if (filterParams[key] !== null && data[key] !== filterParams[key]) {
            return false;
        }
    }
    // If all filter parameters are null or match, include the car
    return true;
  });
}
