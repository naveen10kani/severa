# Deploying SEVERA to Render

The repo ships with a **Render Blueprint** (`render.yaml`) that creates both services
in one click. Nothing else needs to be edited — all paths in the backend are
working-directory independent (`backend/app/core/paths.py`), so each service can run
from its own root folder.

---

## What gets deployed

| Service | Runtime | Root | Build | Start |
|---|---|---|---|---|
| `severa-api` | Python 3.12 | `backend/` | `pip install --no-cache-dir -r requirements.txt` | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| `severa-frontend` | Node 20 | `frontend/` | `npm install && npm run build` | `npm run start` |

Environment variables:

| Service | Key | Value | Why |
|---|---|---|---|
| `severa-api` | `PYTHON_VERSION` | `3.12.6` | matches local runtime |
| `severa-frontend` | `NEXT_PUBLIC_API_URL` | `https://severa-api.onrender.com` | inlined into the JS bundle at **build** time |
| `severa-frontend` | `NODE_VERSION` | `20.11.1` | LTS |

CORS is already wide open in `backend/app/main.py`, so the browser can call the API
across origins without extra configuration.

---

## Step 1 — Push the project to GitHub

```bash
cd "C:\Users\Naveen\OneDrive\Desktop\major project"
git init
git add .
git commit -m "SEVERA command center: 3D digital twin, cluster map, Render blueprint"
git remote add origin https://github.com/naveen10kani/severa.git
git branch -M main
git push -u origin main
```

> The trained model (`backend/app/models_artifact/severa_best_model.joblib`, ~42 MB)
> **must** be committed — Render builds from the repo, and there is no other copy in
> production. GitHub allows files up to 100 MB, so this is fine.

---

## Step 2 — Create the services (two options)

### Option A — Blueprint (recommended)

1. Render dashboard → **New** → **Blueprint**
2. Connect/select the GitHub repo
3. Render reads `render.yaml` and creates `severa-api` + `severa-frontend`
4. Click **Apply**

### Option B — Manual

**API** — New → Web Service → connect repo:
- Runtime: **Python**
- Root directory: `backend`
- Build command: `pip install --no-cache-dir -r requirements.txt`
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Health check path: `/health`
- Env: `PYTHON_VERSION=3.12.6`

**Frontend** — New → Web Service → connect repo:
- Runtime: **Node**
- Root directory: `frontend`
- Build command: `npm install && npm run build`
- Start command: `npm run start`
- Env: `NODE_VERSION=20.11.1`, `NEXT_PUBLIC_API_URL=https://severa-api.onrender.com`

> If you rename the API service, update `NEXT_PUBLIC_API_URL` to match —
> `NEXT_PUBLIC_*` values are baked in at **build** time, so redeploy the frontend
> after changing it.

---

## Step 3 — Verify

```bash
curl https://severa-api.onrender.com/health          # {"status":"HEALTHY",...}
curl https://severa-api.onrender.com/hotspots        # 160 cluster objects
curl -X POST https://severa-api.onrender.com/predict \
     -H "Content-Type: application/json" \
     -d '{"weather":"storm","road_type":"motorway","speed_limit":120,
          "light_condition":"dark-unlit","vehicle_count":4,"time_of_day":"23:30",
          "day_of_week":"Saturday","latitude":51.5,"longitude":-0.13}'
```

Then open `https://severa-frontend.onrender.com` — the War Room should stream live
predictions and the 3D digital twin should load.

---

## Free-tier notes

- **Cold start:** free instances sleep after 15 min idle; the first request takes
  ~30–60 s while the 42 MB model loads. Subsequent requests are fast.
- **Memory:** the API holds a Random Forest in memory on a 512 MB instance. If the
  service is OOM-killed in the logs, upgrade `severa-api` to **Starter** ($7/mo).
- **Health checks:** `/health` keeps the API from being marked unhealthy; it does
  not prevent sleep on the free plan.
- **Local development** is unchanged: `uvicorn` on :8000 + `npm run dev` on :3000.
