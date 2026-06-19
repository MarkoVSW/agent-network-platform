import { getAllAgents, getAgentBySlug } from "../registry/manager.js";
import type { Agent } from "../config/schemas.js";

export function getMarketplaceAgents(query?: string, tag?: string): Agent[] {
  let agents = getAllAgents({ status: "certified" });

  if (query) {
    const q = query.toLowerCase();
    agents = agents.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.slug.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  if (tag) {
    agents = agents.filter((a) => a.tags.includes(tag));
  }

  return agents;
}

export function getMarketplaceAgent(slug: string): Agent | undefined {
  const agent = getAgentBySlug(slug);
  if (agent?.status !== "certified") return undefined;
  return agent;
}

export function getMarketplaceTags(): { tag: string; count: number }[] {
  const agents = getAllAgents({ status: "certified" });
  const tagCounts = new Map<string, number>();

  for (const agent of agents) {
    for (const tag of agent.tags) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
  }

  return Array.from(tagCounts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}
