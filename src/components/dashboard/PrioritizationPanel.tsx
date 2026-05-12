'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useFleetStore } from '@/store/fleet-store';
import {
  AlertTriangle, Zap, TrendingUp, Trophy, CheckCircle,
} from 'lucide-react';

export default function PrioritizationPanel() {
  const prioritizedEvents = useFleetStore((s) => s.prioritizedEvents);

  const topEvents = prioritizedEvents.slice(0, 10);
  const urgentCount = topEvents.filter((e) => e.priorityLevel === 'urgent').length;
  const avgScore = topEvents.length > 0
    ? Math.round(topEvents.reduce((s, e) => s + e.priorityScore, 0) / topEvents.length)
    : 0;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-white">Edge Case Prioritization</h2>
        <p className="text-[11px] text-[#4b5563] mt-0.5">
          Top ranked events for training data collection
        </p>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-[#111827] border-[#1a1a1a]">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-3.5 h-3.5 text-[#ef4444]" />
              <span className="text-[10px] text-[#4b5563] uppercase tracking-wider">Urgent</span>
            </div>
            <p className="text-xl font-bold text-white">{urgentCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#111827] border-[#1a1a1a]">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-[#4b5563]" />
              <span className="text-[10px] text-[#4b5563] uppercase tracking-wider">Avg Score</span>
            </div>
            <p className="text-xl font-bold text-white">{avgScore}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#111827] border-[#1a1a1a]">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-3.5 h-3.5 text-[#f59e0b]" />
              <span className="text-[10px] text-[#4b5563] uppercase tracking-wider">Total</span>
            </div>
            <p className="text-xl font-bold text-white">{topEvents.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="bg-[#111827] border-[#1a1a1a]">
        <CardContent className="p-0">
          <div className="max-h-[calc(100vh-380px)] overflow-y-auto custom-scrollbar">
            {/* Header */}
            <div className="grid grid-cols-[40px_1fr_50px_80px_50px_40px_60px] gap-1 px-3 py-2 text-[9px] font-medium text-[#4b5563] uppercase tracking-wider border-b border-[#1a1a1a] bg-[#0d0d0d] sticky top-0">
              <span>#</span><span>Event</span><span>Vehicle</span><span>Score</span><span>Rarity</span><span>Danger</span><span>Action</span>
            </div>
            {topEvents.map((event, idx) => {
              const scoreColor = event.priorityScore >= 75 ? '#ef4444' : event.priorityScore >= 50 ? '#f59e0b' : '#10b981';
              return (
                <div
                  key={event.eventId}
                  className={`grid grid-cols-[40px_1fr_50px_80px_50px_40px_60px] gap-1 px-3 py-2 text-[11px] border-b border-[#1a1a1a] items-center ${event.acknowledged ? 'opacity-40' : ''}`}
                >
                  <span className="text-[#374151]">{idx + 1}</span>
                  <span className="text-[#9ca3af] truncate">{event.type.replace('_', ' ')}</span>
                  <span className="text-[#374151] font-mono text-[10px]">{event.vehicleId.replace('AV-', '')}</span>
                  <span className="font-bold" style={{ color: scoreColor }}>{event.priorityScore}</span>
                  <span className="text-[#6b7280]">{event.rarityScore}</span>
                  <span className="text-[#6b7280]">{event.dangerScore}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-1.5 text-[9px] text-[#4b5563] hover:text-white hover:bg-[#1a1a1a]"
                    onClick={() => {}}
                  >
                    Add
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
