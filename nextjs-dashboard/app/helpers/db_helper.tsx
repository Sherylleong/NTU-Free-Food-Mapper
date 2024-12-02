import sql from 'mssql';

import { NextApiRequest, NextApiResponse } from 'next';  // types for api routes
import {FiltersType} from "../components/filters";
const connectionString = process.env.AZURE_SQL_CONNECTIONSTRING;

// interface for the expected structure of data from the database

export interface LocationDataRow {
  location: string;
  categories: string;
  latitude: number;
  longitude: number;
  location_counts: number;
  mean_time_to_clear: number;
}

export interface CategoryDataRow {
  category: string;
  location_counts: number;
  mean_time_to_clear: number;
}

export interface DateDataRow {
  date: string;
  day_of_week: string,
  location_counts: number;
  mean_time_to_clear: number;
}

export interface TimeDataRow {
  date: Date;
  location_counts: number;
  mean_time_to_clear: number;
}

export interface DataRow {
  [key: string]: any; // Allow any structure depending on the columns
}
export interface LightDataRow {
  msg_first_date: Date;
  location: string;
  time_to_clear: number;
  latitude: number;
  longitude: number;
}

export interface FullProcessedDataRow {
  min_id: number;
  max_id: number;
  msg_first_date: string;
  msg_last_date: string;
  sender: string;
  location: string;
  text: string;
  time_to_clear: number;
}

export interface FullOriDataRow {
  id: number,
  date: string,
  sender: string,
  text: string,
}

export interface MetadataRow {
  max_id: number;
  max_date: Date;
  latest_update_time: Date;
}

function buildFilterQueryString(filters: {
  locations: string[];
  daysOfWeek: string[];
  dateRange: { startDate: string, endDate: string };  // YYYY-MM-DD
  timeRange: { startTime: string, endTime: string };  // HH
  categories: string[];
  timeToClear: { minTime: string, maxTime: string }; // mins
}){
  const locations = filters.locations.map(loc => `'${loc}'`).join(', ');
  const daysOfWeek = filters.daysOfWeek.map(day => `'${day}'`).join(', ');
  const { startDate, endDate } = filters.dateRange;
  const { startTime, endTime } = filters.timeRange;
  const categories = filters.categories.map(cat => `'${cat}'`).join(', ');
  const { minTime, maxTime } = filters.timeToClear;
  let query = `
  SELECT 
    T1.MIN_ID,
    T1.MSG_FIRST_DATE,
    T1.CATEGORIES,
    T1.LOCATION,
    T1.TIME_TO_CLEAR,
    DATEPART(HOUR, T1.MSG_FIRST_DATE) AS EVENT_TIME,
    T2.LATITUDE,
    T2.LONGITUDE,
  FROM
    PROCESSED_DATA T1
  INNER JOIN
    LOCATION_DATA T2
    ON 1=1
      AND PROCESSED_DATA.LOCATION = LOCATION_DATA.LOCATION
  CROSS APPLY STRING_SPLIT(CATEGORIES, ';') AS INDIV_CATEGORY
  WHERE 1=1
    AND LOCATION IN (${locations})
    AND DAYS_OF_WEEK IN (${daysOfWeek})
    AND MIN_DATE BETWEEN '${startDate}' AND '${endDate}
    AND DATEPART BETWEEN '${startTime}' AND '${endTime}
    AND INDIV_CATEGORY.VALUE IN (${categories})
    AND TIME_TO_CLEAR BETWEEN '${minTime}' AND '${maxTime};
  `
  return query;
}

export async function queryFullOriData() {
  if (!connectionString) {
    throw new Error('Connection string is not defined in environment variables');
  }
  try {
    const pool = await sql.connect(connectionString);
    const result = await pool.request().query('SELECT * FROM ORI_DATA');
    // map the results to DataRow format
    const dataRows: FullOriDataRow[] = result.recordset.map((row) => ({
      id: row.id,
      date: row.date,
      sender: row.sender,
      text: row.text,
    }));
    return dataRows;
  }
  catch (err) {
    console.error('Error fetching data from Azure SQL Database:', err);
  }
}

export async function queryProcessedData<T extends DataRow>(query: string): Promise<T[]> {
  if (!connectionString) {
    throw new Error('Connection string is not defined in environment variables');
  }
  
  try {
    const pool = await sql.connect(connectionString);
    const result = await pool.request().query(query);

    // dynamically map the results to a structure based on the column names
    const dataRows: T[] = result.recordset.map((row: any) => {
      const mappedRow: any = {};
      for (const key in row) {
        // Convert specific fields like dates or split strings if needed
        if (key === 'time_of_day') {
          const date = new Date(row[key]);
          const sgtDate = new Intl.DateTimeFormat('en-SG', {
            timeZone: 'Asia/Singapore', // Set time zone to Singapore
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }).format(date);
          const sgtTime = new Intl.DateTimeFormat('en-SG', {
            timeZone: 'Asia/Singapore', // Set time zone to Singapore
            hour: '2-digit', // Ensure 2-digit hour format
            minute: '2-digit', // Ensure 2-digit minute format
            hour12: false, // Use 24-hour format
          }).format(date);
          mappedRow[key] = sgtDate;
          mappedRow['time'] = sgtTime;
          
        } else if (key === 'categories') {
          mappedRow[key] = row[key].split(";");
        } else if (!isNaN(Number(row[key])) && row[key] !== '') {
          mappedRow[key] = row[key];
        }
        else {
          mappedRow[key] = row[key];
        }
      }
      return mappedRow as T; // cast to the expected return type
    });

    console.log('Data from table:', result.recordset);
    pool.close();
    return dataRows;
  } catch (err) {
    console.error('Error fetching data from Azure SQL Database:', err);
    return [];
  }
}
    
export async function queryProcessedDataCopy(query: string) {
  if (!connectionString) {
    throw new Error('Connection string is not defined in environment variables');
  }
  try {
    const pool = await sql.connect(connectionString);
    const result = await pool.request().query(query);

    // map the results to DataRow format
    const dataRows: DataRow[] = result.recordset.map((row) => ({
      min_id: row.min_id,
      max_id: row.max_id,
      msg_first_date: new Date(row.msg_first_date),
      msg_last_date: new Date(row.msg_last_date),
      sender: row.sender,
      location: row.location,
      categories: row.categories.split(";"),
      text: row.text,
      time_to_clear: row.time_to_clear,
      latitude: row.latitude,
      longitude: row.longitude,
    }));

    console.log('Data from table:', result.recordset);
    pool.close();
    return dataRows;
  } catch (err) {
    console.error('Error fetching data from Azure SQL Database:', err);
    return [];
  }
}

export async function queryLastUpdateTime(query: string) {
  if (!connectionString) {
    throw new Error('Connection string is not defined in environment variables');
  }
  try {
    const pool = await sql.connect(connectionString);
    const result = await pool.request().query("SELECT * FROM METADATA");
    const lastUpdateTime = result.recordset[0].latest_update_time;
    console.log('Data from table:', lastUpdateTime);
    pool.close();
    return lastUpdateTime;
  } catch (err) {
    console.error('Error fetching data from Azure SQL Database:', err);
  }
}

export async function queryFiltersProcessedData(filters: {
  locations: string[];
  daysOfWeek: string[];
  dateRange: { startDate: string, endDate: string };  // YYYY-MM-DD
  timeRange: { startTime: string, endTime: string };  // HH
  categories: string[];
  timeToClear: { minTime: string, maxTime: string }; // mins
}) {
  const queryString = buildFilterQueryString(filters);
  return queryProcessedData(queryString);
}

export async function queryFiltersProcessedDataLocationStatistics(filters: FiltersType
) : Promise<LocationDataRow[]> {
  //const locations = filters.locations.map(loc => `'${loc}'`).join(', ');
  const daysOfWeek = filters.daysOfWeek.map(day => `'${day}'`).join(', ');
  const { startDate, endDate } = filters.dateRange;
  const { startTime, endTime } = filters.timeRange;
  const categories = filters.categories.map(cat => `'${cat}'`).join(', ');
  const { minTime, maxTime } = filters.timeToClear;
  let query = `
  SELECT 
    T1.location,
    T1.categories,
    T2.latitude
    T2.longitude,
    COUNT(T1.LOCATION) AS location_counts,
    AVG(TIME_TO_CLEAR) AS mean_time_to_clear
  FROM
    PROCESSED_DATA T1
  INNER JOIN
    LOCATION_DATA T2
    ON 1=1
      AND PROCESSED_DATA.LOCATION = LOCATION_DATA.LOCATION
  CROSS APPLY STRING_SPLIT(CATEGORIES, ';') AS INDIV_CATEGORY
  WHERE 1=1
    AND DATENAME(weekday, MIN_DATE) IN (${daysOfWeek})
    AND MIN_DATE BETWEEN '${startDate}' AND '${endDate}'
    AND CONVERT(TIME, MIN_DATE) BETWEEN '${startTime.toString().padStart(2, '0')}:00:00' AND '${endTime.toString().padStart(2, '0')}:00:00'
    AND INDIV_CATEGORY.VALUE IN (${categories})
    AND TIME_TO_CLEAR BETWEEN '${minTime}' AND '${maxTime};
  GROUP BY LOCATION, T2.LATITUDE, T2.LONGITUDE,T1.CATEGORIES
  `
  return queryProcessedData(query);  
}

export async function queryFiltersProcessedDataDateStatistics(filters: FiltersType
) : Promise<DateDataRow[]> {
  //const locations = filters.locations.map(loc => `'${loc}'`).join(', ');
  const daysOfWeek = filters.daysOfWeek.map(day => `'${day}'`).join(', ');
  const { startDate, endDate } = filters.dateRange;
  const { startTime, endTime } = filters.timeRange;
  const categories = filters.categories.map(cat => `'${cat}'`).join(', ');
  const { minTime, maxTime } = filters.timeToClear;
  let query = `
  SELECT 
    CONVERT(DATE, MIN_DATE) AS date,
    DATENAME(weekday, MIN_DATE) AS day_of_week,
    T1.categories,
    COUNT(T1.LOCATION) AS location_counts,
    AVG(TIME_TO_CLEAR) AS mean_time_to_clear
  FROM
    PROCESSED_DATA T1
  CROSS APPLY STRING_SPLIT(CATEGORIES, ';') AS INDIV_CATEGORY
  WHERE 1=1
    AND DATENAME(weekday, MIN_DATE) IN (${daysOfWeek})
    AND MIN_DATE BETWEEN '${startDate}' AND '${endDate}'
    AND CONVERT(TIME, MIN_DATE) BETWEEN '${startTime.toString().padStart(2, '0')}:00:00' AND '${endTime.toString().padStart(2, '0')}:59:00'
    AND INDIV_CATEGORY.VALUE IN (${categories})
    AND TIME_TO_CLEAR BETWEEN '${minTime}' AND '${maxTime}';
  GROUP BY CONVERT(DATE, MIN_DATE)
  `
  return queryProcessedData(query);  
}

export async function queryFiltersProcessedDataCategoryStatistics(filters: FiltersType
) : Promise<CategoryDataRow[]> {
  //const locations = filters.locations.map(loc => `'${loc}'`).join(', ');
  const daysOfWeek = filters.daysOfWeek.map(day => `'${day}'`).join(', ');
  const { startDate, endDate } = filters.dateRange;
  const { startTime, endTime } = filters.timeRange;
  const categories = filters.categories.map(cat => `'${cat}'`).join(', ');
  const { minTime, maxTime } = filters.timeToClear;
  let query = `
  SELECT 
    INDIV_CATEGORY.VALUE AS category,
    COUNT(T1.LOCATION) AS location_counts,
    AVG(TIME_TO_CLEAR) AS mean_time_to_clear
  FROM
    PROCESSED_DATA T1
  CROSS APPLY
    STRING_SPLIT(CATEGORIES, ';') AS INDIV_CATEGORY
  WHERE 1=1
    AND TIME_OF_DAY IN (${daysOfWeek})
    AND DATENAME(weekday, MIN_DATE) BETWEEN '${startDate}' AND '${endDate}'
    AND CONVERT(TIME, MIN_DATE) BETWEEN '${startTime.toString().padStart(2, '0')}:00:00' AND '${endTime.toString().padStart(2, '0')}:00:00'
    AND INDIV_CATEGORY.VALUE IN (${categories})
    AND TIME_TO_CLEAR BETWEEN '${minTime}' AND '${maxTime}';
  GROUP BY INDIV_CATEGORY.VALUE
  `
  return queryProcessedData(query);  
}

export async function queryFullProcessedData(query: string) {
  return queryProcessedData("SELECT * FROM PROCESSED_DATA")
}
