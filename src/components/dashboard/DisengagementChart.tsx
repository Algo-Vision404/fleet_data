'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFleetStore } from '@/store/fleet-store';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Shield, Brain, MapPin } from 'lucide-react';

export default function DisengagementChart() {
  const disengagementHistory = useFleetStore((s) => s.disengagementHistory);

  return (
    <Card className="bg-[#111827] border-[#1f2937]">
      <CardHeader className="pb-2 px-4 pt-4">
        <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
          <Shield className="w-4 h-4 text-amber-400" />
          Disengagement Rate (per 1,000 miles)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={disengagementHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10, fill: '#6b7280' }}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} width={40} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                labelStyle={{ color: '#9ca3af' }}
              />
              <ReferenceLine
                y={2.5}
                stroke="#ef4444"
                strokeDasharray="5 5"
                label={{
                  value: 'Threshold',
                  position: 'right',
                  fill: '#ef4444',
                  fontSize: 10,
                }}
              />
              <Line
                type="monotone"
                dataKey="rate"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={false}
                name="Rate"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function DriftIndicators() {
  const driftHistory = useFleetStore((s) => s.driftHistory);

  return (
    <Card className="bg-[#111827] border-[#1f2937]">
      <CardHeader className="pb-2 px-4 pt-4">
        <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
          <Brain className="w-4 h-4 text-emerald-400" />
          Model Confidence Drift
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={driftHistory}>
              <defs>
                <linearGradient id="driftGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10, fill: '#6b7280' }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#6b7280' }}
                width={40}
                domain={[60, 100]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                labelStyle={{ color: '#9ca3af' }}
              />
              <Line
                type="monotone"
                dataKey="expected"
                stroke="#6b7280"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="Expected"
              />
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                name="Actual"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function GeographicAnomalies() {
  const regionAnomalies = useFleetStore((s) => s.regionAnomalies);

  return (
    <Card className="bg-[#111827] border-[#1f2937]">
      <CardHeader className="pb-2 px-4 pt-4">
        <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
          <MapPin className="w-4 h-4 text-cyan-400" />
          Anomaly Counts by Region
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={regionAnomalies} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: '#6b7280' }}
              />
              <YAxis
                type="category"
                dataKey="region"
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                width={80}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                labelStyle={{ color: '#9ca3af' }}
              />
              <Bar dataKey="anomalies" fill="#06b6d4" radius={[0, 4, 4, 0]} name="Anomalies" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
