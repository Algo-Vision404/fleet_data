# FleetMind AI — Autonomous Fleet Data Intelligence Platform

A production-grade web platform simulating autonomous vehicles streaming telemetry into a centralized AI data engine. FleetMind AI provides real-time fleet monitoring, event detection, data prioritization, training pipeline visualization, and analytics for self-driving fleet operations.

## Architecture

```
Frontend (Next.js 16)          Backend (API Routes)           Data Layer
┌────────────────────┐     ┌──────────────────────┐     ┌──────────────────┐
│  Dashboard UI      │────▶│  /api/fleet           │────▶│  Synthetic Data  │
│  6-tab layout      │────▶│  /api/events          │────▶│  Generator       │
│  Real-time charts  │────▶│  /api/metrics         │────▶│  (deterministic  │
│  Canvas heatmap    │────▶│  /api/pipeline        │     │   seeded PRNG)   │
│  Zustand store     │────▶│  /api/analytics       │     └──────────────────┘
└────────────────────┘     └──────────────────────┘
        ▲                           ▲
        │                           │
   Simulation Engine          Server-side data
   (client-side)               generation
```

## Tech Stack

- **Framework:** Next.js 16.1 (App Router, Turbopack)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4
- **State:** Zustand 5
- **Animation:** Framer Motion 12
- **Charts:** Recharts 2
- **Heatmap:** HTML5 Canvas API
- **UI Components:** Radix UI + shadcn/ui
- **Icons:** Lucide React

## Features

### Fleet Simulator
50 synthetic autonomous vehicles with realistic telemetry — speed, steering angle, lane position, brake pressure, GPS (SF Bay Area), weather conditions, battery levels, lidar status, and disengagement counts. Simulation runs client-side with configurable start/stop/reset controls.

### Real-Time Event Detection
9 event types detected from vehicle telemetry changes:

| Event | Severity |
|-------|----------|
| Near-Collision | Critical / High |
| Collision | Critical |
| Unusual Pedestrian | Critical / High |
| Occlusion | Critical / High |
| Harsh Braking | Critical / High / Medium |
| Lane Drift | High / Medium / Low |
| Phantom Braking | Medium / Low |
| Disengagement | High / Medium |
| Intervention | Medium / Low |

### Data Prioritization Engine
Events are scored 0–100 based on rarity, danger, novelty, and training value. Each event receives a recommended action (escalate, queue for training, archive, etc.).

### Training Data Pipeline
7-stage visualization: Ingestion → Validation → Transformation → Enrichment → Splitting → Versioning → Storage. Each stage shows throughput, latency, processed count, errors, and backpressure.

### Observability Stack
Service health monitoring with CPU/memory/disk metrics, service dependency status, and error rate tracking.

### Analytics Dashboard
- Disengagement rate chart with safety threshold
- Model drift indicators (actual vs expected confidence)
- Geographic anomaly distribution (10 SF Bay Area regions)
- Priority scoring panel with action recommendations

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/fleet` | GET | Fleet vehicles (50) with status counts |
| `/api/events` | GET | Filtered events (`?severity=&type=&limit=`) |
| `/api/metrics` | GET | System metrics snapshot |
| `/api/pipeline` | GET | Pipeline stages + overall health |
| `/api/analytics` | GET | Time-series: throughput, latency, disengagement, drift, regions |

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── fleet/route.ts
│   │   ├── events/route.ts
│   │   ├── metrics/route.ts
│   │   ├── pipeline/route.ts
│   │   └── analytics/route.ts
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   └── dashboard/
│       ├── DashboardLayout.tsx      # Sidebar nav + header + tab switching
│       ├── FleetOverview.tsx         # KPI cards (Overview tab)
│       ├── LiveTelemetryFeed.tsx     # Real-time vehicle telemetry
│       ├── VehicleGrid.tsx           # Fleet map (Fleet tab)
│       ├── EventTimeline.tsx         # Filterable event feed
│       ├── EventHeatmap.tsx          # Canvas-based density map
│       ├── DataPipeline.tsx          # Pipeline stage visualization
│       ├── PrioritizationPanel.tsx   # Priority scoring table
│       ├── ObservabilityStack.tsx    # Service health monitoring
│       └── DisengagementChart.tsx    # Drift + disengagement + anomalies
├── lib/
│   ├── fleet-simulator.ts           # Vehicle state simulation engine
│   ├── event-detector.ts            # Telemetry-based event detection
│   ├── prioritization-engine.ts     # Priority scoring algorithm
│   ├── pipeline-engine.ts           # Pipeline stage state machine
│   ├── synthetic-data.ts            # Deterministic data generator (no Math.random in SSR)
│   └── utils.ts
└── store/
    └── fleet-store.ts               # Zustand global state
```

## Getting Started

```bash
# Install dependencies
bun install

# Run development server
bun dev

# Production build
bun run build
bun start
```

The app runs on `https://fleet-data.vercel.app`.

## Dashboard Tabs

| Tab | Contents |
|-----|----------|
| **Overview** | KPI cards, fleet stats, live telemetry, recent events |
| **Fleet Map** | Vehicle grid with GPS positions, event heatmap |
| **Events** | Full event timeline with filters, geographic density heatmap |
| **Pipeline** | 7-stage data pipeline with throughput and latency |
| **Observability** | Service health, system metrics, log stream |
| **Analytics** | Disengagement trends, model drift, region anomalies, priority panel |

## Notes

- All synthetic data uses deterministic seeded generation (no `Math.random()` in SSR paths) to prevent hydration mismatches
- The simulation engine runs entirely client-side — toggle it with the Start/Stop button in the header
- The heatmap uses Canvas API with double-RAF delay to handle AnimatePresence tab transitions
- Color palette uses solid colors on black backgrounds — no gradients
