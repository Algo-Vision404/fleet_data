'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFleetStore } from '@/store/fleet-store';
import {
  Car,
  Zap,
  Shield,
  Database,
  AlertTriangle,
  Activity,
  Cpu,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

    // Events per minute (from recent events)
    const recentEvents = events.filter(
      (e) => Date.now() - e.timestamp.getTime() < 60000
    );
    const eventsPerMin = recentEvents.length;

    // Disengagement rate per 1000 miles
    const totalDisengagements = vehicles.reduce((s, v) => s + v.disengagementCount, 0);
    const totalMiles = vehicles.reduce((s, v) => s + v.totalMiles, 0) || 1;
    const disengagementRate = ((totalDisengagements / totalMiles) * 1000).toFixed(2);

    // Edge cases: high + urgent priority
    const edgeCases = events.filter(
      (e) =>
        e.severity === 'critical' ||
        e.severity === 'high'
    ).length;

    // Fleet health: weighted score
    const fleetHealth = Math.round(
      (active / total) * 60 +
      ((100 - emergency / total * 100) / 100) * 20 +
      (systemMetrics.pipelineHealth / 100) * 20
    );

    // Model confidence (simulated)
    const modelConfidence = Math.round(
      85 + Math.random() * 12 - (emergency * 3)
    );

    // Critical alerts
    const criticalAlerts = events.filter(
      (e) => e.severity === 'critical' && !e.acknowledged
    ).length;

    return {
      active,
      activePct,
      total,
      charging,
      idle,
      maintenance,
      emergency,
      eventsPerMin,
      disengagementRate,
      dataIngested: systemMetrics.dataIngestedGB.toFixed(1),
      edgeCases,
      fleetHealth: Math.min(99, Math.max(fleetHealth, 45)),
      modelConfidence: Math.min(99, Math.max(modelConfidence, 60)),
      criticalAlerts,
      throughput: systemMetrics.eventsPerSecond,
    };
  }, [vehicles, events, systemMetrics]);

  const cards = [
    {
      title: 'Active Vehicles',
      value: `${stats.active}/${stats.total}`,
      subtitle: `${stats.activePct}% fleet online`,
      icon: Car,
      trend: 'up' as const,
      accent: 'emerald',
      stat: stats.activePct,
    },
    {
      title: 'Events / min',
      value: stats.eventsPerMin.toString(),
      subtitle: `Throughput: ${stats.throughput.toFixed(0)} eps`,
      icon: Zap,
      trend: stats.eventsPerMin > 5 ? 'up' as const : 'down' as const,
      accent: 'amber',
      stat: stats.eventsPerMin,
    },
    {
      title: 'Disengagement Rate',
      value: `${stats.disengagementRate}`,
      subtitle: 'per 1,000 miles',
      icon: Shield,
      trend: parseFloat(stats.disengagementRate) > 2 ? 'up' as const : 'down' as const,
      accent: parseFloat(stats.disengagementRate) > 3 ? 'red' : 'amber',
      stat: parseFloat(stats.disengagementRate),
    },
    {
      title: 'Data Ingested',
      value: `${stats.dataIngested} GB`,
      subtitle: 'All-time telemetry',
      icon: Database,
      trend: 'up' as const,
      accent: 'cyan',
      stat: parseFloat(stats.dataIngested),
    },
    {
      title: 'Edge Cases Found',
      value: stats.edgeCases.toString(),
      subtitle: 'Rare/novel events today',
      icon: AlertTriangle,
      trend: stats.edgeCases > 10 ? 'up' as const : 'down' as const,
      accent: 'amber',
      stat: stats.edgeCases,
    },
    {
      title: 'Fleet Health',
      value: `${stats.fleetHealth}%`,
      subtitle:
        stats.fleetHealth > 80
          ? 'All systems nominal'
          : stats.fleetHealth > 60
          ? 'Minor issues detected'
          : 'Attention required',
      icon: Activity,
      trend: stats.fleetHealth > 75 ? 'up' as const : 'down' as const,
      accent: stats.fleetHealth > 80 ? 'emerald' : stats.fleetHealth > 60 ? 'amber' : 'red',
      stat: stats.fleetHealth,
    },
    {
      title: 'Model Confidence',
      value: `${stats.modelConfidence}%`,
      subtitle: 'Avg autopilot confidence',
      icon: Cpu,
      trend: 'up' as const,
      accent: 'emerald',
      stat: stats.modelConfidence,
    },
    {
      title: 'Critical Alerts',
      value: stats.criticalAlerts.toString(),
      subtitle: 'Unacknowledged',
      icon: TrendingUp,
      trend: stats.criticalAlerts > 5 ? 'up' as const : 'down' as const,
      accent: stats.criticalAlerts > 3 ? 'red' : 'emerald',
      stat: stats.criticalAlerts,
    },
  ];

  const accentMap: Record<string, string> = {
    emerald: 'border-emerald-500/40 bg-emerald-500/5',
    amber: 'border-amber-500/40 bg-amber-500/5',
    red: 'border-red-500/40 bg-red-500/5',
    cyan: 'border-cyan-500/40 bg-cyan-500/5',
  };

  const iconColorMap: Record<string, string> = {
    emerald: 'text-emerald-400 bg-emerald-500/10',
    amber: 'text-amber-400 bg-amber-500/10',
    red: 'text-red-400 bg-red-500/10',
    cyan: 'text-cyan-400 bg-cyan-500/10',
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-white">Fleet Overview</h2>
        <p className="text-sm text-[#6b7280] mt-0.5">
          Real-time fleet performance metrics and KPIs
        </p>
      </div>

      {/* Status badges row */}
      <div className="flex flex-wrap gap-2">
        <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
          {stats.active} Active
        </Badge>
        <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30">
          {stats.idle} Idle
        </Badge>
        <Badge className="bg-cyan-500/15 text-cyan-400 border-cyan-500/30">
          {stats.charging} Charging
        </Badge>
        <Badge className="bg-gray-500/15 text-gray-400 border-gray-500/30">
          {stats.maintenance} Maintenance
        </Badge>
        {stats.emergency > 0 && (
          <Badge className="bg-red-500/15 text-red-400 border-red-500/30 animate-pulse">
            {stats.emergency} Emergency
          </Badge>
        )}
      </div>

      {/* KPI Cards grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.title}
              className={cn(
                'bg-[#111827] border transition-all duration-300 hover:shadow-lg',
                accentMap[card.accent]
              )}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
                <CardTitle className="text-xs font-medium text-[#9ca3af]">
                  {card.title}
                </CardTitle>
                <div
                  className={cn(
                    'w-7 h-7 rounded-lg flex items-center justify-center',
                    iconColorMap[card.accent]
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-bold text-white">{card.value}</p>
                    <p className="text-[11px] text-[#6b7280] mt-0.5">
                      {card.subtitle}
                    </p>
                  </div>
                  {card.trend === 'up' ? (
                    <TrendingUp className="w-4 h-4 text-emerald-400 opacity-60" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-400 opacity-60" />
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
