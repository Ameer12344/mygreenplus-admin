'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function DropoffTrendChart({
  data,
}: {
  data: { day: string; kg: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="#DDE8DD" />
        <XAxis
          dataKey="day"
          tick={{ fontSize: 11, fill: '#8FAF8F' }}
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
        />
        <Bar dataKey="kg" fill="#2E7D32" radius={[4, 4, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}
