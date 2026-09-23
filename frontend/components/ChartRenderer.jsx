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

  /*
   * Keep charts compact while ensuring categorical labels are
   * actually rendered instead of being automatically skipped.
   */
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

  /*
   * Dynamic label configuration:
   *
   * - Every categorical label is rendered.
   * - Normal labels use a compact -45 degree angle.
   * - Dense/long labels use a steeper angle and smaller font.
   * - No category names or values are hard-coded.
   */
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

  /*
   * Keep the chart compact like the reference UI.
   * The max width prevents a chart from stretching across the
   * entire conversation area when the page is wide.
   */
  const chartFrameStyle = {
    width: '100%',
    maxWidth: 560,
    height: 360,
    margin: '0 auto',
  }

  if (chart.chart_type === 'pie') {
    return (
      <div className="document-chart">
        <h3>{chart.title}</h3>

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
      </div>
    )
  }

  if (chart.chart_type === 'line') {
    return (
      <div className="document-chart">
        <h3>{chart.title}</h3>

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
      </div>
    )
  }

  if (chart.chart_type === 'scatter') {
    return (
      <div className="document-chart">
        <h3>{chart.title}</h3>

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
      </div>
    )
  }

  return (
    <div className="document-chart">
      <h3>{chart.title}</h3>

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
    </div>
  )
}
