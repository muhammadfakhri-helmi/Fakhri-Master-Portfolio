// Where reviewer scores, notes and statuses are kept. Answer files are never stored.
//   - Local server (npm run reviewer): JSON file on this computer via reviewer/server.mjs.
//   - Online page (GitHub Pages): this browser's localStorage only.

import type { Review } from "../lib/scoring.ts";

const STORAGE_KEY = "jds-b8-reviews-v1";

const session = () => document.querySelector<HTMLMetaElement>('meta[name="reviewer-session"]')?.content ?? "";

export const serverAvailable = () => session().length > 0;

function readLocal(): Record<string, Review> {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as unknown;
    return parsed && typeof parsed === "object" ? (parsed as Record<string, Review>) : {};
  } catch {
    return {};
  }
}

function writeLocal(reviews: Record<string, Review>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
}

export async function loadReviews(): Promise<{ reviews: Record<string, Review>; where: string }> {
  if (!serverAvailable()) return { reviews: readLocal(), where: "browser ini" };
  const response = await fetch("./api/reviews", { headers: { "X-Reviewer-Session": session() } });
  if (!response.ok) throw new Error(`Gagal memuat data review (${response.status})`);
  const data = (await response.json()) as { reviews: Record<string, Review>; dataFile: string };
  return { reviews: data.reviews, where: data.dataFile };
}

export async function saveReview(review: Review): Promise<Review> {
  if (!serverAvailable()) {
    writeLocal({ ...readLocal(), [review.submissionId]: review });
    return review;
  }
  const response = await fetch(`./api/reviews/${review.submissionId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "X-Reviewer-Session": session() },
    body: JSON.stringify({ scores: review.scores, notes: review.notes, status: review.status }),
  });
  if (!response.ok) throw new Error(`Gagal menyimpan review (${response.status})`);
  return ((await response.json()) as { review: Review }).review;
}

/** Backup file for moving reviews between browsers/devices. */
export function reviewsBackup(reviews: Record<string, Review>): string {
  return JSON.stringify({ format: "JDS-B8-REVIEWS-v1", exportedAt: new Date().toISOString(), reviews }, null, 2);
}

export function parseReviewsBackup(text: string): Record<string, Review> {
  const parsed = JSON.parse(text) as { format?: string; reviews?: Record<string, Review> };
  if (parsed.format !== "JDS-B8-REVIEWS-v1" || !parsed.reviews || typeof parsed.reviews !== "object") {
    throw new Error("File ini bukan backup review JDS B8.");
  }
  return parsed.reviews;
}
