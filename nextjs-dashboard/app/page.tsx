"use client";

import { Button } from '@nextui-org/react';

import React, { useState, useEffect } from 'react'
import {FreeFoodMap} from "./components/map";
import {FiltersType} from "./helpers/db_helper";
import {Filters} from "./components/filters";
import {Graphs} from "./components/graphs";
import {CountUp} from "./components/counter";
import {Navbar} from "./components/navbar";

const getTodayDate = (): string => {
  const date = new Date().toLocaleString('en-US', { timeZone: 'Asia/Singapore' });
  const sgtDate = new Date(date);
  const year = sgtDate.getFullYear();
  const month = (sgtDate.getMonth() + 1).toString().padStart(2, '0'); // month is zero-indexed
  const day = sgtDate.getDate().toString().padStart(2, '0'); // pad single digits with leading zero
  
  return `${year}-${month}-${day}`;
};


async function fetchLastUpdateTime() {
  const res = await fetch('/api/lastUpdateTime', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  let lastUpdateTime;
  if (res.ok) {
    lastUpdateTime = await res.json();
  } else {
    lastUpdateTime = null
  }
  return lastUpdateTime
}


async function fetchMetadata() {
  const res = await fetch('/api/metadata', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  let metadata;
  if (res.ok) {
    metadata = await res.json();
  } else {
    metadata = null
  }
  return metadata
}
const Home = () => {
  const [lastUpdateTime, setLastUpdateTime] = useState<any>(null)
  const [filters, setFilters] = useState<FiltersType>({
    daysOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    dateRange: { startDate: '2018-01-01', endDate: getTodayDate() },
    timeRange: { startTime: 0, endTime: 24 },
    categories: ['North Spine', 'South Spine','Hive', 'School', 'Hall', 'TRs', 'LTs', 'Other', 'Unknown'],
    availableTimesToClearOnly: false,
    timeToClear: { minTime: 0, maxTime: 120 },
    locations: []
  });
  useEffect(() => {
    // fetch the last update time when the component mounts
    const fetchData = async () => {
      try {
        const updateTime = await fetchLastUpdateTime();
        let date = new Date(updateTime);
        console.log(date, updateTime)
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth()+1).padStart(2, '0'); // months are zero-based
        const day = String(date.getUTCDate()).padStart(2, '0');
        const hours = String(date.getUTCHours()).padStart(2, '0');
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');
        const dateString = `${year}-${month}-${day} ${hours}:${minutes}`;
        setLastUpdateTime(dateString); 
      } catch (error) {
        console.error('Error fetching last update time:', error);
      }
    };
    fetchData();
  }, []); // Empty dependency array ensures this runs once when the component mounts


  return (
    <>
    <div className='fixed top-0 left-0 right-0' style={{zIndex:9999}}>
      <Navbar/>
      <Filters filters={filters} setFilters={setFilters}/>
    </div>
    <div className="flex flex-col items-center justify-center min-h-screen">
      <CountUp filters={filters}/>
      <div className="text-gray-500 pb-16">last updated: {lastUpdateTime}</div>
      <FreeFoodMap filters={filters} setFilters={setFilters}/>
      <div className="h-96 w-full sm:w-[90%]">
        <Graphs filters={filters} />
      </div>  
    </div>
    </>
  )
}

export default Home



