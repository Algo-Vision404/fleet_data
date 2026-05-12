'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFleetStore } from '@/store/fleet-store';
import { cn } from '@/lib/utils';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Activity, Clock, Server, XCircle, AlertTriangle } from 'lucide-react';

const SERVICES = ['Kafka', 'Spark', 'PostgreSQL', 'Redis', 'MinIO', 'Grafana'];

const LOG_MESSAGES = [
  '[INFO] Ingestion pipeline batch #8473 completed successfully',
  '[INFO] Validation passed for 247/250 records (99.2%)',
  '[WARN] High backpressure detected on enrichment stage',
  '[INFO] Model confidence update: 94.2% avg across fleet',
  '[INFO] New edge case queued: unusual_pedestrian in downtown SF',
  '[WARN] Lidar degradation detected on AV-023',
  '[INFO] Dataset version v2.4.8 snapshot created',
  '[INFO] Training batch #1204 started with 1,247 samples',
  '[ERROR] Timeout on storage write — retrying (attempt 2/3)',
  '[INFO] Disengagement event logged for AV-017',
  '[INFO] Kafka consumer lag: 12ms — healthy',
  '[WARN] Memory usage at 78% on transformation worker',
  '[INFO] Vehicle AV-031 reconnected after network drop',
  '[INFO] Spark job 8472 completed in 4.2s',
  '[INFO] Redis cache hit rate: 94.7%',
];

const TOOLTIP = {
  backgroundColor: '#1f2937',
  border: '1px solid #333',
  borderRadius: '6px',
  fontSize: '11px',
  color: '#d1d5db',
};

export default function ObservabilityStack() {
  const throughputHistory = useFleetStore((s) => s.throughputHistory);
  const latencyHistory = useFleetStore((s) => s.latencyHistory);
  const systemMetrics = useFleetStore((s) => s.systemMetrics);
  const pipelineStages = useFleetStore((s) => s.pipelineStages);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Service statuses — deterministic from pipeline health
  const serviceStatuses = useMemo(() => {
    const hf = systemMetrics.pipelineHealth / 100;
    return SERVICES.map((name, i) => {
      const seed = (i * 17 + Math.round(hf * 100)) % 100;
      let status: 'healthy' | 'degraded' | 'down';
      if (hf > 0.8) status = seed > 10 ? 'healthy' : 'degraded';
      else if (hf > 0.5) status = seed > 40 ? 'healthy' : seed > 10 ? 'degraded' : 'down';
      else status = seed > 60 ? 'degraded' : 'down';
      return { name, status };
    });
  }, [systemMetrics.pipelineHealth]);

  // Log entries
  const logEntries = useMemo(() => {
    const base = mounted ? Date.now() : 0;
    return Array.from({ length: 15 }, (_, i) => ({
      id: i,
      message: LOG_MESSAGES[i % LOG_MESSAGES.length],
      time: mounted
        ? new Date(base - i * 2500).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        : '--:--:--',
    }));
  }, [throughputHistory, mounted]);

  const healthColor = systemMetrics.pipelineHealth > 80 ? '#10b981' : systemMetrics.pipelineHealth > 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-white">Observability Stack</h2>
        <p className="text-[11px] text-[#4b5563] mt-0.5">
          System health monitoring and diagnostics
        </p>
      </div>

      {/* Top: Health + Services */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pipeline Health */}
        <Card className="bg-[#111827] border-[#1a1a1a]">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-medium text-[#6b7280] flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-[#4b5563]" />
              Pipeline Health
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <div className="flex items-center gap-6">
              <div className="relative w-20 h-20 shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#1a1a1a" strokeWidth="6" />
                  <circle
                    cx="50" cy="50" r="42" fill="none"
                    stroke={healthColor} strokeWidth="6" strokeLinecap="round"
                    strokeDasharray={`${(systemMetrics.pipelineHealth / 100) * 264} 264`}
                    className="transition-all duration-700"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-white">{systemMetrics.pipelineHealth}%</span>
                </div>
              </div>
              <div className="space-y-2 flex-1 text-sm">
                <div className="flex justify-between"><span className="text-[#4b5563]">Throughput</span><span className="text-[#9ca3af]">{systemMetrics.eventsPerSecond.toFixed(0)} eps</span></div>
                <div className="flex justify-between"><span className="text-[#4b5563]">Avg Latency</span><span className="text-[#9ca3af]">{systemMetrics.avgLatencyMs.toFixed(1)} ms</span></div>
                <div className="flex justify-between"><span className="text-[#4b5563]">Uptime</span><span className="text-[#9ca3af]">{Math.floor(systemMetrics.uptimeSeconds / 60)}m {Math.floor(systemMetrics.uptimeSeconds % 60)}s</span></div>
                <div className="flex justify-between"><span className="text-[#4b5563]">Ingested</span><span className="text-[#9ca3af]">{systemMetrics.dataIngestedGB.toFixed(1)} GB</span></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service Status — clean grid */}
        <Card className="bg-[#111827] border-[#1a1a1a]">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-medium text-[#6b7280] flex items-center gap-2">
              <Server className="w-3.5 h-3.5 text-[#4b5563]" />
              Service Status
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {serviceStatuses.map((svc) => (
                <div key={svc.name} className="flex items-center gap-2 bg-[#0d0d0d] rounded-md px-3 py-2">
                  <span className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    svc.status === 'healthy' ? 'bg-[#10b981]' : svc.status === 'degraded' ? 'bg-[#f59e0b]' : 'bg-[#ef4444]'
                  )} />
                  <span className="text-[11px] text-[#9ca3af]">{svc.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Throughput */}
      <Card className="bg-[#111827] border-[#1a1a1a]">
        <CardHeader className="pb-2 px-4 pt-4">
          <CardTitle className="text-xs font-medium text-[#6b7280]">Throughput (events/sec) — Last 60s</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={throughputHistory}>
                <defs>
                  <linearGradient id="epsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#4b5563' }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10, fill: '#4b5563' }} width={35} />
                <Tooltip contentStyle={TOOLTIP} />
                <Area type="monotone" dataKey="eps" stroke="#10b981" fill="url(#epsGrad)" strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Latency */}
      <Card className="bg-[#111827] border-[#1a1a1a]">
        <CardHeader className="pb-2 px-4 pt-4">
          <CardTitle className="text-xs font-medium text-[#6b7280]">Latency (P50 / P95 / P99)</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={latencyHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#4b5563' }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10, fill: '#4b5563' }} width={35} />
                <Tooltip contentStyle={TOOLTIP} />
                <Bar dataKey="p50" fill="#10b981" radius={[2, 2, 0, 0]} name="P50" />
                <Bar dataKey="p95" fill="#f59e0b" radius={[2, 2, 0, 0]} name="P95" />
                <Bar dataKey="p99" fill="#ef4444" radius={[2, 2, 0, 0]} name="P99" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Log Stream */}
      <Card className="bg-[#111827] border-[#1a1a1a]">
        <CardHeader className="pb-2 px-4 pt-4">
          <CardTitle className="text-xs font-medium text-[#6b7280] flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-[#4b5563]" />
            Log Stream
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="bg-black rounded-md p-3 max-h-44 overflow-y-auto custom-scrollbar font-mono text-[10px] space-y-0.5">
            {logEntries.map((log) => {
              const isError = log.message.includes('[ERROR]');
              const isWarn = log.message.includes('[WARN]');
              return (
                <div key={log.id} className="flex gap-2">
                  <span className="text-[#374151] shrink-0">{log.time}</span>
                  <span className={
                    isError ? 'text-[#ef4444]' : isWarn ? 'text-[#f59e0b]' : 'text-[#4b5563]'
                  }>
                    {log.message}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
