import { z } from "zod";

export const AgentStatusEnum = z.enum([
  "discovered",
  "registered",
  "in_review",
  "changes_requested",
  "certified",
  "rejected",
  "deprecated",
  "suspended",
]);
export type AgentStatus = z.infer<typeof AgentStatusEnum>;

export const AgentCapabilitySchema = z.object({
  name: z.string(),
  description: z.string(),
});

export const AgentIOFieldSchema = z.object({
  name: z.string(),
  type: z.string(),
  description: z.string(),
});

export const AgentSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  description: z.string().default(""),
  owner: z.string(),
  repoUrl: z.string().optional(),
  status: AgentStatusEnum.default("discovered"),
  version: z.string().default("0.1.0"),
  capabilities: z.array(AgentCapabilitySchema).default([]),
  dependencies: z.array(z.string()).default([]),
  io: z.object({
    inputs: z.array(AgentIOFieldSchema).default([]),
    outputs: z.array(AgentIOFieldSchema).default([]),
  }).optional(),
  tags: z.array(z.string()).default([]),
  readme: z.string().default(""),
  installCommand: z.string().default(""),
  discoveredAt: z.string(),
  registeredAt: z.string().optional(),
  certifiedAt: z.string().optional(),
  lastUpdatedAt: z.string(),
  source: z.enum(["github_scan", "manual", "seed"]).default("manual"),
  repoMeta: z.object({
    stars: z.number().default(0),
    language: z.string().optional(),
    lastPush: z.string().optional(),
    defaultBranch: z.string().default("main"),
  }).optional(),
});
export type Agent = z.infer<typeof AgentSchema>;

export const ReviewChecklistSchema = z.object({
  hasDescription: z.boolean().default(false),
  hasCapabilities: z.boolean().default(false),
  hasDependencies: z.boolean().default(false),
  hasIO: z.boolean().default(false),
  codeReviewed: z.boolean().default(false),
  securityChecked: z.boolean().default(false),
});

export const ReviewSchema = z.object({
  id: z.string(),
  agentId: z.string(),
  reviewer: z.string().default("platform-admin"),
  status: z.enum(["pending", "approved", "rejected", "changes_requested"]).default("pending"),
  checklist: ReviewChecklistSchema.default({}),
  comments: z.string().default(""),
  submittedAt: z.string(),
  resolvedAt: z.string().optional(),
});
export type Review = z.infer<typeof ReviewSchema>;

export const AgentRunSchema = z.object({
  id: z.string(),
  agentId: z.string(),
  timestamp: z.string(),
  durationMs: z.number(),
  status: z.enum(["success", "failure", "timeout"]).default("success"),
  triggeredBy: z.string().default("system"),
  metadata: z.record(z.string(), z.unknown()).default({}),
});
export type AgentRun = z.infer<typeof AgentRunSchema>;

// Valid lifecycle transitions
export const VALID_TRANSITIONS: Record<AgentStatus, Record<string, AgentStatus>> = {
  discovered: { promote: "registered" },
  registered: { submit_review: "in_review" },
  in_review: {
    approve: "certified",
    reject: "rejected",
    request_changes: "changes_requested",
  },
  changes_requested: { resubmit: "in_review" },
  certified: { deprecate: "deprecated", suspend: "suspended" },
  rejected: { reregister: "registered" },
  deprecated: { reactivate: "registered" },
  suspended: { reactivate: "registered" },
};
