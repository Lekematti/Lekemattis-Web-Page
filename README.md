# Lekemattis-Web-Page

My Website

## Local development

- Install deps: `npm ci`
- Start dev (auto-picks a free backend port): `npm run dev`
- Lint: `npm run lint`
- Tests: `npm test`

## Deployment

### Render

This repo includes a Render Blueprint: `render.yaml`.

- Create services from the Blueprint:

  - `lekemattis-frontend` (Static Site)
  - `lekemattis-backend` (Web Service)
- Set required environment variables during setup:

  - Frontend: `VITE_API_BASE_URL` = your backend URL (for example `https://lekemattis-backend.onrender.com`)
  - Backend: `CORS_ORIGIN` = your frontend URL (for example `https://lekemattis-frontend.onrender.com`)
    - You can provide multiple allowed origins as a comma-separated list.

Frontend settings in Render depend on your chosen Root Directory:

- If **Root Directory is empty** (repo root):

  - Build Command: `npm ci && npm run build:frontend`
  - Publish Directory: `Frontend/dist`
- If **Root Directory is `Frontend`**:

  - Build Command: `npm ci && npm run build`
  - Publish Directory: `dist`

Backend notes:

- The backend uses Node's experimental SQLite module and must run with `--experimental-sqlite` (already configured in scripts and `render.yaml`).
- `GET /api/visits` returns the current visit count. The root path `/` intentionally returns 404 JSON.

Visit counter persistence:

- To persist the SQLite database across deploys/restarts, you need a Render Disk mounted at `/var/data` and set `VISITS_DB_FILE=/var/data/visits.sqlite`.
- If you don't have access to Disks on your plan, the visit counter data is **not guaranteed** to survive the next deploy.

### GitHub Actions CD (optional)

The workflow `.github/workflows/main.yml` contains a manual deploy job (`workflow_dispatch`) that can trigger Render deploy hooks:

- Add these as GitHub Actions **Repository secrets**:

  - `RENDER_BACKEND_DEPLOY_HOOK` (optional)
  - `RENDER_FRONTEND_DEPLOY_HOOK` (optional)

To deploy via GitHub:

- GitHub → Actions → `CI/CD` → Run workflow (branch `main`)
