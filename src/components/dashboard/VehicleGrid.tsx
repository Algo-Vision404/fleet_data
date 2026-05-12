'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFleetStore } from '@/store/fleet-store';
import type { Vehicle } from '@/lib/fleet-simulator';
import { cn } from '@/lib/utils';
import { Search, Gauge, Radio, Battery } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function VehicleGrid() {
  const vehicles = useFleetStore((s) => s.vehicles);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filtered = useMemo(() => {
    return vehicles.filter((v) => {
      const matchSearch =
        v.vehicleId.toLowerCase().includes(search.toLowerCase()) ||
        v.model.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === 'all' || v.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [vehicles, search, filterStatus]);

  const statusColors: Record<string, string> = {
    active: 'border-emerald-500/30',
    idle: 'border-amber-500/30',
    charging: 'border-cyan-500/30',
    maintenance: 'border-gray-500/30',
    emergency_stop: 'border-red-500/30 animate-pulse',
  };

  const statusBadgeColors: Record<string, string> = {
    active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    idle: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    charging: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    maintenance: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
    emergency_stop: 'bg-red-500/15 text-red-400 border-red-500/30',
  };

  const statusDot: Record<string, string> = {
    active: 'bg-emerald-400',
    idle: 'bg-amber-400',
    charging: 'bg-cyan-400',
    maintenance: 'bg-gray-400',
    emergency_stop: 'bg-red-400',
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-white">Fleet Map</h2>
        <p className="text-sm text-[#6b7280] mt-0.5">
          Active vehicle positions and status grid
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7280]" />
          <Input
            placeholder="Search vehicle ID or model..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-[#111827] border-[#1f2937] text-white pl-9 h-9 text-sm placeholder:text-[#6b7280]"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {['all', 'active', 'idle', 'charging', 'maintenance', 'emergency_stop'].map(
            (status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={cn(
                  'px-2.5 py-1 rounded-md text-xs font-medium transition-colors capitalize',
                  filterStatus === status
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-[#111827] text-[#9ca3af] hover:bg-white/5'
                )}
              >
                {status === 'emergency_stop' ? 'Emergency' : status}
              </button>
            )
          )}
        </div>
      </div>

      {/* Vehicle grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filtered.map((v) => (
          <VehicleCard key={v.vehicleId} vehicle={v} statusColors={statusColors} statusBadgeColors={statusBadgeColors} statusDot={statusDot} />
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="text-center py-12 text-[#6b7280] text-sm">
          No vehicles match your filters.
        </div>
      )}
    </div>
  );
}

function VehicleCard({
  vehicle,
  statusColors,
  statusBadgeColors,
  statusDot,
}: {
  vehicle: Vehicle;
  statusColors: Record<string, string>;
  statusBadgeColors: Record<string, string>;
  statusDot: Record<string, string>;
}) {
  return (
    <Card className={cn('bg-[#111827] border', statusColors[vehicle.status])}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={cn('w-2 h-2 rounded-full', statusDot[vehicle.status])} />
            <span className="font-mono text-sm font-medium text-white">
              {vehicle.vehicleId}
            </span>
          </div>
          <Badge
            variant="outline"
            className={cn('text-[10px] px-1.5 py-0 h-5', statusBadgeColors[vehicle.status])}
          >
            {vehicle.status === 'emergency_stop' ? 'EMERGENCY' : vehicle.status}
          </Badge>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-[#6b7280]">Model</span>
            <span className="text-[#d1d5db]">{vehicle.model}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#6b7280] flex items-center gap-1">
              <Gauge className="w-3 h-3" /> Speed
            </span>
            <span className="text-white font-mono">{vehicle.speed.toFixed(0)} mph</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#6b7280] flex items-center gap-1">
              <Radio className="w-3 h-3" /> Lidar
            </span>
            <Badge
              variant="outline"
              className={cn(
                'text-[10px] px-1 py-0 h-4',
                vehicle.lidarStatus === 'active'
                  ? 'border-emerald-500/30 text-emerald-400'
                  : vehicle.lidarStatus === 'degraded'
                  ? 'border-amber-500/30 text-amber-400'
                  : 'border-red-500/30 text-red-400'
              )}
            >
              {vehicle.lidarStatus}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#6b7280] flex items-center gap-1">
              <Battery className="w-3 h-3" /> Battery
            </span>
            <span
              className={cn(
                'font-mono',
                vehicle.batteryLevel > 50
                  ? 'text-emerald-400'
                  : vehicle.batteryLevel > 20
                  ? 'text-amber-400'
                  : 'text-red-400'
              )}
            >
              {vehicle.batteryLevel.toFixed(0)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#6b7280]">Mode</span>
            <span className="text-[#d1d5db] capitalize">{vehicle.autopilotMode}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
