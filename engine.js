#!/usr/bin/env node

// Actus Prime - Core Engine
//
// Exports: dispatch(), generateExpert(), runExpert()
// Also works as CLI: node engine.js dispatch "Apply to YC"
//                     node engine.js generate "Marcus Aurelius" "stoic philosophy"
//                     node engine.js run "pg" "Open google.com and search for YC tips"

import { readFileSync, writeFileSync, mkdirSync, existsSync, cpSync } from "fs";
import { execSync, spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ── Config ──────────────────────────────────────────────────────────────────

const BEDROCK_URL = "https://bedrock-runtime.us-east-1.amazonaws.com";
const BEDROCK_MODEL = "us.anthropic.claude-sonnet-4-6";
const BEDROCK_TOKEN = process.env.AWS_BEARER_TOKEN_BEDROCK;
const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

const OPENCLAW_HOME = join(process.env.HOME, ".openclaw");
const PROJECT_DIR = __dirname;
const PROMPTS_DIR = join(PROJECT_DIR, "prompts");
const SHARED_DIR = join(PROJECT_DIR, "shared");

// ── Bedrock API (bearer token, converse stream) ────────────────────────────

async function callBedrock(systemPrompt, userMessage, maxTokens = 4096) {
  if (!BEDROCK_TOKEN) {
    throw new Error("AWS_BEARER_TOKEN_BEDROCK not set in environment");
  }

  const url = `${BEDROCK_URL}/model/${BEDROCK_MODEL}/converse`;

  const body = {
    messages: [
      { role: "user", content: [{ text: userMessage }] },
    ],
    system: [{ text: systemPrompt }],
    inferenceConfig: {
      maxTokens,
      temperature: 0.7,
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${BEDROCK_TOKEN}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Bedrock ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data.output?.message?.content?.[0]?.text || "";
}

// ── Tavily Search (optional, enriches personality factory) ─────────────────

async function searchTavily(query) {
  if (!TAVILY_API_KEY) {
    console.log("[tavily] No API key, skipping search enrichment");
    return null;
  }

  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: TAVILY_API_KEY,
      query,
      max_results: 5,
      include_raw_content: false,
    }),
  });

  if (!res.ok) {
    console.log(`[tavily] Search failed: ${res.status}`);
    return null;
  }

  const data = await res.json();
  return data.results
    ?.map((r) => `## ${r.title}\n${r.content}`)
    .join("\n\n");
}

// ── Dispatch ────────────────────────────────────────────────────────────────

export async function dispatch(taskDescription) {
  const systemPrompt = readFileSync(
    join(PROMPTS_DIR, "dispatch.md"),
    "utf-8"
  );

  // Strip the markdown header comments, just use the prompt content
  const promptContent = systemPrompt
    .split("\n")
    .filter((l) => !l.startsWith("#") || l.startsWith("## ") || l.startsWith("### "))
    .join("\n")
    .replace(/^# Dispatch System Prompt\n+/, "");

  console.log(`[dispatch] Analyzing task: "${taskDescription}"`);
  const raw = await callBedrock(systemPrompt, taskDescription, 512);

  // Extract JSON from response (may have markdown fences)
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`Dispatch returned non-JSON: ${raw}`);
  }

  const result = JSON.parse(jsonMatch[0]);
  console.log(
    `[dispatch] -> ${result.expert} (${result.domain}) [${result.preBuilt ? "pre-built" : "needs generation"}]`
  );
  return result;
}

// ── Personality Factory (two-stage: JSON spec -> SOUL.md) ──────────────────

export async function generateExpert(name, domain) {
  const agentId = name.toLowerCase().replace(/[^a-z0-9]/g, "");

  // Check if workspace already exists
  const workspacePath = join(OPENCLAW_HOME, `workspace-${agentId}`);
  if (existsSync(join(workspacePath, "SOUL.md"))) {
    console.log(`[factory] Agent "${agentId}" already exists, skipping generation`);
    return { agentId, workspacePath, cached: true };
  }

  console.log(`[factory] Generating personality for: ${name} (${domain})`);

  // Stage 0: Tavily search for fresh context
  const tavilyContext = await searchTavily(
    `${name} philosophy beliefs communication style quotes ${domain}`
  );

  // Stage 1: Generate structured JSON personality spec
  const factoryPrompt = readFileSync(
    join(PROMPTS_DIR, "personality-factory.md"),
    "utf-8"
  );

  let userMsg = `Compile personality for: ${name}\nDomain: ${domain}`;
  if (tavilyContext) {
    userMsg += `\n\n## Fresh Context from Tavily Search:\n\n${tavilyContext}`;
  }

  console.log(`[factory] Stage 1: Generating JSON personality spec...`);
  const jsonSpec = await callBedrock(factoryPrompt, userMsg, 4096);

  // Validate JSON
  let parsedSpec;
  try {
    const jsonMatch = jsonSpec.match(/\{[\s\S]*\}/);
    parsedSpec = JSON.parse(jsonMatch[0]);
  } catch (e) {
    console.error(`[factory] JSON parse failed, raw output:\n${jsonSpec}`);
    throw new Error(`Personality factory produced invalid JSON for ${name}`);
  }

  // Stage 2: Convert JSON spec -> SOUL.md
  const soulGeneratorPrompt = readFileSync(
    join(PROMPTS_DIR, "soul-generator.md"),
    "utf-8"
  );

  console.log(`[factory] Stage 2: Converting to SOUL.md...`);
  const soulMd = await callBedrock(
    soulGeneratorPrompt,
    JSON.stringify(parsedSpec, null, 2),
    3000
  );

  // Stage 3: Create workspace and register agent
  console.log(`[factory] Stage 3: Creating workspace and registering agent...`);

  mkdirSync(workspacePath, { recursive: true });

  // Write SOUL.md
  writeFileSync(join(workspacePath, "SOUL.md"), soulMd);

  // Write personality spec JSON for reference
  writeFileSync(
    join(workspacePath, "personality-spec.json"),
    JSON.stringify(parsedSpec, null, 2)
  );

  // Copy shared AGENTS.md
  cpSync(join(SHARED_DIR, "AGENTS.md"), join(workspacePath, "AGENTS.md"));

  // Write IDENTITY.md
  const identityMd = `# IDENTITY.md

- **Name:** ${parsedSpec.identity?.name || name}
- **Archetype:** ${parsedSpec.identity?.archetype || domain}
- **Domain:** ${parsedSpec.identity?.domain || domain}
`;
  writeFileSync(join(workspacePath, "IDENTITY.md"), identityMd);

  // Register with OpenClaw (if not already registered)
  try {
    execSync(
      `openclaw agents add ${agentId} --workspace ${workspacePath} 2>&1`,
      { stdio: "pipe" }
    );
    console.log(`[factory] Registered agent: ${agentId}`);
  } catch (e) {
    // Agent might already exist from a previous run
    if (e.stdout?.toString().includes("already exists")) {
      console.log(`[factory] Agent "${agentId}" already registered`);
    } else {
      console.log(
        `[factory] Registration note: ${e.stdout?.toString().trim() || e.message}`
      );
    }
  }

  return { agentId, workspacePath, cached: false, spec: parsedSpec };
}

// ── Run Expert Agent ────────────────────────────────────────────────────────

export function runExpert(agentId, message) {
  console.log(`[run] Invoking agent "${agentId}" with: "${message}"`);

  const result = execSync(
    `openclaw agent --agent ${agentId} --message ${JSON.stringify(message)} 2>&1`,
    {
      encoding: "utf-8",
      timeout: 120000,
      env: { ...process.env },
    }
  );

  return result;
}

// Streaming version - returns the child process for piping to SSE
export function runExpertStream(agentId, message) {
  console.log(`[run:stream] Invoking agent "${agentId}" with: "${message}"`);

  const child = spawn(
    "openclaw",
    ["agent", "--agent", agentId, "--message", message],
    {
      env: { ...process.env },
      stdio: ["ignore", "pipe", "pipe"],
    }
  );

  return child;
}

// ── Full Pipeline: task -> dispatch -> (factory?) -> run ────────────────────

export async function pipeline(taskDescription) {
  // Step 1: Dispatch
  const dispatchResult = await dispatch(taskDescription);

  // Step 2: Generate if not pre-built
  if (!dispatchResult.preBuilt) {
    await generateExpert(dispatchResult.expert, dispatchResult.domain);
  }

  // Step 3: Run the expert
  const output = runExpert(dispatchResult.agentId, taskDescription);

  return {
    dispatch: dispatchResult,
    output,
  };
}

// ── CLI ─────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const command = args[0];

if (command === "dispatch") {
  dispatch(args.slice(1).join(" "))
    .then((r) => console.log(JSON.stringify(r, null, 2)))
    .catch((e) => {
      console.error(e.message);
      process.exit(1);
    });
} else if (command === "generate") {
  const name = args[1];
  const domain = args[2] || "general";
  generateExpert(name, domain)
    .then((r) => console.log(JSON.stringify(r, null, 2)))
    .catch((e) => {
      console.error(e.message);
      process.exit(1);
    });
} else if (command === "run") {
  const agentId = args[1];
  const message = args.slice(2).join(" ");
  const output = runExpert(agentId, message);
  console.log(output);
} else if (command === "pipeline") {
  pipeline(args.slice(1).join(" "))
    .then((r) => {
      console.log("\n=== Dispatch ===");
      console.log(JSON.stringify(r.dispatch, null, 2));
      console.log("\n=== Output ===");
      console.log(r.output);
    })
    .catch((e) => {
      console.error(e.message);
      process.exit(1);
    });
} else if (command) {
  console.log(`Unknown command: ${command}`);
  console.log("Usage:");
  console.log('  node engine.js dispatch "Apply to YC"');
  console.log('  node engine.js generate "Marcus Aurelius" "stoic philosophy"');
  console.log('  node engine.js run pg "Open google and search YC tips"');
  console.log('  node engine.js pipeline "Apply to YC for me"');
}
