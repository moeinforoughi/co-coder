# Deployment Guides

Complete guides for deploying Co-Coder to various platforms.

## Table of Contents

- [Render.com (Recommended)](#rendercom)
- [Vercel + Railway](#vercel--railway)
- [Railway (Full Stack)](#railway)
- [Manual/VPS Deployment](#manual-deployment)
- [Environment Variables](#environment-variables)

---

## Render.com

**Best for**: Full-stack Docker deployment with free tier

### Prerequisites
- GitHub account
- Render.com account (free tier available)

### Step 1: Prepare Repository

1. Push your code to GitHub:
```bash
git push origin main
```

2. Ensure `render.yaml` exists in your repository root

### Step 2: Deploy to Render

#### Option A: Using render.yaml (Recommended)

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New" → "Blueprint"
3. Connect your GitHub repository
4. Render will auto-detect `render.yaml`
5. Click "Apply"

#### Option B: Manual Setup

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `co-coder`
   - **Environment**: `Docker`
   - **Region**: Choose closest to you
   - **Branch**: `main`
   - **Dockerfile Path**: `./Dockerfile`
   - **Instance Type**: Free

5. Add Environment Variable (Optional):
   - `NODE_ENV`: `production`

6. Click "Create Web Service"

### Step 3: Verify Deployment

1. Wait for build to complete (5-10 minutes)
2. Visit the provided URL (e.g., `https://co-coder.onrender.com`)
3. Test creating and joining sessions

### Auto-Deploy

Render automatically redeploys on every push to main branch.

### Custom Domain (Optional)

1. Go to your service → Settings
2. Scroll to "Custom Domain"
3. Add your domain and configure DNS

---

## Vercel + Railway

**Best for**: Separate frontend and backend deployment

### Frontend on Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

5. Add Environment Variable:
   - `VITE_API_URL`: `https://your-backend-url.railway.app`

6. Deploy

### Backend on Railway

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Configure:
   - Add custom start command: `cd server && npm start`
   - Add environment variables:
     - `PORT`: `3000`
     - `NODE_ENV`: `production`
     - `CLIENT_URL`: `https://your-frontend.vercel.app`

5. Deploy

### Update Frontend

Update `client/vite.config.js`:
```javascript
export default defineConfig({
  // ...
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})
```

---

## Railway

**Best for**: Full-stack deployment with database support

### Deploy Full App

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository

### Configure Service

1. In Railway dashboard, go to your service
2. Settings → Add custom start command:
```bash
npm install && cd server && npm install && cd ../client && npm install && cd .. && npm run build && cd server && npm start
```

3. Add Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: (Railway provides automatically)

4. Deploy

### Domain

Railway provides a subdomain automatically. You can add a custom domain in Settings.

---

## Manual Deployment

**Best for**: VPS, DigitalOcean, AWS EC2, etc.

### Prerequisites

- Ubuntu 20.04+ server
- Node.js 18+
- PM2 (process manager)

### Step 1: Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx (for reverse proxy)
sudo apt install -y nginx
```

### Step 2: Deploy Application

```bash
# Clone repository
git clone https://github.com/yourusername/co-coder.git
cd co-coder

# Install dependencies
npm install
cd client && npm install && npm run build
cd ../server && npm install
cd ..

# Start with PM2
pm2 start server/index.js --name co-coder
pm2 save
pm2 startup
```

### Step 3: Configure Nginx

Create `/etc/nginx/sites-available/co-coder`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/co-coder /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 4: SSL Certificate (Optional but Recommended)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### Update & Restart

```bash
git pull
cd client && npm run build
pm2 restart co-coder
```

---

## Environment Variables

### Backend (server)

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment mode | `development` | No |
| `PORT` | Server port | `3000` | No |
| `CLIENT_URL` | Frontend URL for CORS | `http://localhost:5173` | Production |

### Frontend (client)

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_API_URL` | Backend API URL | `/api` (proxy) | Production only |

---

## Docker Deployment

### Build and Run Locally

```bash
# Build image
docker build -t co-coder .

# Run container
docker run -p 3000:3000 -e NODE_ENV=production co-coder

# Access at http://localhost:3000
```

### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

Run:
```bash
docker-compose up -d
```

---

## Troubleshooting

### WebSocket Connection Issues

If WebSocket fails in production:

1. Ensure your reverse proxy supports WebSocket upgrades
2. Check CORS settings in `server/index.js`
3. Verify `CLIENT_URL` environment variable

### Build Failures

1. Check Node.js version (needs 18+)
2. Clear npm cache: `npm cache clean --force`
3. Delete `node_modules` and reinstall

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

---

## CI/CD Integration

GitHub Actions automatically:
- Runs tests on every push
- Builds Docker image on main branch
- Can auto-deploy to your platform

See `.github/workflows/ci-cd.yml` for details.

---

## Monitoring & Logs

### Render
- View logs in dashboard → your service → Logs

### Railway
- View logs in dashboard → your service → Deployments → View logs

### PM2
```bash
pm2 logs co-coder
pm2 monit
```

---

## Next Steps

After deployment:
1. Test all features (session creation, real-time sync, code execution)
2. Set up custom domain
3. Configure SSL certificate
4. Add monitoring (e.g., UptimeRobot)
5. Set up error tracking (e.g., Sentry)

---

## Support

For issues or questions:
- Check the main [README.md](../README.md)
- Review the [walkthrough](../walkthrough.md)
- Open an issue on GitHub
