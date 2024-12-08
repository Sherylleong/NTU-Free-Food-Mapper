
import { queryLastUpdateTime, queryMetadata } from '../../helpers/db_helper';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // Call the query function to fetch the filtered data
    const metadata = await queryMetadata();

    // Return the filtered data as JSON using NextResponse
    return NextResponse.json(metadata ? metadata : {lastUpdateTime: null, total_events: null}, { status: 200 }); // Correct response for success
  } catch (error: any) {
    console.error('Error fetching latest date:', error);
    return NextResponse.json(
      { error: 'Error fetching latest date', details: error.message },
      { status: 500 }
    ); // Correct response for error
  }
}