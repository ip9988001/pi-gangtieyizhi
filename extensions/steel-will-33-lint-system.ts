import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "fs";
import { join } from "path";
import semanticRetrievalService from "../services/steel-will-semantic-retrieval.ts";
import { ensureWikiStructure, rebuildWikiIndex } from "./steel-will-30-wiki-engine.ts";

type WikiLintFinding = {
  severity: "high" | "medium" | "low";
  rule: string;
  filePath: string;
  message: string;
};

const HOME_DIR = process.env.HOME || process.env.USERPROFILE || "~";
const MEMORY_DIR = join(HOME_DIR, ".pi", "agent", "memory");
const WIKI_DIR = join(MEMORY_DIR, "wiki");
const WIKI_PENDING_DIR = join(MEMORY_DIR, "wiki_candidates", "pending");
const WIKI_REPORT_PATH = join(WIKI_DIR, "lint-report.md");
const VECTOR_DB_INDEX_PATH = join(MEMORY_DIR, "system", "vector_db", "index.json");
const LOG_PREFIX = "[SteelWill-WikiLint]";
const PENDING_BACKLOG_THRESHOLD = 5;
const STALE_PENDING_DAYS = 3;
const MANUAL_REVIEW_THRESHOLD = 0.72;
const VECTOR_CONSISTENCY_SAMPLE_SIZE = 3;

function collectMarkdownFiles(dirPath: string): string[] {
  if (!existsSync(dirPath)) {
    return [];
  }

  const entries = readdirSync(dirPath);
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dirPath, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      files.push(...collectMarkdownFiles(fullPath));
      continue;
    }

    if (entry.endsWith(".md")) {
      files.push(fullPath);
    }
  }

  return files.sort();
}

function extractHeading(content: string, fallback: string): string {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : fallback;
}

function extractMetadataValue(content: string, key: string): string {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = content.match(new RegExp(`^- ${escapedKey}:\\s+(.+)$`, "m"));
  return match ? match[1].trim() : "";
}

function hasSummary(content: string): boolean {
  const match = content.match(/## Summary\s+([\s\S]*?)\n## /m);
  return Boolean(match && match[1].trim() && match[1].trim() !== "_No summary yet._");
}

function looksLikeStructureReadme(filePath: string): boolean {
  return filePath.endsWith("README.md");
}

function isOperationalWikiFile(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, "/").toLowerCase();
  return (
    normalized.endsWith("/wiki/index.md") ||
    normalized.endsWith("/wiki/log.md") ||
    normalized.endsWith("/wiki/lint-report.md")
  );
}

function detectReplacementCharacter(text: string): boolean {
  return text.includes("\ufffd") || text.includes("锟");
}

function normalizePendingKey(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function samplePagesForVectorConsistency(pages: string[]): string[] {
  const contentPages = pages.filter(
    (filePath) => !looksLikeStructureReadme(filePath) && !isOperationalWikiFile(filePath),
  );

  if (contentPages.length <= VECTOR_CONSISTENCY_SAMPLE_SIZE) {
    return contentPages;
  }

  return [
    contentPages[0],
    contentPages[Math.floor(contentPages.length / 2)],
    contentPages[contentPages.length - 1],
  ];
}

async function buildLintFindings(): Promise<WikiLintFinding[]> {
  ensureWikiStructure();
  rebuildWikiIndex();

  const findings: WikiLintFinding[] = [];
  const titleMap = new Map<string, string[]>();
  const summaryMap = new Map<string, string[]>();
  const pages = collectMarkdownFiles(WIKI_DIR).filter((filePath) => !filePath.endsWith("lint-report.md"));

  for (const pagePath of pages) {
    const content = readFileSync(pagePath, "utf-8");
    const title = extractHeading(content, pagePath);
    const normalizedTitle = title.toLowerCase();
    const sourcePath = extractMetadataValue(content, "source_path");
    const tags = extractMetadataValue(content, "tags");

    if (!looksLikeStructureReadme(pagePath) && !isOperationalWikiFile(pagePath) && !content.includes("## Metadata")) {
      findings.push({
        severity: "high",
        rule: "missing-metadata",
        filePath: pagePath,
        message: "Wiki page is missing the metadata section.",
      });
    }

    if (!looksLikeStructureReadme(pagePath) && !isOperationalWikiFile(pagePath) && !sourcePath) {
      findings.push({
        severity: "medium",
        rule: "missing-source-path",
        filePath: pagePath,
        message: "Wiki page is missing source_path.",
      });
    }

    if (!looksLikeStructureReadme(pagePath) && !isOperationalWikiFile(pagePath) && !hasSummary(content)) {
      findings.push({
        severity: "medium",
        rule: "missing-summary",
        filePath: pagePath,
        message: "Wiki page summary is empty.",
      });
    }

    if (!looksLikeStructureReadme(pagePath) && !isOperationalWikiFile(pagePath) && (!tags || tags === "none")) {
      findings.push({
        severity: "low",
        rule: "missing-tags",
        filePath: pagePath,
        message: "Wiki page does not have useful tags yet.",
      });
    }

    if (detectReplacementCharacter(title) || detectReplacementCharacter(content)) {
      findings.push({
        severity: "medium",
        rule: "encoding-artifact",
        filePath: pagePath,
        message: "Text contains replacement characters and may have an encoding/display issue.",
      });
    }

    if (!titleMap.has(normalizedTitle)) {
      titleMap.set(normalizedTitle, []);
    }
    titleMap.get(normalizedTitle)?.push(pagePath);

    if (!looksLikeStructureReadme(pagePath) && !isOperationalWikiFile(pagePath)) {
      const summary = content.match(/## Summary\s+([\s\S]*?)\n## /m)?.[1]?.trim() || "";
      if (summary) {
        if (!summaryMap.has(summary)) {
          summaryMap.set(summary, []);
        }
        summaryMap.get(summary)?.push(pagePath);
      }
    }

    if (!looksLikeStructureReadme(pagePath) && !isOperationalWikiFile(pagePath) && !content.includes("## Content")) {
      findings.push({
        severity: "high",
        rule: "missing-content-section",
        filePath: pagePath,
        message: "Wiki page is missing the content section.",
      });
    }
  }

  for (const [title, filePaths] of titleMap.entries()) {
    if (filePaths.length > 1) {
      for (const filePath of filePaths) {
        findings.push({
          severity: "medium",
          rule: "duplicate-title",
          filePath,
          message: `Duplicate wiki title detected: ${title}`,
        });
      }
    }
  }

  for (const [summary, filePaths] of summaryMap.entries()) {
    if (summary.length > 0 && filePaths.length > 1) {
      for (const filePath of filePaths) {
        findings.push({
          severity: "low",
          rule: "duplicate-summary",
          filePath,
          message: `Duplicate summary detected across ${filePaths.length} pages.`,
        });
      }
    }
  }

  const wikiIndexContent = existsSync(join(WIKI_DIR, "index.md"))
    ? readFileSync(join(WIKI_DIR, "index.md"), "utf-8")
    : "";

  for (const pagePath of pages.filter((filePath) => !isOperationalWikiFile(filePath))) {
    const relativePath = pagePath.replace(WIKI_DIR, ".").replace(/\\/g, "/");
    if (!wikiIndexContent.includes(relativePath)) {
      findings.push({
        severity: "medium",
        rule: "index-missing-page",
        filePath: pagePath,
        message: `Wiki index does not reference ${relativePath}.`,
      });
    }
  }

  if (!existsSync(VECTOR_DB_INDEX_PATH)) {
    findings.push({
      severity: "medium",
      rule: "vector-index-missing",
      filePath: VECTOR_DB_INDEX_PATH,
      message: "Vector index file is missing.",
    });
  } else {
    try {
      await semanticRetrievalService.init();
      const status = await semanticRetrievalService.getStatus();
      if (status.itemCount === 0) {
        findings.push({
          severity: "medium",
          rule: "vector-index-empty",
          filePath: VECTOR_DB_INDEX_PATH,
          message: "Vector index exists but has no items.",
        });
      }

      const sampledPages = samplePagesForVectorConsistency(pages);
      for (const pagePath of sampledPages) {
        const pageContent = readFileSync(pagePath, "utf-8");
        const title = extractHeading(pageContent, pagePath);
        const results = await semanticRetrievalService.searchMemory(title, 5);
        const matched = results.some((result) => result.metadata.filePath === pagePath);

        if (!matched) {
          findings.push({
            severity: "medium",
            rule: "vector-wiki-sample-mismatch",
            filePath: pagePath,
            message: `Vector search by page title did not return this wiki page in the sampled consistency check.`,
          });
        }
      }
    } catch (error: any) {
      findings.push({
        severity: "medium",
        rule: "vector-status-error",
        filePath: VECTOR_DB_INDEX_PATH,
        message: `Unable to read vector index status: ${error.message}`,
      });
    }
  }

  const pendingCandidates = collectMarkdownFiles(WIKI_PENDING_DIR).filter(
    (filePath) => !looksLikeStructureReadme(filePath),
  );
  const pendingDedupMap = new Map<string, string[]>();
  const now = Date.now();
  let manualReviewCount = 0;

  if (pendingCandidates.length > PENDING_BACKLOG_THRESHOLD) {
    findings.push({
      severity: "medium",
      rule: "pending-backlog",
      filePath: WIKI_PENDING_DIR,
      message: `Pending queue has ${pendingCandidates.length} candidates, above the backlog threshold of ${PENDING_BACKLOG_THRESHOLD}.`,
    });
  }

  for (const pendingPath of pendingCandidates) {
    const content = readFileSync(pendingPath, "utf-8");
    const dedupKey = normalizePendingKey(extractMetadataValue(content, "dedup_key") || pendingPath);
    const reviewStatus = extractMetadataValue(content, "review_status") || "manual-review";
    const createdAt = extractMetadataValue(content, "created");
    const confidence = Number(extractMetadataValue(content, "category_confidence") || "0");

    if (!pendingDedupMap.has(dedupKey)) {
      pendingDedupMap.set(dedupKey, []);
    }
    pendingDedupMap.get(dedupKey)?.push(pendingPath);

    if (reviewStatus === "manual-review") {
      manualReviewCount++;
    }

    if (createdAt) {
      const ageMs = now - new Date(createdAt).getTime();
      if (Number.isFinite(ageMs) && ageMs > STALE_PENDING_DAYS * 24 * 60 * 60 * 1000) {
        findings.push({
          severity: reviewStatus === "manual-review" ? "medium" : "low",
          rule: "pending-stale",
          filePath: pendingPath,
          message: `Pending candidate is older than ${STALE_PENDING_DAYS} days and has not been promoted yet.`,
        });
      }
    }

    if (confidence > 0 && confidence < MANUAL_REVIEW_THRESHOLD && reviewStatus !== "manual-review") {
      findings.push({
        severity: "medium",
        rule: "pending-review-mismatch",
        filePath: pendingPath,
        message: "Low-confidence pending candidate is not marked for manual review.",
      });
    }
  }

  if (manualReviewCount > 0) {
    findings.push({
      severity: manualReviewCount >= 3 ? "medium" : "low",
      rule: "pending-manual-review",
      filePath: WIKI_PENDING_DIR,
      message: `${manualReviewCount} pending candidate(s) are waiting for manual review.`,
    });
  }

  for (const [dedupKey, filePaths] of pendingDedupMap.entries()) {
    if (!dedupKey || filePaths.length <= 1) {
      continue;
    }

    for (const filePath of filePaths) {
      findings.push({
        severity: "medium",
        rule: "pending-duplicate",
        filePath,
        message: `Pending candidate shares the same dedup key with ${filePaths.length - 1} other pending item(s): ${dedupKey}`,
      });
    }
  }

  return findings.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    if (order[a.severity] !== order[b.severity]) {
      return order[a.severity] - order[b.severity];
    }
    return a.filePath.localeCompare(b.filePath);
  });
}

function renderLintReport(findings: WikiLintFinding[]): string {
  const lines = [
    "# Steel Will Wiki Lint Report",
    "",
    `Generated: ${new Date().toISOString()}`,
    `Total findings: ${findings.length}`,
    "",
  ];

  if (findings.length === 0) {
    lines.push("No findings.");
    lines.push("");
    return lines.join("\n");
  }

  lines.push("## Findings");
  lines.push("");

  for (const finding of findings) {
    lines.push(`- [${finding.severity.toUpperCase()}] ${finding.rule}`);
    lines.push(`  File: ${finding.filePath.replace(/\\/g, "/")}`);
    lines.push(`  Message: ${finding.message}`);
  }

  lines.push("");
  return lines.join("\n");
}

async function runWikiLint(): Promise<{ report: string; findings: WikiLintFinding[] }> {
  const findings = await buildLintFindings();
  const report = renderLintReport(findings);
  writeFileSync(WIKI_REPORT_PATH, report, "utf-8");
  return { report, findings };
}

export default function (pi: any) {
  pi.on("session_start", async (_event: any, ctx: any) => {
    try {
      ensureWikiStructure();
      ctx.ui.setStatus("steel-will-wiki-lint", "OK lint ready");
      console.log(`${LOG_PREFIX} lint system ready`);
    } catch (error: any) {
      console.error(`${LOG_PREFIX} initialization failed`, error?.message ?? error);
      ctx.ui.setStatus("steel-will-wiki-lint", "ERR lint");
    }
  });

  pi.registerTool({
    name: "wiki_lint",
    label: "Wiki Lint",
    description: "Run health checks against the Steel Will wiki and produce a lint report.",
    promptSnippet: "Run health checks against the Steel Will wiki",
    promptGuidelines: [
      "Use wiki_lint when the wiki or pending queue may have stale, duplicate, or structurally invalid items.",
      "This tool writes a fresh lint report into memory/wiki/lint-report.md.",
      "Treat lint findings as review signals, not automatic destructive actions.",
    ],
    parameters: {
      type: "object",
      properties: {},
    },
    async execute() {
      try {
        const result = await runWikiLint();
        return {
          content: [
            {
              type: "text",
              text:
                `Wiki lint completed.\n` +
                `Findings: ${result.findings.length}\n` +
                `Report: ${WIKI_REPORT_PATH}`,
            },
          ],
          details: {
            findings: result.findings,
            reportPath: WIKI_REPORT_PATH,
          },
        };
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `Wiki lint failed: ${error.message}` }],
          details: { error: error.message },
          isError: true,
        };
      }
    },
  });

  pi.registerCommand("steel-will-wiki-lint", {
    description: "Run wiki lint and show the report",
    handler: async (_args: any, ctx: any) => {
      try {
        const result = await runWikiLint();
        ctx.ui.notify(result.report, "info");
      } catch (error: any) {
        ctx.ui.notify(`Wiki lint failed: ${error.message}`, "error");
      }
    },
  });

  pi.registerCommand("steel-will-wiki-report", {
    description: "Show the latest wiki lint report",
    handler: async (_args: any, ctx: any) => {
      try {
        if (!existsSync(WIKI_REPORT_PATH)) {
          ctx.ui.notify("Wiki lint report does not exist yet.", "warning");
          return;
        }
        ctx.ui.notify(readFileSync(WIKI_REPORT_PATH, "utf-8"), "info");
      } catch (error: any) {
        ctx.ui.notify(`Wiki report read failed: ${error.message}`, "error");
      }
    },
  });

  console.log(`${LOG_PREFIX} extension loaded`);
}
