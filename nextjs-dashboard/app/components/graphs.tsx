"use client"
import { ResponsiveBar } from '@nivo/bar'
import React, { useState, useEffect } from 'react';
import {DataRow, LocationDataRow, CategoryDataRow, CategoryMainSubDataRow, DateDataRow, MetadataRow, queryFullOriData, queryFiltersProcessedDataLocationStatistics, queryFiltersProcessedDataCategoryStatistics, queryFiltersProcessedDataDateStatistics, queryLastUpdateTime, queryFullProcessedData} from '../helpers/db_helper'
import {FiltersType} from "../helpers/db_helper";
import { ResponsiveCalendar } from '@nivo/calendar';
import { ResponsiveTreeMap } from '@nivo/treemap'
import { ResponsiveLine  } from '@nivo/line'

export const Graphs: React.FC<{ filters: FiltersType }> = ( {filters} ) => {
    const [dataByCategory, setDataByCategory] = useState<CategoryDataRow[]>([]);
    const [dataByCategoryMainSub, setDataByCategoryMainSub] = useState<CategoryMainSubDataRow[]>([]);
    const [dataByDate, setDataByDate] = useState<DateDataRow[]>([]);

    const fetchCategoryData = async () => {
      try {
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
    useEffect(() => {
        fetchCategoryData();
        fetchCategoryMainSubData();
        fetchDateData();
    }, [filters])
    return (
        <div>
            <DateCalendarChart dataByDate={dataByDate} dateRange={filters.dateRange} />
            <CategoryOccurencesBarChart dataByCategory={dataByCategory}/>
            <CategoryTreeMap dataByCategoryMainSub={dataByCategoryMainSub}/>
            <CategoryMeanTimeToClearBarChart dataByCategory={dataByCategory}/>
            <DayofWeekMeanTimeToClearBarChart dataByDate={dataByDate} />
            <DayofWeekOccurencesBarChart dataByDate={dataByDate} />
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
      <div style={{ height: 800 }}>
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
        margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
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
      <div style={{ width: '90%' }}>
        <ResponsiveBar
          data={transformedData}
          keys={['location_counts']}
          indexBy="category"
          layout="vertical"
          margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
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
      <div style={{ width: '90%' }}>
        <ResponsiveBar
          data={transformedData}
          keys={['mean_time_to_clear']}
          indexBy="category"
          layout="vertical"
        />
      </div>
    )
}
// bar chart time to clear by day of week
const DayofWeekOccurencesBarChart = ({dataByDate} : {dataByDate: DateDataRow[]}) => {
    const transformedData = [{
      id: 'occurences',
      color: "hsl(60, 70%, 50%)",
      data: dataByDate.map((item) => ({ // expects dynamic keys and values
        x: item.day_of_week,
        y: item.location_counts,
      }))
    }]

    return (
      <div style={{ width: '90%' }}>
        <ResponsiveLine 
          data={transformedData}
          margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
          xScale={{ type: 'point' }}
          yScale={{
            type: 'linear',
            min: 'auto',
            max: 'auto',
            stacked: true,
            reverse: false
        }}
        />
      </div>
    )
}


const DayofWeekMeanTimeToClearBarChart = ({dataByDate} : {dataByDate: DateDataRow[]}) => {
  const transformedData = [{
    id: 'occurences',
    color: "hsl(60, 70%, 50%)",
    data: dataByDate.map((item) => ({ // expects dynamic keys and values
      x: item.day_of_week,
      //data: item.location_counts,
      y: item.mean_time_to_clear,
    }))
  }]

  return (
    <div style={{ width: '90%' }}>
      <ResponsiveLine 
        data={transformedData}
        margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
        xScale={{ type: 'point' }}
        yScale={{
          type: 'linear',
          min: 'auto',
          max: 'auto',
          stacked: true,
          reverse: false
      }}
      />
    </div>
  )
}