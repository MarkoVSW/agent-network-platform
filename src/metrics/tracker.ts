import { v4 as uuid } from "uuid";
import { JsonStore } from "../state/store.js";
import { AgentRunSchema, type AgentRun } from "../config/schemas.js";
import { getAllAgents } from "../registry/manager.js";

const store = new JsonStore<AgentRun>("runs.json", AgentRunSchema);

export function recordRun(data: {
  agentId: string;
  durationMs: number;
  status: "success" | "failure" | "timeout";
  triggeredBy?: string;
  metadata?: Record<string, unknown>;
}): AgentRun {
  const run: AgentRun = AgentRunSchema.parse({
    id: uuid(),
    agentId: data.agentId,
    timestamp: new Date().toISOString(),
    durationMs: data.durationMs,
    status: data.status,
    triggeredBy: data.triggeredBy ?? "system",
    metadata: data.metadata ?? {},
  });

  store.add(run);
  return run;
}

export function getRunsForAgent(agentId: string): AgentRun[] {
  return store.load().filter((r) => r.agentId === agentId);
}

export function getMetricsSummary() {
  const agents = getAllAgents();
  const runs = store.load();

  const statusCounts: Record<string, number> = {};
  for (const a of agents) {
    statusCounts[a.status] = (statusCounts[a.status] ?? 0) + 1;
  }

  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const recentRuns = runs.filter(
    (r) => new Date(r.timestamp).getTime() > weekAgo
  );

  const successRate =
    recentRuns.length > 0
      ? recentRuns.filter((r) => r.status === "success").length /
        recentRuns.length
      : 0;

  return {
    totalAgents: agents.length,
    statusCounts,
    totalRuns: runs.length,
    runsThisWeek: recentRuns.length,
    successRate: Math.round(successRate * 100),
    recentRuns: recentRuns.slice(-20).reverse(),
  };
}

export function getNetworkGraph() {
  const agents = getAllAgents();
  const nodes = agents.map((a) => ({
    id: a.id,
    slug: a.slug,
    name: a.name,
    status: a.status,
  }));

  const edges: { source: string; target: string }[] = [];
  for (const agent of agents) {
    for (const depSlug of agent.dependencies) {
      const dep = agents.find((a) => a.slug === depSlug);
      if (dep) {
        edges.push({ source: agent.id, target: dep.id });
      }
    }
  }

  return { nodes, edges };
}
