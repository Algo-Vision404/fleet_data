'use client';

import React, { useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { useFleetStore } from '@/store/fleet-store';
import type { Vehicle } from '@/lib/fleet-simulator';
import { cn } from '@/lib/utils';

interface TelemetryUpdate {
  vehicle: Vehicle;
  timestamp: Date;
}

export default function LiveTelemetryFeed() {
  const vehicles = useFleetStore((s) => s.vehicles);
  const feedRef = useRef<HTMLDivElement>(null);
  const updatesRef = useRef<TelemetryUpdate[]>([]);
  const [displayUpdates, setDisplayUpdates] = React.useState<TelemetryUpdate[]>([]);
  const [, forceUpdate] = React.useReducer((x: number) => x + 1, 0);

  // Track previous speeds to detect changes
  const prevVehiclesRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    // Detect vehicles with significant changes
    const newUpdates: TelemetryUpdate[] = [];

    vehicles.forEach((v) => {
      const prevSpeed = prevVehiclesRef.current.get(v.vehicleId);
      if (prevSpeed !== undefined && Math.abs(v.speed - prevSpeed) > 2) {
        newUpdates.unshift({
          vehicle: { ...v },
          timestamp: new Date(),
        });
      }
      prevVehiclesRef.current.set(v.vehicleId, v.speed);
    });

    if (newUpdates.length > 0) {
      updatesRef.current = [...newUpdates, ...updatesRef.current].slice(0, 20);
      setDisplayUpdates([...updatesRef.current]);
      forceUpdate();
    }
  }, [vehicles]);

  const statusColorMap: Record<string, string> = {
    active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    idle: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    charging: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    maintenance: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
    emergency_stop: 'bg-red-500/15 text-red-400 border-red-500/30',
  };

  const statusLabelMap: Record<string, string> = {
    active: 'Active',
    idle: 'Idle',
    charging: 'Charging',
    maintenance: 'Maint.',
    emergency_stop: 'EMERGENCY',
  };

  if (displayUpdates.length === 0) {
    return (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-white">Live Telemetry Feed</h3>
        <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-6 text-center text-[#6b7280] text-sm">
          Waiting for simulation data...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Live Telemetry Feed</h3>
        <span className="text-xs text-[#6b7280]">Last 20 updates</span>
      </div>
      <div
        ref={feedRef}
        className="bg-[#111827] border border-[#1f2937] rounded-xl overflow-hidden"
      >
        {/* Table header */}
        <div className="grid grid-cols-[100px_70px_70px_70px_70px_1fr_80px] gap-1 px-4 py-2.5 bg-[#0d1320] text-[10px] font-medium text-[#6b7280] uppercase tracking-wider border-b border-[#1f2937]">
          <span>Vehicle</span>
          <span>Speed</span>
          <span>Steer</span>
          <span>Lane</span>
          <span>Brake</span>
          <span>GPS</span>
          <span>Status</span>
        </div>

        {/* Feed rows */}
        <div className="max-h-96 overflow-y-auto custom-scrollbar">
          {displayUpdates.map((update, idx) => {
            const { vehicle } = update;
            return (
              <div
                key={`${vehicle.vehicleId}-${idx}`}
                className={cn(
                  'grid grid-cols-[100px_70px_70px_70px_70px_1fr_80px] gap-1 px-4 py-2 text-xs border-b border-[#1f2937]/50 items-center transition-colors hover:bg-white/[0.02]',
                  idx === 0 && 'bg-emerald-500/[0.03]'
                )}
              >
                <span className="font-mono font-medium text-white text-[11px]">
                  {vehicle.vehicleId}
                </span>
                <span className="font-mono text-[#d1d5db]">
                  {vehicle.speed.toFixed(0)}
                  <span className="text-[#6b7280] text-[10px]"> mph</span>
                </span>
                <span
                  className={cn(
                    'font-mono',
                    Math.abs(vehicle.steeringAngle) > 15
                      ? 'text-amber-400'
                      : 'text-[#d1d5db]'
                  )}
                >
                  {vehicle.steeringAngle.toFixed(1)}°
                </span>
                <span
                  className={cn(
                    'font-mono',
                    Math.abs(vehicle.lanePosition) > 0.6
                      ? 'text-red-400'
                      : Math.abs(vehicle.lanePosition) > 0.3
                      ? 'text-amber-400'
                      : 'text-[#d1d5db]'
                  )}
                >
                  {vehicle.lanePosition.toFixed(2)}
                </span>
                <span
                  className={cn(
                    'font-mono',
                    vehicle.brakePressure > 60
                      ? 'text-red-400'
                      : vehicle.brakePressure > 30
                      ? 'text-amber-400'
                      : 'text-[#d1d5db]'
                  )}
                >
                  {vehicle.brakePressure.toFixed(0)}%
                </span>
                <span className="font-mono text-[#6b7280] text-[10px] truncate">
                  {vehicle.gps.lat.toFixed(4)}, {vehicle.gps.lng.toFixed(4)}
                </span>
                <Badge
                  variant="outline"
                  className={cn(
                    'text-[10px] px-1.5 py-0 h-5 font-medium',
                    statusColorMap[vehicle.status]
                  )}
                >
                  {statusLabelMap[vehicle.status]}
                </Badge>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
