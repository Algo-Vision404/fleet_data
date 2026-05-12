'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFleetStore } from '@/store/fleet-store';
import { cn } from '@/lib/utils';
import {
  GitBranch,
  CheckCircle,
  AlertCircle,
  XCircle,
  Clock,
  Zap,
  ArrowRight,
} from 'lucide-react';
import type { PipelineStage, StageStatus } from '@/lib/pipeline-engine';

export default function DataPipeline() {
  const pipelineStages = useFleetStore((s) => s.pipelineStages);
  const systemMetrics = useFleetStore((s) => s.systemMetrics);

  const stageStatusConfig: Record<StageStatus, { icon: typeof CheckCircle; color: string; label: string }> = {
    running: { icon: CheckCircle, color: 'text-emerald-400', label: 'Running' },
    idle: { icon: Clock, color: 'text-[#6b7280]', label: 'Idle' },
    error: { icon: XCircle, color: 'text-red-400', label: 'Error' },
    backpressure: { icon: AlertCircle, color: 'text-amber-400', label: 'Backpressure' },
  };

  const healthColor =
    systemMetrics.pipelineHealth > 80
      ? 'text-emerald-400'
      : systemMetrics.pipelineHealth > 50
      ? 'text-amber-400'
      : 'text-red-400';

  const healthStroke =
    systemMetrics.pipelineHealth > 80
      ? '#10b981'
      : systemMetrics.pipelineHealth > 50
      ? '#f59e0b'
      : '#ef4444';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Data Pipeline</h2>
          <p className="text-sm text-[#6b7280] mt-0.5">
            Training data processing pipeline
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-xs text-[#6b7280]">Health</div>
            <div className={cn('text-lg font-bold', healthColor)}>
              {systemMetrics.pipelineHealth}%
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-[#6b7280]">Throughput</div>
            <div className="text-lg font-bold text-white">
              {systemMetrics.eventsPerSecond.toFixed(0)}
              <span className="text-xs text-[#6b7280] ml-0.5">eps</span>
            </div>
          </div>
        </div>
      </div>

      {/* Circular health indicator */}
      <Card className="bg-[#111827] border-[#1f2937]">
        <CardContent className="p-4">
          <div className="flex items-center gap-6">
            {/* SVG Circular progress */}
            <div className="relative w-20 h-20 shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="#1f2937"
                  strokeWidth="6"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke={healthStroke}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${(systemMetrics.pipelineHealth / 100) * 264} 264`}
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={cn('text-lg font-bold', healthColor)}>
                  {systemMetrics.pipelineHealth}%
                </span>
              </div>
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#6b7280]">Pipeline Status</span>
                <span className="text-emerald-400 font-medium">Active</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#6b7280]">Dataset Version</span>
                <span className="text-white font-mono">v2.4.7</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#6b7280]">Avg Latency</span>
                <span className="text-white">{systemMetrics.avgLatencyMs.toFixed(1)} ms</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#6b7280]">Total Processed</span>
                <span className="text-white">
                  {systemMetrics.totalEventsProcessed.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pipeline stages - horizontal flow */}
      <div className="overflow-x-auto custom-scrollbar pb-2">
        <div className="flex items-center gap-2 min-w-[800px]">
          {pipelineStages.map((stage, idx) => {
            const config = stageStatusConfig[stage.status] || stageStatusConfig.idle;
            const StatusIcon = config.icon;

            return (
              <React.Fragment key={stage.id}>
                <div className="flex-1 min-w-[100px]">
                  <Card
                    className={cn(
                      'bg-[#111827] border transition-all',
                      stage.status === 'error'
                        ? 'border-red-500/40'
                        : stage.status === 'backpressure'
                        ? 'border-amber-500/40'
                        : 'border-[#1f2937]'
                    )}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-white truncate">
                          {stage.name}
                        </span>
                        <StatusIcon className={cn('w-3.5 h-3.5 shrink-0', config.color)} />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-[#6b7280]">Throughput</span>
                          <span className="text-[#d1d5db] font-mono">{stage.throughput.toFixed(0)}/s</span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span className="text-[#6b7280]">Latency</span>
                          <span className={cn('font-mono', stage.latency > 25 ? 'text-amber-400' : 'text-[#d1d5db]')}>
                            {stage.latency.toFixed(1)}ms
                          </span>
                        </div>
                        {/* Backpressure bar */}
                        <div className="h-1 bg-[#1f2937] rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all duration-500',
                              stage.backpressure > 70
                                ? 'bg-red-500'
                                : stage.backpressure > 40
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            )}
                            style={{ width: `${stage.backpressure}%` }}
                          />
                        </div>
                        {stage.errorCount > 0 && (
                          <div className="text-[10px] text-red-400">
                            {stage.errorCount} errors
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                {idx < pipelineStages.length - 1 && (
                  <div className="flex items-center shrink-0">
                    <div className="relative">
                      <ArrowRight className="w-4 h-4 text-[#4b5563]" />
                      {/* Animated particle */}
                      <div className="absolute inset-0 overflow-hidden w-4 h-4">
                        <div className="absolute w-1 h-1 bg-emerald-400 rounded-full animate-pipeline-particle" />
                      </div>
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
