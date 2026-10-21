# Local edition data flow

VALHALLA 0.2 sends chat requests only to `http://127.0.0.1:11434`, the Ollama
service on your own laptop. It does not call OpenAI, Anthropic, or Ollama Cloud.
It has no API-key entry field, no credentials in requests, and no paid fallback.
HTTP redirects are rejected, model names are restricted, and installed-model
metadata is checked for remote/cloud model indicators before inference.

Selected project notes and text references are included in the current local
model request. They are not uploaded by this app. References apply only to the
current turn and are held in main-process memory until removed, sent successfully,
or the app exits. Only text files are accepted. No audio is recorded; microphone
permission is denied. Optional speech output uses operating-system voices.

The setup script downloads open model weights from Ollama's registry through
the Ollama CLI. Ollama installation, model downloads, and runtime updates need
internet access. Ollama is separate software with its own configuration and
policies; do not expose its local server to untrusted networks. To disable its
cloud features globally, see https://docs.ollama.com/faq and restart Ollama after
changing its documented settings. This app independently rejects remote models.

Project title, notes, and conversation are saved as plain JSON under
`%APPDATA%/VALHALLA`. They are not an encrypted vault. Settings store the local
model name and read-aloud preference. Earlier API keys, if present in an existing
settings file or environment, are ignored. Export a project before clearing
history if you need a separate copy. To remove all app data, close VALHALLA and
remove its user-data directory; model weights are managed separately by Ollama.

Atomic saves and corrupted-file backups remain enabled. The app does not retain
full tool traces or attachment content in exported project Markdown. The full
conversation is saved locally, but only a short recent history is sent to the
local model to limit context use.
