'use client';

import React, { useState, useEffect } from 'react';
import { GoogleMap, LoadScript, Marker,  InfoWindow, Data } from '@react-google-maps/api';
import {LocationDataRow, MetadataRow, queryFullOriData, queryFiltersProcessedDataLocationStatistics, queryProcessedData, queryLastUpdateTime, queryFullProcessedData} from '../helpers/db_helper'
import {FiltersType} from "../helpers/db_helper";
import { MarkerClusterer } from "@googlemaps/markerclusterer";


export const Map: React.FC<{ filters: FiltersType,  setFilters: React.Dispatch<React.SetStateAction<FiltersType>>}> = ( {filters, setFilters}) => {
    const [data, setData] = useState<LocationDataRow[]>([]);
    const [selectedMarkers, setSelectedMarkers] = useState<string[]>([]);
    const fetchData = async () => {
        try {
          const res = await fetch('/api/dataLocationStatistics', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(filters),
          });
    
          if (res.ok) {
            const data: LocationDataRow[] = await res.json();
            setData(data);
            console.log(data)
          } else {
            const errorData = await res.json();
            console.error('Error fetching location statistics', errorData);
          }
        } catch (error) {
          console.error('Error:', error);
        }
      };
    useEffect(() => {
        fetchData();
        
    }, [filters])
 
    const handleMarkerClick = (item: string) => {
      setSelectedMarkers(prevState => ([...prevState, item]));
      console.log(selectedMarkers)
      // setFilters(prevFilters => ({ ...prevFilters, location: selectedMarkers }));
    };

    const containerStyle = {
        height: '80vh',
        width: '90vw',
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
      <div className='mb-10'>
        <h1 className="text-3xl font-semibold text-center mt-16 mb-5">Bird's Eye View of Free Food Events in NTU</h1>
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
                title={`${item.location}: ${item.location_counts}`}
                onClick={() => handleMarkerClick(item.location)}
                label={{
                    text: item.location_counts.toString(),  // Display count
                    color: "white", 
                    fontSize: "14px", 
                }}
            />
            ))}

        </GoogleMap>
        </LoadScript>
      </div>
    );
}

