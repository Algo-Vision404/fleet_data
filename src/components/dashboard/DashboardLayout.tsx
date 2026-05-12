'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  MapPin,
  AlertTriangle,
  GitBranch,
  Activity,
  BarChart3,
  Play,
  Square,
  RotateCcw,
  Radio,
  Menu,
  X,
  Car,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFleetStore } from '@/store/fleet-store';

interface DashboardLayoutProps {
  children: React.ReactNode;
  onToggleSimulation: () => void;
  onRestart: () => void;
}

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'fleet', label: 'Fleet Map', icon: MapPin },
  { id: 'events', label: 'Events', icon: AlertTriangle },
  { id: 'pipeline', label: 'Pipeline', icon: GitBranch },
  { id: 'observability', label: 'Observability', icon: Activity },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
];

export default function DashboardLayout({
  children,
  onToggleSimulation,
  onRestart,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const activeTab = useFleetStore((s) => s.activeTab);
  const setActiveTab = useFleetStore((s) => s.setActiveTab);
  const isSimulationRunning = useFleetStore((s) => s.isSimulationRunning);
  const vehicles = useFleetStore((s) => s.vehicles);
  const events = useFleetStore((s) => s.events);

  const activeVehicles = vehicles.filter((v) => v.status === 'active').length;
  const criticalAlerts = events.filter(
    (e) => e.severity === 'critical' && !e.acknowledged
  ).length;

  return (
    <div className="min-h-screen flex bg-[#0a0f1a] text-[#f9fafb]">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#0d1320] border-r border-[#1f2937] flex flex-col transition-transform duration-300 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="p-5 border-b border-[#1f2937]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <Car className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white">
                FleetMind AI
              </h1>
              <p className="text-[10px] text-[#6b7280] uppercase tracking-widest">
                Data Intelligence
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setSidebarOpen(false);
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 shadow-sm shadow-emerald-500/10'
                    : 'text-[#9ca3af] hover:text-white hover:bg-white/5'
                )}
              >
                <Icon className="w-4.5 h-4.5" />
                {item.label}
                {item.id === 'events' && criticalAlerts > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {criticalAlerts}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="p-4 border-t border-[#1f2937]">
          <div className="text-xs text-[#6b7280] space-y-1">
            <div className="flex justify-between">
              <span>Fleet Size</span>
              <span className="text-[#9ca3af]">{vehicles.length} vehicles</span>
            </div>
            <div className="flex justify-between">
              <span>Events Today</span>
              <span className="text-[#9ca3af]">{events.length}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header */}
        <header className="sticky top-0 z-30 bg-[#0a0f1a]/80 backdrop-blur-xl border-b border-[#1f2937]">
          <div className="flex items-center justify-between px-4 py-3 lg:px-6">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-[#9ca3af] hover:text-white"
                onClick={() => setSidebarOpen(true)}
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>

              <div className="flex items-center gap-2">
                <Radio
                  className={cn(
                    'w-3 h-3',
                    isSimulationRunning ? 'text-emerald-400 animate-pulse' : 'text-[#6b7280]'
                  )}
                />
                <span className="text-sm text-[#9ca3af] hidden sm:block">
                  {isSimulationRunning ? 'Simulation Active' : 'Simulation Paused'}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="border-emerald-500/30 text-emerald-400 text-xs bg-emerald-500/10 hidden sm:flex"
              >
                {activeVehicles} Active
              </Badge>
              <Badge
                variant="outline"
                className="border-amber-500/30 text-amber-400 text-xs bg-amber-500/10 hidden md:flex"
              >
                {events.length} Events
              </Badge>
              <div className="w-px h-6 bg-[#1f2937] mx-1 hidden sm:block" />
              <Button
                size="sm"
                variant="ghost"
                onClick={onRestart}
                className="text-[#9ca3af] hover:text-white h-8 px-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="ml-1 hidden sm:inline text-xs">Reset</span>
              </Button>
              <Button
                size="sm"
                onClick={onToggleSimulation}
                className={cn(
                  'h-8 text-xs',
                  isSimulationRunning
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30'
                )}
                variant="outline"
              >
                {isSimulationRunning ? (
                  <>
                    <Square className="w-3 h-3 mr-1" /> Stop
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 mr-1" /> Start
                  </>
                )}
              </Button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
