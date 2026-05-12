'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import FleetOverview from '@/components/dashboard/FleetOverview';
import LiveTelemetryFeed from '@/components/dashboard/LiveTelemetryFeed';
import VehicleGrid from '@/components/dashboard/VehicleGrid';
import EventTimeline from '@/components/dashboard/EventTimeline';
import EventHeatmap from '@/components/dashboard/EventHeatmap';
import DataPipeline from '@/components/dashboard/DataPipeline';
import PrioritizationPanel from '@/components/dashboard/PrioritizationPanel';
import ObservabilityStack from '@/components/dashboard/ObservabilityStack';
import DisengagementChart, {
  DriftIndicators,
  GeographicAnomalies,
} from '@/components/dashboard/DisengagementChart';
import { useFleetStore } from '@/store/fleet-store';
import { initializeVehicles, startSimulation } from '@/lib/fleet-simulator';
import { detectEvents } from '@/lib/event-detector';
import {
  prioritizeEvent,
  updateHistoricalContext,
  resetHistoricalContext,
} from '@/lib/prioritization-engine';
import {
  initializePipeline,
  updatePipeline,
  getPipelineState,
} from '@/lib/pipeline-engine';
import {
  generateSyntheticPrioritizedEvents,
} from '@/lib/synthetic-data';
import type { Vehicle } from '@/lib/fleet-simulator';

const stopSimulationRef = { current: null as (() => void) | null };
const metricsIntervalRef = { current: null as ReturnType<typeof setInterval> | null };
const pipelineIntervalRef = { current: null as ReturnType<typeof setInterval> | null };
const startTimeRef = { current: Date.now() };

function clearAllIntervals() {
  if (stopSimulationRef.current) {
    stopSimulationRef.current();
    stopSimulationRef.current = null;
  }
  if (metricsIntervalRef.current) {
    clearInterval(metricsIntervalRef.current);
    metricsIntervalRef.current = null;
  }
  if (pipelineIntervalRef.current) {
    clearInterval(pipelineIntervalRef.current);
    pipelineIntervalRef.current = null;
  }
}

function beginSimulations(vehicles: Vehicle[]) {
  clearAllIntervals();

  // Start fleet simulation
  const stop = startSimulation(
    () => useFleetStore.getState().vehicles,
    (updated) => useFleetStore.getState().updateVehicles(updated),
    (updatedVehicles, previousVehicles) => {
      const state = useFleetStore.getState();
      if (!state.isSimulationRunning) return;

      // Detect events
      const newEvents: ReturnType<typeof detectEvents>[] = [];
      updatedVehicles.forEach((v, i) => {
        if (i < previousVehicles.length) {
          const detected = detectEvents(v, previousVehicles[i]);
          newEvents.push(...detected);
        }
      });

      if (newEvents.length > 0) {
        state.addEvents(newEvents);

        const prioritized = newEvents.map((e) => {
          updateHistoricalContext(e.type);
          return prioritizeEvent(e);
        });
        state.addPrioritizedEvents(prioritized);
      }
    }
  );
  stopSimulationRef.current = stop;

  // Metrics update interval (every 2 seconds)
  metricsIntervalRef.current = setInterval(() => {
    const state = useFleetStore.getState();
    if (!state.isSimulationRunning) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const recentEvents = state.events.filter(
      (e) => Date.now() - e.timestamp.getTime() < 2000
    );
    const eps = recentEvents.length / 2;

    let pipelineState;
    try {
      pipelineState = getPipelineState();
    } catch {
      pipelineState = { stages: [], overallHealth: 0 };
    }
    const avgLatency =
      pipelineState.stages.length > 0
        ? pipelineState.stages.reduce((s, st) => s + st.latency, 0) /
          pipelineState.stages.length
        : 0;

    const uptime = Math.floor((Date.now() - startTimeRef.current) / 1000);

    state.updateMetrics({
      eventsPerSecond: eps,
      avgLatencyMs: avgLatency,
      pipelineHealth: pipelineState.overallHealth,
      activeVehicles: state.vehicles.filter((v) => v.status === 'active').length,
      dataIngestedGB: state.systemMetrics.dataIngestedGB + eps * 0.0001,
      uptimeSeconds: uptime,
    });

    state.addThroughputPoint({ time: timeStr, eps: Math.round(eps * 10) / 10 });

    state.addLatencyPoint({
      time: timeStr,
      p50: Math.round(avgLatency * 0.8 * 10) / 10,
      p95: Math.round(avgLatency * 1.2 * 10) / 10,
      p99: Math.round(avgLatency * 1.8 * 10) / 10,
    });

    const totalDisengagements = state.vehicles.reduce(
      (s, v) => s + v.disengagementCount,
      0
    );
    const totalMiles = state.vehicles.reduce((s, v) => s + v.totalMiles, 0) || 1;
    state.addDisengagementPoint({
      time: timeStr,
      rate: Math.round(((totalDisengagements / totalMiles) * 1000) * 100) / 100,
      threshold: 2.5,
    });

    const driftBase = 88 + (Math.sin(Date.now() / 10000) * 4) + (Math.cos(Date.now() / 7000) * 2);
    state.addDriftPoint({
      time: timeStr,
      actual: Math.round(driftBase * 10) / 10,
      expected: 92,
    });

    const regionSeeds = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const regionNames = [
      'SoMa', 'Mission', 'Castro', 'Haight', 'Richmond',
      'Sunset', 'Dogpatch', 'Potrero', 'Bayview', 'Marina',
    ];
    const regions = regionNames.map((region, idx) => ({
      region,
      anomalies: 2 + Math.floor(Math.abs(Math.sin(Date.now() / 5000 + regionSeeds[idx])) * 18),
    }));
    state.updateRegionAnomalies(regions);
  }, 2000);

  // Pipeline update interval
  pipelineIntervalRef.current = setInterval(() => {
    const state = useFleetStore.getState();
    if (!state.isSimulationRunning) return;

    const eventCount = Math.floor(Math.random() * 10) + 1;
    const updated = updatePipeline(eventCount);
    state.updatePipeline(updated.stages);
    state.updateMetrics({ pipelineHealth: updated.overallHealth });
  }, 3000);
}

export default function Home() {
  const store = useFleetStore();

  const handleToggleSimulation = useCallback(() => {
    store.toggleSimulation();
  }, [store]);

  const handleRestart = useCallback(() => {
    clearAllIntervals();
    resetHistoricalContext();
    startTimeRef.current = Date.now();

    const vehicles = initializeVehicles(50);
    store.updateVehicles(vehicles);

    const pipeline = initializePipeline();
    store.updatePipeline(pipeline.stages);
    store.updateMetrics({
      pipelineHealth: pipeline.overallHealth,
      activeVehicles: vehicles.filter((v) => v.status === 'active').length,
      eventsPerSecond: 0,
      avgLatencyMs: 0,
      totalEventsProcessed: 0,
      alertCount: 0,
      dataIngestedGB: 0,
      uptimeSeconds: 0,
    });

    if (store.isSimulationRunning) {
      beginSimulations(vehicles);
    }
  }, [store]);

  // Initialize on mount — fetch all data from backend API
  useEffect(() => {
    let cancelled = false;

    async function loadInitialData() {
      try {
        // Fetch fleet, events, metrics, pipeline, analytics in parallel
        const [fleetRes, eventsRes, metricsRes, pipelineRes, analyticsRes] = await Promise.all([
          fetch('/api/fleet'),
          fetch('/api/events?limit=50'),
          fetch('/api/metrics'),
          fetch('/api/pipeline'),
          fetch('/api/analytics'),
        ]);

        if (cancelled) return;

        const fleetData = await fleetRes.json();
        const eventsData = await eventsRes.json();
        const metricsData = await metricsRes.json();
        const pipelineData = await pipelineRes.json();
        const analyticsData = await analyticsRes.json();

        if (cancelled) return;

        // Hydrate the store — rehydrate Date fields from JSON strings
        if (fleetData?.vehicles) {
          const vehicles = fleetData.vehicles.map((v: any) => ({
            ...v,
            lastUpdated: new Date(v.lastUpdated),
          }));
          store.updateVehicles(vehicles);
        }

        if (eventsData?.events) {
          const events = eventsData.events.map((e: any) => ({
            ...e,
            timestamp: new Date(e.timestamp),
          }));
          store.addEvents(events);
          store.addPrioritizedEvents(generateSyntheticPrioritizedEvents(events));
        }

        if (pipelineData?.stages) {
          store.updatePipeline(pipelineData.stages);
        }

        store.updateMetrics({
          ...metricsData,
          pipelineHealth: pipelineData?.overallHealth ?? 0,
        });

        if (analyticsData) {
          if (analyticsData.throughput) store.addThroughputPoints(analyticsData.throughput);
          if (analyticsData.latency) store.addLatencyPoints(analyticsData.latency);
          if (analyticsData.disengagement) store.addDisengagementPoints(analyticsData.disengagement);
          if (analyticsData.drift) store.addDriftPoints(analyticsData.drift);
          if (analyticsData.regionAnomalies) store.updateRegionAnomalies(analyticsData.regionAnomalies);
        }
      } catch (err) {
        console.error('Failed to load initial data from API:', err);
      }
    }

    loadInitialData();

    return () => {
      cancelled = true;
      clearAllIntervals();
    };
  }, []);

  // Start/stop simulation based on state
  useEffect(() => {
    if (store.isSimulationRunning) {
      beginSimulations(store.vehicles);
    } else {
      clearAllIntervals();
    }
  }, [store.isSimulationRunning]);

  const renderContent = () => {
    switch (store.activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <FleetOverview />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <LiveTelemetryFeed />
              <EventTimeline />
            </div>
          </div>
        );
      case 'fleet':
        return (
          <div className="space-y-6">
            <VehicleGrid />
            <EventHeatmap />
          </div>
        );
      case 'events':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-white">Events</h2>
              <p className="text-sm text-[#9ca3af] mt-1">
                Detected safety events, timeline view and geographic density
              </p>
            </div>
            <EventTimeline />
            <EventHeatmap />
          </div>
        );
      case 'pipeline':
        return <DataPipeline />;
      case 'observability':
        return <ObservabilityStack />;
      case 'analytics':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white">Analytics Dashboard</h2>
              <p className="text-sm text-[#6b7280] mt-0.5">
                Historical trends and model performance metrics
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DisengagementChart />
              <DriftIndicators />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GeographicAnomalies />
              <PrioritizationPanel />
            </div>
          </div>
        );
      default:
        return <FleetOverview />;
    }
  };

  return (
    <DashboardLayout
      onToggleSimulation={handleToggleSimulation}
      onRestart={handleRestart}
    >
      {renderContent()}
    </DashboardLayout>
  );
}
