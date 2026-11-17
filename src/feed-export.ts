import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { RecommendedPaper } from "./types.js";

type ExportStatus = "delivered" | "no_recommendations";

// Explicit allowlist: do not publish interest profiles, matching context or credentials.
export function buildFeedExport(papers: RecommendedPaper[], now: Date, status: ExportStatus) {
  return {
    schemaVersion: 1,
    generatedAt: now.toISOString(),
    status,
    papers: papers.map((paper) => ({
      title: paper.title,
      authors: paper.authors ?? [],
      journal: paper.journal,
      doi: paper.doi ?? null,
      url: paper.url,
      abstract: paper.abstract,
      publishedAt: paper.publishedAt?.toISOString() ?? null,
      score: paper.score
    }))
  };
}

export function writeFeedExport(
  papers: RecommendedPaper[],
  now: Date,
  status: ExportStatus,
  env: Record<string, string | undefined> = process.env
): void {
  const outputDir = env.DAILY_FEED_EXPORT_DIR?.trim();
  if (!outputDir) return;
  const document = buildFeedExport(papers, now, status);
  mkdirSync(join(outputDir, "runs"), { recursive: true });
  const content = `${JSON.stringify(document, null, 2)}\n`;
  const runName = `${now.toISOString().replace(/:/g, "-")}.json`;
  writeFileSync(join(outputDir, "runs", runName), content, "utf8");
  writeFileSync(join(outputDir, "latest.json"), content, "utf8");
  console.log(`Exported ${papers.length} recommendations (${status}).`);
}
