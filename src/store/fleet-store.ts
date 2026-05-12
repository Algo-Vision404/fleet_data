// Fleet Store - Zustand state management for fleet data

import { create } from 'zustand';
import type { Vehicle } from '@/lib/fleet-simulator';
import type { FleetEvent } from '@/lib/event-detector';
import type { PrioritizedEvent } from '@/lib/prioritization-engine';
import type { PipelineStage } from '@/lib/pipeline-engine';

export interface SystemMetrics {
  totalEventsProcessed: number;
  eventsPerSecond: number;
  avgLatencyMs: number;
  pipelineHealth: number;
  activeVehicles: number;
  alertCount: number;
  dataIngestedGB: number;
  uptimeSeconds: number;
}

export interface ThroughputDataPoint {
  time: string;
  eps: number;
}

export interface LatencyDataPoint {
  time: string;
  p50: number;
  p95: number;
  p99: number;
}

export interface DisengagementDataPoint {
  time: string;
  rate: number;
  threshold: number;
}

export interface DriftDataPoint {
  time: string;
  actual: number;
  expected: number;
}

export interface RegionData {
  region: string;
  anomalies: number;
}

export interface FleetStore {
  vehicles: Vehicle[];
  events: FleetEvent[];
  prioritizedEvents: PrioritizedEvent[];
  pipelineStages: PipelineStage[];
  systemMetrics: SystemMetrics;
  isSimulationRunning: boolean;
  activeTab: string;

  // Time series data
  throughputHistory: ThroughputDataPoint[];
  latencyHistory: LatencyDataPoint[];
  disengagementHistory: DisengagementDataPoint[];
  driftHistory: DriftDataPoint[];
  regionAnomalies: RegionData[];

  // Actions
  updateVehicles: (vehicles: Vehicle[]) => void;
  addEvents: (events: FleetEvent[]) => void;
  addPrioritizedEvents: (events: PrioritizedEvent[]) => void;
  updatePipeline: (stages: PipelineStage[]) => void;
  updateMetrics: (metrics: SystemMetrics) => void;
  toggleSimulation: () => void;
  acknowledgeEvent: (eventId: string) => void;
  setActiveTab: (tab: string) => void;
  addThroughputPoint: (point: ThroughputDataPoint) => void;
  addLatencyPoint: (point: LatencyDataPoint) => void;
  addDisengagementPoint: (point: DisengagementDataPoint) => void;
  addDriftPoint: (point: DriftDataPoint) => void;
  updateRegionAnomalies: (regions: RegionData[]) => void;
}

export const useFleetStore = create<FleetStore>((set) => ({
  vehicles: [],
  events: [],
  prioritizedEvents: [],
  pipelineStages: [],
  systemMetrics: {
    totalEventsProcessed: 0,
    eventsPerSecond: 0,
    avgLatencyMs: 0,
    pipelineHealth: 0,
    activeVehicles: 0,
    alertCount: 0,
    dataIngestedGB: 0,
    uptimeSeconds: 0,
  },
  isSimulationRunning: false,
  activeTab: 'overview',

  throughputHistory: [],
  latencyHistory: [],
  disengagementHistory: [],
  driftHistory: [],
  regionAnomalies: [],

  updateVehicles: (vehicles) => set({ vehicles }),

  addEvents: (newEvents) =>
    set((state) => ({
      events: [...newEvents, ...state.events].slice(0, 100),
      systemMetrics: {
        ...state.systemMetrics,
        totalEventsProcessed: state.systemMetrics.totalEventsProcessed + newEvents.length,
        alertCount: [...newEvents, ...state.events].filter(
          (e) => e.severity === 'critical' && !e.acknowledged
        ).length,
      },
    })),

  addPrioritizedEvents: (newEvents) =>
    set((state) => ({
      prioritizedEvents: [...newEvents, ...state.prioritizedEvents]
        .sort((a, b) => b.priorityScore - a.priorityScore)
        .slice(0, 50),
    })),

  updatePipeline: (stages) => set({ pipelineStages: stages }),

  updateMetrics: (metrics) =>
    set((state) => ({
      systemMetrics: { ...state.systemMetrics, ...metrics },
    })),

  toggleSimulation: () =>
    set((state) => ({ isSimulationRunning: !state.isSimulationRunning })),

  acknowledgeEvent: (eventId) =>
    set((state) => ({
      events: state.events.map((e) =>
        e.eventId === eventId ? { ...e, acknowledged: true } : e
      ),
      prioritizedEvents: state.prioritizedEvents.map((e) =>
        e.eventId === eventId ? { ...e, acknowledged: true } : e
      ),
    })),

  setActiveTab: (tab) => set({ activeTab: tab }),

  addThroughputPoint: (point) =>
    set((state) => ({
      throughputHistory: [...state.throughputHistory.slice(-59), point],
    })),

  addLatencyPoint: (point) =>
    set((state) => ({
      latencyHistory: [...state.latencyHistory.slice(-59), point],
    })),

  addDisengagementPoint: (point) =>
    set((state) => ({
      disengagementHistory: [...state.disengagementHistory.slice(-59), point],
    })),

  addDriftPoint: (point) =>
    set((state) => ({
      driftHistory: [...state.driftHistory.slice(-59), point],
    })),

  updateRegionAnomalies: (regions) => set({ regionAnomalies: regions }),
}));
