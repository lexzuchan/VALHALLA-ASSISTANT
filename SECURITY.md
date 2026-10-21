# Local edition security

This is an early application, not a security-audited engineering platform.
The trusted interface remains sandboxed with context isolation, no Node access,
strict CSP, and an allowlisted IPC bridge that validates sender and main frame.
AI and reference output are displayed as text, not executable HTML.

The model adapter has a fixed loopback address, rejects redirects and unknown
endpoints, and allows only `valhalla-local`, `qwen3:4b`, and `qwen3:1.7b`.
It checks installed-model metadata and rejects remote/cloud manifests. There is
no API-key handling, cloud request, automatic model pull, shell tool, browser
tool, Python execution, CAD control, or hardware actuation in chat.

The only model tool evaluates bounded deterministic physics formulas. Tool names,
numerical inputs, number of calls, and number of request rounds are checked.
Image/PDF input and voice recording are unavailable; all device permissions are
denied. Setup files are shown in File Explorer; they are never executed by chat.
The user explicitly runs the setup script to download weights and configure the
assistant through Ollama. It does not install software or bypass Windows warnings.

Keep Electron, build dependencies, and Ollama updated. Keep the Ollama service
bound to loopback. Do not upload private notebooks, API keys from earlier versions,
or model weights to GitHub. Unsigned executables have no verified publisher
identity; code signing and automatic update integrity checks are not configured.
