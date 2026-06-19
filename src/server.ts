import express from "express";
import { resolve } from "node:path";
import { logger } from "./utils/logger.js";
import { discoverFromOrg, discoverFromRepo } from "./discovery/github.js";
import * as registry from "./registry/manager.js";
import * as certification from "./certification/workflow.js";
import * as marketplace from "./marketplace/catalog.js";
import * as metrics from "./metrics/tracker.js";
import { JsonStore } from "./state/store.js";
import { AgentSchema, type Agent } from "./config/schemas.js";

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(express.json());
app.use(express.static(resolve(import.meta.dirname, "../public")));

// In-memory discovered agents (not yet promoted)
const discoveredStore = new JsonStore<Agent>("discovered.json", AgentSchema);

// --- Health ---
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// --- Discovery ---
app.post("/api/discover", async (req, res) => {
  try {
    const { owner, repo } = req.body;
    if (!owner) {
      res.status(400).json({ error: "owner is required" });
      return;
    }

    let agents: Agent[];
    if (repo) {
      agents = await discoverFromRepo(owner, repo);
    } else {
      agents = await discoverFromOrg(owner);
    }

    // Dedupe against existing registry and discovered
    const existingAgents = registry.getAllAgents();
    const existingDiscovered = discoveredStore.load();
    const existingSlugs = new Set([
      ...existingAgents.map((a) => a.slug),
      ...existingDiscovered.map((a) => a.slug),
    ]);

    const newAgents = agents.filter((a) => !existingSlugs.has(a.slug));

    for (const agent of newAgents) {
      discoveredStore.add(agent);
    }

    res.json({
      scanned: agents.length,
      new: newAgents.length,
      duplicates: agents.length - newAgents.length,
      agents: newAgents,
    });
  } catch (err) {
    logger.error({ error: (err as Error).message }, "Discovery failed");
    res.status(500).json({ error: (err as Error).message });
  }
});

app.get("/api/discovered", (_req, res) => {
  res.json(discoveredStore.load());
});

app.delete("/api/discovered/:id", (req, res) => {
  const removed = discoveredStore.remove(req.params.id);
  res.json({ removed });
});

// --- Registry ---
app.get("/api/agents", (req, res) => {
  const agents = registry.getAllAgents({
    status: req.query.status as string | undefined,
    tag: req.query.tag as string | undefined,
  });
  res.json(agents);
});

app.get("/api/agents/:id", (req, res) => {
  const agent = registry.getAgent(req.params.id);
  if (!agent) {
    res.status(404).json({ error: "Agent not found" });
    return;
  }
  const reviews = certification.getReviewsForAgent(agent.id);
  const runs = metrics.getRunsForAgent(agent.id);
  res.json({ ...agent, reviews, runs });
});

app.post("/api/agents", (req, res) => {
  try {
    const { discoveredId, slug, name, description, owner, repoUrl, tags } =
      req.body;

    // If promoting from discovered
    if (discoveredId) {
      const discovered = discoveredStore.findById(discoveredId);
      if (!discovered) {
        res.status(404).json({ error: "Discovered agent not found" });
        return;
      }
      const agent = registry.promoteDiscoveredAgent(discovered);
      discoveredStore.remove(discoveredId);
      res.json(agent);
      return;
    }

    // Manual registration
    const agent = registry.registerAgent({
      slug,
      name,
      description,
      owner,
      repoUrl,
      tags,
    });
    res.json(agent);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

app.patch("/api/agents/:id", (req, res) => {
  const updated = registry.updateAgent(req.params.id, req.body);
  if (!updated) {
    res.status(404).json({ error: "Agent not found" });
    return;
  }
  res.json(updated);
});

app.post("/api/agents/:id/transition", (req, res) => {
  const { action } = req.body;
  if (!action) {
    res.status(400).json({ error: "action is required" });
    return;
  }
  const result = registry.transitionAgent(req.params.id, action);
  if (result.error && !result.agent) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json(result.agent);
});

// --- Certification ---
app.get("/api/reviews", (req, res) => {
  const reviews = certification.getAllReviews(
    req.query.status as string | undefined
  );
  res.json(reviews);
});

app.post("/api/reviews", (req, res) => {
  try {
    const { agentId, reviewer } = req.body;
    const review = certification.createReview(agentId, reviewer);
    res.json(review);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

app.patch("/api/reviews/:id", (req, res) => {
  const { checklist, comments, decision } = req.body;

  // If decision is provided, resolve the review
  if (decision) {
    const result = certification.resolveReview(
      req.params.id,
      decision,
      comments
    );
    if (result.error) {
      res.status(400).json({ error: result.error });
      return;
    }
    res.json(result.review);
    return;
  }

  // Otherwise just update checklist/comments
  const updated = certification.updateReview(req.params.id, {
    checklist,
    comments,
  });
  if (!updated) {
    res.status(404).json({ error: "Review not found" });
    return;
  }
  res.json(updated);
});

// --- Marketplace ---
app.get("/api/marketplace", (req, res) => {
  const agents = marketplace.getMarketplaceAgents(
    req.query.q as string | undefined,
    req.query.tag as string | undefined
  );
  const tags = marketplace.getMarketplaceTags();
  res.json({ agents, tags });
});

app.get("/api/marketplace/:slug", (req, res) => {
  const agent = marketplace.getMarketplaceAgent(req.params.slug);
  if (!agent) {
    res.status(404).json({ error: "Agent not found in marketplace" });
    return;
  }
  const runs = metrics.getRunsForAgent(agent.id);
  res.json({ ...agent, runs });
});

// --- Metrics ---
app.get("/api/metrics/summary", (_req, res) => {
  res.json(metrics.getMetricsSummary());
});

app.get("/api/metrics/agents/:id/runs", (req, res) => {
  res.json(metrics.getRunsForAgent(req.params.id));
});

app.post("/api/metrics/runs", (req, res) => {
  try {
    const run = metrics.recordRun(req.body);
    res.json(run);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

app.get("/api/metrics/network", (_req, res) => {
  res.json(metrics.getNetworkGraph());
});

app.listen(PORT, () => {
  logger.info(
    { port: PORT },
    `Agent Network Platform running at http://localhost:${PORT}`
  );
});
