'use client';

import React, { useEffect, useRef } from 'react'
import { GoogleMap } from "@react-google-maps/api";
import { Libraries, useJsApiLoader } from '@react-google-maps/api';
import { Loader } from "@googlemaps/js-api-loader";

// Define a list of libraries to load from the Google Maps API
const libraries = ['places', 'drawing', 'geometry'];


export function Map() {
    const mapRef = useRef<HTMLDivElement>(null);
    useEffect (() => {
        const initMap = async () => {
            const loader = new Loader({
                apiKey: process.env.NEXT_PUBLIC_GMAPAPIKEY as string,
            });

            const { Map } = await loader.importLibrary('maps')

            const defaultMapCenter = {
                lat: 1.3487,
                lng: 103.6830
            }

            const mapOptions : google.maps.MapOptions = {
                center: defaultMapCenter,
                zoom: 16,
                mapId: 'NTUFREEFOOD_MAPID',
                gestureHandling: 'auto',
            };

            // setup map
            const map = new Map(mapRef.current as HTMLDivElement, mapOptions)
        }
        
        initMap();
    }, [])

    const mapSize = {
        height: 700,
        width: 1500,
    }
  return (
    <div id='map' style={mapSize} ref={mapRef}/>
  )
}

export default Map