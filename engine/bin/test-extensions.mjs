import { createJiti } from "jiti/static";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// pi-coding-agent root
const piRoot = path.resolve(__dirname, "../../../AppData/Roaming/npm/node_modules/@earendil-works/pi-coding-agent");

// Set up aliases like pi's loader does
const typeboxPkg = path.resolve(piRoot, "node_modules/typebox");

const jiti = createJiti(import.meta.url, {
  alias: {
    "typebox": typeboxPkg,
    "typebox/compile": path.join(typeboxPkg, "compile"),
    "typebox/value": path.join(typeboxPkg, "value"),
    "@earendil-works/pi-coding-agent": path.resolve(piRoot, "dist/index.js"),
  },
});

const extensions = [
  "C:/Users/35881/.pi/agent/extensions/steel-will-recall-tool.ts",
  "C:/Users/35881/.pi/agent/extensions/steel-will-codegraph.ts",
  "C:/Users/35881/.pi/agent/extensions/steel-will-achievement-motivator.ts",
  "C:/Users/35881/.pi/agent/extensions/steel-will-auto-promoter.ts",
];

for (const ext of extensions) {
  const name = path.basename(ext);
  try {
    const mod = jiti(ext);
    const keys = Object.keys(mod);
    console.log(`✅ ${name} — OK, exports: ${keys.join(", ") || "(default only)"}`);
  } catch (e) {
    const msg = (e.message || String(e)).substring(0, 500);
    console.log(`❌ ${name} — ${msg}`);
  }
}
