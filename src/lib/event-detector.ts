// Event Detector - Analyzes telemetry changes and detects events

import type { Vehicle } from './fleet-simulator';

export type EventSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface FleetEvent {
  eventId: string;
  vehicleId: string;
  type: string;
  severity: EventSeverity;
  timestamp: Date;
  location: { lat: number; lng: number };
  description: string;
  metadata: Record<string, unknown>;
  acknowledged: boolean;
}

let eventCounter = 0;

function generateEventId(): string {
  eventCounter++;
  return `EVT-${String(eventCounter).padStart(6, '0')}`;
}

function generateEventIdForType(type: string): string {
  const prefix: Record<string, string> = {
    near_collision: 'NC',
    harsh_braking: 'HB',
    lane_drift: 'LD',
    phantom_braking: 'PB',
    occlusion: 'OC',
    unusual_pedestrian: 'UP',
    disengagement: 'DG',
    collision: 'CL',
    intervention: 'IV',
  };
  eventCounter++;
  return `EVT-${prefix[type] || 'XX'}-${String(eventCounter).padStart(4, '0')}`;
}

export function detectEvents(
  vehicle: Vehicle,
  previousState: Vehicle
): FleetEvent[] {
  const events: FleetEvent[] = [];
  const baseEvent = {
    vehicleId: vehicle.vehicleId,
    timestamp: new Date(),
    location: { lat: vehicle.gps.lat, lng: vehicle.gps.lng },
    acknowledged: false,
  };

  // 1. Near collision: speed change > 15 mph/s AND simulated object proximity
  const speedDelta = Math.abs(vehicle.speed - previousState.speed);
  if (speedDelta > 15 && Math.random() < 0.3) {
    events.push({
      ...baseEvent,
      eventId: generateEventIdForType('near_collision'),
      type: 'near_collision',
      severity: 'critical',
      description: `Near collision detected for ${vehicle.vehicleId} — rapid speed change of ${speedDelta.toFixed(1)} mph/s with object proximity < 10m`,
      metadata: {
        speedChange: speedDelta,
        proximity: randomBetween(2, 9),
        estimatedTimeToCollision: randomBetween(0.5, 2.5),
      },
    });
  }

  // 2. Harsh braking: brake pressure > 80% AND deceleration < -4 m/s²
  if (vehicle.brakePressure > 80 && vehicle.acceleration < -4) {
    events.push({
      ...baseEvent,
      eventId: generateEventIdForType('harsh_braking'),
      type: 'harsh_braking',
      severity: vehicle.acceleration < -5 ? 'critical' : 'high',
      description: `Harsh braking on ${vehicle.vehicleId} — pressure at ${vehicle.brakePressure.toFixed(0)}%, deceleration ${vehicle.acceleration.toFixed(1)} m/s²`,
      metadata: {
        brakePressure: vehicle.brakePressure,
        deceleration: vehicle.acceleration,
        duration: randomBetween(0.3, 1.5),
      },
    });
  }

  // 3. Lane drift: lane position > 0.6 or < -0.6
  if (Math.abs(vehicle.lanePosition) > 0.6 && Math.random() < 0.4) {
    events.push({
      ...baseEvent,
      eventId: generateEventIdForType('lane_drift'),
      type: 'lane_drift',
      severity: Math.abs(vehicle.lanePosition) > 0.8 ? 'high' : 'medium',
      description: `Lane drift detected on ${vehicle.vehicleId} — position offset ${vehicle.lanePosition.toFixed(2)} from center`,
      metadata: {
        lanePosition: vehicle.lanePosition,
        roadType: vehicle.roadType,
        speed: vehicle.speed,
        weather: vehicle.weather,
      },
    });
  }

  // 4. Phantom braking: brake pressure > 40% with no obstacle (simulated)
  if (vehicle.brakePressure > 40 && vehicle.brakePressure < 70 && Math.random() < 0.15) {
    events.push({
      ...baseEvent,
      eventId: generateEventIdForType('phantom_braking'),
      type: 'phantom_braking',
      severity: 'medium',
      description: `Phantom braking on ${vehicle.vehicleId} — ${vehicle.brakePressure.toFixed(0)}% brake with no obstacle detected`,
      metadata: {
        brakePressure: vehicle.brakePressure,
        obstacleDetected: false,
        confidence: randomBetween(0.7, 0.95),
      },
    });
  }

  // 5. Occlusion: lidarStatus === 'degraded' in urban area
  if (vehicle.lidarStatus === 'degraded' && vehicle.roadType === 'urban' && Math.random() < 0.5) {
    events.push({
      ...baseEvent,
      eventId: generateEventIdForType('occlusion'),
      type: 'occlusion',
      severity: 'high',
      description: `Sensor occlusion on ${vehicle.vehicleId} — degraded lidar in ${vehicle.roadType} environment`,
      metadata: {
        lidarStatus: vehicle.lidarStatus,
        roadType: vehicle.roadType,
        visibility: randomBetween(10, 40),
      },
    });
  }

  // 6. Unusual pedestrian: simulated pedestrian detection
  if (vehicle.roadType === 'urban' && vehicle.speed < 30 && Math.random() < 0.08) {
    events.push({
      ...baseEvent,
      eventId: generateEventIdForType('unusual_pedestrian'),
      type: 'unusual_pedestrian',
      severity: 'high',
      description: `Unusual pedestrian detected near ${vehicle.vehicleId} — pedestrian outside crosswalk in vehicle path`,
      metadata: {
        pedestrianPosition: randomBetween(-5, 5),
        inCrosswalk: false,
        vehicleSpeed: vehicle.speed,
        distance: randomBetween(5, 20),
      },
    });
  }

  // 7. Disengagement: autopilotMode changed to 'off' suddenly
  if (vehicle.autopilotMode === 'off' && previousState.autopilotMode !== 'off') {
    events.push({
      ...baseEvent,
      eventId: generateEventIdForType('disengagement'),
      type: 'disengagement',
      severity: 'medium',
      description: `Autopilot disengaged on ${vehicle.vehicleId} — mode changed from ${previousState.autopilotMode} to off`,
      metadata: {
        previousMode: previousState.autopilotMode,
        totalDisengagements: vehicle.disengagementCount,
        totalMiles: vehicle.totalMiles,
        weather: vehicle.weather,
      },
    });
  }

  // 8. Collision: extreme deceleration + speed drop (rare)
  if (vehicle.acceleration < -8 && speedDelta > 30 && Math.random() < 0.1) {
    events.push({
      ...baseEvent,
      eventId: generateEventIdForType('collision'),
      type: 'collision',
      severity: 'critical',
      description: `COLLISION detected on ${vehicle.vehicleId} — impact with extreme deceleration ${vehicle.acceleration.toFixed(1)} m/s²`,
      metadata: {
        deceleration: vehicle.acceleration,
        speedBeforeImpact: previousState.speed,
        speedAfterImpact: vehicle.speed,
        airbagDeployed: Math.random() > 0.3,
      },
    });
  }

  // 9. Intervention: driver took control (autopilot mode changed from non-off)
  if (vehicle.autopilotMode === 'off' && previousState.autopilotMode !== 'off' && Math.random() < 0.5) {
    events.push({
      ...baseEvent,
      eventId: generateEventIdForType('intervention'),
      type: 'intervention',
      severity: 'low',
      description: `Driver intervention on ${vehicle.vehicleId} — manual control assumed from ${previousState.autopilotMode} mode`,
      metadata: {
        previousMode: previousState.autopilotMode,
        reason: pickRandom(['Comfort preference', 'Uncertain situation', 'Construction zone', 'Emergency vehicle nearby']),
      },
    });
  }

  return events;
}

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
