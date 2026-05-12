'use client';

import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFleetStore } from '@/store/fleet-store';
import { cn } from '@/lib/utils';

const GRID_COLS = 30;
const GRID_ROWS = 20;

const REGION_NAMES = [
  'SoMa', 'Mission', 'Castro', 'Haight', 'Richmond',
  'Sunset', 'Dogpatch', 'Potrero', 'Bayview', 'Excelsior',
  'Marina', 'Nob Hill', 'Tenderloin', 'Chinatown', 'North Beach',
  'Financial', 'Embarcadero', 'Presidio', 'Park Merced', 'Oceanview',
];

export default function EventHeatmap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const events = useFleetStore((s) => s.events);
  const vehicles = useFleetStore((s) => s.vehicles);

  // Calculate event density per grid cell
  const gridData = useMemo(() => {
    const grid: number[][] = Array.from({ length: GRID_ROWS }, () =>
      Array(GRID_COLS).fill(0)
    );

    const SF_BAY = { latMin: 37.6, latMax: 37.85, lngMin: -122.55, lngMax: -122.3 };

    events.forEach((e) => {
      const col = Math.floor(
        ((e.location.lng - SF_BAY.lngMin) / (SF_BAY.lngMax - SF_BAY.lngMin)) * GRID_COLS
      );
      const row = Math.floor(
        ((e.location.lat - SF_BAY.latMin) / (SF_BAY.latMax - SF_BAY.latMin)) * GRID_ROWS
      );
      if (row >= 0 && row < GRID_ROWS && col >= 0 && col < GRID_COLS) {
        grid[row][col] += 1;
      }
    });

    // Add vehicle presence (lighter)
    vehicles.forEach((v) => {
      const col = Math.floor(
        ((v.gps.lng - SF_BAY.lngMin) / (SF_BAY.lngMax - SF_BAY.lngMin)) * GRID_COLS
      );
      const row = Math.floor(
        ((v.gps.lat - SF_BAY.latMin) / (SF_BAY.latMax - SF_BAY.latMin)) * GRID_ROWS
      );
      if (row >= 0 && row < GRID_ROWS && col >= 0 && col < GRID_COLS) {
        grid[row][col] += 0.2;
      }
    });

    return grid;
  }, [events, vehicles]);

  const maxDensity = useMemo(() => {
    let max = 1;
    gridData.forEach((row) => row.forEach((val) => { if (val > max) max = val; }));
    return max;
  }, [gridData]);

  const drawHeatmap = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    const w = rect.width;
    const h = Math.max(400, Math.min(500, w * 0.5));

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(dpr, dpr);

    const cellW = w / GRID_COLS;
    const cellH = h / GRID_ROWS;

    // Background
    ctx.fillStyle = '#0d1320';
    ctx.fillRect(0, 0, w, h);

    // Draw grid cells
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const density = gridData[row][col];
        const intensity = Math.min(density / maxDensity, 1);

        const color = getHeatColor(intensity);
        ctx.fillStyle = color;
        ctx.fillRect(col * cellW + 0.5, row * cellH + 0.5, cellW - 1, cellH - 1);

        // Grid border
        ctx.strokeStyle = 'rgba(31, 41, 55, 0.4)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(col * cellW + 0.5, row * cellH + 0.5, cellW - 1, cellH - 1);
      }
    }

    // Draw vehicle dots
    const SF_BAY = { latMin: 37.6, latMax: 37.85, lngMin: -122.55, lngMax: -122.3 };
    vehicles.forEach((v) => {
      if (v.status !== 'active') return;
      const x = ((v.gps.lng - SF_BAY.lngMin) / (SF_BAY.lngMax - SF_BAY.lngMin)) * w;
      const y = ((v.gps.lat - SF_BAY.latMin) / (SF_BAY.latMax - SF_BAY.latMin)) * h;

      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = v.status === 'emergency_stop' ? '#ef4444' : '#10b981';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    });
  }, [gridData, maxDensity, vehicles]);

  useEffect(() => {
    drawHeatmap();
    const handleResize = () => drawHeatmap();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawHeatmap]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const tooltip = tooltipRef.current;
    if (!canvas || !tooltip) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const col = Math.floor((x / rect.width) * GRID_COLS);
    const row = Math.floor((y / rect.height) * GRID_ROWS);

    if (row >= 0 && row < GRID_ROWS && col >= 0 && col < GRID_COLS) {
      const density = gridData[row][col];
      const regionName = REGION_NAMES[(row * GRID_COLS + col) % REGION_NAMES.length];
      tooltip.style.display = 'block';
      tooltip.style.left = `${x + 12}px`;
      tooltip.style.top = `${y - 8}px`;
      tooltip.innerHTML = `
        <div class="text-xs font-medium text-white">${regionName} (${col}, ${row})</div>
        <div class="text-[10px] text-[#9ca3af]">Event density: ${density.toFixed(1)}</div>
      `;
    }
  };

  const handleMouseLeave = () => {
    if (tooltipRef.current) {
      tooltipRef.current.style.display = 'none';
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-white">Event Heatmap</h2>
        <p className="text-sm text-[#6b7280] mt-0.5">
          Geographic event density in the San Francisco Bay Area
        </p>
      </div>

      <Card className="bg-[#111827] border-[#1f2937]">
        <CardContent className="p-4">
          <div ref={containerRef} className="relative">
            <canvas
              ref={canvasRef}
              className="w-full rounded-lg cursor-crosshair"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />
            <div
              ref={tooltipRef}
              className="absolute hidden bg-[#1f2937] border border-[#374151] rounded-lg px-2.5 py-1.5 shadow-xl pointer-events-none z-10"
            />

            {/* Legend */}
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-[10px] text-[#6b7280]">Active Vehicle</span>
                <div className="w-2.5 h-2.5 rounded-full bg-red-400 ml-3" />
                <span className="text-[10px] text-[#6b7280]">Emergency</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-[#6b7280] mr-1">Low</span>
                <div className="w-24 h-2.5 rounded-sm" style={{ background: 'linear-gradient(to right, #064e3b, #10b981, #f59e0b, #ef4444)' }} />
                <span className="text-[10px] text-[#6b7280] ml-1">High</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getHeatColor(intensity: number): string {
  if (intensity === 0) return '#0d1320';
  if (intensity < 0.2) {
    const t = intensity / 0.2;
    return `rgb(${lerp(13, 16, t)}, ${lerp(19, 185, t)}, ${lerp(32, 129, t)})`;
  }
  if (intensity < 0.5) {
    const t = (intensity - 0.2) / 0.3;
    return `rgb(${lerp(16, 245, t)}, ${lerp(185, 158, t)}, ${lerp(129, 11, t)})`;
  }
  const t = Math.min((intensity - 0.5) / 0.5, 1);
  return `rgb(${lerp(245, 239, t)}, ${lerp(158, 68, t)}, ${lerp(11, 68, t)})`;
}

function lerp(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}
