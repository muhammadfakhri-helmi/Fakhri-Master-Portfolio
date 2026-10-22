// Talks to reviewer/server.mjs on 127.0.0.1. Only reviewer scores, notes and
// statuses are sent — never decrypted answers or the private key.

import type { Review } from "../lib/scoring.ts";

const session = () => document.querySelector<HTMLMetaElement>('meta[name="reviewer-session"]')?.content ?? "";

export const serverAvailable = () => session().length > 0;

export async function loadReviews(): Promise<{ reviews: Record<string, Review>; dataFile: string }> {
  const response = await fetch("./api/reviews", { headers: { "X-Reviewer-Session": session() } });
  if (!response.ok) throw new Error(`Gagal memuat data review (${response.status})`);
  return response.json();
}

export async function saveReview(review: Review): Promise<Review> {
  const response = await fetch(`./api/reviews/${review.submissionId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "X-Reviewer-Session": session() },
    body: JSON.stringify({ scores: review.scores, notes: review.notes, status: review.status }),
  });
  if (!response.ok) throw new Error(`Gagal menyimpan review (${response.status})`);
  return ((await response.json()) as { review: Review }).review;
}
