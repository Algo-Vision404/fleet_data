'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFleetStore } from '@/store/fleet-store';
import { cn } from '@/lib/utils';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Activity,
  Clock,
  Server,
  CheckCircle,
  AlertTriangle,
  XCircle,
} from 'lucide-react';

const SERVICES = [
  { name: 'Kafka', icon: 'stream' },
  { name: 'Spark', icon: 'compute' },
  { name: 'PostgreSQL', icon: 'database' },
  { name: 'Redis', icon: 'cache' },
  { name: 'MinIO', icon: 'storage' },
  { name: 'Grafana', icon: 'monitoring' },
];

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

export default function ObservabilityStack() {
  const throughputHistory = useFleetStore((s) => s.throughputHistory);
  const latencyHistory = useFleetStore((s) => s.latencyHistory);
  const systemMetrics = useFleetStore((s) => s.systemMetrics);
  const pipelineStages = useFleetStore((s) => s.pipelineStages);

  // Service statuses — deterministic from pipeline health
  const serviceStatuses = useMemo(() => {
    const healthFactor = systemMetrics.pipelineHealth / 100;
    return SERVICES.map((svc, i) => {
      // Use index + pipelineHealth for deterministic but varied results
      const seed = (i * 17 + Math.round(healthFactor * 100)) % 100;
      let status: 'healthy' | 'degraded' | 'down';
      if (healthFactor > 0.8) {
        status = seed > 10 ? 'healthy' : 'degraded';
      } else if (healthFactor > 0.5) {
        status = seed > 40 ? 'healthy' : seed > 10 ? 'degraded' : 'down';
      } else {
        status = seed > 60 ? 'degraded' : 'down';
      }
      return { ...svc, status };
    });
  }, [systemMetrics.pipelineHealth]);

  // Client-only mount flag to avoid Date hydration mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Simulated log entries
  const logEntries = useMemo(() => {
    const base = mounted ? Date.now() : 0;
    return Array.from({ length: 15 }, (_, i) => ({
      id: i,
      message: LOG_MESSAGES[i % LOG_MESSAGES.length],
      time: mounted
        ? new Date(base - i * 2500).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })
        : '--:--:--',
    }));
  }, [throughputHistory, mounted]);

  // Simulated alerts
  const alerts = useMemo(() => {
    const res: Array<{ id: string; severity: string; message: string; time: string }> = [];
    const degradedServices = serviceStatuses.filter((s) => s.status !== 'healthy');
    const now = mounted
      ? new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      : '--:--';
    degradedServices.forEach((s) => {
      res.push({
        id: `alert-${s.name}`,
        severity: s.status === 'down' ? 'critical' : 'warning',
        message: `${s.name} is ${s.status === 'down' ? 'unreachable' : 'degraded'}`,
        time: now,
      });
    });
    if (systemMetrics.pipelineHealth < 80) {
      res.push({
        id: 'alert-pipeline',
        severity: 'warning',
        message: `Pipeline health below 80%: ${systemMetrics.pipelineHealth}%`,
        time: now,
      });
    }
    return res;
  }, [serviceStatuses, systemMetrics.pipelineHealth, mounted]);

  const healthStroke =
    systemMetrics.pipelineHealth > 80
      ? '#10b981'
      : systemMetrics.pipelineHealth > 50
      ? '#f59e0b'
      : '#ef4444';

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-white">Observability Stack</h2>
        <p className="text-sm text-[#6b7280] mt-0.5">
          System health monitoring and diagnostics
        </p>
      </div>

      {/* Top row: Health + Services */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pipeline Health Circle */}
        <Card className="bg-[#111827] border-[#1f2937]">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Pipeline Health
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <div className="flex items-center gap-6">
              <div className="relative w-24 h-24 shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#1f2937" strokeWidth="6" />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke={healthStroke}
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${(systemMetrics.pipelineHealth / 100) * 264} 264`}
                    className="transition-all duration-700"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold text-white">
                    {systemMetrics.pipelineHealth}%
                  </span>
                </div>
              </div>
              <div className="space-y-2 flex-1">
                <div className="flex justify-between text-sm">
                  <span className="text-[#6b7280]">Throughput</span>
                  <span className="text-white">{systemMetrics.eventsPerSecond.toFixed(0)} eps</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#6b7280]">Avg Latency</span>
                  <span className="text-white">{systemMetrics.avgLatencyMs.toFixed(1)} ms</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#6b7280]">Uptime</span>
                  <span className="text-white">
                    {Math.floor(systemMetrics.uptimeSeconds / 60)}m{' '}
                    {Math.floor(systemMetrics.uptimeSeconds % 60)}s
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#6b7280]">Data Ingested</span>
                  <span className="text-white">{systemMetrics.dataIngestedGB.toFixed(1)} GB</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service Status Grid */}
        <Card className="bg-[#111827] border-[#1f2937]">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-cyan-400" />
              Service Status
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {serviceStatuses.map((svc) => (
                <div
                  key={svc.name}
                  className="flex items-center gap-2 bg-[#0d1320] rounded-lg px-3 py-2 border border-[#1f2937]"
                >
                  <div
                    className={cn(
                      'w-2 h-2 rounded-full',
                      svc.status === 'healthy'
                        ? 'bg-emerald-400'
                        : svc.status === 'degraded'
                        ? 'bg-amber-400 animate-pulse'
                        : 'bg-red-400 animate-pulse'
                    )}
                  />
                  <span className="text-xs text-[#d1d5db]">{svc.name}</span>
                </div>
              ))}
            </div>

            {/* Active alerts */}
            {alerts.length > 0 && (
              <div className="mt-3 space-y-1.5">
                <span className="text-[10px] text-[#6b7280] uppercase tracking-wider font-medium">
                  Active Alerts
                </span>
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={cn(
                      'flex items-center gap-2 text-xs px-2 py-1 rounded',
                      alert.severity === 'critical'
                        ? 'bg-red-500/10 text-red-400'
                        : 'bg-amber-500/10 text-amber-400'
                    )}
                  >
                    {alert.severity === 'critical' ? (
                      <XCircle className="w-3 h-3" />
                    ) : (
                      <AlertTriangle className="w-3 h-3" />
                    )}
                    <span className="flex-1">{alert.message}</span>
                    <span className="text-[10px] opacity-60">{alert.time}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Throughput chart */}
      <Card className="bg-[#111827] border-[#1f2937]">
        <CardHeader className="pb-2 px-4 pt-4">
          <CardTitle className="text-sm font-medium text-white">
            Throughput (Events/sec) — Last 60s
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={throughputHistory}>
                <defs>
                  <linearGradient id="epsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
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
                <Area
                  type="monotone"
                  dataKey="eps"
                  stroke="#10b981"
                  fill="url(#epsGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Latency chart */}
      <Card className="bg-[#111827] border-[#1f2937]">
        <CardHeader className="pb-2 px-4 pt-4">
          <CardTitle className="text-sm font-medium text-white">
            Latency Distribution (P50/P95/P99)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={latencyHistory}>
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
                <Bar dataKey="p50" fill="#10b981" radius={[2, 2, 0, 0]} name="P50" />
                <Bar dataKey="p95" fill="#f59e0b" radius={[2, 2, 0, 0]} name="P95" />
                <Bar dataKey="p99" fill="#ef4444" radius={[2, 2, 0, 0]} name="P99" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Log Stream */}
      <Card className="bg-[#111827] border-[#1f2937]">
        <CardHeader className="pb-2 px-4 pt-4">
          <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#6b7280]" />
            Log Stream
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="bg-black rounded-lg p-3 max-h-48 overflow-y-auto custom-scrollbar font-mono text-[11px] space-y-0.5">
            {logEntries.map((log) => {
              const isError = log.message.includes('[ERROR]');
              const isWarn = log.message.includes('[WARN]');
              return (
                <div key={log.id} className="flex gap-2">
                  <span className="text-[#4b5563] shrink-0">{log.time}</span>
                  <span
                    className={cn(
                      isError
                        ? 'text-red-400'
                        : isWarn
                        ? 'text-amber-400'
                        : 'text-[#6b7280]'
                    )}
                  >
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
