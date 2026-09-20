# Deploying CellMap BioAnalytics on Render

This guide walks you through deploying **CellMap BioAnalytics** (FastAPI Backend + React Frontend) to [Render](https://render.com/).

---

## Method 1: One-Click Blueprint Deployment (Recommended)

Render Blueprints let you configure and spin up both the backend and frontend simultaneously using the included [`render.yaml`](./render.yaml).

### Steps:
1. Push this repository to your GitHub account:
   ```bash
   git push origin main
   ```
2. Log in to your [Render Dashboard](https://dashboard.render.com/).
3. Click **New +** in the top navigation bar and select **Blueprint**.
4. Connect your GitHub repository (`Hybrid-Topology-Preserving-PCA-UMAP-Visualization-Pipeline-for-Single-Cell-Biomarker-Discovery_`).
5. Render will automatically detect `render.yaml` and configure:
   - **`cellmap-backend`**: Docker Web Service running FastAPI with the scientific compute pipeline.
   - **`cellmap-frontend`**: High-performance Static Site built with Vite.
6. Click **Apply**. Render will automatically build both services and provision free SSL/HTTPS URLs!

---

## Method 2: Manual Service Deployment

If you prefer to configure the services individually in the Render dashboard:

### 1. Deploy the Backend (Web Service)
1. In Render Dashboard, click **New +** > **Web Service**.
2. Connect your GitHub repository.
3. Choose **Docker** as the Runtime:
   - **Name**: `cellmap-backend`
   - **Region**: Any (e.g., Oregon or Frankfurt)
   - **Branch**: `main`
   - **Dockerfile Path**: `docker/Dockerfile.backend`
   - **Docker Context**: `.`
   - **Health Check Path**: `/health`
4. Under **Environment Variables**, add:
   | Key | Value | Description |
   |-----|-------|-------------|
   | `PORT` | `8000` | Port listened to by the server |
   | `ENVIRONMENT` | `production` | Production environment mode |
   | `DEBUG` | `false` | Disable debug logs |
   | `JWT_SECRET_KEY` | *(Click 'Generate')* | Secure key for authentication |
   | `CORS_ORIGINS` | `https://cellmap-frontend.onrender.com,http://localhost:3000,http://localhost:5173` | Allowed frontend origins |
   | `DATABASE_URL` | `sqlite+aiosqlite:///./cellmap.db` | Or link a Render PostgreSQL database |
5. Click **Create Web Service**. Note your backend URL (e.g., `https://cellmap-backend.onrender.com`).

---

### 2. Deploy the Frontend (Static Site)
1. In Render Dashboard, click **New +** > **Static Site**.
2. Connect your GitHub repository.
3. Configure the build:
   - **Name**: `cellmap-frontend`
   - **Branch**: `main`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Under **Environment Variables**, add:
   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://cellmap-backend.onrender.com` *(use your backend service URL)* |
5. Under **Redirects / Rewrites**, add:
   - **Source**: `/*`
   - **Destination**: `/index.html`
   - **Action**: `Rewrite` *(This enables single-page client routing without 404s)*
6. Click **Create Static Site**.

---

## Production Architecture Notes

- **Dynamic Port Binding**: The Docker backend dynamically reads `${PORT:-8000}`, ensuring immediate compatibility with Render's port assignment.
- **Database Compatibility**: The application automatically normalizes Render's `postgres://` URLs to `postgresql+asyncpg://` for SQLAlchemy async engines.
- **Task Queue / Eager Execution**: Celery includes automatic fallback to `task_always_eager` mode if an external Redis instance is not configured, allowing the entire pipeline to run seamlessly on Render's free tier without paid Redis add-ons.
- **CORS Handling**: Backend `CORSMiddleware` includes regex validation for `https://.*\.onrender\.com`, ensuring smooth cross-origin communication between the frontend and backend.
