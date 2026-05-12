'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useFleetStore } from '@/store/fleet-store';
import { cn } from '@/lib/utils';
import {
  Trophy,
  AlertTriangle,
  Zap,
  Target,
  Brain,
  Plus,
  TrendingUp,
  Shield,
} from 'lucide-react';

export default function PrioritizationPanel() {
  const prioritizedEvents = useFleetStore((s) => s.prioritizedEvents);

  const topEvents = useMemo(() => {
    return prioritizedEvents.slice(0, 10);
  }, [prioritizedEvents]);

  const summaryStats = useMemo(() => {
    const urgent = prioritizedEvents.filter((e) => e.priorityLevel === 'urgent').length;
    const high = prioritizedEvents.filter((e) => e.priorityLevel === 'high').length;
    const avgScore =
      prioritizedEvents.length > 0
        ? prioritizedEvents.reduce((s, e) => s + e.priorityScore, 0) /
          prioritizedEvents.length
        : 0;
    return {
      total: prioritizedEvents.length,
      urgent,
      high,
      avgScore: avgScore.toFixed(1),
    };
  }, [prioritizedEvents]);

  const getScoreBarColor = (score: number) => {
    if (score >= 75) return 'bg-red-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const getPriorityBadgeStyle = (level: string) => {
    switch (level) {
      case 'urgent':
        return 'bg-red-500/15 text-red-400 border-red-500/30';
      case 'high':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'normal':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      default:
        return 'bg-gray-500/15 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-white">Edge Case Prioritization</h2>
        <p className="text-sm text-[#6b7280] mt-0.5">
          AI-scored rare events ranked for model training
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="bg-[#111827] border-[#1f2937]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-[#6b7280]" />
              <span className="text-xs text-[#6b7280]">Total Edge Cases</span>
            </div>
            <p className="text-2xl font-bold text-white">{summaryStats.total}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#111827] border-red-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-xs text-[#6b7280]">Urgent</span>
            </div>
            <p className="text-2xl font-bold text-red-400">{summaryStats.urgent}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#111827] border-amber-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-[#6b7280]">High Priority</span>
            </div>
            <p className="text-2xl font-bold text-amber-400">{summaryStats.high}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#111827] border-[#1f2937]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-[#6b7280]">Avg Priority Score</span>
            </div>
            <p className="text-2xl font-bold text-white">{summaryStats.avgScore}</p>
          </CardContent>
        </Card>
      </div>

      {/* Prioritized events table */}
      <Card className="bg-[#111827] border-[#1f2937]">
        <CardHeader className="pb-3 px-4 pt-4">
          <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            Top 10 Priority Events
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {/* Table header */}
          <div className="grid grid-cols-[40px_1fr_80px_70px_50px_50px_60px_1fr] gap-2 px-3 py-2 text-[10px] font-medium text-[#6b7280] uppercase tracking-wider border-b border-[#1f2937]">
            <span>Rank</span>
            <span>Event Type</span>
            <span>Vehicle</span>
            <span>Score</span>
            <span>Rarity</span>
            <span>Danger</span>
            <span>Train</span>
            <span>Action</span>
          </div>

          {/* Table body */}
          <div className="max-h-96 overflow-y-auto custom-scrollbar">
            {topEvents.length === 0 ? (
              <div className="text-center py-8 text-[#6b7280] text-sm">
                No prioritized events yet.
              </div>
            ) : (
              topEvents.map((event, idx) => (
                <div
                  key={event.eventId}
                  className="grid grid-cols-[40px_1fr_80px_70px_50px_50px_60px_1fr] gap-2 px-3 py-2.5 text-xs border-b border-[#1f2937]/50 items-center hover:bg-white/[0.02] transition-colors"
                >
                  <span className="font-bold text-[#9ca3af]">#{idx + 1}</span>
                  <div className="flex items-center gap-1.5">
                    <Badge
                      variant="outline"
                      className={cn('text-[10px] px-1.5 py-0 h-4 capitalize', getPriorityBadgeStyle(event.priorityLevel))}
                    >
                      {event.type.replace('_', ' ')}
                    </Badge>
                  </div>
                  <span className="font-mono text-[#d1d5db] text-[11px]">
                    {event.vehicleId}
                  </span>
                  {/* Score bar */}
                  <div className="flex items-center gap-1.5">
                    <div className="flex-1 h-1.5 bg-[#1f2937] rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all', getScoreBarColor(event.priorityScore))}
                        style={{ width: `${event.priorityScore}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-white font-mono w-6 text-right">
                      {event.priorityScore}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#9ca3af]">{event.rarityScore}</span>
                  <span className="text-[10px] text-[#9ca3af]">{event.dangerScore}</span>
                  <span className="text-[10px] text-[#9ca3af]">{event.trainingValue}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-1.5 text-[10px] text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                  >
                    <Plus className="w-3 h-3 mr-0.5" />
                    Train
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
