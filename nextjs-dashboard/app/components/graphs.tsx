import { ResponsiveBar } from '@nivo/bar'
import React, { useState, useEffect } from 'react';
import {DataRow, LocationDataRow, CategoryDataRow, DateDataRow, MetadataRow, queryFullOriData, queryFiltersProcessedDataLocationStatistics, queryFiltersProcessedData, queryFiltersProcessedDataCategoryStatistics, queryFiltersProcessedDataDateStatistics, queryLastUpdateTime, queryFullProcessedData} from '../helpers/db_helper'
import { FiltersType } from "./filters";
import { ResponsiveCalendar } from '@nivo/calendar';

export const Charts: React.FC<{ filters: FiltersType }> = ( {filters} ) => {
    const [dataBycategory, setDataBycategory] = useState<CategoryDataRow[]>([]);
    const [dataByDate, setDataByDate] = useState<DateDataRow[]>([]);
    useEffect(() => {
        const fetchData = async () => {
            try {
                const dataByCategory = await queryFiltersProcessedDataCategoryStatistics(filters);
                setDataBycategory(dataByCategory);
                const dataByDate = await queryFiltersProcessedDataDateStatistics(filters);
                setDataByDate(dataByDate);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        }
        fetchData();
    }, [filters])
    return (<div></div>)
}
// calendar chart occurences by date

const DateCalendarChart = (dataByDate: DateDataRow[], dateRange: {startDate:string, endDate:string}) => {
    const transformedData = dataByDate.map((item) => ({ // expects dynamic keys and values
        day: item.date,
        value: item.location_counts,
      }));
    return (
      <div style={{ height: 400 }}>
        <ResponsiveCalendar
          data={transformedData}
          from={dateRange.startDate}
          to={dateRange.endDate}
        />
      </div>
    );
  };


// bar chart occurences, time to clear by category
const CategoryBarChart = (dataBycategory : CategoryDataRow[]) => {
    const transformedData = dataBycategory.map((item) => ({ // expects dynamic keys and values
        category: item.category,
        location_counts: item.location_counts,
        mean_time_to_clear: item.mean_time_to_clear,
      }));
    return (
      <div style={{ height: 400 }}>
        <ResponsiveBar
          data={transformedData}
          keys={['location_counts', 'mean_time_to_clear']}
          indexBy="category"
          layout="vertical"
        />
      </div>
    )
  }


// bar chart time to clear by day of week