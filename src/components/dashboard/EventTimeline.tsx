'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  MapPin,
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

  const severityConfig: Record<
    string,
    { icon: typeof AlertOctagon; color: string; bgColor: string; borderColor: string }
  > = {
    critical: {
      icon: AlertOctagon,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/40',
    },
    high: {
      icon: AlertTriangle,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/40',
    },
    medium: {
      icon: AlertCircle,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/40',
    },
    low: {
      icon: Info,
      color: 'text-[#9ca3af]',
      bgColor: 'bg-[#9ca3af]/10',
      borderColor: 'border-[#9ca3af]/40',
    },
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-white">Event Timeline</h2>
        <p className="text-sm text-[#6b7280] mt-0.5">
          Real-time event detection feed sorted by priority
        </p>
      </div>

      {/* Severity filter tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {SEVERITY_FILTERS.map((sev) => (
          <button
            key={sev}
            onClick={() => setSeverityFilter(sev)}
            className={cn(
              'px-2.5 py-1 rounded-md text-xs font-medium transition-colors capitalize',
              severityFilter === sev
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-[#111827] text-[#9ca3af] hover:bg-white/5'
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
              'px-2 py-0.5 rounded text-[10px] font-medium transition-colors',
              typeFilter === f.id
                ? 'bg-white/10 text-white'
                : 'text-[#6b7280] hover:text-[#9ca3af]'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Event list */}
      <div className="space-y-2 max-h-[calc(100vh-380px)] overflow-y-auto custom-scrollbar">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12 text-[#6b7280] text-sm">
            No events match your filters.
          </div>
        ) : (
          filteredEvents.map((event) => {
            const config = severityConfig[event.severity] || severityConfig.low;
            const SevIcon = config.icon;
            const isCritical = event.severity === 'critical';

            return (
              <motion.div
                key={event.eventId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Card
                  className={cn(
                    'bg-[#111827] border transition-all',
                    config.borderColor,
                    event.acknowledged && 'opacity-50',
                    isCritical && !event.acknowledged && 'animate-pulse-border'
                  )}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      {/* Severity icon */}
                      <div
                        className={cn(
                          'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                          config.bgColor
                        )}
                      >
                        <SevIcon className={cn('w-4 h-4', config.color)} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 h-4 capitalize border-[#1f2937] text-[#9ca3af]"
                          >
                            {event.type.replace('_', ' ')}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 h-4 font-mono border-[#1f2937] text-[#9ca3af]"
                          >
                            <Car className="w-2.5 h-2.5 mr-0.5" />
                            {event.vehicleId}
                          </Badge>
                          <span className="text-[10px] text-[#6b7280] flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {formatTime(event.timestamp)}
                          </span>
                        </div>
                        <p className="text-xs text-[#d1d5db] leading-relaxed">
                          {event.description}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="shrink-0">
                        {!event.acknowledged && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-[10px] text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                            onClick={() => acknowledgeEvent(event.eventId)}
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Ack
                          </Button>
                        )}
                        {event.acknowledged && (
                          <CheckCircle className="w-4 h-4 text-emerald-500/50" />
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
