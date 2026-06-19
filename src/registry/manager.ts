import { v4 as uuid } from "uuid";
import { JsonStore } from "../state/store.js";
import {
  AgentSchema,
  VALID_TRANSITIONS,
  type Agent,
  type AgentStatus,
} from "../config/schemas.js";

const store = new JsonStore<Agent>("agents.json", AgentSchema);

export function getAllAgents(filters?: {
  status?: string;
  tag?: string;
}): Agent[] {
  let agents = store.load();
  if (filters?.status) {
    agents = agents.filter((a) => a.status === filters.status);
  }
  if (filters?.tag) {
    agents = agents.filter((a) => a.tags.includes(filters.tag!));
  }
  return agents;
}

export function getAgent(id: string): Agent | undefined {
  return store.findById(id);
}

export function getAgentBySlug(slug: string): Agent | undefined {
  return store.load().find((a) => a.slug === slug);
}

export function registerAgent(data: {
  slug: string;
  name: string;
  description?: string;
  owner: string;
  repoUrl?: string;
  tags?: string[];
  source?: Agent["source"];
  discoveredId?: string;
}): Agent {
  // If promoting from discovered, find and remove from discovered list
  const existing = store.load().find((a) => a.slug === data.slug);
  if (existing) {
    throw new Error(`Agent with slug "${data.slug}" already exists`);
  }

  const now = new Date().toISOString();
  const agent: Agent = AgentSchema.parse({
    id: data.discoveredId ?? uuid(),
    slug: data.slug,
    name: data.name,
    description: data.description ?? "",
    owner: data.owner,
    repoUrl: data.repoUrl,
    status: "registered",
    tags: data.tags ?? [],
    discoveredAt: now,
    registeredAt: now,
    lastUpdatedAt: now,
    source: data.source ?? "manual",
  });

  store.add(agent);
  return agent;
}

export function promoteDiscoveredAgent(discoveredAgent: Agent): Agent {
  const now = new Date().toISOString();
  const agent: Agent = {
    ...discoveredAgent,
    status: "registered",
    registeredAt: now,
    lastUpdatedAt: now,
  };
  store.add(agent);
  return agent;
}

export function updateAgent(
  id: string,
  updates: Partial<
    Pick<
      Agent,
      | "name"
      | "description"
      | "version"
      | "capabilities"
      | "dependencies"
      | "io"
      | "tags"
      | "readme"
      | "installCommand"
    >
  >
): Agent | null {
  return store.update(id, (agent) => ({
    ...agent,
    ...updates,
    lastUpdatedAt: new Date().toISOString(),
  }));
}

export function transitionAgent(
  id: string,
  action: string
): { agent: Agent; error?: string } | { agent: null; error: string } {
  const agent = store.findById(id);
  if (!agent) return { agent: null, error: "Agent not found" };

  const transitions = VALID_TRANSITIONS[agent.status];
  const newStatus = transitions?.[action];

  if (!newStatus) {
    return {
      agent: null,
      error: `Invalid action "${action}" for status "${agent.status}". Valid: ${Object.keys(transitions ?? {}).join(", ")}`,
    };
  }

  const now = new Date().toISOString();
  const updated = store.update(id, (a) => ({
    ...a,
    status: newStatus,
    lastUpdatedAt: now,
    ...(newStatus === "certified" ? { certifiedAt: now } : {}),
    ...(newStatus === "registered" && !a.registeredAt
      ? { registeredAt: now }
      : {}),
  }));

  return { agent: updated! };
}
