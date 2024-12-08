"use client";

import { Button } from '@nextui-org/react';

import React, { useState, useEffect } from 'react'
import {Map} from "./components/map";
import {FiltersType} from "./helpers/db_helper";
import {Filters} from "./components/filters";
import {Graphs} from "./components/graphs";
import {CountUp} from "./components/counter";

const getTodayDate = (): string => {
  const date = new Date().toLocaleString('en-US', { timeZone: 'Asia/Singapore' });
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

async function fetchTotalEvents(filters: FiltersType) {
  const res = await fetch('/api/totalEvents', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(filters),
  });
  let totalEvents;
  if (res.ok) {
    totalEvents = await res.json();
  } else {
    totalEvents = null
  }
  return totalEvents
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
  const [totalEvents, setTotalEvents] = useState<any>(null)
  const [filters, setFilters] = useState<FiltersType>({
    daysOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    dateRange: { startDate: '2018-01-01', endDate: getTodayDate() },
    timeRange: { startTime: 0, endTime: 24 },
    categories: ['North Spine', 'South Spine','Hive', 'School', 'Hall', 'TRs', 'LTs', 'Other'],
    availableTimesToClearOnly: false,
    timeToClear: { minTime: 0, maxTime: 24 },
  });
  useEffect(() => {
    // Fetch the last update time when the component mounts
    const fetchData = async () => {
      try {
        const updateTime = await fetchLastUpdateTime();
        let date = new Date(updateTime);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const dateString = `${year}-${month}-${day} ${hours}:${minutes}`;
        setLastUpdateTime(dateString); // Set the fetched time to state

        const totalEvents = await fetchTotalEvents(filters);
        setTotalEvents(totalEvents);
      } catch (error) {
        console.error('Error fetching last update time:', error);
      }
    };
    fetchData();
  }, []); // Empty dependency array ensures this runs once when the component mounts


  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <CountUp target={totalEvents}/>
      <div className="text-gray-500">last updated: {lastUpdateTime}</div>
      <Filters filters={filters} setFilters={setFilters}/>
      <Map filters={filters}/>
      <div className="h-96 w-full sm:w-[80%]">
        <Graphs filters={filters} />
      </div>  
    </div>
  )
}

export default Home



