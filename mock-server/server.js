import express from "express";
import cors from "cors";
import multer from "multer";
import { nanoid } from "nanoid";

const PORT = process.env.PORT ?? 8080;

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1024 * 1024 * 512 // 512 MB cap for mock uploads
  }
});

app.use(cors());
app.use(express.json({ limit: "10mb" }));

const clips = new Map();

const discoveredModels = [
  {
    id: "local-llama-70b",
    name: "Local Llama 3 70B",
    endpoint: "http://localhost:8000",
    description: "vLLM gateway exposing a chat completions interface at /v1/chat/completions."
  },
  {
    id: "audio-whisper",
    name: "Whisper Large-v3",
    endpoint: "http://localhost:8001",
    description: "FastAPI wrapper for Whisper audio transcription tasks."
  },
  {
    id: "vision-siglip",
    name: "SigLIP-So400m Vision Encoder",
    endpoint: "http://localhost:8002",
    description: "Image embedding encoder served via llamafile."
  }
];

const defaultClips = [
  {
    id: nanoid(),
    name: "Product Launch Teaser.mp4",
    status: "ready",
    mediaType: "video",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    tags: ["marketing", "social"],
    description: "30s teaser showing the new Atlas dashboard."
  },
  {
    id: nanoid(),
    name: "Customer Interview.wav",
    status: "ready",
    mediaType: "audio",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    tags: ["research"],
    description: "Interview with early adopter discussing Atlas Browser workflows."
  },
  {
    id: nanoid(),
    name: "Workflow Diagram.png",
    status: "ready",
    mediaType: "image",
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    tags: ["docs", "architecture"],
    description: "High-level architecture diagram for the Atlas ingest pipeline."
  }
];

for (const clip of defaultClips) {
  clips.set(clip.id, clip);
}

app.get("/", (_req, res) => {
  res.json({
    service: "atlas-mock-server",
    endpoints: ["/clips", "/clips/:id", "/ingest", "/models"],
    docs: "Use this mock service for local VS Code + admin console development."
  });
});

app.get("/clips", (_req, res) => {
  res.json(Array.from(clips.values()));
});

app.patch("/clips/:id", (req, res) => {
  const { id } = req.params;
  const clip = clips.get(id);
  if (!clip) {
    res.status(404).json({ error: "Clip not found" });
    return;
  }
  const { tags, description } = req.body ?? {};
  const updated = {
    ...clip,
    tags: Array.isArray(tags) ? tags : clip.tags,
    description: description ?? clip.description
  };
  clips.set(id, updated);
  res.json(updated);
});

app.post("/ingest", upload.single("file"), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "file field is required" });
    return;
  }

  let tags = [];
  if (typeof req.body.tags === "string") {
    try {
      const parsed = JSON.parse(req.body.tags);
      if (Array.isArray(parsed)) {
        tags = parsed.map((item) => String(item));
      }
    } catch (error) {
      console.warn("Failed to parse tags payload", error);
    }
  }

  const clip = {
    id: nanoid(),
    name: req.file.originalname,
    status: "ready",
    mediaType: resolveMediaType(req.file.originalname),
    createdAt: new Date().toISOString(),
    tags,
    description: req.body.description ?? "",
    metadata: {
      size: req.file.size,
      mimetype: req.file.mimetype,
      note: "Binary payload is discarded in mock server."
    }
  };

  clips.set(clip.id, clip);
  res.json(clip);
});

app.get("/models", (_req, res) => {
  res.json(discoveredModels);
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message ?? "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Atlas mock server listening on http://localhost:${PORT}`);
});

function resolveMediaType(fileName) {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".mp4") || lower.endsWith(".mov") || lower.endsWith(".mkv") || lower.endsWith(".webm")) {
    return "video";
  }
  if (lower.endsWith(".mp3") || lower.endsWith(".wav") || lower.endsWith(".flac") || lower.endsWith(".m4a")) {
    return "audio";
  }
  if (lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".gif")) {
    return "image";
  }
  return "binary";
}
