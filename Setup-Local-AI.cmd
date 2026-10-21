@echo off
setlocal
title VALHALLA - Local AI Setup
cd /d "%~dp0"
set "OLLAMA_HOST=http://127.0.0.1:11434"
set "OLLAMA_NO_CLOUD=1"
set "OLLAMA_EXE="
for /f "delims=" %%I in ('where ollama.exe 2^>nul') do if not defined OLLAMA_EXE set "OLLAMA_EXE=%%I"
if not defined OLLAMA_EXE if exist "%LOCALAPPDATA%\Programs\Ollama\ollama.exe" set "OLLAMA_EXE=%LOCALAPPDATA%\Programs\Ollama\ollama.exe"
if not defined OLLAMA_EXE (
  echo Ollama is not installed or could not be found.
  echo Install it from https://ollama.com/download/windows
  echo Open Ollama, then run this setup file again.
  pause
  exit /b 1
)
echo.
echo VALHALLA Local - no API key or model subscription required.
echo The first run downloads model weights; internet is needed for this step.
echo Your laptop will use disk space, memory, and electricity to run the AI.
echo.
curl.exe --fail --silent --max-time 5 http://127.0.0.1:11434/api/version >nul 2>&1
if errorlevel 1 (
  echo Ollama is installed but is not responding.
  echo Open Ollama from the Windows Start menu, then run this file again.
  pause
  exit /b 1
)
set "BASE_MODEL=qwen3:4b"
set "MODELFILE=%~dp0local-ai\Modelfile"
if /i "%~1"=="lite" (
  set "BASE_MODEL=qwen3:1.7b"
  set "MODELFILE=%~dp0local-ai\Modelfile-lite"
)
echo Downloading %BASE_MODEL% ...
"%OLLAMA_EXE%" pull %BASE_MODEL%
if errorlevel 1 goto failed
echo Creating VALHALLA's local assistant profile ...
"%OLLAMA_EXE%" create valhalla-local -f "%MODELFILE%"
if errorlevel 1 goto failed
echo.
echo Setup complete.
echo In VALHALLA, open Settings and click Check local AI.
echo Select VALHALLA Local as the model. Leave Ollama running.
echo Downloaded weights stay on this laptop; do not upload them to GitHub.
pause
exit /b 0
:failed
echo.
echo Setup failed. Read the error above.
echo Check your connection and free disk space, then try again.
echo No API key or payment is required for this local model.
pause
exit /b 1
