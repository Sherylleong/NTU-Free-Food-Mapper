import React from 'react'
import Map from "./map";


const Home = () => {
console.log('g')
  return (
    <div>
      home
      <Map />
    </div>
  )
}

export default Home



require('dotenv').config();
// Load the AWS SDK for Node.js
var AWS = require("aws-sdk");
// Set the region
AWS.config.update({ region: "ap-southeast-1" });




