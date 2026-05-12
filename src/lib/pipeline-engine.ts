// Pipeline Engine - Simulates a data training pipeline

export type StageStatus = 'running' | 'idle' | 'error' | 'backpressure';

export interface PipelineStage {
  id: string;
  name: string;
  status: StageStatus;
  throughput: number; // events/sec
  latency: number; // ms
  processedCount: number;
  errorCount: number;
  backpressure: number; // 0-100
}

export interface PipelineState {
  stages: PipelineStage[];
  overallHealth: number; // 0-100
  totalProcessed: number;
  datasetVersion: string;
  currentThroughput: number; // events/sec
}

const STAGE_DEFINITIONS = [
  { id: 'ingestion', name: 'Ingestion', baseLatency: 2, baseThroughput: 500 },
  { id: 'validation', name: 'Validation', baseLatency: 5, baseThroughput: 450 },
  { id: 'transformation', name: 'Transformation', baseLatency: 15, baseThroughput: 400 },
  { id: 'enrichment', name: 'Enrichment', baseLatency: 25, baseThroughput: 350 },
  { id: 'splitting', name: 'Splitting', baseLatency: 10, baseThroughput: 420 },
  { id: 'versioning', name: 'Versioning', baseLatency: 8, baseThroughput: 380 },
  { id: 'storage', name: 'Storage', baseLatency: 30, baseThroughput: 300 },
];

let pipelineState: PipelineState;

export function initializePipeline(): PipelineState {
  const stages: PipelineStage[] = STAGE_DEFINITIONS.map((def) => ({
    id: def.id,
    name: def.name,
    status: 'running' as StageStatus,
    throughput: def.baseThroughput + randomBetween(-50, 50),
    latency: def.baseLatency + randomBetween(-2, 5),
    processedCount: Math.floor(randomBetween(1000, 50000)),
    errorCount: Math.floor(randomBetween(0, 10)),
    backpressure: randomBetween(0, 30),
  }));

  pipelineState = {
    stages,
    overallHealth: 95,
    totalProcessed: stages.reduce((sum, s) => sum + s.processedCount, 0),
    datasetVersion: 'v2.4.7',
    currentThroughput: 0,
  };

  return pipelineState;
}

export function getPipelineState(): PipelineState {
  return pipelineState;
}

export function updatePipeline(eventsProcessed: number): PipelineState {
  if (!pipelineState) return initializePipeline();

  pipelineState.stages = pipelineState.stages.map((stage, idx) => {
    const def = STAGE_DEFINITIONS[idx];
    const newThroughput = def.baseThroughput + randomBetween(-80, 80);
    const newLatency = def.baseLatency + randomBetween(-3, 8);
    const backpressure = clamp(randomBetween(
      pipelineState.overallHealth < 80 ? 40 : 0,
      pipelineState.overallHealth < 80 ? 90 : 40
    ), 0, 100);

    // Simulate occasional errors
    const newErrors = Math.random() < 0.03
      ? stage.errorCount + Math.floor(randomBetween(1, 5))
      : stage.errorCount;

    let status: StageStatus = 'running';
    if (backpressure > 70) status = 'backpressure';
    else if (newErrors > 20) status = 'error';
    else if (eventsProcessed === 0) status = 'idle';

    return {
      ...stage,
      status,
      throughput: Math.max(0, newThroughput),
      latency: Math.max(1, newLatency),
      processedCount: stage.processedCount + eventsProcessed + Math.floor(randomBetween(0, 5)),
      errorCount: newErrors,
      backpressure,
    };
  });

  // Calculate overall health
  const avgBackpressure = pipelineState.stages.reduce((s, st) => s + st.backpressure, 0) / pipelineState.stages.length;
  const totalErrors = pipelineState.stages.reduce((s, st) => s + st.errorCount, 0);
  const errorPenalty = Math.min(totalErrors * 0.5, 30);
  const backpressurePenalty = avgBackpressure * 0.3;
  pipelineState.overallHealth = clamp(Math.round(100 - errorPenalty - backpressurePenalty), 0, 100);

  pipelineState.totalProcessed = pipelineState.stages.reduce((s, st) => s + st.processedCount, 0) / pipelineState.stages.length;
  pipelineState.currentThroughput = pipelineState.stages[0].throughput;

  // Version bump occasionally
  if (Math.random() < 0.002) {
    const parts = pipelineState.datasetVersion.replace('v', '').split('.');
    const minor = parseInt(parts[1]) + 1;
    pipelineState.datasetVersion = `v${parts[0]}.${minor}.${parts[2]}`;
  }

  return pipelineState;
}

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}
