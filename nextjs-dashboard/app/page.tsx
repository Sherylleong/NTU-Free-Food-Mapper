"use client";

import React, { useState, useEffect } from 'react'
import {Map} from "./components/map";
import {FiltersType} from "./helpers/db_helper";
import {Filters} from "./components/filters";

const getTodayDate = (): string => {
  const date = new Date().toLocaleString('en-SG', { timeZone: 'Asia/Singapore' });
  const sgtDate = new Date(date);

  const year = sgtDate.getFullYear();
  const month = (sgtDate.getMonth() + 1).toString().padStart(2, '0'); // Month is zero-indexed
  const day = sgtDate.getDate().toString().padStart(2, '0'); // Pad single digits with leading zero

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
const Home = () => {
  const [lastUpdateTime, setLastUpdateTime] = useState<any>(null)
  const [filters, setFilters] = useState<FiltersType>({
    daysOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    dateRange: { startDate: '2018-01-01', endDate: getTodayDate() },
    timeRange: { startTime: 0, endTime: 24 },
    categories: ['North Spine', 'South Spine','Hive', 'School', 'Hall', 'TRs', 'LTs', 'Other','Unknown/None'],
    timeToClear: { minTime: 0, maxTime: 24 },
  });
  useEffect(() => {
    // Fetch the last update time when the component mounts
    const fetchData = async () => {
      try {
        const updateTime = await fetchLastUpdateTime();
        setLastUpdateTime(updateTime); // Set the fetched time to state
      } catch (error) {
        console.error('Error fetching last update time:', error);
      }
    };

    fetchData();
  }, []); // Empty dependency array ensures this runs once when the component mounts


  return (
    <>
    <div>last updated: {lastUpdateTime}</div>
    <div>
      <Filters filters={filters} setFilters={setFilters}/>
      <Map filters={filters}/>
    </div>
    </>
  )
}

export default Home



