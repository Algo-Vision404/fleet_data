// Synthetic Data Generator - Pre-populates the dashboard with realistic fleet data
// Uses deterministic values (no Math.random) to avoid hydration mismatches.

import type { Vehicle } from './fleet-simulator';
import type { FleetEvent } from './event-detector';
import type { PrioritizedEvent } from '@/lib/prioritization-engine';
import type { PipelineStage } from './pipeline-engine';
import type {
  ThroughputDataPoint,
  LatencyDataPoint,
  DisengagementDataPoint,
  DriftDataPoint,
  RegionData,
  SystemMetrics,
} from '@/store/fleet-store';

// --- Deterministic "random" helpers based on index seed ---
function seeded(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

function sBetween(seed: number, min: number, max: number): number {
  return min + seeded(seed) * (max - min);
}

function sPick<T>(seed: number, arr: T[]): T {
  return arr[Math.floor(seeded(seed) * arr.length)];
}

function sRound(val: number, decimals: number): number {
  const f = Math.pow(10, decimals);
  return Math.round(val * f) / f;
}

// --- Vehicle Types ---
type VStatus = Vehicle['status'];
type VWeather = Vehicle['weather'];
type VRoadType = Vehicle['roadType'];
type VLidar = Vehicle['lidarStatus'];
type VAuto = Vehicle['autopilotMode'];

const MODELS = ['Atlas Pro', 'Nexus S', 'Sentinel X', 'Voyager M', 'Pinnacle R'];
const STATUSES: VStatus[] = ['active', 'active', 'active', 'idle', 'charging', 'maintenance'];
const WEATHERS: VWeather[] = ['clear', 'clear', 'clear', 'rain', 'fog', 'overcast', 'snow'];
const ROADS: VRoadType[] = ['highway', 'urban', 'residential', 'industrial'];
const LIDARS: VLidar[] = ['active', 'active', 'active', 'active', 'active', 'degraded'];
const AUTOS: VAuto[] = ['highway', 'urban', 'parking'];

// --- Generate 50 vehicles with deterministic telemetry ---
export function generateSyntheticVehicles(count: number = 50): Vehicle[] {
  const now = new Date();
  const vehicles: Vehicle[] = [];

  for (let i = 0; i < count; i++) {
    const id = `AV-${String(i + 1).padStart(3, '0')}`;
    const s = i * 7; // unique seed per vehicle
    const status = sPick<VStatus>(s, STATUSES);
    const isActive = status === 'active';
    const speed = isActive ? sBetween(s + 1, 5, 72) : sBetween(s + 1, 0, 5);
    const roadType = speed > 45 ? 'highway' : speed > 25 ? 'urban' : sPick<VRoadType>(s + 6, ROADS);

    vehicles.push({
      vehicleId: id,
      model: sPick(s + 2, MODELS),
      status,
      speed: sRound(speed, 1),
      steeringAngle: sRound(sBetween(s + 3, -25, 25), 1),
      lanePosition: sRound(sBetween(s + 4, -0.6, 0.6), 2),
      brakePressure: sRound(sBetween(s + 5, 0, isActive ? 55 : 10), 0),
      acceleration: sRound(sBetween(s + 6, isActive ? -2 : 0, isActive ? 2 : 0), 1),
      gps: {
        lat: sRound(sBetween(s + 7, 37.62, 37.83), 4),
        lng: sRound(sBetween(s + 8, -122.52, -122.32), 4),
      },
      weather: sPick<VWeather>(s + 9, WEATHERS),
      temperature: sRound(sBetween(s + 10, 6, 32), 0),
      roadType,
      cameraCount: 6 + Math.floor(seeded(s + 11) * 7),
      lidarStatus: sPick<VLidar>(s + 12, LIDARS),
      disengagementCount: Math.floor(sBetween(s + 13, 0, 14)),
      totalMiles: sRound(sBetween(s + 14, 200, 48000), 0),
      batteryLevel: sRound(sBetween(s + 15, 18, 98), 0),
      autopilotMode: status === 'active' ? sPick<VAuto>(s + 16, AUTOS) : 'off',
      lastUpdated: new Date(now.getTime() - i * 60000),
    });
  }

  return vehicles;
}

// --- Generate synthetic events ---
const EVENT_TEMPLATES: Array<{
  type: FleetEvent['type'];
  severity: FleetEvent['severity'];
  desc: (vid: string) => string;
  meta: (vid: string) => Record<string, unknown>;
}> = [
  {
    type: 'near_collision',
    severity: 'critical',
    desc: (v) => `Near collision detected for ${v} — rapid speed change of 18.3 mph/s with object proximity at 6.2m`,
    meta: () => ({ speedChange: 18.3, proximity: 6.2, estimatedTimeToCollision: 1.4 }),
  },
  {
    type: 'harsh_braking',
    severity: 'high',
    desc: (v) => `Harsh braking on ${v} — pressure at 92%, deceleration -5.1 m/s²`,
    meta: () => ({ brakePressure: 92, deceleration: -5.1, duration: 0.8 }),
  },
  {
    type: 'harsh_braking',
    severity: 'critical',
    desc: (v) => `Emergency braking on ${v} — pressure at 98%, deceleration -7.2 m/s²`,
    meta: () => ({ brakePressure: 98, deceleration: -7.2, duration: 1.3 }),
  },
  {
    type: 'lane_drift',
    severity: 'medium',
    desc: (v) => `Lane drift detected on ${v} — position offset 0.72 from center`,
    meta: (v) => ({ lanePosition: 0.72, roadType: 'highway', speed: 58, weather: 'clear' }),
  },
  {
    type: 'lane_drift',
    severity: 'high',
    desc: (v) => `Severe lane drift on ${v} — position offset 0.89 from center in rain`,
    meta: () => ({ lanePosition: 0.89, roadType: 'highway', speed: 62, weather: 'rain' }),
  },
  {
    type: 'phantom_braking',
    severity: 'medium',
    desc: (v) => `Phantom braking on ${v} — 52% brake with no obstacle detected`,
    meta: () => ({ brakePressure: 52, obstacleDetected: false, confidence: 0.87 }),
  },
  {
    type: 'occlusion',
    severity: 'high',
    desc: (v) => `Sensor occlusion on ${v} — degraded lidar in urban environment near construction`,
    meta: () => ({ lidarStatus: 'degraded', roadType: 'urban', visibility: 22 }),
  },
  {
    type: 'unusual_pedestrian',
    severity: 'high',
    desc: (v) => `Unusual pedestrian detected near ${v} — pedestrian outside crosswalk in vehicle path at 14m`,
    meta: () => ({ pedestrianPosition: 2.3, inCrosswalk: false, vehicleSpeed: 22, distance: 14 }),
  },
  {
    type: 'unusual_pedestrian',
    severity: 'critical',
    desc: (v) => `Pedestrian incursion near ${v} — jaywalking pedestrian entered vehicle path at 8m`,
    meta: () => ({ pedestrianPosition: -1.1, inCrosswalk: false, vehicleSpeed: 28, distance: 8 }),
  },
  {
    type: 'disengagement',
    severity: 'medium',
    desc: (v) => `Autopilot disengaged on ${v} — mode changed from highway to off`,
    meta: () => ({ previousMode: 'highway', totalDisengagements: 7, weather: 'fog' }),
  },
  {
    type: 'collision',
    severity: 'critical',
    desc: (v) => `COLLISION detected on ${v} — impact with extreme deceleration -9.4 m/s²`,
    meta: () => ({ deceleration: -9.4, speedBeforeImpact: 34, speedAfterImpact: 0, airbagDeployed: true }),
  },
  {
    type: 'intervention',
    severity: 'low',
    desc: (v) => `Driver intervention on ${v} — manual control assumed from urban mode (construction zone)`,
    meta: () => ({ previousMode: 'urban', reason: 'Construction zone' }),
  },
  {
    type: 'near_collision',
    severity: 'high',
    desc: (v) => `Near miss for ${v} — pedestrian entered roadway at intersection, TTC 2.1s`,
    meta: () => ({ speedChange: 12.5, proximity: 4.8, estimatedTimeToCollision: 2.1 }),
  },
  {
    type: 'phantom_braking',
    severity: 'low',
    desc: (v) => `Minor phantom braking on ${v} — 44% brake triggered by shadow overpass`,
    meta: () => ({ brakePressure: 44, obstacleDetected: false, confidence: 0.72 }),
  },
  {
    type: 'occlusion',
    severity: 'critical',
    desc: (v) => `Complete lidar occlusion on ${v} — sensor offline in heavy fog, fallback to camera-only`,
    meta: () => ({ lidarStatus: 'offline', roadType: 'urban', visibility: 8 }),
  },
  {
    type: 'intervention',
    severity: 'medium',
    desc: (v) => `Driver override on ${v} — took control due to emergency vehicle approaching`,
    meta: () => ({ previousMode: 'highway', reason: 'Emergency vehicle nearby' }),
  },
  {
    type: 'disengagement',
    severity: 'high',
    desc: (v) => `System-initiated disengagement on ${v} — confidence below threshold in snow conditions`,
    meta: () => ({ previousMode: 'urban', totalDisengagements: 12, weather: 'snow' }),
  },
  {
    type: 'harsh_braking',
    severity: 'medium',
    desc: (v) => `Moderate harsh braking on ${v} — 83% pressure, deceleration -4.3 m/s² at intersection`,
    meta: () => ({ brakePressure: 83, deceleration: -4.3, duration: 0.5 }),
  },
  {
    type: 'lane_drift',
    severity: 'low',
    desc: (v) => `Minor lane drift on ${v} — position offset 0.55, auto-corrected within 0.8s`,
    meta: () => ({ lanePosition: 0.55, roadType: 'residential', speed: 18, weather: 'clear' }),
  },
  {
    type: 'near_collision',
    severity: 'critical',
    desc: (v) => `Near collision with cyclist on ${v} — rapid deceleration required, proximity 3.1m`,
    meta: () => ({ speedChange: 22.7, proximity: 3.1, estimatedTimeToCollision: 0.6 }),
  },
];

export function generateSyntheticEvents(): FleetEvent[] {
  const now = Date.now();
  const events: FleetEvent[] = [];

  for (let i = 0; i < 35; i++) {
    const template = EVENT_TEMPLATES[i % EVENT_TEMPLATES.length];
    const vehicleIdx = Math.floor(seeded(i * 3 + 100) * 50);
    const vehicleId = `AV-${String(vehicleIdx + 1).padStart(3, '0')}`;
    const minutesAgo = i * 4 + Math.floor(seeded(i * 5 + 200) * 3);

    events.push({
      eventId: `EVT-${String(i + 1).padStart(6, '0')}`,
      vehicleId,
      type: template.type,
      severity: template.severity,
      timestamp: new Date(now - minutesAgo * 60000),
      location: {
        lat: sRound(sBetween(i * 7 + 300, 37.62, 37.83), 4),
        lng: sRound(sBetween(i * 7 + 301, -122.52, -122.32), 4),
      },
      description: template.desc(vehicleId),
      metadata: template.meta(vehicleId),
      acknowledged: seeded(i * 11 + 400) > 0.7, // ~30% acknowledged
    });
  }

  return events;
}

// --- Generate synthetic prioritized events ---
export function generateSyntheticPrioritizedEvents(
  events: FleetEvent[]
): PrioritizedEvent[] {
  const typeTrainingMap: Record<string, number> = {
    collision: 15, near_collision: 14, unusual_pedestrian: 13,
    occlusion: 12, phantom_braking: 11, harsh_braking: 10,
    lane_drift: 8, disengagement: 7, intervention: 5,
  };
  const severityDangerMap: Record<string, number> = {
    critical: 30, high: 20, medium: 10, low: 5,
  };
  const typeFrequency: Record<string, number> = {
    lane_drift: 1500, harsh_braking: 800, near_collision: 200,
    disengagement: 600, phantom_braking: 400, occlusion: 150,
    unusual_pedestrian: 100, collision: 15, intervention: 300,
  };
  const totalHist = 4065;

  return events
    .filter((_, i) => i < 25) // top 25 events
    .map((event, i) => {
      const freq = (typeFrequency[event.type] || 1) / totalHist;
      const rarityScore = Math.round(Math.max(0, Math.min(30, (1 - freq * 10) * 30)));
      const dangerScore = severityDangerMap[event.severity] || 5;
      const isInRecent = ['lane_drift', 'harsh_braking', 'disengagement'].includes(event.type);
      const noveltyScore = Math.round(Math.max(0, Math.min(25, isInRecent ? 5 : 18 - i * 0.3)));
      const trainingValue = typeTrainingMap[event.type] || 5;
      const priorityScore = Math.round(Math.max(0, Math.min(100, rarityScore + dangerScore + noveltyScore + trainingValue)));

      let priorityLevel: PrioritizedEvent['priorityLevel'];
      if (priorityScore >= 75) priorityLevel = 'urgent';
      else if (priorityScore >= 50) priorityLevel = 'high';
      else if (priorityScore >= 25) priorityLevel = 'normal';
      else priorityLevel = 'low';

      const recommendedAction =
        event.type === 'collision' || event.type === 'near_collision'
          ? 'Immediate review — add to critical training set'
          : event.type === 'occlusion'
          ? 'Schedule sensor fusion review — add to perception training'
          : event.type === 'phantom_braking'
          ? 'Add to false-positive training corpus'
          : event.type === 'unusual_pedestrian'
          ? 'Add to pedestrian detection edge case library'
          : event.severity === 'critical'
          ? 'Escalate to safety team — queue for priority training'
          : priorityLevel === 'urgent' || priorityLevel === 'high'
          ? 'Add to next training batch — flag for review'
          : priorityLevel === 'normal'
          ? 'Queue for standard training pipeline'
          : 'Archive for future analysis';

      return {
        ...event,
        priorityScore,
        rarityScore,
        dangerScore,
        noveltyScore,
        trainingValue,
        priorityLevel,
        recommendedAction,
      };
    })
    .sort((a, b) => b.priorityScore - a.priorityScore);
}

// --- Generate synthetic pipeline stages ---
export function generateSyntheticPipeline(): PipelineStage[] {
  const defs = [
    { id: 'ingestion', name: 'Ingestion', baseLatency: 2, baseThroughput: 500 },
    { id: 'validation', name: 'Validation', baseLatency: 5, baseThroughput: 450 },
    { id: 'transformation', name: 'Transformation', baseLatency: 15, baseThroughput: 400 },
    { id: 'enrichment', name: 'Enrichment', baseLatency: 25, baseThroughput: 350 },
    { id: 'splitting', name: 'Splitting', baseLatency: 10, baseThroughput: 420 },
    { id: 'versioning', name: 'Versioning', baseLatency: 8, baseThroughput: 380 },
    { id: 'storage', name: 'Storage', baseLatency: 30, baseThroughput: 300 },
  ];

  return defs.map((d, i) => ({
    id: d.id,
    name: d.name,
    status: 'running' as const,
    throughput: Math.round(d.baseThroughput + sBetween(i * 10, -40, 60)),
    latency: sRound(d.baseLatency + sBetween(i * 10 + 1, -2, 5), 1),
    processedCount: Math.floor(sBetween(i * 10 + 2, 8000, 52000)),
    errorCount: Math.floor(sBetween(i * 10 + 3, 0, 8)),
    backpressure: sRound(sBetween(i * 10 + 4, 2, 25), 0),
  }));
}

// --- Generate synthetic time-series data ---

// Deterministic wave function for realistic chart shapes
function wave(i: number, base: number, amplitude: number, freq: number): number {
  return sRound(base + Math.sin(i * freq) * amplitude + Math.cos(i * freq * 1.7) * amplitude * 0.3, 1);
}

export function generateSyntheticThroughput(count: number = 30): ThroughputDataPoint[] {
  const points: ThroughputDataPoint[] = [];
  const baseTime = new Date(Date.now() - count * 2000);

  for (let i = 0; i < count; i++) {
    const t = new Date(baseTime.getTime() + i * 2000);
    points.push({
      time: t.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      eps: wave(i, 8.5, 3.5, 0.4),
    });
  }
  return points;
}

export function generateSyntheticLatency(count: number = 30): LatencyDataPoint[] {
  const points: LatencyDataPoint[] = [];
  const baseTime = new Date(Date.now() - count * 2000);

  for (let i = 0; i < count; i++) {
    const t = new Date(baseTime.getTime() + i * 2000);
    const base = wave(i, 12, 3, 0.35);
    points.push({
      time: t.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      p50: sRound(base * 0.8, 1),
      p95: sRound(base * 1.2, 1),
      p99: sRound(base * 1.8, 1),
    });
  }
  return points;
}

export function generateSyntheticDisengagement(count: number = 30): DisengagementDataPoint[] {
  const points: DisengagementDataPoint[] = [];
  const baseTime = new Date(Date.now() - count * 2000);

  for (let i = 0; i < count; i++) {
    const t = new Date(baseTime.getTime() + i * 2000);
    points.push({
      time: t.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      rate: wave(i, 1.8, 0.9, 0.25),
      threshold: 2.5,
    });
  }
  return points;
}

export function generateSyntheticDrift(count: number = 30): DriftDataPoint[] {
  const points: DriftDataPoint[] = [];
  const baseTime = new Date(Date.now() - count * 2000);

  for (let i = 0; i < count; i++) {
    const t = new Date(baseTime.getTime() + i * 2000);
    // Slight downward trend in actual confidence
    const drift = 92.5 - i * 0.12 + Math.sin(i * 0.5) * 2;
    points.push({
      time: t.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      actual: sRound(drift, 1),
      expected: 92,
    });
  }
  return points;
}

export function generateSyntheticRegionAnomalies(): RegionData[] {
  const regions = [
    { region: 'SoMa', seed: 0 },
    { region: 'Mission', seed: 1 },
    { region: 'Castro', seed: 2 },
    { region: 'Haight', seed: 3 },
    { region: 'Richmond', seed: 4 },
    { region: 'Sunset', seed: 5 },
    { region: 'Dogpatch', seed: 6 },
    { region: 'Potrero', seed: 7 },
    { region: 'Bayview', seed: 8 },
    { region: 'Marina', seed: 9 },
  ];

  return regions.map(({ region, seed }) => ({
    region,
    anomalies: 2 + Math.floor(seeded(seed * 13 + 500) * 18),
  }));
}

export function generateSyntheticMetrics(): SystemMetrics {
  return {
    totalEventsProcessed: 4732,
    eventsPerSecond: 8.3,
    avgLatencyMs: 14.2,
    pipelineHealth: 91,
    activeVehicles: 38,
    alertCount: 4,
    dataIngestedGB: 12.4,
    uptimeSeconds: 4827, // ~80 minutes
  };
}
