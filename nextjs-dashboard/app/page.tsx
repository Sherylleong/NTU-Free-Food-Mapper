import React, { useState } from 'react'
import {Map} from "./components/map";
import {Filters} from "./components/filters";
import {FiltersType} from "./components/filters";

const getTodayDate = (): string => {
  const date = new Date().toLocaleString('en-SG', { timeZone: 'Asia/Singapore' });
  const sgtDate = new Date(date);

  const year = sgtDate.getFullYear();
  const month = (sgtDate.getMonth() + 1).toString().padStart(2, '0'); // Month is zero-indexed
  const day = sgtDate.getDate().toString().padStart(2, '0'); // Pad single digits with leading zero

  return `${year}-${month}-${day}`;
};

const Home = () => {
  const [filters, setFilters] = useState<FiltersType>({
    daysOfWeek: [],
    dateRange: { startDate: '2018-01-01', endDate: getTodayDate() },
    timeRange: { startTime: 0, endTime: 24 },
    categories: ['North Spine', 'South Spine','Hive', 'School', 'Hall', 'TRs', 'LTs', 'Other','Unknown/None'],
    timeToClear: { minTime: 0, maxTime: 24 },
  });
  return (
    <div>
      <Filters filters={filters} setFilters={setFilters}/>
      <Map filters={filters}/>

    </div>
  )
}

export default Home



