'use client';

import React, { useRef, useEffect, useMemo, useCallback, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useFleetStore } from '@/store/fleet-store';

const GRID_COLS = 30;
const GRID_ROWS = 20;

const REGION_NAMES = [
  'SoMa', 'Mission', 'Castro', 'Haight', 'Richmond',
  'Sunset', 'Dogpatch', 'Potrero', 'Bayview', 'Excelsior',
  'Marina', 'Nob Hill', 'Tenderloin', 'Chinatown', 'North Beach',
  'Financial', 'Embarcadero', 'Presidio', 'Park Merced', 'Oceanview',
];

// Solid color bands — no gradients, clean discrete steps
const HEAT_COLORS = [
  '#0a0a0a', // 0: empty
  '#0f2b1a', // 1: very low — dark green
  '#164e2b', // 2: low — green
  '#1a7a3d', // 3: moderate — brighter green
  '#f59e0b', // 4: high — solid amber
  '#ef4444', // 5: critical — solid red
];

function getHeatColor(intensity: number): string {
  if (intensity <= 0) return HEAT_COLORS[0];
  if (intensity < 0.15) return HEAT_COLORS[1];
  if (intensity < 0.3) return HEAT_COLORS[2];
  if (intensity < 0.5) return HEAT_COLORS[3];
  if (intensity < 0.75) return HEAT_COLORS[4];
  return HEAT_COLORS[5];
}

export default function EventHeatmap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const events = useFleetStore((s) => s.events);
  const vehicles = useFleetStore((s) => s.vehicles);
  const [isReady, setIsReady] = useState(false);

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

    // Add vehicle presence (lighter weight)
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

    // Guard against zero-width containers (can happen during tab transitions)
    if (w < 10) return;

    const h = Math.max(360, Math.min(480, w * 0.5));

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
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, w, h);

    // Draw grid cells with solid colors
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const density = gridData[row][col];
        const intensity = Math.min(density / maxDensity, 1);
        const color = getHeatColor(intensity);

        ctx.fillStyle = color;
        ctx.fillRect(col * cellW + 1, row * cellH + 1, cellW - 2, cellH - 2);

        // Subtle grid border
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 1;
        ctx.strokeRect(col * cellW, row * cellH, cellW, cellH);
      }
    }

    // Draw vehicle dots
    const SF_BAY = { latMin: 37.6, latMax: 37.85, lngMin: -122.55, lngMax: -122.3 };
    vehicles.forEach((v) => {
      const x = ((v.gps.lng - SF_BAY.lngMin) / (SF_BAY.lngMax - SF_BAY.lngMin)) * w;
      const y = ((v.gps.lat - SF_BAY.latMin) / (SF_BAY.latMax - SF_BAY.latMin)) * h;

      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      // Use solid colors: red for emergency, white for active, gray for others
      ctx.fillStyle = v.status === 'emergency_stop' ? '#ef4444' : v.status === 'active' ? '#ffffff' : '#4b5563';
      ctx.fill();
    });
  }, [gridData, maxDensity, vehicles]);

  // Draw after mount + a frame delay to handle AnimatePresence sizing
  useEffect(() => {
    setIsReady(false);
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        drawHeatmap();
        setIsReady(true);
      });
    });

    const handleResize = () => drawHeatmap();
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', handleResize);
    };
  }, [drawHeatmap]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const tooltip = tooltipRef.current;
    if (!canvas || !tooltip || !isReady) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const col = Math.floor((x / rect.width) * GRID_COLS);
    const row = Math.floor((y / rect.height) * GRID_ROWS);

    if (row >= 0 && row < GRID_ROWS && col >= 0 && col < GRID_COLS) {
      const density = gridData[row][col];
      const regionName = REGION_NAMES[(row * GRID_COLS + col) % REGION_NAMES.length];
      const intensity = Math.min(density / maxDensity, 1);
      const levelLabel = intensity <= 0 ? 'Clear' : intensity < 0.15 ? 'Minimal' : intensity < 0.3 ? 'Low' : intensity < 0.5 ? 'Moderate' : intensity < 0.75 ? 'High' : 'Critical';

      tooltip.style.display = 'block';
      tooltip.style.left = `${x + 12}px`;
      tooltip.style.top = `${y - 8}px`;
      tooltip.innerHTML = `
        <div style="color:#f3f4f6;font-size:12px;font-weight:500;">${regionName}</div>
        <div style="color:#9ca3af;font-size:11px;">Density: ${density.toFixed(1)} — ${levelLabel}</div>
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
        <h2 className="text-lg font-semibold text-white">Event Heatmap</h2>
        <p className="text-sm text-[#9ca3af] mt-1">
          Geographic event density — San Francisco Bay Area
        </p>
      </div>

      <Card className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg">
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
              className="absolute hidden bg-[#1a1a1a] border border-[#333] rounded-md px-2.5 py-1.5 shadow-xl pointer-events-none z-10"
            />

            {/* Legend — solid color blocks */}
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-white" />
                  <span className="text-xs text-[#9ca3af]">Active</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
                  <span className="text-xs text-[#9ca3af]">Emergency</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#4b5563]" />
                  <span className="text-xs text-[#9ca3af]">Idle</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-[#9ca3af]">Low</span>
                <div className="flex gap-0.5">
                  <div className="w-5 h-2.5 rounded-sm" style={{ backgroundColor: '#0f2b1a' }} />
                  <div className="w-5 h-2.5 rounded-sm" style={{ backgroundColor: '#164e2b' }} />
                  <div className="w-5 h-2.5 rounded-sm" style={{ backgroundColor: '#1a7a3d' }} />
                  <div className="w-5 h-2.5 rounded-sm" style={{ backgroundColor: '#f59e0b' }} />
                  <div className="w-5 h-2.5 rounded-sm" style={{ backgroundColor: '#ef4444' }} />
                </div>
                <span className="text-xs text-[#9ca3af]">High</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
