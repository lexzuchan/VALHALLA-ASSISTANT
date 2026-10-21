# Local-only architecture

```
Local renderer
  ├── physics.js → calculators, unit conversion, simulation samples
  └── preload.cjs → allowlisted IPC
      └── main.cjs → local settings, project storage, selected text files
          └── ai.cjs → http://127.0.0.1:11434
              ├── /api/tags + /api/show → verify downloaded local weights
              └── /api/chat → local inference
                  └── physics_calculate → deterministic physics.js
```

The existing OpenAI adapter is replaced, not used as a fallback. An old API key
cannot trigger a cloud request. API destination and model names are fixed or
allowlisted. No prompts or notes are sent during startup. The connection button
inspects installed-model metadata but does not generate an answer or download
weights. Chat verifies metadata again before using the model.

Default model: valhalla-local, created from Qwen3 4B by the included Modelfile.
Lite setup uses Qwen3 1.7B under the same name. This customizes a system prompt
and runtime parameters; it is not training or fine-tuning.

The API requests a 4096-token context, 768-token generation limit, no thinking
output, and a one-minute idle unload. Short history and reference limits constrain
input size. Three request rounds and two calls per round bound tool use. Models
without tool capability can answer text but do not get fabricated tool results.

Only text attachments are accepted. Microphone access and transcription are
disabled. Read-aloud remains an operating-system service. Setup scripts are
packaged as extra resources and are shown, rather than automatically executed.
