'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useFleetStore } from '@/store/fleet-store';
import { cn } from '@/lib/utils';
import {
  CheckCircle,
  Clock,
} from 'lucide-react';

const EVENT_TYPE_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'near_collision', label: 'Near-Collision' },
  { id: 'harsh_braking', label: 'Harsh Braking' },
  { id: 'lane_drift', label: 'Lane Drift' },
  { id: 'phantom_braking', label: 'Phantom Braking' },
  { id: 'occlusion', label: 'Occlusion' },
  { id: 'unusual_pedestrian', label: 'Pedestrian' },
  { id: 'disengagement', label: 'Disengagement' },
  { id: 'collision', label: 'Collision' },
  { id: 'intervention', label: 'Intervention' },
];

const SEVERITY_FILTERS = ['all', 'critical', 'high', 'medium', 'low'];

// Severity config — solid left border + badge, clean card background
const SEV_CONFIG: Record<string, { color: string; bgColor: string; label: string }> = {
  critical: { color: '#ef4444', bgColor: '#2a1010', label: 'CRITICAL' },
  high:     { color: '#f59e0b', bgColor: '#2a2010', label: 'HIGH' },
  medium:   { color: '#6b7280', bgColor: '#1a1a1a', label: 'MEDIUM' },
  low:      { color: '#4b5563', bgColor: '#1a1a1a', label: 'LOW' },
};

export default function EventTimeline() {
  const events = useFleetStore((s) => s.events);
  const acknowledgeEvent = useFleetStore((s) => s.acknowledgeEvent);
  const [typeFilter, setTypeFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');

  const filteredEvents = useMemo(() => {
    return events
      .filter((e) => {
        if (typeFilter !== 'all' && e.type !== typeFilter) return false;
        if (severityFilter !== 'all' && e.severity !== severityFilter) return false;
        return true;
      })
      .slice(0, 50);
  }, [events, typeFilter, severityFilter]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white">Event Timeline</h2>
        <p className="text-sm text-[#9ca3af] mt-1">
          Real-time event detection feed — {filteredEvents.length} events
        </p>
      </div>

      {/* Severity filter */}
      <div className="flex gap-1 flex-wrap">
        {SEVERITY_FILTERS.map((sev) => (
          <button
            key={sev}
            onClick={() => setSeverityFilter(sev)}
            className={cn(
              'px-3 py-1.5 rounded text-xs font-medium transition-colors capitalize',
              severityFilter === sev
                ? 'bg-white text-black'
                : 'bg-[#1a1a1a] text-[#9ca3af] hover:text-white hover:bg-[#252525]'
            )}
          >
            {sev}
          </button>
        ))}
      </div>

      {/* Type filters */}
      <div className="flex gap-1.5 flex-wrap">
        {EVENT_TYPE_FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setTypeFilter(f.id)}
            className={cn(
              'px-2 py-1 rounded text-xs transition-colors border',
              typeFilter === f.id
                ? 'bg-[#1a1a1a] text-white border-[#333]'
                : 'bg-transparent text-[#9ca3af] border-[#1a1a1a] hover:text-white hover:border-[#333]'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Event list */}
      <div className="space-y-2 max-h-[calc(100vh-420px)] overflow-y-auto custom-scrollbar">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-16 text-[#6b7280] text-sm">
            No events match your filters.
          </div>
        ) : (
          filteredEvents.map((event) => {
            const config = SEV_CONFIG[event.severity] || SEV_CONFIG.low;

            return (
              <motion.div
                key={event.eventId}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: event.acknowledged ? 0.4 : 1, x: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Card
                  className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg"
                  style={{ borderLeft: `3px solid ${config.color}` }}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      {/* Severity badge */}
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded mt-0.5 shrink-0"
                        style={{ color: config.color, backgroundColor: config.bgColor }}
                      >
                        {config.label}
                      </span>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-xs text-[#d1d5db] font-medium">
                            {event.type.replace('_', ' ')}
                          </span>
                          <span className="text-xs font-mono text-[#6b7280]">
                            {event.vehicleId}
                          </span>
                          <span className="text-xs text-[#6b7280] flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {event.timestamp.toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-[#9ca3af] leading-relaxed">
                          {event.description}
                        </p>
                      </div>

                      {/* Acknowledge */}
                      <div className="shrink-0">
                        {!event.acknowledged ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2.5 text-xs text-[#9ca3af] hover:text-white hover:bg-[#1a1a1a]"
                            onClick={() => acknowledgeEvent(event.eventId)}
                          >
                            <CheckCircle className="w-3.5 h-3.5 mr-1" />
                            Ack
                          </Button>
                        ) : (
                          <CheckCircle className="w-4 h-4 text-[#4b5563]" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
