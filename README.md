# V.A.L.H.A.L.L.A — Local Edition

**Voice-Assisted Laboratory for Heuristics, Analysis, Learning, Logic, and Automation**

Version **0.2.0** runs chat on your own laptop through Ollama. No API key,
model subscription, per-message API bill, or automatic cloud fallback.
This is a configured **Qwen3 4B** assistant, not a model trained from scratch.
Your laptop still supplies storage, memory, computing power, and electricity.

## Where to put the code

1. Extract **VALHALLA-Local-GitHub.zip** into a new folder on your PC.
2. Open your existing VALHALLA GitHub repository at its root (where `package.json` is).
3. Choose **Add file → Upload files**. Select all contents **inside** the extracted
   folder and drag them into the upload area. Keep the nested folder structure.
4. Commit to `main`. These files replace the previous version's files. No
   `node_modules` or downloaded AI weights are included in this ZIP.
5. Open **Actions → Build VALHALLA for Windows**. Download **VALHALLA-Windows**
   from the successful run, extract it, and install **VALHALLA-0.2.0-Setup.exe**
   or run **VALHALLA-0.2.0-Portable.exe**.

Do not upload the ZIP itself, the enclosing folder, or model weights. Keep
`dependabot.yml` at `.github/dependabot.yml`; only `build.yml` belongs in
`.github/workflows/`. The workflow explicitly disables release publishing.

## Set up the free local model on your laptop

1. Install **Ollama** from https://ollama.com/download/windows and open it.
2. Double-click **Setup-Local-AI.cmd** in the extracted source folder.
   You can also find it from the app's **Settings → Show setup files**.
3. Leave the terminal open while it downloads **qwen3:4b** (about 2.5 GB) and
   creates **valhalla-local**, the configured VALHALLA assistant.
4. Open VALHALLA → **Settings & connection** → **Check local AI**.
5. Select **VALHALLA Local — recommended**, save settings, then start chatting.

After setup, chat works without internet while Ollama is running. Initial model
downloads and Ollama updates require internet. Model files are managed by Ollama
under your user account, not stored inside this GitHub project or installer.

If the 4B model is too slow or memory-hungry, run **Setup-Lite-AI.cmd** instead.
That recreates `valhalla-local` using the smaller **qwen3:1.7b** base. Keep the
same model selection in the app. The smaller model generally gives weaker answers.
No exact laptop performance is promised without testing your hardware.

## What works

- Local text chat with bounded calls to the eight physics calculators.
- Short `.txt`, `.md`, `.csv`, and `.json` references; optional project notes.
- Projectile, spring and RC simulations with playback and CSV export.
- Unit conversion, project notebook, conversation saving, Markdown export.
- Optional read-aloud using installed system voices.

The model uses a 4096-token context, up to 768 generated tokens per request,
thinking disabled, and a short recent-message window. The app limits a question
plus references to roughly 4500 characters. It asks Ollama to unload the model
after one idle minute. These settings keep memory and computation modest, but
are not a hard cap on CPU, GPU, or total RAM usage.

**Not included in this local edition:** image/PDF analysis, microphone dictation,
Claude/OpenAI connections, web search, CAD control, Python execution, or hardware
automation. Describe a diagram in text or paste a short extracted passage instead.
Small models can make mistakes; calculator cards validate formula evaluation,
not physical safety, material properties, or standards compliance.

## Develop and build

Use Node.js 22.12+ on Windows:

```powershell
npm ci
npm run check
npm start
npm run dist
```

Builds are unsigned. The GitHub workflow runs tests and native startup before
packaging. It does not download model weights or need API credentials.

Existing notebook and conversation data remain under `%APPDATA%/VALHALLA`.
Old API credentials, if present in an earlier settings file or environment,
are ignored by this edition and never used for requests.

See [PRIVACY.md](PRIVACY.md), [SECURITY.md](SECURITY.md),
[model limits](docs/ENGINEERING.md), and [verification](docs/VERIFICATION.md).
The original source is MIT licensed. Qwen3 weights retain their upstream license.

## References

- Base model and download size: https://ollama.com/library/qwen3:4b
- Local API: https://docs.ollama.com/api/chat
- Local-only cloud setting: https://docs.ollama.com/faq
