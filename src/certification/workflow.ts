import { v4 as uuid } from "uuid";
import { JsonStore } from "../state/store.js";
import { ReviewSchema, type Review } from "../config/schemas.js";
import { transitionAgent, getAgent } from "../registry/manager.js";

const store = new JsonStore<Review>("reviews.json", ReviewSchema);

export function getAllReviews(status?: string): Review[] {
  let reviews = store.load();
  if (status) {
    reviews = reviews.filter((r) => r.status === status);
  }
  return reviews;
}

export function getReview(id: string): Review | undefined {
  return store.findById(id);
}

export function getReviewsForAgent(agentId: string): Review[] {
  return store.load().filter((r) => r.agentId === agentId);
}

export function createReview(agentId: string, reviewer?: string): Review {
  // Transition agent to in_review
  const result = transitionAgent(agentId, "submit_review");
  if (result.error && !result.agent) {
    // Agent might already be in_review — allow creating additional reviews
  }

  const review: Review = ReviewSchema.parse({
    id: uuid(),
    agentId,
    reviewer: reviewer ?? "platform-admin",
    status: "pending",
    submittedAt: new Date().toISOString(),
  });

  store.add(review);
  return review;
}

export function updateReview(
  id: string,
  updates: Partial<Pick<Review, "checklist" | "comments">>
): Review | null {
  return store.update(id, (review) => ({
    ...review,
    ...updates,
  }));
}

export function resolveReview(
  id: string,
  decision: "approved" | "rejected" | "changes_requested",
  comments?: string
): { review: Review | null; error?: string } {
  const review = store.findById(id);
  if (!review) return { review: null, error: "Review not found" };
  if (review.status !== "pending") return { review: null, error: "Review already resolved" };

  // Map decision to agent transition action
  const actionMap: Record<string, string> = {
    approved: "approve",
    rejected: "reject",
    changes_requested: "request_changes",
  };

  // Map decision to expected agent target status
  const expectedStatus: Record<string, string> = {
    approved: "certified",
    rejected: "rejected",
    changes_requested: "changes_requested",
  };

  const agentResult = transitionAgent(review.agentId, actionMap[decision]);
  if (agentResult.error && !agentResult.agent) {
    // Allow resolving if agent is already in the expected target state
    // (e.g. approved via Registry tab directly, agent already certified)
    const agent = getAgent(review.agentId);
    if (!agent || agent.status !== expectedStatus[decision]) {
      return { review: null, error: agentResult.error };
    }
  }

  const updated = store.update(id, (r) => ({
    ...r,
    status: decision,
    comments: comments ?? r.comments,
    resolvedAt: new Date().toISOString(),
  }));

  return { review: updated };
}
