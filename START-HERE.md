# Two separate steps: upload code, then download the model locally

## A. Update the app in GitHub

Extract this ZIP. At your repository root, choose Add file → Upload files.
Drag all contents of the extracted folder into the upload area, including the
folders. Commit to main. Wait for the Windows build to succeed, then download
the VALHALLA-Windows artifact. Extract and install the 0.2.0 Setup executable.

This ZIP contains only source/setup files, not node_modules or model weights.
Never put the downloaded Qwen model into GitHub.

## B. Set up the AI on your laptop

1. Install and open Ollama: https://ollama.com/download/windows
2. Run Setup-Local-AI.cmd from this extracted folder. It downloads about 2.5 GB.
3. In the new VALHALLA app, open Settings and click Check local AI.
4. Chat. There is no API-key field in this edition.

If the laptop struggles, run Setup-Lite-AI.cmd to switch to a smaller base model.
This is a configured open model, not newly trained weights. Model downloads need
internet once; inference runs on your laptop. Your hardware and electricity are
still used. Image/PDF analysis and voice dictation are unavailable in this edition.
