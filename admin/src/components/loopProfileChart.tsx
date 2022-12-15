import { useState } from 'react';
import axios from "axios";
import { useQuery } from "react-query";
import * as mantineCore from '@mantine/core';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

import type { LoopProfile } from "../types/loop";


ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

//
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_MAPS_API_BASE_URL,
  headers: {
    "Content-type": "application/json",
  },
});

//
export function LoopProfileChart(props: { loopProfile: LoopProfile }) {
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
          display: false,
      },
      responsive: true,
      scales: {
        y: {
            title: {
              display: true,
              text: 'Elevation (feet)',
              color: '#000'
            }
        },
        x: {
          type: 'linear',
          title: {
            display: true,
            text: 'Distance (miles)',
            color: '#000'
          },
          ticks: {
            min: 0,
            precision: 2
          },
        },
      },
      title: {
        display: false,
        text: 'Elevation Profile',
      },
    },
  };

  let chartData = {
    datasets: [
      {
        label: 'Elevation Prfofile',
        data: props.loopProfile,
        pointRadius: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        borderColor: 'rgba(0, 0, 0, 1)',
        borderWidth: 2,
        fill: false
      }
    ],
  };

  return (
    <>
      {props.loopProfile &&
        <>
          <mantineCore.Title order={6}>Elevation Profile</mantineCore.Title>
          <Line
            options={chartOptions}
            data={chartData}
            height={50}
          />
        </>
      }
    </>
  );
}