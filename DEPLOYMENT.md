# FloraTrack Crop Propagation App - Deployment Guide

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Prerequisites](#2-prerequisites)
3. [Server Provisioning](#3-server-provisioning)
4. [GitHub Repository Setup](#4-github-repository-setup)
5. [Server: System Dependencies](#5-server-system-dependencies)
6. [Server: Directory Structure](#6-server-directory-structure)
7. [Server: Clone Repository](#7-server-clone-repository)
8. [Server: Backend Setup](#8-server-backend-setup)
9. [Server: Database Setup (PostgreSQL)](#9-server-database-setup-postgresql)
10. [Server: Alembic Migrations](#10-server-alembic-migrations)
11. [Server: Backend Environment File](#11-server-backend-environment-file)
12. [Server: Systemd Service](#12-server-systemd-service)
13. [Server: Frontend Build & Deploy](#13-server-frontend-build--deploy)
14. [Server: Nginx Configuration](#14-server-nginx-configuration)
15. [Server: Firewall Rules](#15-server-firewall-rules)
16. [Server: Passwordless Sudo for Deploy](#16-server-passwordless-sudo-for-deploy)
17. [CI/CD: GitHub Actions Pipeline](#17-cicd-github-actions-pipeline)
18. [CI/CD: GitHub Secrets](#18-cicd-github-secrets)
19. [CI/CD: Deploy SSH Key](#19-cicd-deploy-ssh-key)
20. [Seed Data (Demo Account)](#20-seed-data-demo-account)
21. [Verification & Health Checks](#21-verification--health-checks)
22. [Maintenance & Operations](#22-maintenance--operations)
23. [Troubleshooting](#23-troubleshooting)
24. [Security Considerations](#24-security-considerations)

---

## 1. Architecture Overview

```
                     +-----------+
                     |  GitHub   |
                     | Actions   |
                     |  CI/CD    |
                     +-----+-----+
                           | SSH deploy on push to main
                           v
                  +--------+--------+
                  |  Ubuntu 24.04   |
                  |  Production     |
                  |  Server         |
                  +--------+--------+
                           |
              +------------+------------+
              |                         |
       +------+------+         +-------+-------+
       |    Nginx     |         |   Uvicorn     |
       | Port 8080    |         |   Port 9000   |
       | Static Files |         |   FastAPI     |
       |  + Proxy     |         |   Backend     |
       +------+------+         +-------+-------+
              |                         |
              |  /api/* proxy_pass      |
              +------------------------>+
                                        |
                              +---------+---------+
                              |   PostgreSQL 16   |
                              |   (Docker)        |
                              |   Port 5432       |
                              +-------------------+
```

### Component Summary

| Component | Technology | Port | Location |
|-----------|-----------|------|----------|
| Frontend | React 19 + CRA | 8080 (via Nginx) | `/var/www/crop-propagation-app/frontend/` |
| Backend | FastAPI + Uvicorn | 9000 | `/var/www/crop-propagation-app/backend/` |
| Database | PostgreSQL 16 | 5432 | Docker container `postgres-postgres-1` |
| Reverse Proxy | Nginx | 8080 | `/etc/nginx/sites-available/crop-propagation` |
| Process Manager | systemd | - | `crop-propagation-api.service` |
| CI/CD | GitHub Actions | - | `.github/workflows/deploy.yml` |
| Repository | Git | - | `/var/www/crop-propagation-app/repo/` |

---

## 2. Prerequisites

### Server Requirements

- **OS**: Ubuntu 22.04 or 24.04 LTS
- **RAM**: Minimum 2 GB (4 GB recommended)
- **Storage**: Minimum 10 GB free
- **Python**: 3.12+
- **Node.js**: 18.x LTS
- **Nginx**: 1.18+
- **PostgreSQL**: 16 (running in Docker or native)

### Local Development Requirements

- **Git**
- **GitHub CLI** (`gh`) - for repo/secret management
- **SSH key** for server access
- **GitHub Personal Access Token** (for private repos)

---

## 3. Server Provisioning

### Current Production Server

| Property | Value |
|----------|-------|
| Hostname | konza |
| IP Address | `102.210.148.91` |
| OS | Ubuntu 24.04 LTS |
| SSH User | `humphrey_picidae` |
| Root Access | via `su` (not sudo) |
| SSH Key | `humphf_key.pem` |

### Initial SSH Access

```bash
# Connect to the server
ssh -i ~/.ssh/humphf_key.pem humphrey_picidae@102.210.148.91

# Verify OS version
lsb_release -a
```

---

## 4. GitHub Repository Setup

### 4.1 Create Repository

```bash
# Initialize local repo (if not done)
cd /path/to/crop-propagation-app
git init
git add .
git commit -m "Initial commit"

# Create remote repo
gh repo create njuguna05/crop-propagation-app --private --source=. --remote=origin --push
```

### 4.2 Repository URL

```
https://github.com/njuguna05/crop-propagation-app.git
```

---

## 5. Server: System Dependencies

SSH into the server and install all required packages.

### 5.1 Update System

```bash
sudo apt update && sudo apt upgrade -y
```

### 5.2 Install Python 3.12

```bash
sudo apt install -y python3.12 python3.12-venv python3.12-dev python3-pip
```

### 5.3 Install Node.js 18

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version   # v18.x.x
npm --version    # 9.x.x
```

### 5.4 Install Nginx

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
```

### 5.5 Install Additional Tools

```bash
sudo apt install -y git rsync build-essential libpq-dev
```

---

## 6. Server: Directory Structure

Create the application directory layout.

```bash
sudo mkdir -p /var/www/crop-propagation-app/{repo,backend,frontend}
sudo chown -R humphrey_picidae:humphrey_picidae /var/www/crop-propagation-app
```

### Directory Purpose

```
/var/www/crop-propagation-app/
├── repo/               # Git clone of the full repository
│   ├── backend/        # Backend source code (reference only)
│   ├── src/            # Frontend source code
│   ├── public/         # Frontend public assets
│   ├── package.json    # Frontend dependencies
│   └── build/          # Compiled frontend (after npm run build)
├── backend/            # Deployed backend (rsync from repo/backend)
│   ├── app/            # FastAPI application code
│   ├── alembic/        # Database migration scripts
│   ├── venv/           # Python virtual environment
│   ├── .env            # Production environment variables (NOT in git)
│   └── seed_data.py    # Database seeder script
└── frontend/           # Deployed frontend static files (rsync from repo/build)
    ├── index.html
    ├── static/
    └── ...
```

---

## 7. Server: Clone Repository

### 7.1 Set Up Deploy Key (Recommended for CI/CD)

```bash
# On server: generate deploy key
ssh-keygen -t ed25519 -f ~/.ssh/github_deploy_key -N "" -C "crop-propagation-deploy"

# Display the public key
cat ~/.ssh/github_deploy_key.pub
```

Add the public key to GitHub:
- Go to **Settings > Deploy keys > Add deploy key**
- Title: `konza-server-deploy`
- Paste the public key
- Check **Allow write access** (not needed for pull-only)

### 7.2 Configure SSH for GitHub

```bash
cat >> ~/.ssh/config << 'EOF'
Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/github_deploy_key
    IdentitiesOnly yes
EOF

chmod 600 ~/.ssh/config
```

### 7.3 Clone the Repository

```bash
cd /var/www/crop-propagation-app
git clone git@github.com:njuguna05/crop-propagation-app.git repo
```

---

## 8. Server: Backend Setup

### 8.1 Create Python Virtual Environment

```bash
cd /var/www/crop-propagation-app/backend
python3.12 -m venv venv
source venv/bin/activate
```

### 8.2 Install Python Dependencies

```bash
pip install --upgrade pip
pip install -r /var/www/crop-propagation-app/repo/backend/requirements.txt
```

### 8.3 Backend Dependencies (requirements.txt)

```
fastapi>=0.104.0
uvicorn[standard]>=0.24.0
sqlalchemy>=2.0.23
alembic>=1.12.0
asyncpg>=0.29.0
psycopg2-binary>=2.9.9
aiosqlite>=0.20.0
python-jose[cryptography]>=3.3.0
passlib[bcrypt]>=1.7.4
bcrypt>=4.0.0,<4.1.0
python-multipart>=0.0.6
python-dotenv>=1.0.0
pydantic>=2.5.0
pydantic-settings>=2.1.0
pydantic[email]>=2.5.0
pytest>=7.4.0
pytest-asyncio>=0.23.0
httpx>=0.25.0
faker>=20.0.0
```

> **Important**: `bcrypt` must be pinned to `<4.1.0` due to incompatibility with `passlib 1.7.4`.

### 8.4 Deploy Backend Code

```bash
rsync -a --delete \
  --exclude='venv' \
  --exclude='.env' \
  --exclude='__pycache__' \
  --exclude='*.pyc' \
  --exclude='*.db' \
  /var/www/crop-propagation-app/repo/backend/ \
  /var/www/crop-propagation-app/backend/
```

---

## 9. Server: Database Setup (PostgreSQL)

### 9.1 PostgreSQL via Docker (Current Setup)

The production server runs PostgreSQL 16 in a Docker container named `postgres-postgres-1`.

```bash
# Verify the container is running
docker ps | grep postgres

# Expected output:
# postgres-postgres-1   postgres:16   ... 0.0.0.0:5432->5432/tcp
```

### 9.2 Create Database and User

```bash
# Connect to the PostgreSQL container
docker exec -it postgres-postgres-1 psql -U postgres

# Inside psql:
CREATE USER flora WITH PASSWORD 'your-secure-password-here';
CREATE DATABASE flora_db OWNER flora;
GRANT ALL PRIVILEGES ON DATABASE flora_db TO flora;
\q
```

### 9.3 Verify Connectivity

```bash
docker exec -it postgres-postgres-1 psql -U flora -d flora_db -c "SELECT 1;"
```

### Database Connection Details

| Property | Value |
|----------|-------|
| Host | `localhost` |
| Port | `5432` |
| Database | `flora_db` |
| User | `flora` |
| Password | *(set in .env)* |
| Async URL | `postgresql+asyncpg://flora:PASSWORD@localhost:5432/flora_db` |
| Sync URL | `postgresql://flora:PASSWORD@localhost:5432/flora_db` |

---

## 10. Server: Alembic Migrations

### 10.1 How Alembic is Configured

The `alembic/env.py` file:
- Reads `DATABASE_URL` from the `.env` file
- Automatically converts async URLs to sync (strips `+asyncpg` / `+aiosqlite`)
- Imports all models from `app.models` to detect schema changes

### 10.2 Run Migrations

```bash
cd /var/www/crop-propagation-app/backend
source venv/bin/activate
alembic upgrade head
```

### 10.3 Check Migration Status

```bash
alembic current     # Show current revision
alembic heads       # Show latest available revision
alembic history     # Show full migration history
```

### 10.4 Generate New Migration (After Model Changes)

```bash
alembic revision --autogenerate -m "Description of changes"

# Review the generated file in alembic/versions/
# Then apply:
alembic upgrade head
```

> **Note**: When converting TEXT columns to JSON in PostgreSQL, auto-generated migrations need manual editing to include `USING column_name::json`. Example:
> ```python
> op.execute('ALTER TABLE orders ALTER COLUMN notes TYPE JSON USING notes::json')
> ```

---

## 11. Server: Backend Environment File

Create the production `.env` file at `/var/www/crop-propagation-app/backend/.env`:

```bash
cat > /var/www/crop-propagation-app/backend/.env << 'EOF'
# Database
DATABASE_URL=postgresql+asyncpg://flora:YOUR_DB_PASSWORD@localhost:5432/flora_db
DATABASE_ECHO=false

# JWT - GENERATE A UNIQUE SECRET KEY
SECRET_KEY=YOUR_GENERATED_SECRET_KEY
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# Environment
ENVIRONMENT=production
DEBUG=false

# CORS - Allow frontend origin
BACKEND_CORS_ORIGINS=http://102.210.148.91:8080,http://102.210.148.91

# API
API_V1_STR=/api/v1
PROJECT_NAME=Crop Propagation API
VERSION=1.0.0
EOF
```

### Generate a Secure SECRET_KEY

```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

> **CRITICAL**: This `.env` file contains secrets. It is excluded from git via `.gitignore` and must NEVER be committed.

---

## 12. Server: Systemd Service

### 12.1 Create the Service File

```bash
sudo cat > /etc/systemd/system/crop-propagation-api.service << 'EOF'
[Unit]
Description=Crop Propagation FastAPI Backend
After=network.target docker.service
Wants=docker.service

[Service]
Type=simple
User=humphrey_picidae
Group=humphrey_picidae
WorkingDirectory=/var/www/crop-propagation-app/backend
EnvironmentFile=/var/www/crop-propagation-app/backend/.env
ExecStart=/var/www/crop-propagation-app/backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 9000
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF
```

### 12.2 Enable and Start the Service

```bash
sudo systemctl daemon-reload
sudo systemctl enable crop-propagation-api
sudo systemctl start crop-propagation-api
```

### 12.3 Service Management Commands

```bash
# Check status
sudo systemctl status crop-propagation-api

# View logs
sudo journalctl -u crop-propagation-api -f              # Follow live
sudo journalctl -u crop-propagation-api --since "1h ago" # Last hour
sudo journalctl -u crop-propagation-api -n 50            # Last 50 lines

# Restart
sudo systemctl restart crop-propagation-api

# Stop
sudo systemctl stop crop-propagation-api
```

### 12.4 Verify Backend is Running

```bash
curl http://127.0.0.1:9000/health
# Expected: {"status":"healthy","service":"Crop Propagation API","version":"1.0.0","environment":"production"}
```

---

## 13. Server: Frontend Build & Deploy

### 13.1 Install Frontend Dependencies

```bash
cd /var/www/crop-propagation-app/repo
npm ci --production=false
```

> **Note**: `--production=false` ensures dev dependencies (react-scripts) are installed.

### 13.2 Build the Frontend

```bash
cd /var/www/crop-propagation-app/repo

CI=false \
REACT_APP_FLORA_API_URL="http://102.210.148.91:8080/api/v1" \
REACT_APP_MOCK_API="false" \
REACT_APP_DEBUG="false" \
npm run build
```

> **Important**: `CI=false` is required. When `CI=true`, Create React App treats ESLint warnings as errors and fails the build.

### 13.3 Deploy Build to Web Root

```bash
rsync -a --delete /var/www/crop-propagation-app/repo/build/ /var/www/crop-propagation-app/frontend/
```

### Frontend Environment Variables

| Variable | Production Value | Purpose |
|----------|-----------------|---------|
| `REACT_APP_FLORA_API_URL` | `http://102.210.148.91:8080/api/v1` | Backend API endpoint |
| `REACT_APP_MOCK_API` | `false` | Disable mock API, use real backend |
| `REACT_APP_DEBUG` | `false` | Disable debug logging |
| `CI` | `false` | Prevent ESLint warnings from failing build |

---

## 14. Server: Nginx Configuration

### 14.1 Create the Site Configuration

Create `/etc/nginx/sites-available/crop-propagation`:

```nginx
server {
    listen 8080;
    server_name 102.210.148.91;

    # Frontend - static files
    root /var/www/crop-propagation-app/frontend;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:9000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
    }

    # Health check
    location /health {
        proxy_pass http://127.0.0.1:9000/health;
        proxy_set_header Host $host;
    }

    # API docs
    location /api/v1/docs {
        proxy_pass http://127.0.0.1:9000/api/v1/docs;
        proxy_set_header Host $host;
    }

    location /api/v1/openapi.json {
        proxy_pass http://127.0.0.1:9000/api/v1/openapi.json;
        proxy_set_header Host $host;
    }

    # Static file caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 14.2 Enable the Site

```bash
sudo ln -sf /etc/nginx/sites-available/crop-propagation /etc/nginx/sites-enabled/crop-propagation

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### 14.3 Nginx Routing Summary

| URL Path | Destination | Description |
|----------|-------------|-------------|
| `/` | Static files | React SPA (index.html) |
| `/api/*` | `127.0.0.1:9000` | FastAPI backend |
| `/health` | `127.0.0.1:9000` | Backend health check |
| `/api/v1/docs` | `127.0.0.1:9000` | Swagger API docs |
| `*.js, *.css, ...` | Static files | Cached for 1 year |

---

## 15. Server: Firewall Rules

### 15.1 Open Port 8080

```bash
sudo ufw allow 8080/tcp comment "Crop Propagation App"
sudo ufw status
```

> **Note**: Port 9000 (backend) is bound to `127.0.0.1` only and is NOT exposed externally. All external traffic goes through Nginx on port 8080.

### Ports Used

| Port | Service | Bound To | External |
|------|---------|----------|----------|
| 8080 | Nginx | 0.0.0.0 | Yes |
| 9000 | Uvicorn | 127.0.0.1 | No |
| 5432 | PostgreSQL | 0.0.0.0 (Docker) | Depends on firewall |

---

## 16. Server: Passwordless Sudo for Deploy

The CI/CD pipeline needs to restart services without a password prompt.

### 16.1 Create Sudoers File

```bash
sudo visudo -f /etc/sudoers.d/crop-deploy
```

Add the following content:

```
humphrey_picidae ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart crop-propagation-api
humphrey_picidae ALL=(ALL) NOPASSWD: /usr/bin/systemctl reload nginx
humphrey_picidae ALL=(ALL) NOPASSWD: /usr/bin/systemctl status crop-propagation-api
```

### 16.2 Verify

```bash
# These should work without a password prompt:
sudo systemctl status crop-propagation-api
sudo systemctl restart crop-propagation-api
sudo systemctl reload nginx
```

---

## 17. CI/CD: GitHub Actions Pipeline

### 17.1 Pipeline Overview

The pipeline (`.github/workflows/deploy.yml`) runs on every push to `main`:

```
Push to main
    |
    +---> test-backend (Python 3.12, SQLite in-memory)
    |         |
    |         +---> pip install requirements.txt
    |         +---> pytest tests/ -v
    |
    +---> test-frontend (Node 18)
    |         |
    |         +---> npm ci
    |         +---> npm test
    |         +---> npm run build (CI=false)
    |
    +---> deploy (needs both tests to pass, main branch only)
              |
              +---> SSH into production server
              +---> git pull
              +---> pip install (backend)
              +---> rsync backend code
              +---> alembic upgrade head
              +---> systemctl restart crop-propagation-api
              +---> npm ci + npm run build (frontend)
              +---> rsync frontend build
              +---> systemctl reload nginx
```

### 17.2 Pipeline File

File: `.github/workflows/deploy.yml`

```yaml
name: Test and Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: backend

    steps:
      - uses: actions/checkout@v4

      - name: Set up Python 3.12
        uses: actions/setup-python@v5
        with:
          python-version: "3.12"

      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements.txt

      - name: Run backend tests
        run: python -m pytest tests/ -v
        env:
          DATABASE_URL: "sqlite+aiosqlite:///:memory:"
          SECRET_KEY: "test-secret-key-for-ci"
          ENVIRONMENT: "testing"
          DEBUG: "false"

  test-frontend:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Set up Node.js 18
        uses: actions/setup-node@v4
        with:
          node-version: "18"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run frontend tests
        run: npm test -- --watchAll=false --passWithNoTests
        env:
          CI: true

      - name: Build frontend
        run: npm run build
        env:
          CI: false
          REACT_APP_FLORA_API_URL: "http://102.210.148.91:8080/api/v1"
          REACT_APP_MOCK_API: "false"
          REACT_APP_DEBUG: "false"

  deploy:
    needs: [test-backend, test-frontend]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'

    steps:
      - name: Deploy to production server
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          command_timeout: 20m
          script: |
            set -e

            APP_DIR="/var/www/crop-propagation-app"
            REPO_DIR="$APP_DIR/repo"

            # Pull latest code
            cd $REPO_DIR
            git fetch origin main
            git reset --hard origin/main

            # --- Backend deployment ---
            cd $REPO_DIR/backend

            # Activate virtual environment and install dependencies
            source $APP_DIR/backend/venv/bin/activate
            pip install -r requirements.txt --quiet

            # Copy backend code to deployment directory
            rsync -a --delete \
              --exclude='venv' \
              --exclude='.env' \
              --exclude='__pycache__' \
              --exclude='*.pyc' \
              --exclude='*.db' \
              $REPO_DIR/backend/ $APP_DIR/backend/

            # Run database migrations
            cd $APP_DIR/backend
            source venv/bin/activate
            alembic upgrade head

            # Restart backend service
            sudo systemctl restart crop-propagation-api

            # --- Frontend deployment ---
            cd $REPO_DIR

            # Install dependencies and build
            npm ci --production=false
            REACT_APP_FLORA_API_URL="http://102.210.148.91:8080/api/v1" \
            REACT_APP_MOCK_API="false" \
            REACT_APP_DEBUG="false" \
            npm run build

            # Deploy build to web root
            rsync -a --delete $REPO_DIR/build/ $APP_DIR/frontend/

            # Reload nginx
            sudo systemctl reload nginx

            echo "Deployment completed successfully!"
```

### 17.3 Key Pipeline Details

| Setting | Value | Why |
|---------|-------|-----|
| `command_timeout: 20m` | 20 minutes | React build on the server is slow (~8-12 min) |
| `CI: false` (build step) | Disable strict mode | Prevents ESLint warnings from failing the build |
| `CI: true` (test step) | Enable strict mode | Tests should fail on warnings |
| `--production=false` | Include dev deps | `react-scripts` is a devDependency needed for build |
| SQLite in tests | In-memory DB | Fast isolated testing, no PostgreSQL needed |

---

## 18. CI/CD: GitHub Secrets

Configure these secrets in GitHub: **Settings > Secrets and variables > Actions > New repository secret**

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `SSH_HOST` | `102.210.148.91` | Production server IP |
| `SSH_USER` | `humphrey_picidae` | SSH username |
| `SSH_PRIVATE_KEY` | *(full private key content)* | ed25519 private key for server access |

### Setting Secrets via CLI

```bash
gh secret set SSH_HOST --body "102.210.148.91"
gh secret set SSH_USER --body "humphrey_picidae"
gh secret set SSH_PRIVATE_KEY < ~/.ssh/deploy_key
```

---

## 19. CI/CD: Deploy SSH Key

The GitHub Actions pipeline connects to the server via SSH. A dedicated key pair is used.

### 19.1 Generate Key Pair (if not done already)

```bash
ssh-keygen -t ed25519 -f ~/.ssh/crop_deploy_key -N "" -C "github-actions-deploy"
```

### 19.2 Add Public Key to Server

```bash
# On the server, append to authorized_keys
cat ~/.ssh/crop_deploy_key.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### 19.3 Add Private Key to GitHub

Copy the **entire** private key content (including `-----BEGIN` and `-----END` lines) and save it as the `SSH_PRIVATE_KEY` GitHub secret.

```bash
cat ~/.ssh/crop_deploy_key
# Copy all output including BEGIN/END lines
```

---

## 20. Seed Data (Demo Account)

### 20.1 Overview

The seed script (`backend/seed_data.py`) populates the database with:
- 1 demo user account
- 6 customers
- 4 suppliers
- 8 crops at various propagation stages
- 5 propagation orders (various statuses: created, in-progress, dispatched)
- 14 tasks (mix of completed, pending, and overdue)
- 6 budwood collection records
- 6 grafting records
- 7 transfer records

### 20.2 Run the Seed Script

```bash
cd /var/www/crop-propagation-app/backend
source venv/bin/activate
python seed_data.py
```

Expected output:
```
============================================================
  Crop Propagation App - Database Seeder
============================================================
Connecting to database...
Creating demo user...
Demo user ID: 1
Seeding customers...
Seeding suppliers...
Seeding crops...
Seeding orders...
Seeding tasks...
Seeding budwood records...
Seeding grafting records...
Seeding transfer records...

Seed data inserted successfully!

Demo Account Credentials:
  Email:    demo@cropprop.com
  Password: demo1234
```

### 20.3 Demo Account Credentials

| Field | Value |
|-------|-------|
| Email | `demo@cropprop.com` |
| Username | `demo` |
| Password | `demo1234` |

### 20.4 Re-running the Seed Script

The script is **idempotent**. If the demo user already exists, it:
1. Cleans all existing demo data
2. Resets the password
3. Re-inserts fresh seed data

---

## 21. Verification & Health Checks

### 21.1 Backend Health Check

```bash
curl http://102.210.148.91:8080/health
```

Expected:
```json
{
  "status": "healthy",
  "service": "Crop Propagation API",
  "version": "1.0.0",
  "environment": "production"
}
```

### 21.2 API Documentation

Open in browser: `http://102.210.148.91:8080/api/v1/docs`

### 21.3 Frontend

Open in browser: `http://102.210.148.91:8080`

1. Click **"Try Demo Account"** on the landing page
2. Verify the dashboard loads with seed data
3. Check that orders, crops, tasks, and records are visible

### 21.4 Test Login via API

```bash
curl -X POST http://102.210.148.91:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "demo@cropprop.com", "password": "demo1234"}'
```

Expected:
```json
{
  "access_token": "eyJhbGci...",
  "refresh_token": "eyJhbGci...",
  "token_type": "bearer"
}
```

### 21.5 Service Status Checks

```bash
# Backend service
sudo systemctl status crop-propagation-api

# Nginx
sudo systemctl status nginx

# PostgreSQL (Docker)
docker ps | grep postgres

# Port listening
ss -tlnp | grep -E '8080|9000|5432'
```

---

## 22. Maintenance & Operations

### 22.1 View Application Logs

```bash
# Backend logs (live)
sudo journalctl -u crop-propagation-api -f

# Backend logs (last 100 lines)
sudo journalctl -u crop-propagation-api -n 100

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### 22.2 Manual Deployment (Without CI/CD)

```bash
# SSH into server
ssh -i ~/.ssh/humphf_key.pem humphrey_picidae@102.210.148.91

# Pull latest code
cd /var/www/crop-propagation-app/repo
git pull origin main

# Backend
source /var/www/crop-propagation-app/backend/venv/bin/activate
pip install -r backend/requirements.txt --quiet
rsync -a --delete \
  --exclude='venv' --exclude='.env' --exclude='__pycache__' --exclude='*.pyc' --exclude='*.db' \
  backend/ /var/www/crop-propagation-app/backend/
cd /var/www/crop-propagation-app/backend
alembic upgrade head
sudo systemctl restart crop-propagation-api

# Frontend
cd /var/www/crop-propagation-app/repo
npm ci --production=false
CI=false REACT_APP_FLORA_API_URL="http://102.210.148.91:8080/api/v1" \
  REACT_APP_MOCK_API="false" REACT_APP_DEBUG="false" npm run build
rsync -a --delete build/ /var/www/crop-propagation-app/frontend/
sudo systemctl reload nginx
```

### 22.3 Database Backup

```bash
# Backup
docker exec postgres-postgres-1 pg_dump -U flora flora_db > ~/backups/flora_db_$(date +%Y%m%d).sql

# Restore
docker exec -i postgres-postgres-1 psql -U flora flora_db < ~/backups/flora_db_20260209.sql
```

### 22.4 Restart All Services

```bash
docker restart postgres-postgres-1
sudo systemctl restart crop-propagation-api
sudo systemctl reload nginx
```

---

## 23. Troubleshooting

### 23.1 Backend Won't Start

```bash
# Check logs
sudo journalctl -u crop-propagation-api --since "5m ago"

# Common causes:
# 1. Missing .env file
ls -la /var/www/crop-propagation-app/backend/.env

# 2. Database not reachable
docker ps | grep postgres
curl http://localhost:5432 2>&1 | head -1

# 3. Port already in use
ss -tlnp | grep 9000

# 4. Python dependency issue
cd /var/www/crop-propagation-app/backend
source venv/bin/activate
python -c "from app.main import app; print('OK')"
```

### 23.2 Frontend Shows Blank Page

```bash
# Check if files exist
ls /var/www/crop-propagation-app/frontend/index.html

# Check Nginx config
sudo nginx -t
sudo cat /etc/nginx/sites-enabled/crop-propagation

# Check Nginx is listening on 8080
ss -tlnp | grep 8080
```

### 23.3 API Calls Return 502 Bad Gateway

```bash
# Backend is down
sudo systemctl status crop-propagation-api

# Backend port not matching Nginx config
curl http://127.0.0.1:9000/health
```

### 23.4 Demo Login Fails

```bash
# Test directly against backend
curl -X POST http://127.0.0.1:9000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"demo@cropprop.com","password":"demo1234"}'

# If 401: re-run seed script
cd /var/www/crop-propagation-app/backend
source venv/bin/activate
python seed_data.py
```

### 23.5 Alembic Migration Fails

```bash
# Check current state
alembic current
alembic heads

# If heads don't match: stamp current state
alembic stamp head

# If TEXT->JSON fails: edit migration to use USING clause
# op.execute('ALTER TABLE orders ALTER COLUMN notes TYPE JSON USING notes::json')
```

### 23.6 CI/CD Deploy Timeout

The frontend build on the server can take 8-15 minutes depending on server resources. The deploy timeout is set to 20 minutes. If it still times out:

```bash
# Check server resources during build
ssh server 'free -m && df -h && uptime'

# Increase swap if needed
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### 23.7 npm Dependencies Missing After Deploy

```bash
# react-scripts not found:
cd /var/www/crop-propagation-app/repo
rm -rf node_modules
npm install

# lucide-react not found:
npm install lucide-react
```

---

## 24. Security Considerations

### 24.1 Secrets Management

| Secret | Location | In Git? |
|--------|----------|---------|
| Database password | `/var/www/.../backend/.env` | NO |
| JWT secret key | `/var/www/.../backend/.env` | NO |
| SSH private key | GitHub Secrets | NO |
| Server password | Manual only | NO |

### 24.2 Network Security

- Backend (port 9000) binds to `127.0.0.1` only - not externally accessible
- All external API traffic routes through Nginx on port 8080
- PostgreSQL should be firewalled to localhost only

### 24.3 Application Security

- JWT access tokens expire in 15 minutes
- Refresh tokens expire in 7 days
- Passwords hashed with bcrypt via passlib
- CORS configured to allow only the frontend origin
- Pydantic validates all request inputs
- SQLAlchemy ORM prevents SQL injection

### 24.4 Files Excluded from Git

From `.gitignore`:
```
backend/.env
backend/venv/
backend/__pycache__/
backend/**/__pycache__/
backend/**/*.pyc
backend/*.db
backend/crop_propagation.db
backend/uploads/
```

---

## Quick Reference Card

```
App URL:        http://102.210.148.91:8080
API Docs:       http://102.210.148.91:8080/api/v1/docs
Health:         http://102.210.148.91:8080/health
GitHub:         https://github.com/njuguna05/crop-propagation-app

SSH:            ssh -i key.pem humphrey_picidae@102.210.148.91
Backend Logs:   sudo journalctl -u crop-propagation-api -f
Restart API:    sudo systemctl restart crop-propagation-api
Reload Nginx:   sudo systemctl reload nginx
Run Migrations: cd /var/www/.../backend && source venv/bin/activate && alembic upgrade head
Seed Data:      cd /var/www/.../backend && source venv/bin/activate && python seed_data.py

Demo Login:     demo@cropprop.com / demo1234
```
