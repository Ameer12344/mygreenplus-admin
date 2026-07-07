'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

type TrendPoint = { day: string; kg: number; isToday?: boolean };

const GREEN = '#2E7D32';

export default function DropoffTrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="#DDE8DD" />
        <XAxis
          dataKey="day"
          tick={(props) => <TodayAwareTick {...props} data={data} />}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#8FAF8F' }}
          axisLine={false}
          tickLine={false}
          width={36}
        />
        <Tooltip
          cursor={{ fill: 'rgba(27, 94, 32, 0.06)' }}
          contentStyle={{
            borderRadius: 10,
            border: '1px solid #DDE8DD',
            fontSize: 12,
          }}
          formatter={(value: number) => [`${value.toFixed(1)} kg`, 'Recycled']}
          labelFormatter={(label: string, payload) => {
            const point = payload?.[0]?.payload as TrendPoint | undefined;
            return point?.isToday ? `Today · ${label}` : label;
          }}
        />
        <Bar dataKey="kg" fill={GREEN} radius={[4, 4, 0, 0]} maxBarSize={28}>
          {data.map((entry, index) => (
            <Cell key={index} fill={GREEN} fillOpacity={entry.isToday ? 1 : 0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// Renders the x-axis label, bolding today's date to stand out —
// same green as the rest of the chart.
function TodayAwareTick(props: any) {
  const { x, y, payload, data } = props;
  const point = (data as TrendPoint[])[payload.index];
  const isToday = point?.isToday;

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={12}
        textAnchor="middle"
        fontSize={11}
        fill={isToday ? GREEN : '#8FAF8F'}
        fontWeight={isToday ? 700 : 400}
      >
        {payload.value}
      </text>
    </g>
  );
}
