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
    <div className="min-h-screen flex bg-black text-[#f9fafb]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 w-60 bg-[#0a0a0a] border-r border-[#1a1a1a] flex flex-col transition-transform duration-200 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="p-5 border-b border-[#1a1a1a]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-[#10b981] flex items-center justify-center">
              <Car className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">FleetMind AI</h1>
              <p className="text-[10px] text-[#4b5563] uppercase tracking-widest">
                Data Intelligence
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5">
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
                  'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-[#10b981] text-white'
                    : 'text-[#6b7280] hover:text-white hover:bg-[#1a1a1a]'
                )}
              >
                <Icon className="w-4 h-4" />
                {item.label}
                {item.id === 'events' && criticalAlerts > 0 && (
                  <span className="ml-auto bg-[#ef4444] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {criticalAlerts}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="p-4 border-t border-[#1a1a1a] text-xs text-[#4b5563] space-y-1.5">
          <div className="flex justify-between">
            <span>Fleet</span>
            <span className="text-[#6b7280]">{vehicles.length} vehicles</span>
          </div>
          <div className="flex justify-between">
            <span>Events</span>
            <span className="text-[#6b7280]">{events.length}</span>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-black border-b border-[#1a1a1a]">
          <div className="flex items-center justify-between px-4 py-3 lg:px-6">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-[#6b7280] hover:text-white"
                onClick={() => setSidebarOpen(true)}
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>

              <div className="flex items-center gap-2">
                <Radio
                  className={cn(
                    'w-3 h-3',
                    isSimulationRunning ? 'text-[#10b981] animate-pulse' : 'text-[#374151]'
                  )}
                />
                <span className="text-xs text-[#4b5563] hidden sm:block">
                  {isSimulationRunning ? 'Simulation Active' : 'Simulation Paused'}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#4b5563] hidden sm:block">{activeVehicles} active</span>
              {criticalAlerts > 0 && (
                <span className="text-xs text-[#ef4444] hidden md:block">{criticalAlerts} alerts</span>
              )}
              <div className="w-px h-5 bg-[#1a1a1a] mx-1 hidden sm:block" />
              <Button
                size="sm"
                variant="ghost"
                onClick={onRestart}
                className="text-[#6b7280] hover:text-white h-8 px-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="ml-1 hidden sm:inline text-xs">Reset</span>
              </Button>
              <Button
                size="sm"
                onClick={onToggleSimulation}
                className={cn(
                  'h-8 text-xs font-medium',
                  isSimulationRunning
                    ? 'bg-[#1a1a1a] text-[#ef4444] hover:bg-[#252525] border border-[#333]'
                    : 'bg-[#10b981] text-white hover:bg-[#059669] border-0'
                )}
              >
                {isSimulationRunning ? (
                  <><Square className="w-3 h-3 mr-1" /> Stop</>
                ) : (
                  <><Play className="w-3 h-3 mr-1" /> Start</>
                )}
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
