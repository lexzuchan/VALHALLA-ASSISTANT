# Local edition testing

Run `npm run check` for syntax checks and the Node test suite. Tests require
neither an API key nor a downloaded model. The local Ollama boundary is mocked;
tests assert the loopback URL, absent credentials, redirect rejection, bounded
settings, tool calculations, errors, cancellation, context limits, and rejection
of remote models and unsupported attachments. Physics and storage tests remain.

`npm run smoke` launches real Electron, checks local IPC and a physics result,
and captures the interface. It does not need Ollama. GitHub Windows packaging
requires this check before artifacts are uploaded.

## Manual checks on the user's Windows laptop

1. Install/open Ollama. Run Setup-Local-AI.cmd and verify the model download.
2. Check local AI in Settings. Send a short text question, then a 4 kg × 3 m/s²
   calculation and inspect any actual calculator card.
3. Stop Ollama and confirm a helpful error instead of any cloud fallback.
4. Disconnect internet after setup and repeat text chat with Ollama running.
5. Include a short text reference and notes; test size limits and file removal.
6. Check simulation controls, project persistence, exports, and system read-aloud.
7. If needed, run Setup-Lite-AI.cmd and repeat using the smaller profile.

Actual inference speed, RAM/GPU use, setup-script execution, and read-aloud must
be checked on the laptop. Mocked tests do not establish model answer quality.
