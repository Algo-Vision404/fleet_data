'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFleetStore } from '@/store/fleet-store';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { Shield, Brain, MapPin } from 'lucide-react';

const CHART_COLORS = {
  primary: '#10b981',   // green
  secondary: '#f59e0b', // amber
  danger: '#ef4444',    // red
  muted: '#374151',     // gray
  grid: '#1a1a1a',      // grid lines
  label: '#4b5563',     // axis labels
};

const tooltipStyle = {
  backgroundColor: '#1f2937',
  border: '1px solid #333',
  borderRadius: '6px',
  fontSize: '11px',
  color: '#d1d5db',
};

export default function DisengagementChart() {
  const disengagementHistory = useFleetStore((s) => s.disengagementHistory);

  return (
    <Card className="bg-[#111827] border-[#1a1a1a]">
      <CardHeader className="pb-2 px-4 pt-4">
        <CardTitle className="text-xs font-medium text-[#6b7280] flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-[#4b5563]" />
          Disengagement Rate (per 1,000 mi)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={disengagementHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: CHART_COLORS.label }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: CHART_COLORS.label }} width={35} />
              <Tooltip contentStyle={tooltipStyle} />
              <ReferenceLine y={2.5} stroke={CHART_COLORS.danger} strokeDasharray="4 4" label={{ value: 'Threshold', position: 'right', fill: CHART_COLORS.danger, fontSize: 9 }} />
              <Line type="monotone" dataKey="rate" stroke={CHART_COLORS.secondary} strokeWidth={1.5} dot={false} />
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
    <Card className="bg-[#111827] border-[#1a1a1a]">
      <CardHeader className="pb-2 px-4 pt-4">
        <CardTitle className="text-xs font-medium text-[#6b7280] flex items-center gap-2">
          <Brain className="w-3.5 h-3.5 text-[#4b5563]" />
          Model Confidence Drift
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={driftHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: CHART_COLORS.label }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: CHART_COLORS.label }} width={35} domain={[60, 100]} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="expected" stroke={CHART_COLORS.muted} strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
              <Line type="monotone" dataKey="actual" stroke={CHART_COLORS.primary} strokeWidth={1.5} dot={false} />
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
    <Card className="bg-[#111827] border-[#1a1a1a]">
      <CardHeader className="pb-2 px-4 pt-4">
        <CardTitle className="text-xs font-medium text-[#6b7280] flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-[#4b5563]" />
          Anomalies by Region
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={regionAnomalies} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
              <XAxis type="number" tick={{ fontSize: 10, fill: CHART_COLORS.label }} />
              <YAxis type="category" dataKey="region" tick={{ fontSize: 10, fill: CHART_COLORS.label }} width={65} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="anomalies" fill={CHART_COLORS.primary} radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
