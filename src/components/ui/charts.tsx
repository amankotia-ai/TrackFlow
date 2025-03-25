import React from 'react';
import * as RechartsPrimitive from "recharts";
import { ChartContainer } from './chart';

// Modern color palette
const CHART_COLORS = {
  primary: '#2563eb', // Blue
  secondary: '#16a34a', // Green
  accent1: '#9333ea', // Purple
  accent2: '#ea580c', // Orange
  accent3: '#dc2626', // Red
  muted: '#94a3b8', // Slate
};

// Shared chart styles
const gridStyle = {
  strokeDasharray: '3 3',
  stroke: '#e2e8f0',
};

const axisStyle = {
  stroke: 'none',
  fontSize: 12,
  fontWeight: 500,
  tickLine: false,
};

const tooltipStyle = {
  contentStyle: {
    background: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    padding: '12px',
  },
  itemStyle: {
    color: '#1e293b',
    fontSize: 12,
    fontWeight: 500,
  },
};

// ComboChart component - combines bar and line chart
export const ComboChart: React.FC<{
  data: any;
  xAxisKey: string;
  barKey: string;
  lineKey: string;
  barName?: string;
  lineName?: string;
}> = ({ data, xAxisKey, barKey, lineKey, barName = "Value", lineName = "Trend" }) => {
  // Check for empty or invalid data
  if (!data) {
    return <div className="flex items-center justify-center h-full text-muted-foreground">No data available</div>;
  }
  
  // For dashboard data, check if we need to use the visitsByDate property
  let chartData = Array.isArray(data) ? data : data.overview?.visitsByDate || [];
  
  if (chartData.length === 0) {
    return <div className="flex items-center justify-center h-full text-muted-foreground">No data available</div>;
  }
  
  return (
    <ChartContainer config={{}}>
      <RechartsPrimitive.ComposedChart 
        data={chartData} 
        margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
      >
        <RechartsPrimitive.CartesianGrid {...gridStyle} vertical={false} strokeDasharray="3 3" />
        <RechartsPrimitive.XAxis 
          dataKey={xAxisKey} 
          {...axisStyle}
          axisLine={{ stroke: '#e2e8f0' }}
          scale="point"
          tickMargin={10}
          tick={{ fontSize: 12 }}
        />
        <RechartsPrimitive.YAxis 
          {...axisStyle}
          axisLine={false}
          yAxisId="left"
          tickMargin={10}
          tick={{ fontSize: 12 }}
        />
        <RechartsPrimitive.YAxis 
          {...axisStyle}
          axisLine={false}
          yAxisId="right"
          orientation="right"
          stroke={CHART_COLORS.muted}
          display="none" // Hide the right axis
        />
        <RechartsPrimitive.Tooltip {...tooltipStyle} />
        <RechartsPrimitive.Legend wrapperStyle={{ paddingTop: '10px' }} />
        <RechartsPrimitive.Bar
          name={barName}
          dataKey="count" // Default to count - this works with visitsByDate
          yAxisId="left"
          fill={CHART_COLORS.primary}
          radius={[2, 2, 0, 0]}
          maxBarSize={30}
          animationDuration={1500}
          animationEasing="ease-out"
        />
        <RechartsPrimitive.Line
          name={lineName}
          type="monotone"
          dataKey="trend" // Default to trend - this works with visitsByDate
          yAxisId="right"
          stroke="#aaaaff"
          strokeWidth={2}
          strokeDasharray="3 0"
          dot={false}
          activeDot={{ r: 6, strokeWidth: 0 }}
          animationDuration={1500}
          animationEasing="ease-out"
        />
      </RechartsPrimitive.ComposedChart>
    </ChartContainer>
  );
};

// LineChart component
export const LineChart: React.FC<{
  data: any[];
  xAxisKey: string;
  yAxisKey: string;
  categories: string[];
}> = ({ data, xAxisKey, yAxisKey, categories }) => {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-full text-muted-foreground">No data available</div>;
  }
  
  return (
    <ChartContainer config={{}}>
      <RechartsPrimitive.LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
        <RechartsPrimitive.CartesianGrid {...gridStyle} strokeDasharray="3 3" />
        <RechartsPrimitive.XAxis 
          dataKey={xAxisKey} 
          {...axisStyle}
          axisLine={{ stroke: '#e2e8f0' }}
          tickMargin={10}
        />
        <RechartsPrimitive.YAxis 
          {...axisStyle}
          axisLine={false}
          tickMargin={10}
        />
        <RechartsPrimitive.Tooltip {...tooltipStyle} />
        <RechartsPrimitive.Legend wrapperStyle={{ paddingTop: '10px' }} />
        {categories.map((category, index) => (
          <RechartsPrimitive.Line
            key={category}
            type="monotone"
            dataKey={yAxisKey}
            stroke={Object.values(CHART_COLORS)[index % Object.keys(CHART_COLORS).length]}
            strokeWidth={2}
            dot={{ fill: '#ffffff', strokeWidth: 2 }}
            activeDot={{ r: 6, strokeWidth: 0 }}
            animationDuration={1500}
            animationEasing="ease-out"
          />
        ))}
      </RechartsPrimitive.LineChart>
    </ChartContainer>
  );
};

// BarChart component
export const BarChart: React.FC<{
  data: any[];
  xAxisKey: string;
  yAxisKey: string;
  categories: string[];
}> = ({ data, xAxisKey, yAxisKey, categories }) => {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-full text-muted-foreground">No data available</div>;
  }
  
  return (
    <ChartContainer config={{}}>
      <RechartsPrimitive.BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
        <RechartsPrimitive.CartesianGrid {...gridStyle} vertical={false} strokeDasharray="3 3" />
        <RechartsPrimitive.XAxis 
          dataKey={xAxisKey} 
          {...axisStyle}
          axisLine={{ stroke: '#e2e8f0' }}
          tickMargin={10}
        />
        <RechartsPrimitive.YAxis 
          {...axisStyle}
          axisLine={false}
          tickMargin={10}
        />
        <RechartsPrimitive.Tooltip {...tooltipStyle} />
        <RechartsPrimitive.Legend wrapperStyle={{ paddingTop: '10px' }} />
        {categories.map((category, index) => (
          <RechartsPrimitive.Bar
            key={category}
            dataKey={yAxisKey}
            fill={Object.values(CHART_COLORS)[index % Object.keys(CHART_COLORS).length]}
            radius={[4, 4, 0, 0]}
            maxBarSize={50}
            animationDuration={1500}
            animationEasing="ease-out"
          />
        ))}
      </RechartsPrimitive.BarChart>
    </ChartContainer>
  );
};

// PieChart component
export const PieChart: React.FC<{
  data: any[];
  nameKey: string;
  dataKey: string;
}> = ({ data, nameKey, dataKey }) => {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-full text-muted-foreground">No data available</div>;
  }
  
  return (
    <ChartContainer config={{}}>
      <RechartsPrimitive.PieChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
        <RechartsPrimitive.Pie
          data={data}
          nameKey={nameKey}
          dataKey={dataKey}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          paddingAngle={2}
          animationDuration={1500}
          animationEasing="ease-out"
        >
          {data.map((entry, index) => (
            <RechartsPrimitive.Cell
              key={`cell-${index}`}
              fill={Object.values(CHART_COLORS)[index % Object.keys(CHART_COLORS).length]}
              stroke="none"
            />
          ))}
        </RechartsPrimitive.Pie>
        <RechartsPrimitive.Tooltip 
          {...tooltipStyle}
          formatter={(value: any) => [value, nameKey]}
        />
        <RechartsPrimitive.Legend 
          verticalAlign="middle" 
          align="right"
          layout="vertical"
          iconType="circle"
          wrapperStyle={{
            paddingLeft: '20px',
            fontSize: '12px',
            fontWeight: 500,
          }}
        />
      </RechartsPrimitive.PieChart>
    </ChartContainer>
  );
}; 