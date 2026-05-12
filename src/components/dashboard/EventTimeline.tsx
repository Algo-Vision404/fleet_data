'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useFleetStore } from '@/store/fleet-store';
import { cn } from '@/lib/utils';
import {
  AlertOctagon,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  Clock,
  Car,
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

// Severity config — solid left border + icon, neutral card background
const SEV_CONFIG: Record<string, { color: string; label: string }> = {
  critical: { color: '#ef4444', label: 'CRIT' },
  high:     { color: '#f59e0b', label: 'HIGH' },
  medium:   { color: '#6b7280', label: 'MED' },
  low:      { color: '#374151', label: 'LOW' },
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
        <h2 className="text-sm font-semibold text-white">Event Timeline</h2>
        <p className="text-[11px] text-[#4b5563] mt-0.5">
          Real-time event detection feed sorted by priority
        </p>
      </div>

      {/* Severity filter */}
      <div className="flex gap-1 flex-wrap">
        {SEVERITY_FILTERS.map((sev) => (
          <button
            key={sev}
            onClick={() => setSeverityFilter(sev)}
            className={cn(
              'px-2 py-1 rounded text-[11px] font-medium transition-colors capitalize',
              severityFilter === sev
                ? 'bg-white text-black'
                : 'bg-[#1a1a1a] text-[#6b7280] hover:text-[#9ca3af]'
            )}
          >
            {sev}
          </button>
        ))}
      </div>

      {/* Type filters */}
      <div className="flex gap-1 flex-wrap">
        {EVENT_TYPE_FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setTypeFilter(f.id)}
            className={cn(
              'px-1.5 py-0.5 rounded text-[10px] transition-colors',
              typeFilter === f.id
                ? 'bg-[#1a1a1a] text-white'
                : 'text-[#374151] hover:text-[#6b7280]'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Event list */}
      <div className="space-y-1.5 max-h-[calc(100vh-380px)] overflow-y-auto custom-scrollbar">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12 text-[#374151] text-xs">
            No events match your filters.
          </div>
        ) : (
          filteredEvents.map((event) => {
            const config = SEV_CONFIG[event.severity] || SEV_CONFIG.low;
            const isCritical = event.severity === 'critical' && !event.acknowledged;

            return (
              <motion.div
                key={event.eventId}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Card
                  className={cn(
                    'bg-[#111827] border-[#1a1a1a] border-l-2',
                    event.acknowledged && 'opacity-40',
                  )}
                  style={{ borderLeftColor: config.color }}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      {/* Severity badge */}
                      <span
                        className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded mt-0.5 shrink-0"
                        style={{ color: config.color, backgroundColor: `${config.color}15` }}
                      >
                        {config.label}
                      </span>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-[10px] text-[#4b5563] uppercase">{event.type.replace('_', ' ')}</span>
                          <span className="text-[10px] font-mono text-[#374151]">{event.vehicleId}</span>
                          <span className="text-[10px] text-[#374151] flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {event.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#9ca3af] leading-relaxed">
                          {event.description}
                        </p>
                      </div>

                      {/* Acknowledge */}
                      <div className="shrink-0">
                        {!event.acknowledged ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-[10px] text-[#6b7280] hover:text-white hover:bg-[#1a1a1a]"
                            onClick={() => acknowledgeEvent(event.eventId)}
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Ack
                          </Button>
                        ) : (
                          <CheckCircle className="w-3.5 h-3.5 text-[#374151]" />
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
