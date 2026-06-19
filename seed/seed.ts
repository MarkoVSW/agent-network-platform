import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { v4 as uuid } from "uuid";
import type { Agent, Review, AgentRun } from "../src/config/schemas.js";

const DATA_DIR = resolve(import.meta.dirname, "../data");
mkdirSync(DATA_DIR, { recursive: true });

const now = new Date();
const iso = (daysAgo = 0) =>
  new Date(now.getTime() - daysAgo * 86400000).toISOString();

// --- Agents ---
const agents: Agent[] = [
  {
    id: uuid(),
    slug: "x-engagement-reply-agent",
    name: "X Engagement Reply Agent",
    description:
      "Polls targeted X authors, matches posts against Soofi Safavi articles via MCP semantic similarity, generates LLM reply drafts, creates Asana approval tasks.",
    owner: "prismteam-ai",
    repoUrl: "https://github.com/prismteam-ai/x-engagement-reply-agent",
    status: "certified",
    version: "1.0.0",
    capabilities: [
      { name: "X Polling", description: "Monitors configured X authors for new posts on a schedule" },
      { name: "Semantic Matching", description: "Matches posts against Soofi articles via hosted MCP" },
      { name: "Reply Generation", description: "Generates 6+ reply drafts using LLM with distinct prompt strategies" },
      { name: "Asana Integration", description: "Creates approval tasks with X compose links for human review" },
    ],
    dependencies: ["investors-mcp"],
    io: {
      inputs: [
        { name: "watchlist", type: "yaml", description: "List of X authors to monitor" },
        { name: "prompts", type: "markdown", description: "Reply prompt templates" },
        { name: "settings", type: "yaml", description: "Thresholds, model, poll config" },
      ],
      outputs: [
        { name: "reply_drafts", type: "json", description: "Generated reply drafts with similarity scores" },
        { name: "asana_tasks", type: "asana", description: "Parent tasks + approval subtasks in Asana" },
        { name: "run_summary", type: "json", description: "Structured pipeline execution summary" },
      ],
    },
    tags: ["x-twitter", "engagement", "mcp", "llm", "asana"],
    readme: "# X Engagement Reply Agent\n\nA standalone, code-managed agent for monitoring X authors and generating recommended reply drafts grounded in Soofi Safavi's published articles.\n\n## Quick Start\n\n```bash\nnpm install\nnpm run dashboard  # http://localhost:3000\n```",
    installCommand: "git clone https://github.com/prismteam-ai/x-engagement-reply-agent && cd x-engagement-reply-agent && npm install",
    discoveredAt: iso(30),
    registeredAt: iso(25),
    certifiedAt: iso(5),
    lastUpdatedAt: iso(1),
    source: "seed",
    repoMeta: { stars: 12, language: "TypeScript", lastPush: iso(1), defaultBranch: "main" },
  },
  {
    id: uuid(),
    slug: "chief-of-staff-agent",
    name: "Chief of Staff Agent",
    description:
      "Executive operations agent that manages scheduling, meeting prep, follow-ups, and stakeholder communications for senior leadership.",
    owner: "prismteam-ai",
    repoUrl: "https://github.com/prismteam-ai/chief-of-staff-agent",
    status: "certified",
    version: "2.1.0",
    capabilities: [
      { name: "Calendar Management", description: "Schedules and coordinates meetings across stakeholders" },
      { name: "Meeting Prep", description: "Generates briefing documents from past interactions" },
      { name: "Follow-up Tracking", description: "Tracks action items and sends reminders" },
    ],
    dependencies: ["x-engagement-reply-agent"],
    io: {
      inputs: [
        { name: "calendar_events", type: "ical", description: "Calendar feed" },
        { name: "email_threads", type: "json", description: "Recent email conversations" },
      ],
      outputs: [
        { name: "briefings", type: "markdown", description: "Meeting preparation documents" },
        { name: "action_items", type: "json", description: "Tracked follow-ups and deadlines" },
      ],
    },
    tags: ["operations", "executive", "scheduling", "productivity"],
    readme: "# Chief of Staff Agent\n\nAI-powered executive operations assistant.",
    installCommand: "git clone https://github.com/prismteam-ai/chief-of-staff-agent",
    discoveredAt: iso(60),
    registeredAt: iso(50),
    certifiedAt: iso(20),
    lastUpdatedAt: iso(3),
    source: "seed",
    repoMeta: { stars: 34, language: "TypeScript", lastPush: iso(3), defaultBranch: "main" },
  },
  {
    id: uuid(),
    slug: "investors-mcp",
    name: "Investors MCP",
    description:
      "Model Context Protocol server providing semantic search over investor content, article matching, and knowledge retrieval for the Soofi ecosystem.",
    owner: "prismteam-ai",
    repoUrl: "https://github.com/prismteam-ai/investors-mcp",
    status: "certified",
    version: "3.0.0",
    capabilities: [
      { name: "Semantic Search", description: "Vector-based content retrieval via queryInvestorContent" },
      { name: "Article Matching", description: "Compare queries against Soofi Safavi article corpus" },
      { name: "Content Ingestion", description: "Add new content to the knowledge base" },
    ],
    dependencies: [],
    io: {
      inputs: [{ name: "query", type: "string", description: "Search query text" }],
      outputs: [{ name: "matches", type: "json", description: "Ranked article matches with similarity scores" }],
    },
    tags: ["mcp", "rag", "semantic-search", "knowledge-base"],
    readme: "# Investors MCP\n\nHosted MCP server for semantic article search.\n\nEndpoint: `https://investors-mcp.vercel.app/mcp`",
    installCommand: "git clone https://github.com/prismteam-ai/investors-mcp && npm install",
    discoveredAt: iso(90),
    registeredAt: iso(85),
    certifiedAt: iso(60),
    lastUpdatedAt: iso(2),
    source: "seed",
    repoMeta: { stars: 67, language: "TypeScript", lastPush: iso(2), defaultBranch: "main" },
  },
  {
    id: uuid(),
    slug: "website-design-agent",
    name: "Website Design Agent",
    description:
      "Generates website designs from natural language briefs, producing Figma-ready layouts and responsive HTML/CSS.",
    owner: "prismteam-ai",
    repoUrl: "https://github.com/prismteam-ai/website-design-agent",
    status: "in_review",
    version: "0.5.0",
    capabilities: [
      { name: "Design Generation", description: "Creates website layouts from text briefs" },
      { name: "Responsive Output", description: "Generates mobile-first responsive designs" },
    ],
    dependencies: [],
    io: {
      inputs: [{ name: "brief", type: "string", description: "Natural language design brief" }],
      outputs: [{ name: "design", type: "html", description: "Generated HTML/CSS layout" }],
    },
    tags: ["design", "frontend", "figma", "generative"],
    readme: "# Website Design Agent\n\nAI-powered website design from natural language.",
    installCommand: "git clone https://github.com/prismteam-ai/website-design-agent",
    discoveredAt: iso(20),
    registeredAt: iso(15),
    lastUpdatedAt: iso(2),
    source: "seed",
    repoMeta: { stars: 8, language: "TypeScript", lastPush: iso(2), defaultBranch: "main" },
  },
  {
    id: uuid(),
    slug: "oracle-property-intelligence",
    name: "Oracle Property Intelligence Platform",
    description:
      "RAG-powered property intelligence platform providing real-time market analysis, valuation insights, and investment recommendations.",
    owner: "prismteam-ai",
    repoUrl: "https://github.com/prismteam-ai/oracle-property-intelligence-platform",
    status: "registered",
    version: "0.3.0",
    capabilities: [
      { name: "Market Analysis", description: "Real-time property market analysis" },
      { name: "Valuation", description: "AI-powered property valuation models" },
    ],
    dependencies: ["investors-mcp"],
    tags: ["property", "rag", "intelligence", "real-estate"],
    readme: "# Oracle Property Intelligence\n\nProperty market intelligence platform.",
    installCommand: "",
    discoveredAt: iso(15),
    registeredAt: iso(10),
    lastUpdatedAt: iso(5),
    source: "seed",
    repoMeta: { stars: 5, language: "TypeScript", lastPush: iso(5), defaultBranch: "main" },
  },
];

// Discovered agents (from team-kit)
const discovered: Agent[] = [
  { id: uuid(), slug: "soofi-xyz-team-kit-arceus", name: "Arceus (Master Router)", description: "Master routing agent that delegates to specialists based on natural language task descriptions", owner: "soofi-xyz", repoUrl: "https://github.com/soofi-xyz/soofi-xyz-team-kit", status: "discovered", version: "0.1.0", capabilities: [], dependencies: [], tags: ["team-kit", "router", "orchestration"], readme: "", installCommand: "", discoveredAt: iso(2), lastUpdatedAt: iso(2), source: "github_scan" },
  { id: uuid(), slug: "soofi-xyz-team-kit-alakazam", name: "Alakazam (RAG Specialist)", description: "Infrastructure and RAG systems specialist for building semantic search pipelines", owner: "soofi-xyz", repoUrl: "https://github.com/soofi-xyz/soofi-xyz-team-kit", status: "discovered", version: "0.1.0", capabilities: [], dependencies: [], tags: ["team-kit", "rag", "infrastructure"], readme: "", installCommand: "", discoveredAt: iso(2), lastUpdatedAt: iso(2), source: "github_scan" },
  { id: uuid(), slug: "soofi-xyz-team-kit-sylveon", name: "Sylveon (Figma-to-Code)", description: "Design-focused agent for converting Figma designs to production frontend code", owner: "soofi-xyz", repoUrl: "https://github.com/soofi-xyz/soofi-xyz-team-kit", status: "discovered", version: "0.1.0", capabilities: [], dependencies: [], tags: ["team-kit", "design", "frontend"], readme: "", installCommand: "", discoveredAt: iso(2), lastUpdatedAt: iso(2), source: "github_scan" },
  { id: uuid(), slug: "soofi-xyz-team-kit-machamp", name: "Machamp (Batch Workflows)", description: "Agent for building and managing batch data processing workflows", owner: "soofi-xyz", repoUrl: "https://github.com/soofi-xyz/soofi-xyz-team-kit", status: "discovered", version: "0.1.0", capabilities: [], dependencies: [], tags: ["team-kit", "batch", "data-processing"], readme: "", installCommand: "", discoveredAt: iso(2), lastUpdatedAt: iso(2), source: "github_scan" },
  { id: uuid(), slug: "soofi-xyz-team-kit-audino", name: "Audino (Frontend Bug Fix)", description: "Specialized agent for diagnosing and fixing frontend bugs with test-first approach", owner: "soofi-xyz", repoUrl: "https://github.com/soofi-xyz/soofi-xyz-team-kit", status: "discovered", version: "0.1.0", capabilities: [], dependencies: [], tags: ["team-kit", "frontend", "debugging"], readme: "", installCommand: "", discoveredAt: iso(2), lastUpdatedAt: iso(2), source: "github_scan" },
];

// --- Reviews ---
const reviews: Review[] = [
  {
    id: uuid(),
    agentId: agents[3].id, // website-design-agent (in_review)
    reviewer: "platform-admin",
    status: "pending",
    checklist: {
      hasDescription: true,
      hasCapabilities: true,
      hasDependencies: true,
      hasIO: true,
      codeReviewed: false,
      securityChecked: false,
    },
    comments: "Looks promising. Need to complete code review and security check.",
    submittedAt: iso(3),
  },
  {
    id: uuid(),
    agentId: agents[0].id, // x-engagement-reply-agent (certified)
    reviewer: "platform-admin",
    status: "approved",
    checklist: {
      hasDescription: true,
      hasCapabilities: true,
      hasDependencies: true,
      hasIO: true,
      codeReviewed: true,
      securityChecked: true,
    },
    comments: "Excellent implementation. All criteria met. MCP integration verified.",
    submittedAt: iso(10),
    resolvedAt: iso(5),
  },
];

// --- Runs ---
const runs: AgentRun[] = [];
const runStatuses: Array<"success" | "failure" | "timeout"> = ["success", "success", "success", "success", "failure"];

for (const agent of agents.filter((a) => a.status === "certified")) {
  for (let i = 0; i < 8; i++) {
    runs.push({
      id: uuid(),
      agentId: agent.id,
      timestamp: iso(Math.random() * 14),
      durationMs: Math.round(1000 + Math.random() * 120000),
      status: runStatuses[Math.floor(Math.random() * runStatuses.length)],
      triggeredBy: ["cron", "manual", "webhook"][Math.floor(Math.random() * 3)],
      metadata: {},
    });
  }
}

// Sort runs by timestamp
runs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

// --- Write files ---
writeFileSync(resolve(DATA_DIR, "agents.json"), JSON.stringify(agents, null, 2));
writeFileSync(resolve(DATA_DIR, "discovered.json"), JSON.stringify(discovered, null, 2));
writeFileSync(resolve(DATA_DIR, "reviews.json"), JSON.stringify(reviews, null, 2));
writeFileSync(resolve(DATA_DIR, "runs.json"), JSON.stringify(runs, null, 2));

console.log(`Seeded:`);
console.log(`  ${agents.length} registered agents`);
console.log(`  ${discovered.length} discovered agents`);
console.log(`  ${reviews.length} reviews`);
console.log(`  ${runs.length} runs`);
console.log(`\nData written to ${DATA_DIR}/`);
