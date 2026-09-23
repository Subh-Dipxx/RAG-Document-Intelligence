'use client'

import { useState } from 'react'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export default function ChartRenderer({ chart }) {
  const [expanded, setExpanded] = useState(false)

  if (!chart || !Array.isArray(chart.data)) {
    return null
  }

  const series = Array.isArray(chart.series) ? chart.series : []

  const xValues =
    chart.chart_type === 'pie'
      ? []
      : chart.data
          .map((row) => row?.[chart.x_key])
          .filter(
            (value) =>
              value !== null &&
              value !== undefined &&
              String(value).trim() !== ''
          )

  const xLabels = xValues.map((value) => String(value))

  const hasNumericXAxis =
    xValues.length > 0 &&
    xValues.every(
      (value) =>
        typeof value === 'number' &&
        Number.isFinite(value)
    )

  const isCategoricalXAxis =
    xLabels.length > 0 && !hasNumericXAxis

  const longestXLabel = xLabels.reduce(
    (max, label) => Math.max(max, label.length),
    0
  )

  const xAxisProps = isCategoricalXAxis
    ? {
        dataKey: chart.x_key,
        interval: 0,
        angle:
          xLabels.length > 18 || longestXLabel > 18
            ? -60
            : -45,
        textAnchor: 'end',
        height:
          xLabels.length > 18 || longestXLabel > 18
            ? 100
            : 80,
        tickMargin: 8,
        tick: {
          fontSize:
            xLabels.length > 24 || longestXLabel > 24
              ? 9
              : 11,
        },
      }
    : {
        dataKey: chart.x_key,
        tickMargin: 8,
        tick: {
          fontSize: 11,
        },
      }

  const maxWidth = expanded ? 940 : 560

 const chartFrameStyle = {
  width: '100%',
  maxWidth,
  height: 360,
  margin: '0 auto',
  transition: 'width 0.2s ease, max-width 0.2s ease',
}

  const renderChart = () => {
    if (chart.chart_type === 'pie') {
      return (
        <div style={chartFrameStyle}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chart.data}
                dataKey={chart.value_key}
                nameKey={chart.name_key}
                outerRadius={120}
                label={({ name }) => name}
                labelLine
              >
                {chart.data.map((_, index) => (
                  <Cell key={`cell-${index}`} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )
    }

    if (chart.chart_type === 'line') {
      return (
        <div style={chartFrameStyle}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chart.data}>
              <CartesianGrid />
              <XAxis {...xAxisProps} />
              <YAxis />
              <Tooltip />

              {series.map((item) => (
                <Line
                  key={item.data_key}
                  type="monotone"
                  dataKey={item.data_key}
                  name={item.label || item.data_key}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )
    }

    if (chart.chart_type === 'scatter') {
      return (
        <div style={chartFrameStyle}>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart>
              <CartesianGrid />
              <XAxis {...xAxisProps} />
              <YAxis />
              <Tooltip />

              {series.map((item) => (
                <Scatter
                  key={item.data_key}
                  name={item.label || item.data_key}
                  data={chart.data}
                  dataKey={item.data_key}
                />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )
    }

    return (
      <div style={chartFrameStyle}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chart.data}>
            <CartesianGrid />
            <XAxis {...xAxisProps} />
            <YAxis />
            <Tooltip />

            {series.map((item) => (
              <Bar
                key={item.data_key}
                dataKey={item.data_key}
                name={item.label || item.data_key}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  return (
    <div
      className="document-chart"
      style={{
  width: expanded ? 'min(940px, calc(100vw - 80px))' : '100%',
  maxWidth: expanded ? '940px' : '600px',
  margin: '0 auto',
  transition: 'width 0.2s ease, max-width 0.2s ease',
}}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <h3 style={{ margin: 0 }}>{chart.title}</h3>

        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-label={expanded ? 'Collapse chart' : 'Expand chart'}
          title={expanded ? 'Collapse chart' : 'Expand chart'}
          style={{
            width: 30,
            height: 30,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(124, 58, 237, 0.22)',
            borderRadius: 8,
            background: 'transparent',
            color: '#4c1d95',
            cursor: 'pointer',
            padding: 0,
            flexShrink: 0,
          }}
        >
          {expanded ? (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                cx="11"
                cy="11"
                r="6.5"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M16 16L21 21"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          )}
        </button>
      </div>

      {renderChart()}
    </div>
  )
}
