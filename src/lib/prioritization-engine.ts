// Prioritization Engine - Scores and ranks events for data collection

import type { FleetEvent } from './event-detector';

export type PriorityLevel = 'urgent' | 'high' | 'normal' | 'low';

export interface PrioritizedEvent extends FleetEvent {
  priorityScore: number;
  rarityScore: number;
  dangerScore: number;
  noveltyScore: number;
  trainingValue: number;
  priorityLevel: PriorityLevel;
  recommendedAction: string;
}

export interface HistoricalContext {
  eventCounts: Record<string, number>;
  totalEvents: number;
  recentPatterns: string[];
}

// Default historical context with typical event distribution
const defaultHistoricalContext: HistoricalContext = {
  eventCounts: {
    lane_drift: 1500,
    harsh_braking: 800,
    near_collision: 200,
    disengagement: 600,
    phantom_braking: 400,
    occlusion: 150,
    unusual_pedestrian: 100,
    collision: 15,
    intervention: 300,
  },
  totalEvents: 4065,
  recentPatterns: ['lane_drift', 'harsh_braking', 'disengagement'],
};

let historicalContext: HistoricalContext = { ...defaultHistoricalContext };

export function resetHistoricalContext(): void {
  historicalContext = {
    eventCounts: { ...defaultHistoricalContext.eventCounts },
    totalEvents: defaultHistoricalContext.totalEvents,
    recentPatterns: [...defaultHistoricalContext.recentPatterns],
  };
}

export function updateHistoricalContext(eventType: string): void {
  historicalContext.eventCounts[eventType] =
    (historicalContext.eventCounts[eventType] || 0) + 1;
  historicalContext.totalEvents += 1;
  historicalContext.recentPatterns.push(eventType);
  if (historicalContext.recentPatterns.length > 20) {
    historicalContext.recentPatterns.shift();
  }
}

export function prioritizeEvent(
  event: FleetEvent,
  ctx: HistoricalContext = historicalContext
): PrioritizedEvent {
  // 1. Rarity Score (0-30): How uncommon this event type is
  const eventCount = ctx.eventCounts[event.type] || 1;
  const frequency = eventCount / ctx.totalEvents;
  // Inverse frequency: rarer events get higher scores
  const rarityScore = Math.round(clamp((1 - frequency * 10) * 30, 0, 30));

  // 2. Danger Score (0-30): Based on severity
  const severityDangerMap: Record<string, number> = {
    critical: 30,
    high: 20,
    medium: 10,
    low: 5,
  };
  const dangerScore = severityDangerMap[event.severity] || 5;

  // 3. Novelty Score (0-25): How different from recent patterns
  const recentTypeCounts = ctx.recentPatterns.filter(
    (p) => p === event.type
  ).length;
  const patternFrequency = recentTypeCounts / Math.max(ctx.recentPatterns.length, 1);
  // Events not in recent patterns are more novel
  const isInRecentPattern = ctx.recentPatterns.includes(event.type);
  const baseNovelty = isInRecentPattern ? 5 : 20;
  const noveltyScore = Math.round(clamp(baseNovelty - patternFrequency * 15, 0, 25));

  // 4. Training Value (0-15): Based on event type usefulness for model training
  const typeTrainingMap: Record<string, number> = {
    collision: 15,
    near_collision: 14,
    unusual_pedestrian: 13,
    occlusion: 12,
    phantom_braking: 11,
    harsh_braking: 10,
    lane_drift: 8,
    disengagement: 7,
    intervention: 5,
  };
  const trainingValue = typeTrainingMap[event.type] || 5;

  const priorityScore = Math.round(clamp(rarityScore + dangerScore + noveltyScore + trainingValue, 0, 100));

  // Determine priority level
  let priorityLevel: PriorityLevel;
  if (priorityScore >= 75) priorityLevel = 'urgent';
  else if (priorityScore >= 50) priorityLevel = 'high';
  else if (priorityScore >= 25) priorityLevel = 'normal';
  else priorityLevel = 'low';

  // Recommended action
  const recommendedAction = getRecommendedAction(event, priorityScore, priorityLevel);

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
}

function getRecommendedAction(
  event: FleetEvent,
  score: number,
  level: PriorityLevel
): string {
  if (event.type === 'collision' || event.type === 'near_collision') {
    return 'Immediate review — add to critical training set';
  }
  if (event.type === 'occlusion') {
    return 'Schedule sensor fusion review — add to perception training';
  }
  if (event.type === 'phantom_braking') {
    return 'Add to false-positive training corpus';
  }
  if (event.type === 'unusual_pedestrian') {
    return 'Add to pedestrian detection edge case library';
  }
  if (event.severity === 'critical') {
    return 'Escalate to safety team — queue for priority training';
  }
  if (level === 'urgent' || level === 'high') {
    return 'Add to next training batch — flag for review';
  }
  if (level === 'normal') {
    return 'Queue for standard training pipeline';
  }
  return 'Archive for future analysis';
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}
