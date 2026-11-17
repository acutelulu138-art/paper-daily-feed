import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildFeedExport, writeFeedExport } from "../src/feed-export.ts";

const now = new Date("2026-11-17T04:27:27.000Z");
const paper = { title: "Example", journal: "Transport", abstract: "Abstract", url: "https://doi.org/10.example/a", doi: "10.example/a", authors: ["Author"], publishedAt: new Date("2026-11-01T00:00:00Z"), score: 0.45, matchContext: { bestMatchSource: "profile", bestMatchTitle: "PRIVATE PROFILE", bestMatchTopics: ["PRIVATE"] } } as any;

test("exports paper metadata and excludes private matching context", () => {
  const result = buildFeedExport([paper], now, "delivered");
  assert.equal(result.papers[0]!.doi, paper.doi);
  assert.equal(result.papers[0]!.publishedAt, "2026-11-01T00:00:00.000Z");
  assert.equal(JSON.stringify(result).includes("PRIVATE"), false);
  assert.equal(result.status, "delivered");
});

test("retains separate same-day runs and writes empty latest explicitly", () => {
  const dir = mkdtempSync(join(tmpdir(), "paper-feed-export-"));
  try {
    writeFeedExport([paper], now, "delivered", { DAILY_FEED_EXPORT_DIR: dir });
    writeFeedExport([], new Date(now.getTime() + 60000), "no_recommendations", { DAILY_FEED_EXPORT_DIR: dir });
    assert.equal(readdirSync(join(dir, "runs")).length, 2);
    const latest = JSON.parse(readFileSync(join(dir, "latest.json"), "utf8"));
    assert.deepEqual(latest.papers, []);
    assert.equal(latest.status, "no_recommendations");
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("export is opt-in", () => {
  assert.doesNotThrow(() => writeFeedExport([paper], now, "delivered", {}));
});
