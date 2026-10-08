import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "fs";
import { basename, join } from "path";
import { ensureWikiStructure, rebuildWikiIndex, upsertWikiPage } from "./steel-will-30-wiki-engine.ts";
import semanticRetrievalService from "../services/steel-will-semantic-retrieval.ts";

type WikiCategory = "entities" | "concepts" | "sources" | "synthesis";
type ReviewStatus = "ready-promote" | "manual-review";

type PendingCandidate = {
  id: string;
  createdAt: string;
  sourceSession: string;
  queryText: string;
  matchedSignals: string[];
  suggestedTitle: string;
  suggestedCategory: WikiCategory;
  categoryConfidence: number;
  reviewStatus: ReviewStatus;
  dedupKey: string;
  summary: string;
  augmentedSummary: string;
  relatedMemoryPaths: string[];
  content: string;
};

type CandidateCreationResult =
  | { status: "created"; candidate: PendingCandidate; candidatePath: string }
  | { status: "duplicate"; candidate: PendingCandidate; duplicatePath: string }
  | { status: "no-signals" };

const HOME_DIR = process.env.HOME || process.env.USERPROFILE || "~";
const AGENT_DIR = join(HOME_DIR, ".pi", "agent");
const MEMORY_DIR = join(AGENT_DIR, "memory");
const WIKI_DIR = join(MEMORY_DIR, "wiki");
const SESSION_DIR = join(AGENT_DIR, "sessions");
const WIKI_CANDIDATE_DIR = join(MEMORY_DIR, "wiki_candidates");
const WIKI_PENDING_DIR = join(WIKI_CANDIDATE_DIR, "pending");
const LOG_PREFIX = "[SteelWill-AutoTrigger]";
const MANUAL_REVIEW_THRESHOLD = 0.72;

const SIGNALS = [
  "记住",
  "重要",
  "结论",
  "决策",
  "教训",
  "经验",
  "方案",
  "规则",
  "模式",
  "反模式",
  "以后",
  "别再",
  "wiki",
  "lesson",
  "pattern",
  "decision",
];

const CATEGORY_HINTS: Array<{ category: WikiCategory; keywords: string[] }> = [
  {
    category: "sources",
    keywords: ["http", "https", "github", "repo", "仓库", "链接", "文档", "论文", "文章", "来源"],
  },
  {
    category: "synthesis",
    keywords: ["方案", "结论", "决策", "总结", "路线", "计划", "实施", "集成", "roadmap", "decision"],
  },
  {
    category: "concepts",
    keywords: ["规则", "模式", "反模式", "原则", "教训", "经验", "机制", "架构", "思路", "lesson", "pattern"],
  },
  {
    category: "entities",
    keywords: ["项目", "系统", "模块", "工具", "团队", "角色", "人物", "公司", "产品"],
  },
];

function nowIso(): string {
  return new Date().toISOString();
}

function ensureCandidateStructure(): void {
  ensureWikiStructure();

  if (!existsSync(WIKI_CANDIDATE_DIR)) {
    mkdirSync(WIKI_CANDIDATE_DIR, { recursive: true });
  }

  if (!existsSync(WIKI_PENDING_DIR)) {
    mkdirSync(WIKI_PENDING_DIR, { recursive: true });
  }
}

function slugify(text: string): string {
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");

  return slug || `candidate-${Date.now()}`;
}

function normalizeText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function normalizeForCompare(text: string): string {
  return normalizeText(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, "")
    .trim();
}

function computeDedupKey(text: string): string {
  return normalizeForCompare(text).slice(0, 180);
}

function detectSignals(text: string): string[] {
  const lower = text.toLowerCase();
  return SIGNALS.filter((signal) => lower.includes(signal.toLowerCase()));
}

function scoreCategory(text: string, category: WikiCategory, matchedSignals: string[]): number {
  const normalized = normalizeText(text).toLowerCase();
  const hints = CATEGORY_HINTS.find((item) => item.category === category)?.keywords ?? [];
  let score = 0;

  for (const keyword of hints) {
    if (normalized.includes(keyword.toLowerCase())) {
      score += 2;
    }
  }

  for (const signal of matchedSignals) {
    if (hints.includes(signal.toLowerCase())) {
      score += 3;
    }
  }

  if (category === "sources" && /(https?:\/\/|github\.com|\.pdf\b|\.md\b)/i.test(text)) {
    score += 3;
  }

  if (category === "synthesis" && /(步骤|第一步|第二步|下一步|实施|落地)/.test(text)) {
    score += 2;
  }

  if (category === "concepts" && /(原则|规则|模式|反模式|教训|经验)/.test(text)) {
    score += 2;
  }

  if (category === "entities" && /(项目|系统|模块|工具|团队|公司|产品)/.test(text)) {
    score += 2;
  }

  return score;
}

function collectFiles(dirPath: string): string[] {
  if (!existsSync(dirPath)) {
    return [];
  }

  const entries = readdirSync(dirPath);
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dirPath, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      files.push(...collectFiles(fullPath));
      continue;
    }
    files.push(fullPath);
  }

  return files;
}

function readLatestSessionMessages(): { sessionPath: string; userMessages: string[] } | null {
  if (!existsSync(SESSION_DIR)) {
    return null;
  }

  const sessionFiles = collectFiles(SESSION_DIR)
    .filter((filePath) => filePath.endsWith(".jsonl"))
    .map((filePath) => ({ filePath, mtime: statSync(filePath).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);

  const latest = sessionFiles[0];
  if (!latest) {
    return null;
  }

  const lines = readFileSync(latest.filePath, "utf-8")
    .split(/\r?\n/)
    .filter(Boolean);

  const userMessages: string[] = [];

  for (const line of lines) {
    try {
      const parsed = JSON.parse(line);
      if (parsed.type !== "message" || parsed.message?.role !== "user") {
        continue;
      }

      const text = (parsed.message.content ?? [])
        .filter((item: any) => item.type === "text")
        .map((item: any) => item.text)
        .join("\n");

      if (text.trim()) {
        userMessages.push(normalizeText(text));
      }
    } catch {
      // Ignore malformed lines and continue.
    }
  }

  return {
    sessionPath: latest.filePath,
    userMessages,
  };
}

function inferCategoryFromSignals(signals: string[]): WikiCategory {
  if (signals.some((signal) => ["方案", "结论", "决策", "decision"].includes(signal.toLowerCase()))) {
    return "synthesis";
  }

  if (signals.some((signal) => ["规则", "模式", "反模式", "教训", "经验", "lesson", "pattern"].includes(signal.toLowerCase()))) {
    return "concepts";
  }

  if (signals.some((signal) => ["repo", "github"].includes(signal.toLowerCase()))) {
    return "sources";
  }

  return "concepts";
}

function suggestCategory(text: string, matchedSignals: string[]): { category: WikiCategory; confidence: number } {
  const baseCategory = inferCategoryFromSignals(matchedSignals);
  const categories: WikiCategory[] = ["entities", "concepts", "sources", "synthesis"];
  const ranked = categories
    .map((category) => ({
      category,
      score: scoreCategory(text, category, matchedSignals) + (category === baseCategory ? 1 : 0),
    }))
    .sort((a, b) => b.score - a.score);

  const top = ranked[0] ?? { category: baseCategory, score: 0 };
  const second = ranked[1] ?? { category: baseCategory, score: 0 };
  const confidence = Math.max(0.35, Math.min(0.98, 0.55 + (top.score - second.score) * 0.08));

  return {
    category: top.score > 0 ? top.category : baseCategory,
    confidence: Number(confidence.toFixed(2)),
  };
}

function inferTitle(text: string): string {
  const cleaned = normalizeText(text).replace(/[。！？，、:：;；"'`~()（）【】\[\]<>《》]/g, " ");
  const short = cleaned.split(" ").filter(Boolean).slice(0, 8).join(" ");
  return short || `Wiki Candidate ${new Date().toISOString()}`;
}

function getReviewStatus(confidence: number): ReviewStatus {
  return confidence >= MANUAL_REVIEW_THRESHOLD ? "ready-promote" : "manual-review";
}

async function buildAugmentedCandidateContext(
  text: string,
): Promise<{ augmentedSummary: string; relatedMemoryPaths: string[] }> {
  try {
    const results = await semanticRetrievalService.searchMemory(text, 3);
    const relatedMemoryPaths = results
      .map((result) => result.metadata.filePath)
      .filter(Boolean)
      .slice(0, 3);

    if (results.length === 0) {
      return {
        augmentedSummary: normalizeText(text).slice(0, 220),
        relatedMemoryPaths: [],
      };
    }

    const topHints = results
      .slice(0, 2)
      .map((result) => {
        const snippet = normalizeText(result.text).slice(0, 90);
        return snippet || result.metadata.filePath;
      })
      .filter(Boolean);

    const augmentedSummary =
      `${normalizeText(text).slice(0, 160)}` +
      (topHints.length > 0 ? ` Related memory: ${topHints.join(" | ")}` : "");

    return {
      augmentedSummary: augmentedSummary.slice(0, 320),
      relatedMemoryPaths,
    };
  } catch {
    return {
      augmentedSummary: normalizeText(text).slice(0, 220),
      relatedMemoryPaths: [],
    };
  }
}

function candidateToMarkdown(candidate: PendingCandidate): string {
  return [
    `# ${candidate.suggestedTitle}`,
    "",
    "## Metadata",
    `- id: ${candidate.id}`,
    `- created: ${candidate.createdAt}`,
    `- source_session: ${candidate.sourceSession}`,
    `- suggested_category: ${candidate.suggestedCategory}`,
    `- category_confidence: ${candidate.categoryConfidence}`,
    `- review_status: ${candidate.reviewStatus}`,
    `- dedup_key: ${candidate.dedupKey || "none"}`,
    `- related_memory_paths: ${candidate.relatedMemoryPaths.join(" | ") || "none"}`,
    `- matched_signals: ${candidate.matchedSignals.join(", ") || "none"}`,
    "",
    "## Summary",
    candidate.summary,
    "",
    "## Augmented Summary",
    candidate.augmentedSummary,
    "",
    "## Suggested Content",
    candidate.content,
    "",
    "## Source Query",
    candidate.queryText,
    "",
  ].join("\n");
}

function parsePendingCandidate(candidatePath: string): PendingCandidate {
  const content = readFileSync(candidatePath, "utf-8");
  const title = content.match(/^#\s+(.+)$/m)?.[1]?.trim() || basename(candidatePath, ".md");
  const id = content.match(/^- id:\s+(.+)$/m)?.[1]?.trim() || basename(candidatePath, ".md");
  const createdAt = content.match(/^- created:\s+(.+)$/m)?.[1]?.trim() || nowIso();
  const sourceSession = content.match(/^- source_session:\s+(.+)$/m)?.[1]?.trim() || "manual";
  const suggestedCategory = (content.match(/^- suggested_category:\s+(.+)$/m)?.[1]?.trim() || "concepts") as WikiCategory;
  const confidence = Number(content.match(/^- category_confidence:\s+(.+)$/m)?.[1]?.trim() || "0.5");
  const reviewStatus = (content.match(/^- review_status:\s+(.+)$/m)?.[1]?.trim() || getReviewStatus(confidence)) as ReviewStatus;
  const dedupKey = content.match(/^- dedup_key:\s+(.+)$/m)?.[1]?.trim() || computeDedupKey(title);
  const relatedRaw = content.match(/^- related_memory_paths:\s+(.+)$/m)?.[1]?.trim() || "";
  const relatedMemoryPaths = relatedRaw === "none" ? [] : relatedRaw.split("|").map((item) => item.trim()).filter(Boolean);
  const matchedSignalsRaw = content.match(/^- matched_signals:\s+(.+)$/m)?.[1]?.trim() || "";
  const matchedSignals = matchedSignalsRaw === "none" ? [] : matchedSignalsRaw.split(",").map((item) => item.trim()).filter(Boolean);
  const summary = content.match(/## Summary\s+([\s\S]*?)\n## Augmented Summary/m)?.[1]?.trim() || "";
  const augmentedSummary = content.match(/## Augmented Summary\s+([\s\S]*?)\n## Suggested Content/m)?.[1]?.trim() || summary;
  const body = content.match(/## Suggested Content\s+([\s\S]*?)\n## Source Query/m)?.[1]?.trim() || "";
  const sourceQuery = content.match(/## Source Query\s+([\s\S]*?)$/m)?.[1]?.trim() || "";

  return {
    id,
    createdAt,
    sourceSession,
    queryText: sourceQuery,
    matchedSignals,
    suggestedTitle: title,
    suggestedCategory,
    categoryConfidence: confidence,
    reviewStatus,
    dedupKey,
    summary,
    augmentedSummary,
    relatedMemoryPaths,
    content: body,
  };
}

function listPendingCandidates(): string[] {
  ensureCandidateStructure();
  return readdirSync(WIKI_PENDING_DIR)
    .filter((fileName) => fileName.endsWith(".md") && fileName !== "README.md")
    .sort()
    .map((fileName) => join(WIKI_PENDING_DIR, fileName));
}

function findDuplicatePending(candidate: PendingCandidate): string | null {
  for (const filePath of listPendingCandidates()) {
    const existing = parsePendingCandidate(filePath);
    if (
      existing.dedupKey === candidate.dedupKey ||
      normalizeForCompare(existing.suggestedTitle) === normalizeForCompare(candidate.suggestedTitle)
    ) {
      return filePath;
    }
  }

  return null;
}

function wikiAlreadyHasCandidate(candidate: PendingCandidate): boolean {
  const wikiPages = collectFiles(WIKI_DIR).filter((filePath) => filePath.endsWith(".md"));
  const candidateKey = candidate.dedupKey;

  for (const filePath of wikiPages) {
    const content = readFileSync(filePath, "utf-8");
    const title = content.match(/^#\s+(.+)$/m)?.[1]?.trim() || "";
    const body = normalizeForCompare(content);

    if (normalizeForCompare(title) === normalizeForCompare(candidate.suggestedTitle)) {
      return true;
    }

    if (candidateKey && body.includes(candidateKey)) {
      return true;
    }
  }

  return false;
}

async function createPendingCandidateFromText(text: string, sourceSession: string): Promise<CandidateCreationResult> {
  const matchedSignals = detectSignals(text);
  if (matchedSignals.length === 0) {
    return { status: "no-signals" };
  }

  const summary = normalizeText(text).slice(0, 220);
  const title = inferTitle(text);
  const suggested = suggestCategory(text, matchedSignals);
  const context = await buildAugmentedCandidateContext(text);
  const candidate: PendingCandidate = {
    id: `${slugify(title)}-${Date.now()}`,
    createdAt: nowIso(),
    sourceSession,
    queryText: text,
    matchedSignals,
    suggestedTitle: title,
    suggestedCategory: suggested.category,
    categoryConfidence: suggested.confidence,
    reviewStatus: getReviewStatus(suggested.confidence),
    dedupKey: computeDedupKey(text),
    summary,
    augmentedSummary: context.augmentedSummary,
    relatedMemoryPaths: context.relatedMemoryPaths,
    content: text,
  };

  const duplicatePendingPath = findDuplicatePending(candidate);
  if (duplicatePendingPath) {
    return {
      status: "duplicate",
      candidate,
      duplicatePath: duplicatePendingPath,
    };
  }

  if (wikiAlreadyHasCandidate(candidate)) {
    return {
      status: "duplicate",
      candidate,
      duplicatePath: "wiki-existing",
    };
  }

  const candidatePath = join(WIKI_PENDING_DIR, `${candidate.id}.md`);
  writeFileSync(candidatePath, candidateToMarkdown(candidate), "utf-8");

  return {
    status: "created",
    candidate,
    candidatePath,
  };
}

function summarizePendingQueue(): { total: number; manualReview: number; readyPromote: number } {
  const pending = listPendingCandidates().map(parsePendingCandidate);
  return {
    total: pending.length,
    manualReview: pending.filter((item) => item.reviewStatus === "manual-review").length,
    readyPromote: pending.filter((item) => item.reviewStatus === "ready-promote").length,
  };
}

async function promotePendingCandidate(candidate: PendingCandidate, candidatePath: string, force: boolean): Promise<{
  pagePath: string;
  vectorSync: { deleted: number; inserted: number };
}> {
  if (candidate.reviewStatus === "manual-review" && !force) {
    throw new Error(
      `Candidate is below the confidence threshold (${Math.round(candidate.categoryConfidence * 100)}% < ${Math.round(
        MANUAL_REVIEW_THRESHOLD * 100,
      )}%). Use the force-promote command after review.`,
    );
  }

  const result = await upsertWikiPage({
    title: candidate.suggestedTitle,
    category: candidate.suggestedCategory,
    summary: candidate.augmentedSummary || candidate.summary,
    content:
      candidate.relatedMemoryPaths.length > 0
        ? `${candidate.content}\n\n## Related Memory Paths\n${candidate.relatedMemoryPaths
            .map((filePath) => `- ${filePath}`)
            .join("\n")}`
        : candidate.content,
    tags: [
      ...candidate.matchedSignals,
      `confidence-${Math.round(candidate.categoryConfidence * 100)}`,
      candidate.reviewStatus,
    ],
    source_path: candidate.sourceSession,
  });

  rebuildWikiIndex();
  unlinkSync(candidatePath);

  return {
    pagePath: result.pagePath,
    vectorSync: result.vectorSync,
  };
}

export default function (pi: any) {
  pi.on("session_start", async (_event: any, ctx: any) => {
    try {
      ensureCandidateStructure();
      ctx.ui.setStatus("steel-will-auto-trigger", "OK trigger ready");
      console.log(`${LOG_PREFIX} auto trigger ready`);
    } catch (error: any) {
      console.error(`${LOG_PREFIX} initialization failed`, error?.message ?? error);
      ctx.ui.setStatus("steel-will-auto-trigger", "ERR trigger");
    }
  });

  pi.on("session_end", async (_event: any, _ctx: any) => {
    try {
      ensureCandidateStructure();
      const latest = readLatestSessionMessages();
      if (!latest) {
        return;
      }

      const recentTexts = latest.userMessages.slice(-3);
      for (const text of recentTexts) {
        const result = await createPendingCandidateFromText(text, latest.sessionPath);
        if (result.status === "created") {
          console.log(
            `${LOG_PREFIX} created pending candidate ${result.candidate.id} (${result.candidate.reviewStatus})`,
          );
          break;
        }
      }
    } catch (error: any) {
      console.error(`${LOG_PREFIX} session_end trigger failed`, error?.message ?? error);
    }
  });

  pi.registerTool({
    name: "wiki_capture_candidate",
    label: "Wiki Capture Candidate",
    description: "Create a pending wiki candidate from a user text fragment or conclusion.",
    promptSnippet: "Create a pending wiki candidate from a durable user text fragment",
    promptGuidelines: [
      "Use this when the user says something should be remembered, reused, or turned into a rule.",
      "This tool creates a pending candidate and does not write into the wiki directly.",
      "Low-confidence candidates are marked for manual review before promotion.",
    ],
    parameters: {
      type: "object",
      properties: {
        text: { type: "string", description: "The durable content to capture." },
        source_session: { type: "string", description: "Optional source session path or note." },
      },
      required: ["text"],
    },
    async execute(_toolCallId: string, params: { text: string; source_session?: string }) {
      try {
        ensureCandidateStructure();
        const result = await createPendingCandidateFromText(
          params.text,
          params.source_session?.trim() || "manual-capture",
        );

        if (result.status === "no-signals") {
          return {
            content: [{ type: "text", text: "No trigger signals detected. Candidate was not created." }],
            details: { created: false, reason: "no-signals" },
          };
        }

        if (result.status === "duplicate") {
          return {
            content: [
              {
                type: "text",
                text:
                  `Skipped duplicate wiki candidate.\n` +
                  `Title: ${result.candidate.suggestedTitle}\n` +
                  `Category: ${result.candidate.suggestedCategory}\n` +
                  `Confidence: ${Math.round(result.candidate.categoryConfidence * 100)}%\n` +
                  `Review: ${result.candidate.reviewStatus}\n` +
                  `Related: ${result.candidate.relatedMemoryPaths.length}\n` +
                  `Duplicate: ${result.duplicatePath}`,
              },
            ],
            details: {
              created: false,
              reason: "duplicate",
              duplicatePath: result.duplicatePath,
              candidate: result.candidate,
            },
          };
        }

        return {
          content: [
            {
              type: "text",
              text:
                `Created pending wiki candidate.\n` +
                `Title: ${result.candidate.suggestedTitle}\n` +
                `Category: ${result.candidate.suggestedCategory}\n` +
                `Confidence: ${Math.round(result.candidate.categoryConfidence * 100)}%\n` +
                `Review: ${result.candidate.reviewStatus}\n` +
                `Related: ${result.candidate.relatedMemoryPaths.length}\n` +
                `Signals: ${result.candidate.matchedSignals.join(", ")}`,
            },
          ],
          details: result.candidate,
        };
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `Candidate capture failed: ${error.message}` }],
          details: { error: error.message },
          isError: true,
        };
      }
    },
  });

  pi.registerCommand("steel-will-trigger-status", {
    description: "Show auto-trigger status",
    handler: async (_args: any, ctx: any) => {
      try {
        ensureCandidateStructure();
        const queue = summarizePendingQueue();
        ctx.ui.notify(
          `## Auto Trigger Status\n\n- Pending candidates: ${queue.total}\n- Ready promote: ${queue.readyPromote}\n- Manual review: ${queue.manualReview}\n- Review threshold: ${Math.round(
            MANUAL_REVIEW_THRESHOLD * 100,
          )}%\n- Candidate root: ${WIKI_PENDING_DIR}\n- Signals: ${SIGNALS.join(", ")}`,
          "info",
        );
      } catch (error: any) {
        ctx.ui.notify(`Trigger status failed: ${error.message}`, "error");
      }
    },
  });

  pi.registerCommand("steel-will-trigger-pending", {
    description: "List pending wiki candidates",
    handler: async (_args: any, ctx: any) => {
      try {
        ensureCandidateStructure();
        const pending = listPendingCandidates();
        if (pending.length === 0) {
          ctx.ui.notify("No pending wiki candidates.", "info");
          return;
        }

        const lines = ["## Pending Wiki Candidates", ""];
        for (const filePath of pending) {
          const candidate = parsePendingCandidate(filePath);
          lines.push(
            `- ${candidate.suggestedTitle} [${candidate.suggestedCategory}, ${Math.round(
              candidate.categoryConfidence * 100,
            )}%, ${candidate.reviewStatus}, related=${candidate.relatedMemoryPaths.length}] -> ${filePath}`,
          );
        }

        ctx.ui.notify(lines.join("\n"), "info");
      } catch (error: any) {
        ctx.ui.notify(`Pending list failed: ${error.message}`, "error");
      }
    },
  });

  pi.registerCommand("steel-will-trigger-promote", {
    description: "Promote the newest ready pending wiki candidate into the wiki",
    handler: async (_args: any, ctx: any) => {
      try {
        ensureCandidateStructure();
        const pending = listPendingCandidates();
        if (pending.length === 0) {
          ctx.ui.notify("No pending candidates to promote.", "warning");
          return;
        }

        const newest = pending
          .map((filePath) => ({ filePath, mtime: statSync(filePath).mtimeMs }))
          .sort((a, b) => b.mtime - a.mtime)[0]?.filePath;

        if (!newest) {
          ctx.ui.notify("No pending candidates to promote.", "warning");
          return;
        }

        const candidate = parsePendingCandidate(newest);
        const result = await promotePendingCandidate(candidate, newest, false);
        ctx.ui.notify(
          `Promoted pending candidate to wiki.\nTitle: ${candidate.suggestedTitle}\nCategory: ${candidate.suggestedCategory}\nConfidence: ${Math.round(
            candidate.categoryConfidence * 100,
          )}%\nPath: ${result.pagePath}\nVector Sync: deleted ${result.vectorSync.deleted}, inserted ${result.vectorSync.inserted}`,
          "info",
        );
      } catch (error: any) {
        ctx.ui.notify(`Promotion failed: ${error.message}`, "error");
      }
    },
  });

  pi.registerCommand("steel-will-trigger-force-promote", {
    description: "Force promote the newest pending wiki candidate after manual review",
    handler: async (_args: any, ctx: any) => {
      try {
        ensureCandidateStructure();
        const pending = listPendingCandidates();
        if (pending.length === 0) {
          ctx.ui.notify("No pending candidates to force-promote.", "warning");
          return;
        }

        const newest = pending
          .map((filePath) => ({ filePath, mtime: statSync(filePath).mtimeMs }))
          .sort((a, b) => b.mtime - a.mtime)[0]?.filePath;

        if (!newest) {
          ctx.ui.notify("No pending candidates to force-promote.", "warning");
          return;
        }

        const candidate = parsePendingCandidate(newest);
        const result = await promotePendingCandidate(candidate, newest, true);
        ctx.ui.notify(
          `Force-promoted pending candidate to wiki.\nTitle: ${candidate.suggestedTitle}\nCategory: ${candidate.suggestedCategory}\nConfidence: ${Math.round(
            candidate.categoryConfidence * 100,
          )}%\nReview: ${candidate.reviewStatus}\nPath: ${result.pagePath}\nVector Sync: deleted ${result.vectorSync.deleted}, inserted ${result.vectorSync.inserted}`,
          "info",
        );
      } catch (error: any) {
        ctx.ui.notify(`Force promotion failed: ${error.message}`, "error");
      }
    },
  });

  console.log(`${LOG_PREFIX} extension loaded`);
}
