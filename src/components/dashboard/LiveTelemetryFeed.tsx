'use client';

import React, { useEffect, useRef } from 'react';
import { useFleetStore } from '@/store/fleet-store';
import type { Vehicle } from '@/lib/fleet-simulator';

interface TelemetryUpdate {
  vehicle: Vehicle;
  timestamp: Date;
}

// Status: solid colored dot + plain text, no badges
const STATUS_DOT: Record<string, string> = {
  active: 'bg-[#10b981]',
  idle: 'bg-[#f59e0b]',
  charging: 'bg-[#6b7280]',
  maintenance: 'bg-[#374151]',
  emergency_stop: 'bg-[#ef4444]',
};

const STATUS_LABEL: Record<string, string> = {
  active: 'Active',
  idle: 'Idle',
  charging: 'Charging',
  maintenance: 'Maint.',
  emergency_stop: 'Emergency',
};

// Threshold helpers — only color when actually alarming
function brakeColor(v: number): string {
  return v > 70 ? 'text-[#ef4444]' : v > 40 ? 'text-[#f59e0b]' : 'text-[#9ca3af]';
}
function laneColor(v: number): string {
  return Math.abs(v) > 0.6 ? 'text-[#ef4444]' : Math.abs(v) > 0.35 ? 'text-[#f59e0b]' : 'text-[#9ca3af]';
}

export default function LiveTelemetryFeed() {
  const vehicles = useFleetStore((s) => s.vehicles);
  const feedRef = useRef<HTMLDivElement>(null);
  const updatesRef = useRef<TelemetryUpdate[]>([]);
  const [displayUpdates, setDisplayUpdates] = React.useState<TelemetryUpdate[]>([]);
  const [, forceUpdate] = React.useReducer((x: number) => x + 1, 0);
  const prevVehiclesRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const newUpdates: TelemetryUpdate[] = [];
    vehicles.forEach((v) => {
      const prevSpeed = prevVehiclesRef.current.get(v.vehicleId);
      if (prevSpeed !== undefined && Math.abs(v.speed - prevSpeed) > 2) {
        newUpdates.unshift({ vehicle: { ...v }, timestamp: new Date() });
      }
      prevVehiclesRef.current.set(v.vehicleId, v.speed);
    });
    if (newUpdates.length > 0) {
      updatesRef.current = [...newUpdates, ...updatesRef.current].slice(0, 20);
      setDisplayUpdates([...updatesRef.current]);
      forceUpdate();
    }
  }, [vehicles]);

  if (displayUpdates.length === 0) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-white">Live Telemetry Feed</h3>
        <div className="bg-[#111827] border border-[#1f2937] rounded-lg p-6 text-center text-[#4b5563] text-xs">
          Waiting for simulation data...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Live Telemetry Feed</h3>
        <span className="text-[11px] text-[#4b5563]">Last 20 updates</span>
      </div>
      <div ref={feedRef} className="bg-[#111827] border border-[#1f2937] rounded-lg overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[80px_60px_55px_55px_50px_1fr_70px] gap-1 px-3 py-2 bg-[#0d0d0d] text-[10px] font-medium text-[#4b5563] uppercase tracking-wider border-b border-[#1a1a1a]">
          <span>Vehicle</span><span>Speed</span><span>Steer</span><span>Lane</span><span>Brake</span><span>GPS</span><span>Status</span>
        </div>
        {/* Rows */}
        <div className="max-h-96 overflow-y-auto custom-scrollbar">
          {displayUpdates.map((update, idx) => {
            const { vehicle } = update;
            return (
              <div
                key={`${vehicle.vehicleId}-${idx}`}
                className={`grid grid-cols-[80px_60px_55px_55px_50px_1fr_70px] gap-1 px-3 py-1.5 text-[11px] font-mono border-b border-[#1a1a1a] items-center ${idx === 0 ? 'bg-white/[0.02]' : ''}`}
              >
                <span className="font-medium text-white">{vehicle.vehicleId}</span>
                <span className="text-[#9ca3af]">
                  {vehicle.speed.toFixed(0)}<span className="text-[#4b5563] text-[9px]"> mph</span>
                </span>
                <span className="text-[#9ca3af]">{vehicle.steeringAngle.toFixed(1)}°</span>
                <span className={laneColor(vehicle.lanePosition)}>{vehicle.lanePosition.toFixed(2)}</span>
                <span className={brakeColor(vehicle.brakePressure)}>{vehicle.brakePressure.toFixed(0)}%</span>
                <span className="text-[#374151] text-[10px] truncate">
                  {vehicle.gps.lat.toFixed(4)}, {vehicle.gps.lng.toFixed(4)}
                </span>
                <span className="flex items-center gap-1.5 text-[10px]">
                  <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[vehicle.status]}`} />
                  <span className="text-[#6b7280] font-sans">{STATUS_LABEL[vehicle.status]}</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
