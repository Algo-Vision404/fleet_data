'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useFleetStore } from '@/store/fleet-store';
import { cn } from '@/lib/utils';
import {
  CheckCircle, AlertCircle, XCircle, Clock, ArrowRight,
} from 'lucide-react';
import type { PipelineStage, StageStatus } from '@/lib/pipeline-engine';

export default function DataPipeline() {
  const pipelineStages = useFleetStore((s) => s.pipelineStages);
  const systemMetrics = useFleetStore((s) => s.systemMetrics);

  const stageStatusConfig: Record<StageStatus, { icon: typeof CheckCircle; color: string; label: string }> = {
    running: { icon: CheckCircle, color: 'text-[#10b981]', label: 'Running' },
    idle: { icon: Clock, color: 'text-[#374151]', label: 'Idle' },
    error: { icon: XCircle, color: 'text-[#ef4444]', label: 'Error' },
    backpressure: { icon: AlertCircle, color: 'text-[#f59e0b]', label: 'Backpressure' },
  };

  const healthColor = systemMetrics.pipelineHealth > 80 ? '#10b981' : systemMetrics.pipelineHealth > 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-sm font-semibold text-white">Data Pipeline</h2>
          <p className="text-[11px] text-[#4b5563] mt-0.5">Training data processing pipeline</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div>
            <span className="text-[#374151]">Health </span>
            <span className="font-bold" style={{ color: healthColor }}>{systemMetrics.pipelineHealth}%</span>
          </div>
          <div>
            <span className="text-[#374151]">Throughput </span>
            <span className="font-bold text-white">{systemMetrics.eventsPerSecond.toFixed(0)}</span>
            <span className="text-[#374151]"> eps</span>
          </div>
        </div>
      </div>

      {/* Pipeline overview bar */}
      <Card className="bg-[#111827] border-[#1a1a1a]">
        <CardContent className="p-4">
          <div className="flex items-center gap-6">
            <div className="relative w-16 h-16 shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#1a1a1a" strokeWidth="6" />
                <circle cx="50" cy="50" r="42" fill="none" stroke={healthColor} strokeWidth="6" strokeLinecap="round"
                  strokeDasharray={`${(systemMetrics.pipelineHealth / 100) * 264} 264`} className="transition-all duration-500" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-white">{systemMetrics.pipelineHealth}%</span>
              </div>
            </div>
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div><span className="text-[#374151]">Status</span><p className="text-[#9ca3af] font-medium mt-0.5">Active</p></div>
              <div><span className="text-[#374151]">Dataset</span><p className="text-[#9ca3af] font-mono mt-0.5">v2.4.7</p></div>
              <div><span className="text-[#374151]">Avg Latency</span><p className="text-[#9ca3af] mt-0.5">{systemMetrics.avgLatencyMs.toFixed(1)} ms</p></div>
              <div><span className="text-[#374151]">Processed</span><p className="text-[#9ca3af] mt-0.5">{systemMetrics.totalEventsProcessed.toLocaleString()}</p></div>
              <div><span className="text-[#374151]">Ingested</span><p className="text-[#9ca3af] mt-0.5">{systemMetrics.dataIngestedGB.toFixed(1)} GB</p></div>
              <div><span className="text-[#374151]">Uptime</span><p className="text-[#9ca3af] mt-0.5">{Math.floor(systemMetrics.uptimeSeconds / 60)}m</p></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pipeline stages — horizontal flow */}
      <div className="overflow-x-auto custom-scrollbar pb-2">
        <div className="flex items-center gap-2 min-w-[800px]">
          {pipelineStages.map((stage, idx) => {
            const config = stageStatusConfig[stage.status] || stageStatusConfig.idle;
            const StatusIcon = config.icon;
            const hasError = stage.status === 'error';

            return (
              <React.Fragment key={stage.id}>
                <div className="flex-1 min-w-[100px]">
                  <Card className={cn('bg-[#111827] border', hasError ? 'border-[#ef4444]' : 'border-[#1a1a1a]')}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-medium text-[#9ca3af] truncate">{stage.name}</span>
                        <StatusIcon className={cn('w-3 h-3 shrink-0', config.color)} />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-[#374151]">Throughput</span>
                          <span className="text-[#6b7280] font-mono">{stage.throughput}/s</span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span className="text-[#374151]">Latency</span>
                          <span className={cn('font-mono', stage.latency > 25 ? 'text-[#f59e0b]' : 'text-[#6b7280]')}>
                            {stage.latency.toFixed(1)}ms
                          </span>
                        </div>
                        {/* Backpressure bar */}
                        <div className="h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                          <div
                            className={cn('h-full rounded-full transition-all duration-500',
                              stage.backpressure > 70 ? 'bg-[#ef4444]' : stage.backpressure > 40 ? 'bg-[#f59e0b]' : 'bg-[#10b981]'
                            )}
                            style={{ width: `${stage.backpressure}%` }}
                          />
                        </div>
                        {stage.errorCount > 0 && (
                          <div className="text-[10px] text-[#ef4444]">{stage.errorCount} errors</div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                {idx < pipelineStages.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-[#252525] shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
