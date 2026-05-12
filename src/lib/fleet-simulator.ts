// Fleet Simulator - Generates realistic vehicle telemetry data

export type VehicleStatus = 'active' | 'idle' | 'charging' | 'maintenance' | 'emergency_stop';
export type Weather = 'clear' | 'rain' | 'fog' | 'snow' | 'overcast';
export type RoadType = 'highway' | 'urban' | 'residential' | 'industrial';
export type LidarStatus = 'active' | 'degraded' | 'offline';
export type AutopilotMode = 'highway' | 'urban' | 'parking' | 'off';

export interface Vehicle {
  vehicleId: string;
  model: string;
  status: VehicleStatus;
  speed: number;
  steeringAngle: number;
  lanePosition: number;
  brakePressure: number;
  acceleration: number;
  gps: { lat: number; lng: number };
  weather: Weather;
  temperature: number;
  roadType: RoadType;
  cameraCount: number;
  lidarStatus: LidarStatus;
  disengagementCount: number;
  totalMiles: number;
  batteryLevel: number;
  autopilotMode: AutopilotMode;
  lastUpdated: Date;
}

const MODELS = ['Atlas Pro', 'Nexus S', 'Sentinel X', 'Voyager M', 'Pinnacle R'];
const STATUSES: VehicleStatus[] = ['active', 'idle', 'charging', 'maintenance', 'emergency_stop'];
const WEATHERS: Weather[] = ['clear', 'rain', 'fog', 'snow', 'overcast'];
const ROAD_TYPES: RoadType[] = ['highway', 'urban', 'residential', 'industrial'];
const LIDAR_STATUSES: LidarStatus[] = ['active', 'degraded', 'offline'];
const AUTOPILOT_MODES: AutopilotMode[] = ['highway', 'urban', 'parking', 'off'];

// San Francisco Bay Area region bounds
const SF_BAY = {
  latMin: 37.6,
  latMax: 37.85,
  lngMin: -122.55,
  lngMax: -122.3,
};

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function lerp(current: number, target: number, factor: number): number {
  return current + (target - current) * factor;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

let previousStates: Map<string, Vehicle> = new Map();

export function initializeVehicles(count: number = 50): Vehicle[] {
  const vehicles: Vehicle[] = [];
  previousStates.clear();

  for (let i = 0; i < count; i++) {
    const id = `AV-${String(i + 1).padStart(3, '0')}`;
    const vehicle: Vehicle = {
      vehicleId: id,
      model: pickRandom(MODELS),
      status: pickRandom(['active', 'active', 'active', 'idle', 'charging']),
      speed: randomBetween(0, 65),
      steeringAngle: randomBetween(-15, 15),
      lanePosition: randomBetween(-0.3, 0.3),
      brakePressure: randomBetween(0, 20),
      acceleration: randomBetween(-1, 2),
      gps: {
        lat: randomBetween(SF_BAY.latMin, SF_BAY.latMax),
        lng: randomBetween(SF_BAY.lngMin, SF_BAY.lngMax),
      },
      weather: pickRandom(WEATHERS),
      temperature: randomBetween(8, 28),
      roadType: pickRandom(ROAD_TYPES),
      cameraCount: Math.floor(randomBetween(6, 13)),
      lidarStatus: pickRandom(['active', 'active', 'active', 'active', 'degraded']),
      disengagementCount: Math.floor(randomBetween(0, 15)),
      totalMiles: randomBetween(100, 50000),
      batteryLevel: randomBetween(15, 100),
      autopilotMode: pickRandom(['highway', 'urban', 'parking']),
      lastUpdated: new Date(),
    };
    vehicles.push(vehicle);
    previousStates.set(id, { ...vehicle });
  }

  return vehicles;
}

export function startSimulation(
  getVehicles: () => Vehicle[],
  updateVehicles: (vehicles: Vehicle[]) => void,
  onUpdate: (updated: Vehicle[], previous: Vehicle[]) => void
): () => void {
  const interval = setInterval(() => {
    const current = getVehicles();
    const updated = [...current];

    // Update a random subset of vehicles each tick (5-15 vehicles)
    const updateCount = Math.floor(randomBetween(5, 16));
    const indices = new Set<number>();
    while (indices.size < updateCount && indices.size < current.length) {
      indices.add(Math.floor(Math.random() * current.length));
    }

    const changedVehicles: Vehicle[] = [];
    const previousVehicles: Vehicle[] = [];

    indices.forEach((idx) => {
      const v = { ...updated[idx] };
      const prev = { ...v };
      previousVehicles.push(prev);

      // Randomly change status occasionally (5% chance)
      if (Math.random() < 0.05) {
        const newStatus = pickRandom(STATUSES);
        v.status = newStatus;
        if (newStatus === 'idle' || newStatus === 'charging' || newStatus === 'maintenance') {
          v.speed = lerp(v.speed, 0, 0.5);
          v.autopilotMode = 'off';
          if (newStatus === 'charging') {
            v.batteryLevel = clamp(v.batteryLevel + randomBetween(0.5, 2), 0, 100);
          }
        } else if (newStatus === 'active') {
          v.autopilotMode = pickRandom(['highway', 'urban', 'parking']);
        }
      }

      // Update telemetry based on status
      if (v.status === 'active') {
        const speedTarget = randomBetween(0, 80);
        v.speed = clamp(lerp(v.speed, speedTarget, 0.3), 0, 80);

        v.steeringAngle = clamp(lerp(v.steeringAngle, randomBetween(-30, 30), 0.2), -30, 30);
        v.lanePosition = clamp(lerp(v.lanePosition, randomBetween(-0.8, 0.8), 0.15), -1, 1);
        v.brakePressure = clamp(lerp(v.brakePressure, randomBetween(0, 60), 0.3), 0, 100);
        v.acceleration = clamp(lerp(v.acceleration, randomBetween(-3, 3), 0.2), -5, 5);

        // Move GPS slightly
        v.gps.lat += randomBetween(-0.001, 0.001);
        v.gps.lng += randomBetween(-0.001, 0.001);
        v.gps.lat = clamp(v.gps.lat, SF_BAY.latMin, SF_BAY.latMax);
        v.gps.lng = clamp(v.gps.lng, SF_BAY.lngMin, SF_BAY.lngMax);

        // Battery drain
        v.batteryLevel = clamp(v.batteryLevel - randomBetween(0.01, 0.1), 0, 100);

        // Occasional lidar degradation
        if (Math.random() < 0.02) {
          v.lidarStatus = pickRandom(LIDAR_STATUSES);
        }

        // Update road type based on speed patterns
        if (v.speed > 45) v.roadType = 'highway';
        else if (v.speed > 25) v.roadType = pickRandom(['urban', 'highway']);
        else v.roadType = pickRandom(['urban', 'residential', 'industrial']);

        // Weather changes
        if (Math.random() < 0.01) {
          v.weather = pickRandom(WEATHERS);
          v.temperature = clamp(v.temperature + randomBetween(-2, 2), -5, 40);
        }

        // Occasional disengagement
        if (Math.random() < 0.005 && v.autopilotMode !== 'off') {
          v.autopilotMode = 'off';
          v.disengagementCount += 1;
        }

        // Miles accumulation
        v.totalMiles += v.speed * (1 / 3600);
      } else {
        v.speed = lerp(v.speed, 0, 0.5);
        v.brakePressure = lerp(v.brakePressure, 0, 0.5);
        v.acceleration = lerp(v.acceleration, 0, 0.5);
      }

      v.lastUpdated = new Date();
      updated[idx] = v;
      changedVehicles.push(v);
    });

    updateVehicles(updated);
    onUpdate(changedVehicles, previousVehicles);
  }, 1000);

  return () => clearInterval(interval);
}

export { previousStates };
