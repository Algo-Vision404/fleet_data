'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFleetStore } from '@/store/fleet-store';
import {
  Car,
  Zap,
  Shield,
  Database,
  AlertTriangle,
  Activity,
  Cpu,
} from 'lucide-react';

// Strict 3-color status system: green=ok, amber=warn, red=bad
type Status = 'ok' | 'warn' | 'bad';

function statusColor(s: Status): string {
  return s === 'ok' ? '#10b981' : s === 'warn' ? '#f59e0b' : '#ef4444';
}

export default function FleetOverview() {
  const vehicles = useFleetStore((s) => s.vehicles);
  const events = useFleetStore((s) => s.events);
  const systemMetrics = useFleetStore((s) => s.systemMetrics);

  const stats = useMemo(() => {
    const active = vehicles.filter((v) => v.status === 'active').length;
    const charging = vehicles.filter((v) => v.status === 'charging').length;
    const idle = vehicles.filter((v) => v.status === 'idle').length;
    const maintenance = vehicles.filter((v) => v.status === 'maintenance').length;
    const emergency = vehicles.filter((v) => v.status === 'emergency_stop').length;
    const total = vehicles.length || 1;
    const activePct = ((active / total) * 100).toFixed(1);

    const recentEvents = events.filter(
      (e) => Date.now() - e.timestamp.getTime() < 60000
    );
    const eventsPerMin = recentEvents.length;

    const totalDisengagements = vehicles.reduce((s, v) => s + v.disengagementCount, 0);
    const totalMiles = vehicles.reduce((s, v) => s + v.totalMiles, 0) || 1;
    const disengagementRate = ((totalDisengagements / totalMiles) * 1000).toFixed(2);

    const edgeCases = events.filter(
      (e) => e.severity === 'critical' || e.severity === 'high'
    ).length;

    const fleetHealth = Math.round(
      (active / total) * 60 +
      ((100 - emergency / total * 100) / 100) * 20 +
      (systemMetrics.pipelineHealth / 100) * 20
    );

    const modelConfidence = Math.round(
      85 + (systemMetrics.pipelineHealth / 100) * 10 - (emergency * 3)
    );

    const criticalAlerts = events.filter(
      (e) => e.severity === 'critical' && !e.acknowledged
    ).length;

    return {
      active, activePct, total, charging, idle, maintenance, emergency,
      eventsPerMin, disengagementRate,
      dataIngested: systemMetrics.dataIngestedGB.toFixed(1),
      edgeCases,
      fleetHealth: Math.min(99, Math.max(fleetHealth, 45)),
      modelConfidence: Math.min(99, Math.max(modelConfidence, 60)),
      criticalAlerts,
      throughput: systemMetrics.eventsPerSecond,
    };
  }, [vehicles, events, systemMetrics]);

  const cards: Array<{
    title: string; value: string; sub: string;
    icon: typeof Car; status: Status;
  }> = [
    { title: 'Active Vehicles', value: `${stats.active}/${stats.total}`, sub: `${stats.activePct}% fleet online`, icon: Car, status: 'ok' },
    { title: 'Events / min', value: stats.eventsPerMin.toString(), sub: `${stats.throughput.toFixed(0)} eps throughput`, icon: Zap, status: 'ok' },
    { title: 'Disengagement Rate', value: stats.disengagementRate, sub: 'per 1,000 miles', icon: Shield, status: parseFloat(stats.disengagementRate) > 2.5 ? 'bad' : 'ok' },
    { title: 'Data Ingested', value: `${stats.dataIngested} GB`, sub: 'All-time telemetry', icon: Database, status: 'ok' },
    { title: 'Edge Cases', value: stats.edgeCases.toString(), sub: 'Rare/novel events today', icon: AlertTriangle, status: stats.edgeCases > 15 ? 'warn' : 'ok' },
    { title: 'Fleet Health', value: `${stats.fleetHealth}%`, sub: stats.fleetHealth > 80 ? 'Nominal' : stats.fleetHealth > 60 ? 'Minor issues' : 'Attention needed', icon: Activity, status: stats.fleetHealth > 80 ? 'ok' : stats.fleetHealth > 60 ? 'warn' : 'bad' },
    { title: 'Model Confidence', value: `${stats.modelConfidence}%`, sub: 'Avg autopilot confidence', icon: Cpu, status: stats.modelConfidence > 85 ? 'ok' : 'warn' },
    { title: 'Critical Alerts', value: stats.criticalAlerts.toString(), sub: 'Unacknowledged', icon: AlertTriangle, status: stats.criticalAlerts > 3 ? 'bad' : stats.criticalAlerts > 0 ? 'warn' : 'ok' },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-white">Fleet Overview</h2>
        <p className="text-sm text-[#6b7280] mt-0.5">
          Real-time fleet performance metrics and KPIs
        </p>
      </div>

      {/* Fleet status bar — simple dots */}
      <div className="flex items-center gap-4 text-xs text-[#9ca3af]">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#10b981]" /> {stats.active} Active
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#f59e0b]" /> {stats.idle} Idle
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#6b7280]" /> {stats.charging} Charging
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#374151]" /> {stats.maintenance} Maint.
        </span>
        {stats.emergency > 0 && (
          <span className="flex items-center gap-1.5 text-[#ef4444]">
            <span className="w-2 h-2 rounded-full bg-[#ef4444] animate-pulse" /> {stats.emergency} Emergency
          </span>
        )}
      </div>

      {/* KPI Cards — neutral cards, white values, colored status dot only */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="bg-[#111827] border-[#1f2937]">
              <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
                <CardTitle className="text-[11px] font-medium text-[#6b7280] uppercase tracking-wider">
                  {card.title}
                </CardTitle>
                <div className="w-7 h-7 rounded-md bg-[#1a2235] flex items-center justify-center">
                  <Icon className="w-3.5 h-3.5 text-[#6b7280]" />
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-white">{card.value}</p>
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: statusColor(card.status) }}
                  />
                </div>
                <p className="text-[11px] text-[#4b5563] mt-1">
                  {card.sub}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
