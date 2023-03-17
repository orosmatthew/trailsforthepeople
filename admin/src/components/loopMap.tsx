import { useState, useRef } from 'react';
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { LngLat, LngLatBounds } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { Source, NavigationControl, Layer, LineLayer } from 'react-map-gl';
import * as ReactMapGl from 'react-map-gl'; // For "Map", to avoid collision
import type { MapRef, MapboxEvent, ViewStateChangeEvent, GeoJSONSource } from 'react-map-gl';
import { Text, Button, Group, Box, Flex, Autocomplete } from '@mantine/core';
import DrawControl from './draw-control';

import type { Loop } from "../types/loop";

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;
const MAPBOX_STYLE = 'mapbox://styles/cleveland-metroparks/cisvvmgwe00112xlk4jnmrehn';
const MAP_DEFAULT_STATE = {
  latitude: 41.3953,
  longitude: -81.6730,
  zoom: 9
};

interface LoopMapProps {
  loop: Loop;
  loopGeom: string;
  mapBounds: LngLatBounds;
  waypointsFeature: Object;
  waypointsForDraw: Object;
  onDrawCreate: (e: {features: object[]}) => void;
  onDrawUpdate: (e: {features: object[]; action: string}) => void;
  onDrawDelete: (e: {features: object[]}) => void;
  doCompleteLoop: () => void;
  activeTab: string;
}

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_MAPS_API_BASE_URL,
});

/**
 * Loop Map
 *
 * @param props 
 * @returns 
 */
export function LoopMap(props: LoopMapProps) {
  // if (props.loopGeom == null) {
  //   props.loopGeom = '{"type":"MultiLineString","coordinates":[]}';
  // }
  // console.log('loopGeom', props.loopGeom);
  const mapRef = useRef<MapRef>(null);

  const [currentTab, setCurrentTab] = useState(props.activeTab);

  const [mapViewState, setMapViewState] = useState({
    longitude: MAP_DEFAULT_STATE.longitude,
    latitude: MAP_DEFAULT_STATE.latitude,
    zoom: MAP_DEFAULT_STATE.zoom
  });

  // Park features for the ZoomTo autocomplete field
  const [autocompleteData, setAutocompleteData] = useState([]);
  // Keyed array (Map) of park feature to coordinates
  const [parkFeatureLocations, setParkFeatureLocations] = useState(new Map());
  // Current value of the zoomTo field
  const [zoomToValue, setZoomToValue] = useState('');

  // Map needs repaint to size correctly when user switches tabs,
  // else the map shows up as 400 x 300
  if (currentTab === 'general' && props.activeTab === 'route') {
    // Changed to Route tab in parent; trigger map repaint
    if (mapRef.current) {
      // @TODO: This still doesn't work if we start with the "General" tab
      mapRef.current.triggerRepaint();
      // mapRef.current.resize(); // <-- This actually breaks it
    }
    setCurrentTab('route');
  } else if (currentTab === 'route' && props.activeTab === 'general') {
    setCurrentTab('general');
  }

  /**
   * Populate the zoomTo autocomplete component with CMP features
   */

  // Get Reservations data from the API
  const getReservations = async () => {
    const response = await apiClient.get<any>("/reservations");

    // Get the name, group (type), coordinates, and bounds (if set) of each reservation
    // for the Autocomplete component
    let autocompleteReservations = response.data.data.map(data => {

      // Construct LngLat from coords data, if it exists
      let coords = {};
      if ((data.longitude && data.latitude) &&
       (data.longitude != 0 && data.latitude != 0)) {
        coords = new LngLat(data.longitude, data.latitude);
      }

      // Construct LngLatBounds from bounds data, if it exists
      let bounds = {};
      if ((data.boxw && data.boxs && data.boxe && data.boxn) &&
        (data.boxw != 0 && data.boxs != 0 && data.boxe != 0 && data.boxn != 0)  ) {
        const sw = new LngLat(data.boxw, data.boxs);
        const ne = new LngLat(data.boxe, data.boxn);
        bounds = new LngLatBounds(sw, ne);
      }

      return {
        value: data.pagetitle,
        group: 'Reservation',
        coords: coords,
        bounds: bounds,
      }
    });

    // Keep only unique entries by name (value):
    autocompleteReservations = [...new Map(autocompleteReservations.map((item) => [item.value, item])).values()];
    setAutocompleteData(autocompleteReservations);

    // Make Map array object of locations, keyed by name and storing coords & bounds
    // -- for lookup by autocomplete text
    const locs = new Map(autocompleteReservations.map((item) =>[item.value, {
      coords: item.coords,
      bounds: item.bounds
    }]));
    setParkFeatureLocations(locs);

    return response.data.data;
  } // End getReservations()

  const {
    isLoading: getReservationsCallIsLoading,
    isError: getReservationsCallIsError,
    data: getReservationsCallData,
    error: getReservationsCallError
  } = useQuery<Loop[], Error>(['loops'], getReservations);
  //------------------

  // Zoom map to (a park location)
  const zoomMapTo = (coords: LngLat, bounds: LngLatBounds) => {
    if (Object.keys(bounds).length !== 0) {
      mapRef.current.fitBounds(bounds, { padding: 10 });
    } else {
      if (coords.lng && coords.lat) {
        // Or, flyto coords with default zoom
        const DEFAULT_POI_ZOOM = 15;
        mapRef.current.flyTo({
          center: coords,
          zoom: DEFAULT_POI_ZOOM,
        });
      }
    }
  }

  // Map onMove event
  const onMapMove = (event: ViewStateChangeEvent) => {
    setMapViewState(event.viewState);
  };

  // Map onLoad event
  const onMapLoad = (event: MapboxEvent) => {
    console.log('onMapLoad');
    // @TODO: Not sure why we were doing the following...
    // React is automatically putting props.loopGeom data into the <Source> data.
    // const loopSource = mapRef.current.getSource('loop-data') as GeoJSONSource;
    // loopSource.setData(props.loopGeom);

    // Fit map bounds to loop bounds
    if (mapRef.current) {
      mapRef.current.fitBounds(props.mapBounds, { padding: 40 });
    }
  };

  // Map onRender event
  const onMapRender = (event: MapboxEvent) => {
    // console.log('onMapRender');
  }

  // Map onRender event
  const onMapResize = (event: MapboxEvent) => {
    console.log('onMapResize');
  }

  const loopLayer: LineLayer = {
    id: "loop-line",
    type: "line",
    source: {
      type: "geojson"
    },
    layout: {
      "line-join": "round",
      "line-cap": "round"
    },
    paint: {
      "line-color": "#01B3FD",
      "line-width": 6,
      "line-opacity": 0.75
    }
  };

  return (
    <>
      <ReactMapGl.Map
        // "reuseMaps" bypasses initialization when a map is removed and re-added
        // (switching screens, tabs, etc.) in order to avoid MapBox
        // generating a billable event with every map initialization
        // https://visgl.github.io/react-map-gl/docs/get-started/tips-and-tricks#minimize-cost-from-frequent-re-mounting
        //
        // @TODO:
        // However, it also seems to break the re-loading of the DrawControl
        // when the map is removed and re-rendered.
        // Maybe this is relevant:? https://github.com/visgl/react-map-gl/issues/699
        //
        // reuseMaps={true}

        ref={mapRef}
        {...mapViewState}
        style={{width: "100%", height: 600}}
        mapStyle={MAPBOX_STYLE}
        mapboxAccessToken={MAPBOX_TOKEN}
        onLoad={onMapLoad}
        onMove={onMapMove}
        onRender={onMapRender}
        onResize={onMapResize}
      >
        <Source
          id="loop-data"
          type="geojson"
          data={props.loopGeom ? JSON.parse(props.loopGeom) : {"type":"MultiLineString","coordinates":[]}}
        >
          <Layer {...loopLayer} />
        </Source>
        <NavigationControl
          showCompass={true}
          visualizePitch={true}
        />
        <DrawControl
          position="top-left"
          displayControlsDefault={false}
          controls={{
            line_string: true,
            trash: true
          }}
          initialData={
            props.waypointsFeature
          }
          waypointsGeom={
            props.waypointsForDraw
          }
          // styles={[
            // https://github.com/mapbox/mapbox-gl-draw/blob/main/docs/EXAMPLES.md
            // https://github.com/mapbox/mapbox-gl-draw/blob/main/docs/API.md#styling-draw
            // https://docs.mapbox.com/mapbox-gl-js/style-spec/
          // ]}
          defaultMode="draw_line_string"
          onUpdate={props.onDrawUpdate} // draw.update
          onCreate={props.onDrawCreate} // draw.create
          onDelete={props.onDrawDelete} // draw.delete
        />
      </ReactMapGl.Map>

      <Group
        position="apart"
        mt={10}
        mb={30}
        >
        <Flex
          gap="sm"
          justify="flex-start"
          align="flex-end"
        >
          <Autocomplete
            label="Zoom to location"
            placeholder="CMP feature..."
            data={autocompleteData}
            onChange={setZoomToValue}
          />
          <Button
            variant="light"
            onClick={() => {
              // Get the coordinates of the current value in the autocomplete field
              // const coords = {lng: -81.804, lat: 41.301};
              const parkFeatureLocation = parkFeatureLocations.get(zoomToValue);
              zoomMapTo(parkFeatureLocation.coords, parkFeatureLocation.bounds);
            }}
          >Zoom</Button>
        </Flex>
        <Box>
          <Text size="sm">Complete loop</Text>
          <Button
            variant="light"
            onClick={props.doCompleteLoop}
          >Back to start</Button>
        </Box>
      </Group>
    </>
  );
}
