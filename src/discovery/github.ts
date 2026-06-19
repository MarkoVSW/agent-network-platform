import { v4 as uuid } from "uuid";
import type { Agent } from "../config/schemas.js";
import { logger } from "../utils/logger.js";

const GITHUB_API = "https://api.github.com";
const AGENT_KEYWORDS = ["agent", "mcp", "ai-agent", "llm", "bot", "automation"];

async function ghFetch(path: string) {
  const res = await fetch(`${GITHUB_API}${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "agent-network-platform",
    },
  });
  if (!res.ok) {
    throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

function isAgentRepo(repo: any): boolean {
  const name = (repo.name ?? "").toLowerCase();
  const desc = (repo.description ?? "").toLowerCase();
  const topics: string[] = repo.topics ?? [];

  return (
    AGENT_KEYWORDS.some((kw) => name.includes(kw)) ||
    AGENT_KEYWORDS.some((kw) => desc.includes(kw)) ||
    topics.some((t) => AGENT_KEYWORDS.some((kw) => t.includes(kw)))
  );
}

function repoToAgent(repo: any, owner: string): Agent {
  const now = new Date().toISOString();
  return {
    id: uuid(),
    slug: repo.name,
    name: repo.name
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c: string) => c.toUpperCase()),
    description: repo.description ?? "",
    owner,
    repoUrl: repo.html_url,
    status: "discovered",
    version: "0.1.0",
    capabilities: [],
    dependencies: [],
    tags: repo.topics ?? [],
    readme: "",
    installCommand: `git clone ${repo.clone_url}`,
    discoveredAt: now,
    lastUpdatedAt: now,
    source: "github_scan",
    repoMeta: {
      stars: repo.stargazers_count ?? 0,
      language: repo.language ?? undefined,
      lastPush: repo.pushed_at ?? undefined,
      defaultBranch: repo.default_branch ?? "main",
    },
  };
}

export async function discoverFromOrg(owner: string): Promise<Agent[]> {
  logger.info({ owner }, `Scanning GitHub org: ${owner}`);

  try {
    const repos = await ghFetch(`/orgs/${owner}/repos?per_page=100&sort=updated`);
    const agents = (repos as any[])
      .filter(isAgentRepo)
      .map((repo) => repoToAgent(repo, owner));

    logger.info(
      { owner, total: repos.length, agents: agents.length },
      `Found ${agents.length} agent repos in ${owner}`
    );
    return agents;
  } catch {
    // Try as a user instead of org
    logger.info({ owner }, "Not an org, trying as user");
    const repos = await ghFetch(`/users/${owner}/repos?per_page=100&sort=updated`);
    const agents = (repos as any[])
      .filter(isAgentRepo)
      .map((repo) => repoToAgent(repo, owner));

    logger.info(
      { owner, total: repos.length, agents: agents.length },
      `Found ${agents.length} agent repos in ${owner}`
    );
    return agents;
  }
}

export async function discoverFromRepo(
  owner: string,
  repo: string
): Promise<Agent[]> {
  logger.info({ owner, repo }, `Scanning single repo: ${owner}/${repo}`);

  const repoData = await ghFetch(`/repos/${owner}/${repo}`);
  const agents: Agent[] = [];

  // Check for agents/ directory (like soofi-xyz-team-kit)
  try {
    const contents = await ghFetch(`/repos/${owner}/${repo}/contents/agents`);
    if (Array.isArray(contents)) {
      for (const item of contents) {
        if (item.name.endsWith(".md")) {
          const now = new Date().toISOString();
          agents.push({
            id: uuid(),
            slug: `${repo}-${item.name.replace(".md", "")}`,
            name: item.name
              .replace(".md", "")
              .replace(/-/g, " ")
              .replace(/\b\w/g, (c: string) => c.toUpperCase()),
            description: `Agent defined in ${owner}/${repo}/agents/${item.name}`,
            owner,
            repoUrl: `https://github.com/${owner}/${repo}`,
            status: "discovered",
            version: "0.1.0",
            capabilities: [],
            dependencies: [],
            tags: ["team-kit", "agent-definition"],
            readme: "",
            installCommand: "",
            discoveredAt: now,
            lastUpdatedAt: now,
            source: "github_scan",
            repoMeta: {
              stars: repoData.stargazers_count ?? 0,
              language: repoData.language ?? undefined,
              lastPush: repoData.pushed_at ?? undefined,
              defaultBranch: repoData.default_branch ?? "main",
            },
          });
        }
      }
    }
  } catch {
    // No agents/ directory — treat repo itself as an agent
  }

  // If no agents found in directory, treat repo as a single agent
  if (agents.length === 0) {
    agents.push(repoToAgent(repoData, owner));
  }

  logger.info({ owner, repo, count: agents.length }, `Discovered ${agents.length} agents`);
  return agents;
}
