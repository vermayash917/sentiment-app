#!/usr/bin/env bash
set -euo pipefail

# ---------- configuration ----------
# change these if your app uses different ports
: "${PORT:=5000}"           # Railpack/host may give PORT; backend should use this
: "${INFERENCE_PORT:=8001}" # internal port for inference service
# -----------------------------------

cleanup() {
  echo "Stopping children..."
  [ -n "${INFERENCE_PID:-}" ] && kill "$INFERENCE_PID" 2>/dev/null || true
  wait
}
trap cleanup EXIT INT TERM

# Install / build backend
if [ -d "backend" ]; then
  printf "\n==> Installing backend deps\n"
  cd backend
  # use npm ci if lockfile exists
  if [ -f package-lock.json ]; then
    npm ci
  else
    npm install
  fi
  cd ..
fi

# Install / build inference (Python)
if [ -d "inference" ]; then
  printf "\n==> Installing inference deps\n"
  cd inference
  # use requirements.txt in inference/
  if [ -f requirements.txt ]; then
    python -m pip install --no-cache-dir -r requirements.txt
  fi
  cd ..
fi

# Build frontend
if [ -d "frontend" ]; then
  printf "\n==> Building frontend\n"
  cd frontend
  if [ -f package-lock.json ]; then
    npm ci
  else
    npm install
  fi
  # Adjust build command if Vite or CRA: npm run build
  npm run build
  cd ..
fi

# Start inference service (background)
if [ -d "inference" ]; then
  printf "\n==> Starting inference on port %s\n" "$INFERENCE_PORT"
  # adjust module path: inference.app:app or app:app depending on file
  # Use uvicorn if fastapi; fallback to flask app.py
  if command -v uvicorn >/dev/null 2>&1; then
    # run uvicorn in background, bind to INFERENCE_PORT
    uvicorn inference.app:app --host 0.0.0.0 --port "$INFERENCE_PORT" --reload & 
  elif [ -f inference/app.py ]; then
    # assume Flask with port env usage
    INFERENCE_PORT="$INFERENCE_PORT" python inference/app.py & 
  else
    echo "No known inference start method found (uvicorn or inference/app.py)"
  fi
  INFERENCE_PID=$!
  echo "Inference PID: $INFERENCE_PID"
fi

# Export env var so backend knows where inference lives (optional)
export INFERENCE_URL="http://127.0.0.1:${INFERENCE_PORT}"

# Start backend in foreground (so container stays alive)
if [ -d "backend" ]; then
  printf "\n==> Starting backend on port %s\n" "$PORT"
  # ensure backend reads PORT env var
  export PORT
  # If package.json has start script, use npm start; else run node server directly
  if [ -f backend/package.json ]; then
    # pass --prefix to run from repo root
    exec npm start --prefix backend
  elif [ -f backend/server.js ]; then
    exec node backend/server.js
  else
    echo "No backend entrypoint found (backend/package.json or backend/server.js)"
    exit 1
  fi
else
  # nothing to run in foreground => keep container alive
  printf "\nNo backend directory found; sleeping (container will stay alive)\n"
  tail -f /dev/null
fi
