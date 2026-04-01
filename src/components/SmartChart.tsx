'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  LabelList,
} from 'recharts';
import { Trash2 } from 'lucide-react';

interface SeriesConfig {
  key: string;
  name: string;
  color: string;
}

interface ChartConfig {
  type: 'bar' | 'line' | 'area' | 'pie';
  data: any[];
  xAxis?: string;
  yAxis?: string;
  series: SeriesConfig[];
  title: string;
  showLabels?: boolean;
}

interface SmartChartProps {
  config: ChartConfig;
  isSelected?: boolean;
  onSelect?: () => void;
  onDelete?: () => void;
}

const COLORS = ['#2563eb', '#6366f1', '#4f46e5', '#4338ca', '#3730a3', '#312e81'];

const formatValue = (val: any) => {
  if (typeof val === 'number') {
    return val.toLocaleString();
  }
  return val;
};

export default function SmartChart({ config, isSelected, onSelect, onDelete }: SmartChartProps) {
  const { type, data, xAxis, series = [], title, showLabels = true } = config;

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-slate-50 border border-dashed rounded-3xl text-slate-400 text-xs font-bold uppercase tracking-widest">
        No Data to Visualize
      </div>
    );
  }

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey={xAxis} 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} 
            />
            <Tooltip 
              contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', padding: '12px' }}
              formatter={(value: any) => [formatValue(value), '']}
            />
            <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
            {series.map((s, i) => (
              <Bar 
                key={`${s.key}-${i}`} 
                dataKey={s.key} 
                name={s.name} 
                fill={s.color || COLORS[i % COLORS.length]} 
                radius={[4, 4, 0, 0]} 
                barSize={32}
              >
                {showLabels && (
                  <LabelList 
                    dataKey={s.key} 
                    position="top" 
                    formatter={formatValue}
                    style={{ fontSize: 10, fontWeight: 700, fill: '#334155' }}
                    offset={10}
                  />
                )}
              </Bar>
            ))}
          </BarChart>
        );

      case 'line':
        return (
          <LineChart data={data} margin={{ top: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey={xAxis} axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
            <Tooltip 
              contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
              formatter={(value: any) => [formatValue(value), '']}
            />
            <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 'bold' }} />
            {series.map((s, i) => (
              <Line 
                key={`${s.key}-${i}`} 
                type="monotone" 
                dataKey={s.key} 
                name={s.name} 
                stroke={s.color || COLORS[i % COLORS.length]} 
                strokeWidth={3} 
                dot={{ r: 4, strokeWidth: 0, fill: s.color || COLORS[i % COLORS.length] }} 
                activeDot={{ r: 6, strokeWidth: 0 }}
              >
                {showLabels && (
                  <LabelList 
                    dataKey={s.key} 
                    position="top" 
                    formatter={formatValue}
                    style={{ fontSize: 10, fontWeight: 700, fill: '#334155' }}
                    offset={12}
                  />
                )}
              </Line>
            ))}
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart data={data} margin={{ top: 20 }}>
            <defs>
              {series.map((s, i) => (
                <linearGradient key={`grad-${s.key}-${i}`} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={s.color || COLORS[i % COLORS.length]} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={s.color || COLORS[i % COLORS.length]} stopOpacity={0}/>
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey={xAxis} axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
            <Tooltip 
              contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
              formatter={(value: any) => [formatValue(value), '']}
            />
            <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 'bold' }} />
            {series.map((s, i) => (
              <Area 
                key={`${s.key}-${i}`} 
                type="monotone" 
                dataKey={s.key} 
                name={s.name} 
                stroke={s.color || COLORS[i % COLORS.length]} 
                fillOpacity={1} 
                fill={`url(#grad-${s.key})`} 
                strokeWidth={3}
              >
                {showLabels && (
                  <LabelList 
                    dataKey={s.key} 
                    position="top" 
                    formatter={formatValue}
                    style={{ fontSize: 10, fontWeight: 700, fill: '#334155' }}
                    offset={12}
                  />
                )}
              </Area>
            ))}
          </AreaChart>
        );

      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey={series[0]?.key || 'value'}
              nameKey={xAxis || 'name'}
              label={({ name, percent, value }) => `${name}\n(${formatValue(value)})`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
              formatter={(val: any) => [formatValue(val), '']}
            />
            <Legend verticalAlign="bottom" height={36}/>
          </PieChart>
        );

      default:
        return <div>Unsupported chart type</div>;
    }
  };

  return (
    <div className={`bg-white p-8 rounded-[40px] border transition-all duration-300 flex flex-col h-full animate-in fade-in zoom-in duration-500 ${
      isSelected 
      ? 'ring-4 ring-blue-500/20 border-blue-500 shadow-2xl shadow-blue-500/30' 
      : 'border-slate-100 shadow-xl shadow-slate-200/30 hover:shadow-2xl hover:shadow-slate-200/50'
    }`}>
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-600 rounded-full" />
          {title}
          {isSelected && (
            <span className="ml-2 px-2 py-0.5 bg-blue-600 text-[9px] text-white rounded-full font-black animate-pulse">수정 대기 중</span>
          )}
        </h3>
        <div className="flex items-center gap-2">
           <button 
             onClick={onSelect}
             className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all ${
               isSelected 
               ? 'bg-red-50 text-red-500 hover:bg-red-100' 
               : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
             }`}
           >
             {isSelected ? '선택 취소' : '수정 선택'}
           </button>
           <button 
             onClick={onDelete}
             className="p-1.5 bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all"
             title="Delete Chart"
           >
             <Trash2 size={14} />
           </button>
        </div>
      </div>
      <div className="flex-1 w-full min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
