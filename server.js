#!/usr/bin/env node

// Actus Prime - API Server
//
// POST /api/dispatch     - dispatch a task to the right expert
// POST /api/generate     - generate a new expert via Personality Factory
// POST /api/run          - run an expert agent (streaming SSE)
// POST /api/pipeline     - full pipeline: dispatch -> (generate?) -> run (streaming SSE)
// POST /api/tts          - text-to-speech via Microsoft Edge Neural TTS
// POST /api/transcribe   - transcribe audio via Reka Speech API
// POST /api/emotion      - detect emotion via Modulate API
// GET  /api/agents       - list registered agents

import express from "express";
import cors from "cors";
import multer from "multer";
import { execSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import "dotenv/config";
import { tts as edgeTts } from "edge-tts";

import { dispatch, generateExpert, runExpertStream } from "./engine.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

const PORT = process.env.PORT || 3456;

// ── POST /api/dispatch ──────────────────────────────────────────────────────

app.post("/api/dispatch", async (req, res) => {
  try {
    const { task } = req.body;
    if (!task) return res.status(400).json({ error: "task is required" });

    const result = await dispatch(task);
    res.json(result);
  } catch (e) {
    console.error("[api:dispatch]", e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── POST /api/generate ──────────────────────────────────────────────────────

app.post("/api/generate", async (req, res) => {
  try {
    const { name, domain } = req.body;
    if (!name) return res.status(400).json({ error: "name is required" });

    const result = await generateExpert(name, domain || "general");
    res.json(result);
  } catch (e) {
    console.error("[api:generate]", e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── POST /api/run (SSE streaming) ───────────────────────────────────────────

app.post("/api/run", (req, res) => {
  const { agentId, message } = req.body;
  if (!agentId || !message) {
    return res.status(400).json({ error: "agentId and message are required" });
  }

  // Set up SSE
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  const child = runExpertStream(agentId, message);

  child.stdout.on("data", (chunk) => {
    const text = chunk.toString();
    res.write(`data: ${JSON.stringify({ type: "output", text })}\n\n`);
  });

  child.stderr.on("data", (chunk) => {
    const text = chunk.toString();
    res.write(`data: ${JSON.stringify({ type: "stderr", text })}\n\n`);
  });

  child.on("close", (code) => {
    res.write(
      `data: ${JSON.stringify({ type: "done", exitCode: code })}\n\n`
    );
    res.end();
  });

  child.on("error", (err) => {
    res.write(
      `data: ${JSON.stringify({ type: "error", message: err.message })}\n\n`
    );
    res.end();
  });

  // Clean up if client disconnects
  req.on("close", () => {
    child.kill();
  });
});

// ── POST /api/pipeline (dispatch + generate + run, all streaming) ───────────

app.post("/api/pipeline", async (req, res) => {
  try {
    const { task } = req.body;
    if (!task) return res.status(400).json({ error: "task is required" });

    // Set up SSE
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    // Step 1: Dispatch
    res.write(
      `data: ${JSON.stringify({ type: "status", stage: "dispatch", message: "Analyzing task..." })}\n\n`
    );
    const dispatchResult = await dispatch(task);
    res.write(
      `data: ${JSON.stringify({ type: "dispatch", ...dispatchResult })}\n\n`
    );

    // Step 2: Generate if not pre-built
    if (!dispatchResult.preBuilt) {
      res.write(
        `data: ${JSON.stringify({ type: "status", stage: "factory", message: `Generating ${dispatchResult.expert}...` })}\n\n`
      );
      await generateExpert(dispatchResult.expert, dispatchResult.domain);
      res.write(
        `data: ${JSON.stringify({ type: "status", stage: "factory", message: `${dispatchResult.expert} ready.` })}\n\n`
      );
    }

    // Step 3: Run the expert (stream output)
    res.write(
      `data: ${JSON.stringify({ type: "status", stage: "run", message: `${dispatchResult.expert} is taking over...` })}\n\n`
    );

    const child = runExpertStream(dispatchResult.agentId, task);

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      res.write(`data: ${JSON.stringify({ type: "output", text })}\n\n`);
    });

    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      res.write(`data: ${JSON.stringify({ type: "stderr", text })}\n\n`);
    });

    child.on("close", (code) => {
      res.write(
        `data: ${JSON.stringify({ type: "done", exitCode: code })}\n\n`
      );
      res.end();
    });

    child.on("error", (err) => {
      res.write(
        `data: ${JSON.stringify({ type: "error", message: err.message })}\n\n`
      );
      res.end();
    });

    req.on("close", () => {
      child.kill();
    });
  } catch (e) {
    console.error("[api:pipeline]", e.message);
    if (!res.headersSent) {
      res.status(500).json({ error: e.message });
    } else {
      res.write(
        `data: ${JSON.stringify({ type: "error", message: e.message })}\n\n`
      );
      res.end();
    }
  }
});

// ── POST /api/transcribe (Reka Speech API) ──────────────────────────────────

app.post("/api/transcribe", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "audio file is required" });
    }

    const REKA_API_KEY = process.env.REKA_API_KEY;
    if (!REKA_API_KEY) {
      return res.status(500).json({ error: "REKA_API_KEY not configured" });
    }

    // Convert to WAV 16kHz using ffmpeg
    const { execSync } = await import("child_process");
    const tmpInput = `/tmp/actusprime-input-${Date.now()}`;
    const tmpOutput = `/tmp/actusprime-output-${Date.now()}.wav`;

    const { writeFileSync, readFileSync, unlinkSync } = await import("fs");
    writeFileSync(tmpInput, req.file.buffer);

    execSync(
      `ffmpeg -y -i ${tmpInput} -ar 16000 -ac 1 -f wav ${tmpOutput} 2>/dev/null`
    );

    const wavBuffer = readFileSync(tmpOutput);
    const audioBase64 = wavBuffer.toString("base64");
    const audioUrl = `data:audio/wav;base64,${audioBase64}`;

    // Clean up temp files
    try { unlinkSync(tmpInput); } catch {}
    try { unlinkSync(tmpOutput); } catch {}

    // Call Reka Speech API
    const rekaRes = await fetch(
      "https://api.reka.ai/v1/transcription_or_translation",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": REKA_API_KEY,
        },
        body: JSON.stringify({
          audio_url: audioUrl,
          sampling_rate: 16000,
          temperature: 0.0,
          max_tokens: 1024,
        }),
      }
    );

    if (!rekaRes.ok) {
      const errText = await rekaRes.text();
      throw new Error(`Reka API ${rekaRes.status}: ${errText}`);
    }

    const rekaData = await rekaRes.json();
    res.json({
      text: rekaData.transcript || rekaData.text || "",
      raw: rekaData,
    });
  } catch (e) {
    console.error("[api:transcribe]", e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── POST /api/emotion (Modulate API) ────────────────────────────────────────

app.post("/api/emotion", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "audio file is required" });
    }

    const MODULATE_API_KEY = process.env.MODULATE_API_KEY;
    if (!MODULATE_API_KEY) {
      return res.status(500).json({ error: "MODULATE_API_KEY not configured" });
    }

    // Send to Modulate Velma-2 API
    const formData = new FormData();
    formData.append(
      "upload_file",
      new Blob([req.file.buffer], { type: req.file.mimetype }),
      req.file.originalname || "audio.mp3"
    );
    formData.append("speaker_diarization", "false");
    formData.append("emotion_signal", "true");

    const modRes = await fetch(
      "https://modulate-developer-apis.com/api/velma-2-stt-batch",
      {
        method: "POST",
        headers: {
          "X-API-Key": MODULATE_API_KEY,
        },
        body: formData,
      }
    );

    if (!modRes.ok) {
      const errText = await modRes.text();
      throw new Error(`Modulate API ${modRes.status}: ${errText}`);
    }

    const modData = await modRes.json();
    res.json(modData);
  } catch (e) {
    console.error("[api:emotion]", e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── POST /api/tts (Microsoft Edge Neural TTS - free, no API key) ────────────

// Microsoft Edge neural voices mapped to expert archetypes.
// Full list: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support
const EDGE_VOICES = {
  // Deep, authoritative — philosophers, statesmen
  deep_male: 'en-US-GuyNeural',
  // Warm, articulate — founders, thought leaders
  warm_male: 'en-GB-RyanNeural',
  // Calm, wise — scholars, scientists
  calm_male: 'en-US-DavisNeural',
  // Energetic — entrepreneurs, tech leaders
  energetic_male: 'en-US-JasonNeural',
  // Female voices for variety
  authoritative_female: 'en-US-JennyNeural',
  warm_female: 'en-GB-SoniaNeural',
  // Default
  default: 'en-US-GuyNeural',
};

// Map expert names to voice archetypes
function getEdgeVoice(expertName) {
  const lower = (expertName || '').toLowerCase();
  if (lower.includes('aurelius') || lower.includes('marcus'))
    return EDGE_VOICES.deep_male;
  if (lower.includes('lincoln') || lower.includes('abraham'))
    return EDGE_VOICES.calm_male;
  if (lower.includes('graham') || lower.includes('paul'))
    return EDGE_VOICES.warm_male;
  if (lower.includes('jobs') || lower.includes('steve'))
    return EDGE_VOICES.energetic_male;
  if (lower.includes('socrates') || lower.includes('einstein') || lower.includes('aristotle'))
    return EDGE_VOICES.calm_male;
  if (lower.includes('curie') || lower.includes('earhart') || lower.includes('cleopatra'))
    return EDGE_VOICES.authoritative_female;
  return EDGE_VOICES.default;
}

app.post('/api/tts', async (req, res) => {
  try {
    const { text, expert } = req.body;
    if (!text) return res.status(400).json({ error: 'text is required' });

    const voice = getEdgeVoice(expert || '');

    console.log(`[tts] Generating speech for "${text.slice(0, 50)}..." voice=${voice}`);

    const audioBuffer = await edgeTts(text, { voice });

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-cache');
    res.send(Buffer.from(audioBuffer));
  } catch (e) {
    console.error('[api:tts]', e.message);
    if (!res.headersSent) {
      res.status(500).json({ error: e.message });
    }
  }
});

// ── GET /api/agents ─────────────────────────────────────────────────────────

app.get("/api/agents", (req, res) => {
  try {
    const output = execSync("openclaw agents list 2>&1", {
      encoding: "utf-8",
    });

    // Parse agent list from output
    const agents = [];
    const lines = output.split("\n");
    for (const line of lines) {
      const match = line.match(/^- (\w+)/);
      if (match) {
        agents.push({ id: match[1], isDefault: line.includes("(default)") });
      }
    }

    res.json({ agents });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Static files (overlay UI) ───────────────────────────────────────────────

app.use(express.static(join(__dirname, "public")));

// ── Start ───────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`[actus-prime] API server running on http://localhost:${PORT}`);
  console.log(`[actus-prime] Overlay UI: http://localhost:${PORT}`);
});
