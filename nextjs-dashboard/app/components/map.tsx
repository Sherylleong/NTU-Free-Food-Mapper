'use client';

import React, { useState, useEffect } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import {LocationDataRow, MetadataRow, queryFullOriData, queryFiltersProcessedDataLocationStatistics, queryFiltersProcessedData, queryProcessedData, queryLastUpdateTime, queryFullProcessedData} from '../helpers/db_helper'
import { FiltersType } from "./filters";



export const Map: React.FC<{ filters: FiltersType }> = ( {filters} ) => {
    const [data, setData] = useState<LocationDataRow[]>([]);
    const [selectedMarker, setSelectedMarker] = useState<LocationDataRow | null>(null);
    useEffect(() => {
        const fetchData = async () => {
            try {
                const result = await queryFiltersProcessedDataLocationStatistics(filters);
                setData(result);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        }
        fetchData();
    }, [filters])
 

    const containerStyle = {
        height: '80vh',
        width: '80vw',
    }
    const defaultMapCenter = {  // ntu
        lat: 1.3487,
        lng: 103.6830
    }

    const mapOptions : google.maps.MapOptions = {
        center: defaultMapCenter,
        zoom: 15.5,
        mapId: 'NTUFREEFOOD',
        gestureHandling: 'auto',
    };

    return (
        <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GMAPAPIKEY as string}>
        <GoogleMap
            mapContainerStyle={containerStyle}
            center={defaultMapCenter}
            zoom={3}
            options={mapOptions}
        >
            {/* render markers for each location in the data */}
            {data.map((item, index) => (
            <Marker
                key={index}
                position={{lat: item.latitude, lng: item.longitude}}
                title={item.location}
                onClick={() => setSelectedMarker(item)}
                label={{
                    text: item.location_counts.toString(),  // Display count
                    color: "white",  // Label text color
                    fontSize: "14px", // Label font size
                    fontWeight: "bold", // Label text weight
                }}
            />
            ))}

        </GoogleMap>
        </LoadScript>
    );
}

