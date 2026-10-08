import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "fs";
import { join } from "path";
import semanticRetrievalService from "../services/steel-will-semantic-retrieval.ts";

type WikiCategory = "entities" | "concepts" | "sources" | "synthesis";

type WikiPageInput = {
  title: string;
  category: WikiCategory;
  summary?: string;
  content: string;
  tags?: string[];
  source_path?: string;
};

const HOME_DIR = process.env.HOME || process.env.USERPROFILE || "~";
const MEMORY_DIR = join(HOME_DIR, ".pi", "agent", "memory");
const WIKI_DIR = join(MEMORY_DIR, "wiki");
const WIKI_INDEX_PATH = join(WIKI_DIR, "index.md");
const WIKI_LOG_PATH = join(WIKI_DIR, "log.md");
const LOG_PREFIX = "[SteelWill-Wiki]";

const WIKI_PATHS: Record<WikiCategory, string> = {
  entities: join(WIKI_DIR, "entities"),
  concepts: join(WIKI_DIR, "concepts"),
  sources: join(WIKI_DIR, "sources"),
  synthesis: join(WIKI_DIR, "synthesis"),
};

function nowIso(): string {
  return new Date().toISOString();
}

export function ensureWikiStructure(): void {
  if (!existsSync(WIKI_DIR)) {
    mkdirSync(WIKI_DIR, { recursive: true });
  }

  for (const dirPath of Object.values(WIKI_PATHS)) {
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true });
    }
  }

  if (!existsSync(WIKI_INDEX_PATH)) {
    writeFileSync(
      WIKI_INDEX_PATH,
      [
        "# Steel Will Wiki Index",
        "",
        "## Purpose",
        "Structured knowledge layer for stable, reusable memory.",
        "",
        "## Categories",
        "- entities",
        "- concepts",
        "- sources",
        "- synthesis",
        "",
        "## Pages",
        "_No wiki pages yet._",
        "",
      ].join("\n"),
      "utf-8",
    );
  }

  if (!existsSync(WIKI_LOG_PATH)) {
    writeFileSync(
      WIKI_LOG_PATH,
      [
        "# Steel Will Wiki Log",
        "",
        "| Time | Action | Category | Title | Path |",
        "| --- | --- | --- | --- | --- |",
        "",
      ].join("\n"),
      "utf-8",
    );
  }
}

function slugify(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");

  return slug || `wiki-${Date.now()}`;
}

function collectWikiPages(dirPath: string): string[] {
  if (!existsSync(dirPath)) {
    return [];
  }

  const entries = readdirSync(dirPath);
  const pages: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dirPath, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      pages.push(...collectWikiPages(fullPath));
      continue;
    }
    if (entry.endsWith(".md")) {
      pages.push(fullPath);
    }
  }

  return pages.sort();
}

function extractFirstHeading(content: string, fallback: string): string {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : fallback;
}

export function rebuildWikiIndex(): void {
  const categories: WikiCategory[] = ["entities", "concepts", "sources", "synthesis"];
  const lines = [
    "# Steel Will Wiki Index",
    "",
    `Updated: ${nowIso()}`,
    "",
    "## Purpose",
    "Structured knowledge layer for stable, reusable memory.",
    "",
  ];

  let totalPages = 0;

  for (const category of categories) {
    const pages = collectWikiPages(WIKI_PATHS[category]);
    lines.push(`## ${category}`);

    if (pages.length === 0) {
      lines.push("_Empty_");
      lines.push("");
      continue;
    }

    for (const pagePath of pages) {
      const content = readFileSync(pagePath, "utf-8");
      const title = extractFirstHeading(content, pagePath);
      const relativePath = pagePath.replace(WIKI_DIR, ".").replace(/\\/g, "/");
      lines.push(`- ${title} -> ${relativePath}`);
      totalPages++;
    }

    lines.push("");
  }

  if (totalPages === 0) {
    lines.push("## Pages");
    lines.push("_No wiki pages yet._");
    lines.push("");
  }

  writeFileSync(WIKI_INDEX_PATH, lines.join("\n"), "utf-8");
}

function appendWikiLog(action: string, category: WikiCategory, title: string, pagePath: string): void {
  const line = `| ${nowIso()} | ${action} | ${category} | ${title} | ${pagePath.replace(/\\/g, "/")} |\n`;
  appendFileSync(WIKI_LOG_PATH, line, "utf-8");
}

function buildWikiPage(input: WikiPageInput, existingContent?: string): string {
  const createdAt = existingContent?.match(/^- created:\s+(.+)$/m)?.[1]?.trim() || nowIso();
  const updatedAt = nowIso();
  const tags = (input.tags ?? []).filter(Boolean);
  const sourcePath = input.source_path?.trim() || "manual";
  const summary = input.summary?.trim() || "";

  return [
    `# ${input.title}`,
    "",
    "## Metadata",
    `- type: wiki-page`,
    `- category: ${input.category}`,
    `- created: ${createdAt}`,
    `- updated: ${updatedAt}`,
    `- source_path: ${sourcePath}`,
    `- tags: ${tags.length > 0 ? tags.join(", ") : "none"}`,
    "",
    "## Summary",
    summary || "_No summary yet._",
    "",
    "## Content",
    input.content.trim(),
    "",
  ].join("\n");
}

async function syncWikiPageToVectors(
  pagePath: string,
  pageContent: string,
  input: WikiPageInput,
): Promise<{ deleted: number; inserted: number }> {
  const tags = Array.from(
    new Set(
      ["wiki", `wiki-${input.category}`, ...(input.tags ?? [])]
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  );

  return semanticRetrievalService.syncDocument(pageContent, {
    filePath: pagePath,
    memoryType: "l3",
    createdAt: nowIso(),
    tags,
    sourceType: "wiki",
    wikiCategory: input.category,
    wikiTitle: input.title,
    sourcePath: input.source_path?.trim() || "manual",
  });
}

export async function upsertWikiPage(
  input: WikiPageInput,
): Promise<{
  pagePath: string;
  action: "created" | "updated";
  vectorSync: { deleted: number; inserted: number };
}> {
  ensureWikiStructure();

  const categoryDir = WIKI_PATHS[input.category];
  const fileName = `${slugify(input.title)}.md`;
  const pagePath = join(categoryDir, fileName);
  const existed = existsSync(pagePath);
  const existingContent = existed ? readFileSync(pagePath, "utf-8") : undefined;
  const pageContent = buildWikiPage(input, existingContent);

  writeFileSync(pagePath, pageContent, "utf-8");
  rebuildWikiIndex();
  appendWikiLog(existed ? "updated" : "created", input.category, input.title, pagePath);
  const vectorSync = await syncWikiPageToVectors(pagePath, pageContent, input);

  return {
    pagePath,
    action: existed ? "updated" : "created",
    vectorSync,
  };
}

export default function (pi: any) {
  pi.on("session_start", async (_event: any, ctx: any) => {
    try {
      ensureWikiStructure();
      rebuildWikiIndex();
      ctx.ui.setStatus("steel-will-wiki", "OK wiki ready");
      console.log(`${LOG_PREFIX} wiki structure ready`);
    } catch (error: any) {
      console.error(`${LOG_PREFIX} initialization failed`, error?.message ?? error);
      ctx.ui.setStatus("steel-will-wiki", "ERR wiki");
    }
  });

  pi.registerTool({
    name: "wiki_upsert_page",
    label: "Wiki Upsert Page",
    description: "Create or update a structured Steel Will wiki page.",
    promptSnippet: "Create or update a structured Steel Will wiki page",
    promptGuidelines: [
      "Use wiki_upsert_page only for stable, reusable knowledge.",
      "Prefer entities, concepts, sources, or synthesis as the category.",
      "Store durable knowledge, not transient conversation fragments.",
    ],
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Wiki page title." },
        category: {
          type: "string",
          enum: ["entities", "concepts", "sources", "synthesis"],
          description: "Wiki category.",
        },
        summary: { type: "string", description: "Short page summary." },
        content: { type: "string", description: "Main wiki content." },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Optional tags.",
        },
        source_path: {
          type: "string",
          description: "Optional source memory path or provenance note.",
        },
      },
      required: ["title", "category", "content"],
    },
    async execute(_toolCallId: string, params: WikiPageInput) {
      try {
        const result = await upsertWikiPage(params);
        return {
          content: [
            {
              type: "text",
              text:
                `${result.action === "created" ? "Created" : "Updated"} wiki page.\n` +
                `Title: ${params.title}\n` +
                `Category: ${params.category}\n` +
                `Path: ${result.pagePath}\n` +
                `Vector Sync: deleted ${result.vectorSync.deleted}, inserted ${result.vectorSync.inserted}`,
            },
          ],
          details: {
            action: result.action,
            title: params.title,
            category: params.category,
            pagePath: result.pagePath,
            vectorSync: result.vectorSync,
          },
        };
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `Wiki upsert failed: ${error.message}` }],
          details: { error: error.message },
          isError: true,
        };
      }
    },
  });

  pi.registerCommand("steel-will-wiki-status", {
    description: "Show Steel Will wiki status",
    handler: async (_args: any, ctx: any) => {
      try {
        ensureWikiStructure();
        rebuildWikiIndex();
        const categorySummary = (Object.entries(WIKI_PATHS) as Array<[WikiCategory, string]>)
          .map(([category, dirPath]) => `- ${category}: ${collectWikiPages(dirPath).length} pages`)
          .join("\n");

        ctx.ui.notify(
          `## Steel Will Wiki Status\n\n- Root: ${WIKI_DIR}\n- Index: ${WIKI_INDEX_PATH}\n- Log: ${WIKI_LOG_PATH}\n\n${categorySummary}`,
          "info",
        );
      } catch (error: any) {
        ctx.ui.notify(`Wiki status failed: ${error.message}`, "error");
      }
    },
  });

  pi.registerCommand("steel-will-wiki-index", {
    description: "Show Steel Will wiki index",
    handler: async (_args: any, ctx: any) => {
      try {
        ensureWikiStructure();
        rebuildWikiIndex();
        ctx.ui.notify(readFileSync(WIKI_INDEX_PATH, "utf-8"), "info");
      } catch (error: any) {
        ctx.ui.notify(`Wiki index read failed: ${error.message}`, "error");
      }
    },
  });

  pi.registerCommand("steel-will-wiki-log", {
    description: "Show Steel Will wiki log",
    handler: async (_args: any, ctx: any) => {
      try {
        ensureWikiStructure();
        ctx.ui.notify(readFileSync(WIKI_LOG_PATH, "utf-8"), "info");
      } catch (error: any) {
        ctx.ui.notify(`Wiki log read failed: ${error.message}`, "error");
      }
    },
  });

  console.log(`${LOG_PREFIX} extension loaded`);
}
