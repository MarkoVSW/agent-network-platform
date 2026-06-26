# Agent Network Registration & Certification Platform

Central registry for all AI agents in the soofi.xyz ecosystem. Manages the full agent lifecycle: discovery from GitHub → registration with metadata → certification review → marketplace publication.

> 🎬 **Demo walkthrough:** see [`My Movie.mp4`](./My%20Movie.mp4) in this repo (tracked via Git LFS).

## Quick Start

### Option A: Docker (easiest — no local Node setup)

Requires Docker with Compose v2.

```bash
docker compose up --build
```

Open **http://localhost:3001**. Demo data is seeded automatically on first boot.
The `data/` directory is mounted from the host, so registry changes persist
across restarts. To reset to a clean demo state, delete `data/*.json` (or run
`npm run seed`) and restart.

### Option B: Local Node

```bash
# Install dependencies
npm install

# Seed demo data (PrismTeam agents at various lifecycle stages)
npm run seed

# Start the platform
npm run dev
```

Open **http://localhost:3001** in your browser.

## What You'll See

The dashboard has **7 tabs**:

### 1. Dashboard
Summary stats (total agents, certified count, run metrics), agent inventory by status with visual bars, and recent activity feed.

### 2. Discovery
Scan any GitHub org or repo for agents. Enter `prismteam-ai` and click "Scan GitHub" to discover agents automatically. Discovered agents can be promoted to the registry.

### 3. Registry
Full agent table with status badges, lifecycle actions, and an edit panel for metadata (capabilities, dependencies, I/O, tags, install command). Supports manual agent registration.

### 4. Certification
Review queue with a checklist (description, capabilities, dependencies, I/O, code review, security check). Approve, reject, or request changes on any agent in review.

### 5. Marketplace
Grid of certified-only agents with search. Click any agent for full details: install command, capabilities, dependencies, I/O spec, and GitHub link.

### 6. Network
Visual dependency graph showing how agents connect. Nodes are color-coded by lifecycle status.

### 7. Metrics
Run history table, success rate, weekly run count, and per-agent execution tracking.

## Agent Lifecycle

```
Discovered → Registered → In Review → Certified → (Deprecated | Suspended)
                                    → Changes Requested → In Review
                                    → Rejected → Registered
```

**8 statuses**: Discovered, Registered, In Review, Changes Requested, Certified, Rejected, Deprecated, Suspended

## Demo Walkthrough (10 Required Scenarios)

1. **Discover agents from GitHub** — Go to Discovery tab, enter `prismteam-ai`, click "Scan GitHub"
2. **Promote discovered agent** — Click "Promote" on any discovered agent
3. **Complete metadata** — In Registry tab, click an agent, fill in description, capabilities, dependencies
4. **Declare capabilities/deps** — Same edit form — add capabilities and dependency slugs
5. **Certification review** — Click "submit_review" on a registered agent, then go to Certification tab to review
6. **Publish to marketplace** — Approve the review → agent appears in Marketplace tab
7. **Explore agent details** — Click any agent in Marketplace for full details + install command
8. **Developer discovery** — Use Marketplace search or browse the Network graph
9. **Dashboard overview** — Dashboard tab shows inventory, cert status, and activity
10. **Track runs/usage** — Metrics tab shows run history and success rates

## Architecture

```
agent-network-platform/
├── src/
│   ├── server.ts              # Express 5 API + static serving
│   ├── config/schemas.ts      # Zod schemas (Agent, Review, Run)
│   ├── discovery/github.ts    # GitHub public API scanning
│   ├── registry/manager.ts    # CRUD + lifecycle state machine
│   ├── certification/workflow.ts  # Review creation + resolution
│   ├── marketplace/catalog.ts # Certified-only filtering
│   ├── metrics/tracker.ts     # Run recording + aggregation
│   └── state/store.ts         # Generic JSON file persistence
├── data/                      # JSON storage files
├── seed/seed.ts               # Demo data population
└── public/index.html          # Single-page dashboard
```

## Tech Stack

- **Runtime**: Node.js 22+ with tsx
- **Language**: TypeScript 5.8+ (ESM)
- **Server**: Express 5
- **Validation**: Zod
- **Storage**: JSON files (atomic writes)
- **Discovery**: GitHub public REST API (no auth needed)
- **Frontend**: Vanilla HTML/CSS/JS (dark GitHub theme)

## Seed Data

Pre-populated with PrismTeam ecosystem agents:

| Agent | Status |
|-------|--------|
| X Engagement Reply Agent | Certified |
| Chief of Staff Agent | Certified |
| Investors MCP | Certified |
| Website Design Agent | In Review |
| Oracle Property Intelligence | Registered |
| 5× Team Kit Agents (Arceus, Alakazam, etc.) | Discovered |

Plus review records, run history, and dependency relationships.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/discover | Scan GitHub org/repo |
| GET | /api/discovered | List discovered agents |
| GET | /api/agents | List registered agents |
| POST | /api/agents | Register or promote agent |
| PATCH | /api/agents/:id | Update metadata |
| POST | /api/agents/:id/transition | Lifecycle action |
| GET/POST | /api/reviews | List or create reviews |
| PATCH | /api/reviews/:id | Update checklist or resolve |
| GET | /api/marketplace | Certified agents only |
| GET | /api/metrics/summary | Aggregate stats |
| GET | /api/metrics/network | Dependency graph |

## References

- [Agent Network spec](https://github.com/prismteam-ai/agent-network-registration-and-certification-platform)
- [Soofi XYZ Team Kit](https://github.com/soofi-xyz/soofi-xyz-team-kit)
- [X Engagement Reply Agent](https://github.com/MarkoVSW/x-engagement-reply-agent) (sibling project)
