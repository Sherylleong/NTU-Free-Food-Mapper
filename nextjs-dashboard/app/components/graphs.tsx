"use client"
import { ResponsiveBar } from '@nivo/bar'
import React, { useState, useEffect } from 'react';
import {DataRow, LocationDataRow, CategoryDataRow, CategoryMainSubDataRow, DateDataRow, queryFiltersProcessedDataDateStatistics, queryLastUpdateTime, queryFullProcessedData, DayOfWeekDataRow} from '../helpers/db_helper'
import {FiltersType} from "../helpers/db_helper";
import { ResponsiveCalendar } from '@nivo/calendar';
import { ResponsiveTreeMap } from '@nivo/treemap'
import { ResponsiveLine  } from '@nivo/line'

export const Graphs: React.FC<{ filters: FiltersType }> = ( {filters} ) => {
    const [dataByCategory, setDataByCategory] = useState<CategoryDataRow[]>([]);
    const [dataByCategoryMainSub, setDataByCategoryMainSub] = useState<CategoryMainSubDataRow[]>([]);
    const [dataByDate, setDataByDate] = useState<DateDataRow[]>([]);
    const [dataByDayOfWeek, setDataByDayOfWeek] = useState<DayOfWeekDataRow[]>([]);

    const fetchCategoryData = async () => {
      try {
        console.log('fetching category data')
        const res = await fetch('/api/dataByCategory', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(filters),
        });
  
        if (res.ok) {
          const data: CategoryDataRow[] = await res.json();
          setDataByCategory(data);
        } else {
          const errorData = await res.json();
          console.error('Error fetching category statistics', errorData);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };

    const fetchCategoryMainSubData = async () => {
      try {
        console.log('fetching category mainsub data')
        const res = await fetch('/api/dataByCategoryMainSub', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(filters),
        });
  
        if (res.ok) {
          const data: CategoryMainSubDataRow[] = await res.json();
          setDataByCategoryMainSub(data);
        } else {
          const errorData = await res.json();
          console.error('Error fetching main sub category statistics', errorData);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };

    const fetchDateData = async () => {
      try {
        console.log('fetching date data')
        const res = await fetch('/api/dataByDate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(filters),
        });
  
        if (res.ok) {
          const data: DateDataRow[] = await res.json();
          setDataByDate(data);
        } else {
          const errorData = await res.json();
          console.error('Error fetching date statistics', errorData);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };
    const fetchDayOfWeekData = async () => {
      try {
        console.log('fetching day of week data')
        const res = await fetch('/api/dataByDayOfWeek', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(filters),
        });
  
        if (res.ok) {
          const data: DayOfWeekDataRow[] = await res.json();
          setDataByDayOfWeek(data);
        } else {
          const errorData = await res.json();
          console.error('Error fetching date statistics', errorData);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };
    useEffect(() => {
        fetchCategoryData();
        fetchCategoryMainSubData();
        fetchDateData();
        fetchDayOfWeekData();
    }, [filters])
    return (
        <div>
            <h1 className="text-3xl font-semibold text-center mt-10">Free Food Events Over Time</h1>
            <DateCalendarChart dataByDate={dataByDate} dateRange={filters.dateRange} />
            <DayofWeekOccurencesLineChart dataByDayOfWeek={dataByDayOfWeek} />
            <h2 className="text-3xl font-semibold text-center mt-20 mb-10">Free Food Events by Category</h2>
            <div className="mb-16">
              <CategoryTreeMap dataByCategoryMainSub={dataByCategoryMainSub}/>
            </div>
            <CategoryOccurencesBarChart dataByCategory={dataByCategory}/>
            <h2 className="text-3xl font-semibold text-center mt-16">Mean Time to Clear (if available)</h2>
            <div className="flex flex-col md:flex-row gap-8 mt-16">
              <CategoryMeanTimeToClearBarChart dataByCategory={dataByCategory} />
              <DayofWeekMeanTimeToClearLineChart dataByDayOfWeek={dataByDayOfWeek} />
            </div>
        </div>
    
    )
}
// calendar chart occurences by date
const DateCalendarChart = ({dataByDate, dateRange} : {dataByDate: DateDataRow[], dateRange: {startDate:string, endDate:string}}) => {
    const transformedData = dataByDate.map((item) => ({ // expects dynamic keys and values
        "day": item.date,
        "value": item.location_counts,
      }));
    return (
      <div className="h-[800px] sm:h-[700px] z-[-1]" style={{ zIndex: -1 }}>
        <ResponsiveCalendar
          data={transformedData}
          from={dateRange.startDate}
          to={dateRange.endDate}
          emptyColor="#eeeeee"
          colors={[ '#61cdbb', '#97e3d5', '#e8c1a0', '#f47560' ]}
          margin={{ top: 40, right: 40, bottom: 40, left: 40 }}
          yearSpacing={40}
          monthBorderColor="#ffffff"
          dayBorderWidth={2}
          dayBorderColor="#ffffff"
        />
      </div>
    );
  };

  interface LocationData {
    name: string;
    value: number;
  }
  
  interface SubCategoryData {
    name: string;
    children: LocationData[];
  }
  
  interface MainCategoryData {
    name: string;
    children: SubCategoryData[];
  }
  
  interface TreeMapData {
    name: string;
    children: MainCategoryData[];
  }
// tree map occurence by category/subcategory
const CategoryTreeMap = ({dataByCategoryMainSub} : {dataByCategoryMainSub: CategoryMainSubDataRow[]}) => {
  const treemapData: TreeMapData = {name: "Locations", children:[]};

  dataByCategoryMainSub.forEach(item => {
    // check if the main category already exists, if not, create it
    const mainCategory = treemapData.children.find(child => child.name === item.main_category);
    if (!mainCategory) {
      const toAdd = {
        "name": item.main_category,
        "children": [
          {
            "name": item.sub_category,
            "children": [
              {
                "name": item.location,
                "value": item.location_counts,
              }
            ]
          },
        ]
      };
      treemapData.children.push(toAdd);
    }
    else {
      // main category exists, check if the subcategory exists
      const subCategory = mainCategory.children.find(child => child.name === item.sub_category);

      if (!subCategory) {
        mainCategory.children.push({
          name: item.sub_category,
          children: [
            {
              name: item.location,
              value: item.location_counts,
            },
          ],
        });
      }
      else {
        // subcategory exists, check if the location exists
        const location = subCategory.children.find(child => child.name === item.location);

        if (!location) {
          subCategory.children.push({
            name: item.location,
            value: item.location_counts,
          });
        } else {
          // If needed, update the location counts here (e.g., if location already exists)
          location.value += item.location_counts;  // Example of how to handle count updates
        }
      }
    }
  });


  return (
    <div style={{ height: 800 }}>
      <ResponsiveTreeMap
        data={treemapData}
        identity="name"
        value="value"
        tile="squarify"
        labelSkipSize={50}
        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
        orientLabel={false}
        label={e=>e.id+" ("+e.formattedValue+")"}
      />
    </div>
  );
};

// bar chart occurences, time to clear by category
const CategoryOccurencesBarChart = ({dataByCategory} : {dataByCategory: CategoryDataRow[]}) => {
    const transformedData = dataByCategory.map((item) => ({ // expects dynamic keys and values
        category: item.category,
        location_counts: item.location_counts,
        mean_time_to_clear: item.mean_time_to_clear,
      }));
    return (
      <div className="w-9/12 lg:w-2/5 mx-auto h-1/2 lg:h-[400px]">
        <p className='text-center'>Total Events by Category</p>
        <ResponsiveBar
          data={transformedData}
          keys={['location_counts']}
          indexBy="category"
          layout="vertical"
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: 'Count',
            legendPosition: 'middle',
            legendOffset: -40,
            truncateTickAt: 0
          }}
          axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: 'Category',
            legendOffset: 36,
            legendPosition: 'middle',
            truncateTickAt: 0
        }}
          margin={{ top: 50, right: 50, bottom: 50, left: 50 }}
          colors={{ scheme: 'pastel2' }}
        />
      </div>
    )
}

const CategoryMeanTimeToClearBarChart = ({dataByCategory} : {dataByCategory: CategoryDataRow[]}) => {
    const transformedData = dataByCategory.map((item) => ({ // expects dynamic keys and values
        category: item.category,
        location_counts: item.location_counts,
        mean_time_to_clear: item.mean_time_to_clear,
      }));
    return (
      <div className="w-9/12 lg:w-2/5 mx-auto h-1/2 lg:h-[400px] mb-16">
        <p className='text-center'>Mean Time to Clear by Category</p>
        <ResponsiveBar
          data={transformedData}
          keys={['mean_time_to_clear']}
          indexBy="category"
          layout="vertical"
          margin={{ top: 50, right: 50, bottom: 50, left: 50 }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: 'Mean Time to Clear',
            legendPosition: 'middle',
            legendOffset: -40,
            truncateTickAt: 0
          }}
          axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: 'Category',
            legendOffset: 36,
            legendPosition: 'middle',
            truncateTickAt: 0
        }}
        colors={{ scheme: 'paired' }}
        />
      </div>
    )
}
// bar chart time to clear by day of week
const DayofWeekOccurencesLineChart = ({dataByDayOfWeek} : {dataByDayOfWeek: DayOfWeekDataRow[]}) => {
    const transformedData = dataByDayOfWeek.length > 0 ? [{
      id: 'occurences',
      color: "hsl(60, 70%, 50%)",
      data: dataByDayOfWeek.map((item) => ({ // expects dynamic keys and values
        x: item.day_of_week,
        y: item.location_counts,
      }))
    }] : [{
      id: 'occurences',
      color: "hsl(60, 70%, 50%)",
      data: [{
        x: '', y: 0
      }]
    }]

    return (
      <div className="w-9/12 lg:w-2/5 mx-auto h-1/2 lg:h-[400px]">
        <p className='text-center'>Total Events by Day of Week</p>
        <ResponsiveLine 
          data={transformedData}
          margin={{ top: 50, right: 50, bottom: 50, left: 50 }}
          xScale={{ type: 'point' }}
          yScale={{
            type: 'linear',
            min: 'auto',
            max: 'auto',
            stacked: true,
            reverse: false
        }}
        axisTop={null}
        axisRight={null}
        axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: 'Day of Week',
            legendOffset: 36,
            legendPosition: 'middle',
            truncateTickAt: 0
        }}
        axisLeft={{
          legend: 'count',
          legendOffset: -40,
          legendPosition: 'middle',
          truncateTickAt: 0
      }}
        colors={{ scheme: 'dark2' }}
        enableTouchCrosshair={true}
        crosshairType="bottom-left"
        useMesh={true}
        
        />
      </div>
    )
}


const DayofWeekMeanTimeToClearLineChart = ({dataByDayOfWeek} : {dataByDayOfWeek: DayOfWeekDataRow[]}) => {
  const transformedData = dataByDayOfWeek.length > 0 ? [{
    id: 'occurences',
    color: "hsl(60, 70%, 50%)",
    data: dataByDayOfWeek.map((item) => ({ // expects dynamic keys and values
      x: item.day_of_week,
      //data: item.location_counts,
      y: item.mean_time_to_clear,
    }))
  }] : [{
    id: 'occurences',
    color: "hsl(60, 70%, 50%)",
    data: [{
      x: '', y: 0
    }]
  }]

  return (
    <div className=" mb-16 w-9/12 lg:w-2/5 mx-auto h-1/2 lg:h-[400px]">
      <p className='text-center'>Mean Time to Clear by Day of Week</p>
      <ResponsiveLine 
        data={transformedData}
        margin={{ top: 50, right: 50, bottom: 50, left: 50 }}
        xScale={{ type: 'point' }}
        yScale={{
          type: 'linear',
          min: 'auto',
          max: 'auto',
          stacked: true,
          reverse: false
      }}
      pointBorderWidth={2}
      pointSize={10}
      colors={{ scheme: 'tableau10' }}
      pointLabel="data.yFormatted"
      enableTouchCrosshair={true}
      axisTop={null}
      axisRight={null}
      crosshairType="bottom-left"
      useMesh={true}
      axisBottom={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: 'Day of Week',
          legendOffset: 36,
          legendPosition: 'middle',
          truncateTickAt: 0
      }}
      axisLeft={{
        legend: 'Mean Time to Clear',
        legendOffset: -40,
        legendPosition: 'middle',
        truncateTickAt: 0
    }}
      />
    </div>
  )
}