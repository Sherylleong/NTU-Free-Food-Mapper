import React from 'react'

const Home = () => {
  return (
    <div>
      home
    </div>
  )
}

export default Home


require('dotenv').config();
// Load the AWS SDK for Node.js
var AWS = require("aws-sdk");
// Set the region
AWS.config.update({ region: "ap-southeast-1" });




