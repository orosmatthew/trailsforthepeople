import { useCallback, useRef } from 'react';
import axios from "axios";
import { useQuery, useMutation } from "react-query";
import { Link, useParams } from "react-router-dom";

import { createStyles, Flex, Text, Table, Title, Anchor, Box, Input, TextInput, Checkbox, Button, Group, Accordion, Select } from '@mantine/core';
import { showNotification, updateNotification } from '@mantine/notifications';
import { useForm } from '@mantine/form';
import { RichTextEditor } from '@mantine/rte';
import { DatePicker } from '@mantine/dates';

import { default as dayjs } from 'dayjs';


import * as MapGl from 'react-map-gl'; // Namespace as MapGl since we already have "Marker"
import type { MapRef } from 'react-map-gl';
import type { MarkerDragEvent } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Styling for datepicker weekend days
const useStyles = createStyles((theme) => ({
  weekend: {
    color: `${theme.colors.blue[5]} !important`,
  },
}));

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;
const MAPBOX_STYLE = 'mapbox://styles/cleveland-metroparks/cisvvmgwe00112xlk4jnmrehn';
const MAP_DEFAULT_STATE = {
  latitude: 41.3953,
  longitude: -81.6730,
  zoom: 9
};

type Marker = {
  id: number,
  creator: string,
  created: string,
  lat: number,
  lng: number,
  content: string,
  title: string,
  expires: string,
  creatorid: number,
  geom_geojson: string,
  category: string,
  enabled: number,
  annual: number,
  startdate: string
};
type MarkerFormData = {
  title: string,
  content: string,
  category: string,
  enabled: boolean,
  annual: boolean,
  startDate,
  expireDate,
  latitude: number,
  longitude: number
};

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_MAPS_API_BASE_URL,
  headers: {
    "Content-type": "application/json",
  },
});

//
export function MarkerEdit() {
  const mutation = useMutation((formData: MarkerFormData) => saveMarker(formData));

  const { classes, cx } = useStyles();

  const mapRef = useRef<MapRef>(null);

  // Get marker
  // Moved this into Marker component so we can use [now defunct] setMarker()
  const getMarker = async (id: string) => {
    const response = await apiClient.get<any>("/markers/" + id);

    form.setValues({
      title: response.data.data.title,
      content: response.data.data.content,
      category: response.data.data.category,
      enabled: response.data.data.enabled === 1,
      annual: response.data.data.annual === 1,
      startDate: dayjs(response.data.data.startdate).toDate(),
      expireDate: dayjs(response.data.data.expires).toDate(),
      latitude: response.data.data.lat,
      longitude: response.data.data.lng
    });

    return response.data.data;
  }

  let params = useParams();
  let markerId = params.markerId ? params.markerId.toString() : '';

  const { isLoading, isSuccess, isError, data, error, refetch } = useQuery<Marker, Error>(['marker', params.markerId], () => getMarker(markerId));

  const form = useForm({
    initialValues: {
      title: '',
      content: '',
      category: '',
      enabled: false,
      annual: false,
      startDate: null,
      expireDate: null,
      latitude: null,
      longitude: null
    },
    validate: {
    },
  });

  // Save Marker
  const saveMarker = async (formData) => {
    showNotification({
      id: 'save-marker',
      loading: true,
      title: 'Saving marker',
      message: 'One moment',
      autoClose: false,
      disallowClose: true,
    });
    const response = apiClient.put<any>('/markers/' + markerId, {
      creator: 'Steven Mather', // @TODO
      created: dayjs(),
      lat: formData.latitude,
      lng: formData.longitude,
      content: formData.content,
      title: formData.title,
      expires: dayjs(formData.expireDate).format('YYYY-MM-DD'),
      creatorid: 1, // @TODO
      geom_geojson: '', // @TODO
      category: formData.category,
      enabled: formData.enabled ? 1 : 0,
      annual: formData.annual ? 1 : 0,
      startdate: dayjs(formData.startDate).format('YYYY-MM-DD'),
    })
    .then(function (response) {
      updateNotification({
        id: 'save-marker',
        loading: false,
        title: 'Marker saved successfully.',
        message: '',
        autoClose: 2000,
      });
      console.log("Marker saved:", response);
    })
    .catch(function (error) {
      updateNotification({
        id: 'save-marker',
        loading: false,
        color: 'red',
        title: 'Error saving marker.',
        message: error,
        autoClose: false,
      });
      console.error("Error saving marker:", error);
    });

    return response;
  }

  //--------

  // Marker event: on drag
  const onMarkerDrag = useCallback((event: MarkerDragEvent) => {
    form.setValues({ latitude: event.lngLat.lat, longitude: event.lngLat.lng });
  }, []);

  // Marker event: on drag end
  const onMarkerDragEnd = useCallback((event: MarkerDragEvent) => {
    // Center map on marker location
    mapRef.current?.easeTo({center: [event.lngLat.lng, event.lngLat.lat]});
  }, []);

  //--------

  return (
    <div>
      <Anchor component={Link} to={`/markers`}>« Markers</Anchor>

      {isLoading && <div>Loading...</div>}

      {isError && (
        <div>{`There is a problem fetching the marker - ${error.message}`}</div>
      )}

      {data &&
        <div>
          <h2>{data.title}</h2>

          <form onSubmit={form.onSubmit((formValues) => {
            mutation.mutate(formValues);
          })}>

            <Box sx={{ maxWidth: 800 }}>

              <TextInput
                mt="md"
                required
                label="Title"
                placeholder="Marker title"
                {...form.getInputProps('title')}
              />

              <Input.Wrapper
                label="Content"
                withAsterisk
                sx={{marginTop: '1em'}}
              >
                <RichTextEditor
                  id="rte"
                  {...form.getInputProps('content')}
                  controls={[
                    ['bold', 'strike', 'italic', 'underline'],
                    ['clean'],
                    ['link'],
                    ['blockquote'],
                    ['sup', 'sub'],
                    ['video'],
                    ['unorderedList', 'orderedList'],
                  ]}
                />
              </Input.Wrapper>

              <Box sx={{marginTop: '1em'}}>
                <Select
                  label="Category"
                  data={[
                    { value: 'Events', label: 'Events' },
                    { value: 'Trail Closures and Construction', label: 'Trail Closures and Construction' },
                  ]}
                  {...form.getInputProps('category')}
                />
              </Box>

              <Box sx={{marginTop: '1em'}}>
                <MapGl.Map
                  reuseMaps
                  ref={mapRef}
                  initialViewState={{
                    latitude: data.lat,
                    longitude: data.lng,
                    zoom: MAP_DEFAULT_STATE.zoom
                  }}
                  style={{width: 800, height: 400}}
                  mapStyle={MAPBOX_STYLE}
                  mapboxAccessToken={MAPBOX_TOKEN}
                >
                  <MapGl.Marker
                    longitude={data.lng}
                    latitude={data.lat}
                    anchor="bottom"
                    draggable
                    onDrag={onMarkerDrag}
                    onDragEnd={onMarkerDragEnd}
                  ></MapGl.Marker>
                </MapGl.Map>
              </Box>

              <Flex
                justify="flex-start"
                sx={{margin: '1em 0'}}
              >
                <Input.Wrapper label="Latitude">
                  <Input
                    variant="unstyled"
                    placeholder="Latitude"
                    {...form.getInputProps('latitude')}
                  />
                </Input.Wrapper>
                <Input.Wrapper label="Longitude">
                  <Input
                    variant="unstyled"
                    placeholder="Longitude"
                    {...form.getInputProps('longitude')}
                  />
                </Input.Wrapper>
              </Flex>

              <Accordion>
                <Accordion.Item value="publishing">
                  <Accordion.Control><Text fw={500}>Publishing status</Text></Accordion.Control>
                  <Accordion.Panel>
                    <DatePicker
                      label="Start date"
                      placeholder="Pick start date"
                      firstDayOfWeek="sunday"
                      {...form.getInputProps('startDate')}
                      dayClassName={(date, modifiers) =>
                        cx({
                          [classes.weekend]: modifiers.weekend,
                        })
                      }
                    />
                    <DatePicker
                      label="Expires"
                      placeholder="Pick expiration date"
                      firstDayOfWeek="sunday"
                      {...form.getInputProps('expireDate')}
                      dayClassName={(date, modifiers) =>
                        cx({
                          [classes.weekend]: modifiers.weekend,
                        })
                      }
                      sx={{ margin: '1em 0 2em' }}
                    />

                    <Checkbox
                      mt="md"
                      label="Annual"
                      {...form.getInputProps('annual', { type: 'checkbox' })}
                    />

                    <Checkbox
                      mt="md"
                      label="Enabled"
                      {...form.getInputProps('enabled', { type: 'checkbox' })}
                      sx={{ margin: '1em 0' }}
                    />
                  </Accordion.Panel>
                </Accordion.Item>

                <Accordion.Item value="authorship">
                  <Accordion.Control><Text fw={500}>Authorship</Text></Accordion.Control>
                  <Accordion.Panel>
                    <div>
                      <span><strong>Created:</strong> {dayjs(data.created).format('YYYY-MM-DD HH:mm:ss Z')}</span><br />
                      <span><strong>Created by:</strong> {data.creator} (ID: {data.creatorid})</span>
                    </div>
                    <div>
                      <span><strong>Last edited:</strong></span><br />
                      <span><strong>Last edited by:</strong></span>
                    </div>
                  </Accordion.Panel>
                </Accordion.Item>

              </Accordion>

              <Group position="left" mt="md">
                <Button type="submit" sx={{ margin: '1em 0' }}>Save Marker</Button>
              </Group>

            </Box>

          </form>
        </div>
      }

    </div>
  );
}

//
export function MarkersList() {

  // Get all markers
  const getAllMarkers = async () => {
    const response = await apiClient.get<any>("/markers");
    return response.data.data;
  }

  const { isLoading, isSuccess, isError, data, error, refetch } = useQuery<Marker[], Error>('markers', getAllMarkers);

  return (
    <div>
      <Title order={2}>Markers</Title>
      {isLoading && <div>Loading...</div>}
      {isError && (
        <div>{`There is a problem fetching the post data - ${error.message}`}</div>
      )}
      <Table striped highlightOnHover>
        <thead>
          <tr>
            <th>Title</th>
            <th>Creator</th>
            <th>Date created</th>
            <th>Expires</th>
            <th>Category</th>
            <th>Enabled</th>
            <th>Annual</th>
          </tr>
        </thead>
        <tbody>
          {data &&
            data.map(marker => (
              <tr key={marker.id}>
                <td>
                  <Anchor
                    component={Link}
                    to={`/markers/${marker.id}`}
                    // key={marker.id}
                  >
                    {marker.title}
                  </Anchor>
                </td>
                <td>{marker.creator} ({marker.creatorid})</td>
                <td>{dayjs(marker.created).format('YYYY-MM-DD HH:mm:ss Z')}</td>
                <td>{marker.expires ? dayjs(marker.expires).format('YYYY-MM-DD HH:mm:ss Z') : ''}</td>
                <td>{marker.category}</td>
                <td>{marker.enabled}</td>
                <td>{marker.annual}</td>
              </tr>
            ))}
        </tbody>
      </Table>
    </div>
  );
}