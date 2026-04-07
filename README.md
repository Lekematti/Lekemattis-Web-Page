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
- The visit counter persists using a Render disk mounted at `/var/data`

### GitHub Actions CD (optional)

The workflow `.github/workflows/main.yml` contains a manual deploy job (`workflow_dispatch`) that can trigger Render deploy hooks:

- `RENDER_BACKEND_DEPLOY_HOOK` (optional)
- `RENDER_FRONTEND_DEPLOY_HOOK` (optional)
