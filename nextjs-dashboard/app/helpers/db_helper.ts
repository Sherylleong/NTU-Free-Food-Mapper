import sql from 'mssql';

import { NextApiRequest, NextApiResponse } from 'next';  // types for api routes

const connectionString: string= process.env.AZURE_SQL_CONNECTIONSTRING!;

// connection pooling
let pool: sql.ConnectionPool | null = null;


// interfaces for the expected structure of data from the database
export interface FiltersType {
  daysOfWeek: string[];
  dateRange: { startDate: string; endDate: string }; // YYYY-MM-DD
  timeRange: { startTime: number; endTime: number }; // HH
  categories: string[];
  availableTimesToClearOnly: boolean;
  timeToClear: { minTime: number; maxTime: number }; 
  locations: string[];
}


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

export interface CategoryMainSubDataRow {
  main_category: string;
  sub_category: string;
  location: string;
  location_counts: number;
}

export interface DateDataRow {
  date: string;
  location_counts: number;
  mean_time_to_clear: number;
}

export interface HourDataRow {
  hour: number;
  location_counts: number;
  mean_time_to_clear: number;
}


export interface DayOfWeekDataRow {
  day_of_week: string;
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


// Function to get or create the connection pool
async function getPool() {
  const retryConnect = async (attempts: number, delay: number): Promise<sql.ConnectionPool> => {
    let lastError: Error | undefined;
    for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
            // attempt to create or reconnect the connection pool
            const newPool = await sql.connect(connectionString);
            console.log('Connected successfully');
            return newPool; // return the pool if connected
        } catch (err) {
            lastError = err as Error;
            console.error(`Attempt ${attempt} failed. Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay)); // wait before retrying
        }
    }
    throw lastError; // If all attempts fail, throw the last error encountered
};
  if (!pool) {
      // Ensure the config is not undefined and properly passed to sql.connect
      pool = await sql.connect(connectionString);
  }

  else if (!pool.connected){
    console.log('Pool is not connected. Reconnecting...');
    pool = await retryConnect(5, 50);
  }
  return pool;
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
  try {
    const pool = await getPool();
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
          
        } else if (key === 'date') {
          const formattedDate = new Date(row[key]).toISOString().split('T')[0];
          mappedRow[key] = formattedDate;
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

    pool.close();
    return dataRows;
  } catch (err) {
    console.error('Error fetching data from Azure SQL Database:', err);
    return [];
  }
}


export async function queryLastUpdateTime() {
  if (!connectionString) {
    throw new Error('Connection string is not defined in environment variables');
  }
  try {
    const pool = await sql.connect(connectionString);
    const result = await pool.request().query("SELECT * FROM METADATA");
    const lastUpdateTime = result.recordset[0].latest_update_time;
    pool.close();
    return lastUpdateTime;
  } catch (err) {
    console.error('Error fetching data from Azure SQL Database:', err);
  }
}

export async function queryMetadata() {
  try {
    const pool = await sql.connect(connectionString);
    const result = await pool.request().query("SELECT * FROM METADATA");
    const lastUpdateTime = result.recordset[0].latest_update_time;
    const total_events = result.recordset[0].total_events;
    pool.close();
    return {lastUpdateTime: lastUpdateTime, total_events: total_events};
  } catch (err) {
    console.error('Error fetching data from Azure SQL Database:', err);
  }
}

export async function queryFiltersProcessedDataTotalCount(filters: FiltersType
) : Promise<DataRow[]> {
  const locations = filters.locations.map(loc => `'${loc}'`).join(', ');
  const daysOfWeek = filters.daysOfWeek.map(day => `'${day}'`).join(', ');
  const { startDate, endDate } = filters.dateRange;
  let { startTime, endTime } = filters.timeRange;
  endTime = endTime > 0 ? endTime - 1 : 0;
  const categories = filters.categories.map(cat => `'${cat}'`).join(', ');
  const { minTime, maxTime } = filters.timeToClear;
  const availableTimesToClearOnly = filters.availableTimesToClearOnly ? 0 : 1;
  let query = `
  SELECT
    COUNT(LOCATION) AS location_counts
  FROM
    PROCESSED_DATA
  WHERE 1=1
    AND MIN_DATE BETWEEN '${startDate}' AND '${endDate}'
    AND DATEPART(HOUR, SWITCHOFFSET(MIN_DATE, '+08:00')) BETWEEN ${startTime} AND ${endTime}
    AND (1=${availableTimesToClearOnly} OR TIME_TO_CLEAR BETWEEN ${minTime} AND ${maxTime})
  `
  if (daysOfWeek.length > 0) query += ` AND DATENAME(weekday, MIN_DATE) IN (${daysOfWeek})`; else query +=` AND 1=0`;
  if (categories.length > 0) query += ` AND (main_category IN (${categories}) OR  sub_category IN (${categories}))`; else query +=` AND 1=0`;
  if (locations.length > 0) query += ` AND LOCATION IN (${locations})`
  return queryProcessedData(query);  
}

export async function queryFiltersProcessedDataLocationStatistics(filters: FiltersType
) : Promise<LocationDataRow[]> {
  // const locations = filters.locations.map(loc => `'${loc}'`).join(', ');
  const daysOfWeek = filters.daysOfWeek.map(day => `'${day}'`).join(', ');
  const { startDate, endDate } = filters.dateRange;
  let { startTime, endTime } = filters.timeRange;
  endTime = endTime > 0 ? endTime - 1 : 0;
  const categories = filters.categories.map(cat => `'${cat}'`).join(', ');
  const { minTime, maxTime } = filters.timeToClear;
  const availableTimesToClearOnly = filters.availableTimesToClearOnly ? 0 : 1;
  let query = `
  SELECT
    T1.location AS location,
    T2.latitude AS latitude,
    T2.longitude AS longitude,
    T1.location_counts AS location_counts,
    T1.mean_time_to_clear AS mean_time_to_clear
  FROM
    (
      SELECT LOCATION, COUNT(LOCATION) AS location_counts, AVG(TIME_TO_CLEAR) AS mean_time_to_clear
      FROM PROCESSED_DATA
      WHERE 1=1
        AND MIN_DATE BETWEEN '${startDate}' AND '${endDate}'
        AND DATEPART(HOUR, SWITCHOFFSET(MIN_DATE, '+08:00')) BETWEEN ${startTime} AND ${endTime}
        AND (1=${availableTimesToClearOnly} OR TIME_TO_CLEAR BETWEEN ${minTime} AND ${maxTime})
  `
  if (daysOfWeek.length > 0) query += ` AND DATENAME(weekday, MIN_DATE) IN (${daysOfWeek})`; else query +=` AND 1=0`;
  if (categories.length > 0) query += ` AND (main_category IN (${categories}) OR  sub_category IN (${categories}))`; else query +=` AND 1=0`;
  query += `       
      GROUP BY LOCATION
    ) T1
  INNER JOIN
    LOCATION_DATA T2
  ON
    T1.LOCATION = T2.LOCATION;`;
  return queryProcessedData(query);  
}

export async function queryFiltersProcessedDataDateStatistics(filters: FiltersType
) : Promise<DateDataRow[]> {
  const locations = filters.locations.map(loc => `'${loc}'`).join(', ');
  const daysOfWeek = filters.daysOfWeek.map(day => `'${day}'`).join(', ');
  const { startDate, endDate } = filters.dateRange;
  let { startTime, endTime } = filters.timeRange;
  endTime = endTime > 0 ? endTime - 1 : 0;
  const categories = filters.categories.map(cat => `'${cat}'`).join(', ');
  const { minTime, maxTime } = filters.timeToClear;
  const availableTimesToClearOnly = filters.availableTimesToClearOnly ? 0 : 1;
  let query = `
  SELECT 
    CONVERT(DATE, MIN_DATE) AS date,
    COUNT(LOCATION) AS location_counts,
    AVG(TIME_TO_CLEAR) AS mean_time_to_clear
  FROM
    PROCESSED_DATA
  WHERE 1=1
    AND MIN_DATE BETWEEN '${startDate}' AND '${endDate}'
    AND DATEPART(HOUR, SWITCHOFFSET(MIN_DATE, '+08:00')) BETWEEN ${startTime} AND ${endTime}
    AND (1=${availableTimesToClearOnly} OR TIME_TO_CLEAR BETWEEN ${minTime} AND ${maxTime})
  `
  if (daysOfWeek.length > 0) query += ` AND DATENAME(weekday, MIN_DATE) IN (${daysOfWeek})`; else query +=` AND 1=0`;
  if (categories.length > 0) query += ` AND (main_category IN (${categories}) OR  sub_category IN (${categories}))`; else query +=` AND 1=0`;
  if (locations.length > 0) query += ` AND LOCATION IN (${locations})`;
  query += ` GROUP BY CONVERT(DATE, MIN_DATE);`
  return queryProcessedData(query);  
}

export async function queryFiltersProcessedDataDayOfWeekStatistics(filters: FiltersType
) : Promise<DayOfWeekDataRow[]> {
  const locations = filters.locations.map(loc => `'${loc}'`).join(', ');
  const daysOfWeek = filters.daysOfWeek.map(day => `'${day}'`).join(', ');
  const { startDate, endDate } = filters.dateRange;
  let { startTime, endTime } = filters.timeRange;
  endTime = endTime > 0 ? endTime - 1 : 0;
  const categories = filters.categories.map(cat => `'${cat}'`).join(', ');
  const { minTime, maxTime } = filters.timeToClear;
  const availableTimesToClearOnly = filters.availableTimesToClearOnly ? 0 : 1;
  let query = `
  SELECT 
    DATENAME(weekday, MIN_DATE) AS day_of_week,
    COUNT(LOCATION) AS location_counts,
    AVG(TIME_TO_CLEAR) AS mean_time_to_clear
  FROM
    PROCESSED_DATA
  WHERE 1=1
    AND MIN_DATE BETWEEN '${startDate}' AND '${endDate}'
    AND DATEPART(HOUR, SWITCHOFFSET(MIN_DATE, '+08:00')) BETWEEN ${startTime} AND ${endTime}
    AND (1=${availableTimesToClearOnly} OR TIME_TO_CLEAR BETWEEN ${minTime} AND ${maxTime})
  `
  if (daysOfWeek.length > 0) query += ` AND DATENAME(weekday, MIN_DATE) IN (${daysOfWeek})`; else query +=` AND 1=0`;
  if (categories.length > 0) query += ` AND (main_category IN (${categories}) OR  sub_category IN (${categories}))`; else query +=` AND 1=0`;
  if (locations.length > 0) query += ` AND LOCATION IN (${locations})`;
  query += `
    GROUP BY DATENAME(weekday, MIN_DATE)
  ORDER BY
    CASE DATENAME(weekday, MIN_DATE)
        WHEN 'Monday' THEN 1
        WHEN 'Tuesday' THEN 2
        WHEN 'Wednesday' THEN 3
        WHEN 'Thursday' THEN 4
        WHEN 'Friday' THEN 5
        WHEN 'Saturday' THEN 6
        WHEN 'Sunday' THEN 7
    END;
  `
  return queryProcessedData(query);  
}

export async function queryFiltersProcessedDataCategoryStatistics(filters: FiltersType
) : Promise<CategoryDataRow[]> {
  const locations = filters.locations.map(loc => `'${loc}'`).join(', ');
  const daysOfWeek = filters.daysOfWeek.map(day => `'${day}'`).join(', ');
  const { startDate, endDate } = filters.dateRange;
  let { startTime, endTime } = filters.timeRange;
  endTime = endTime > 0 ? endTime - 1 : 0;
  const categories = filters.categories.map(cat => `'${cat}'`).join(', ');
  const { minTime, maxTime } = filters.timeToClear;
  const availableTimesToClearOnly = filters.availableTimesToClearOnly ? 0 : 1;
  let query = `
    SELECT 
    INDIV_CATEGORY.VALUE AS category,
    COUNT(LOCATION) AS location_counts,
    AVG(TIME_TO_CLEAR) AS mean_time_to_clear
  FROM
    PROCESSED_DATA T1
  CROSS APPLY
    STRING_SPLIT(CATEGORIES, ';') AS INDIV_CATEGORY
  WHERE 1=1
    AND MIN_DATE BETWEEN '${startDate}' AND '${endDate}'
    AND DATEPART(HOUR, SWITCHOFFSET(MIN_DATE, '+08:00')) BETWEEN ${startTime} AND ${endTime}
    AND (1=${availableTimesToClearOnly} OR TIME_TO_CLEAR BETWEEN ${minTime} AND ${maxTime})
  `
  if (daysOfWeek.length > 0) query += ` AND DATENAME(weekday, MIN_DATE) IN (${daysOfWeek})`; else query +=` AND 1=0`;
  if (categories.length > 0) query += ` AND INDIV_CATEGORY.VALUE IN (${categories})`; else query +=` AND 1=0`;
  if (locations.length > 0) query += ` AND LOCATION IN (${locations})`;
  query += ` GROUP BY INDIV_CATEGORY.VALUE;`;
  return queryProcessedData(query);  
}

export async function queryFiltersProcessedDataCategoryMainSubStatistics(filters: FiltersType
) : Promise<CategoryMainSubDataRow[]> {
  const locations = filters.locations.map(loc => `'${loc}'`).join(', ');
  const daysOfWeek = filters.daysOfWeek.map(day => `'${day}'`).join(', ');
  const { startDate, endDate } = filters.dateRange;
  let { startTime, endTime } = filters.timeRange;
  endTime = endTime > 0 ? endTime - 1 : 0;
  const categories = filters.categories.map(cat => `'${cat}'`).join(', ');
  const { minTime, maxTime } = filters.timeToClear;
  const availableTimesToClearOnly = filters.availableTimesToClearOnly ? 0 : 1;
  let query = `
  SELECT 
    main_category,
    sub_category,
    location,
    COUNT(T1.LOCATION) AS location_counts
  FROM
    PROCESSED_DATA T1
  WHERE 1=1
    AND MIN_DATE BETWEEN '${startDate}' AND '${endDate}'
    AND DATEPART(HOUR, SWITCHOFFSET(MIN_DATE, '+08:00')) BETWEEN ${startTime} AND ${endTime}
    AND (1=${availableTimesToClearOnly} OR TIME_TO_CLEAR BETWEEN ${minTime} AND ${maxTime})
  `
  if (daysOfWeek.length > 0) query += ` AND DATENAME(weekday, MIN_DATE) IN (${daysOfWeek})`; else query +=` AND 1=0`;
  if (categories.length > 0) query += ` AND (main_category IN (${categories}) OR  sub_category IN (${categories}))`; else query +=` AND 1=0`;
  if (locations.length > 0) query += ` AND LOCATION IN (${locations})`;
  query += ` GROUP BY main_category, sub_category, T1.LOCATION;`;
  return queryProcessedData(query);  
}

export async function queryFullProcessedData(query: string) {
  return queryProcessedData("SELECT * FROM PROCESSED_DATA")
}

export async function queryFiltersProcessedDataHourStatistics(filters: FiltersType
) : Promise<HourDataRow[]> {
  const locations = filters.locations.map(loc => `'${loc}'`).join(', ');
  const daysOfWeek = filters.daysOfWeek.map(day => `'${day}'`).join(', ');
  const { startDate, endDate } = filters.dateRange;
  let { startTime, endTime } = filters.timeRange;
  endTime = endTime > 0 ? endTime - 1 : 0;
  const categories = filters.categories.map(cat => `'${cat}'`).join(', ');
  const { minTime, maxTime } = filters.timeToClear;
  const availableTimesToClearOnly = filters.availableTimesToClearOnly ? 0 : 1;
  let query = `
  SELECT 
    DATEPART(HOUR, SWITCHOFFSET(MIN_DATE, '+08:00')) AS hour,
    COUNT(LOCATION) AS location_counts,
    AVG(TIME_TO_CLEAR) AS mean_time_to_clear
  FROM
    PROCESSED_DATA
  WHERE 1=1
    AND MIN_DATE BETWEEN '${startDate}' AND '${endDate}'
    AND DATEPART(HOUR, SWITCHOFFSET(MIN_DATE, '+08:00')) BETWEEN ${startTime} AND ${endTime}
    AND (1=${availableTimesToClearOnly} OR TIME_TO_CLEAR BETWEEN ${minTime} AND ${maxTime})
  `
  if (daysOfWeek.length > 0) query += ` AND DATENAME(weekday, MIN_DATE) IN (${daysOfWeek})`; else query +=` AND 1=0`;
  if (categories.length > 0) query += ` AND (main_category IN (${categories}) OR  sub_category IN (${categories}))`; else query +=` AND 1=0`;
  if (locations.length > 0) query += ` AND LOCATION IN (${locations}) `;
  query += `
    GROUP BY DATEPART(HOUR, SWITCHOFFSET(MIN_DATE, '+08:00'))
    ORDER BY DATEPART(HOUR, SWITCHOFFSET(MIN_DATE, '+08:00')) ASC
  `
  console.log(query);
  return queryProcessedData(query);  
}
