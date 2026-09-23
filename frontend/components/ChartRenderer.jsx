'use client'

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
  if (!chart || !Array.isArray(chart.data)) {
    return null
  }

  const series = Array.isArray(chart.series) ? chart.series : []

  // Keep every categorical X-axis label readable without hard-coding
  // any document-specific values. Numeric X-axes remain unrotated.
  const xValues = chart.chart_type === 'pie'
    ? []
    : chart.data
        .map((row) => row?.[chart.x_key])
        .filter((value) => value !== null && value !== undefined)

  const hasNumericXAxis =
    xValues.length > 0 &&
    xValues.every(
      (value) => typeof value === 'number' && Number.isFinite(value)
    )

  const xLabels = xValues.map((value) => String(value))

  const longestXLabel = xLabels.reduce(
    (max, label) => Math.max(max, label.length),
    0
  )

  const useReadableCategoricalXAxis =
    xLabels.length > 0 && !hasNumericXAxis

  // Give dense/long categorical axes more horizontal room instead
  // of allowing labels to overlap.
  const chartWidth = useReadableCategoricalXAxis
    ? Math.max(
        720,
        xLabels.length * 80,
        longestXLabel * 12
      )
    : '100%'

  const xAxisProps = useReadableCategoricalXAxis
    ? {
        dataKey: chart.x_key,
        interval: 0,
        angle: -45,
        textAnchor: 'end',
        height: 90,
        tickMargin: 12,
        tick: { fontSize: 12 },
      }
    : {
        dataKey: chart.x_key,
        interval: 0,
        tickMargin: 8,
        tick: { fontSize: 12 },
      }

  const chartFrame = (content) => (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <div
        style={{
          width: chartWidth,
          minWidth: '100%',
          height: 420,
        }}
      >
        <ResponsiveContainer>
          {content}
        </ResponsiveContainer>
      </div>
    </div>
  )

  if (chart.chart_type === 'pie') {
    return (
      <div className="document-chart">
        <h3>{chart.title}</h3>

        <div style={{ width: '100%', height: 360 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={chart.data}
                dataKey={chart.value_key}
                nameKey={chart.name_key}
                outerRadius={120}
                label
              >
                {chart.data.map((_, index) => (
                  <Cell key={`cell-${index}`} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    )
  }

  if (chart.chart_type === 'line') {
    return (
      <div className="document-chart">
        <h3>{chart.title}</h3>

        {chartFrame(
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
        )}
      </div>
    )
  }

  if (chart.chart_type === 'scatter') {
    return (
      <div className="document-chart">
        <h3>{chart.title}</h3>

        {chartFrame(
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
        )}
      </div>
    )
  }

  return (
    <div className="document-chart">
      <h3>{chart.title}</h3>

      {chartFrame(
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
      )}
    </div>
  )
}
