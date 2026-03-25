# IdeaForge — Smart Project Idea Validator

> A full-stack web application that helps students and developers validate their project ideas using **live data** from the GitHub API, Stack Exchange API, and AI-powered analysis via the Anthropic Claude API.

---

## 🎯 What It Does

IdeaForge takes a project idea (e.g. *"AI chatbot for healthcare"*) and returns:

| Feature | Data Source |
|---|---|
| 🔍 Similar existing projects (real repos) | **GitHub Search API** |
| 📊 Developer discussions & market demand | **Stack Exchange API** |
| ⚖️ Difficulty level estimation | **Claude AI** (using real data) |
| 🧰 Recommended tech stack | **Claude AI** |
| 💡 Actionable improvement suggestions | **Claude AI** |
| 📈 Market demand, originality & feasibility scores | **Claude AI** (data-driven) |

Users can **sort** GitHub repos by stars, forks, or last updated. They can **filter** repos by programming language and **search** by keyword. Stack Exchange results can be sorted by votes, answers, or views. All real clickable links to GitHub and Stack Overflow are included.

---

## 🔌 APIs Used

### 1. GitHub Search API
- **Documentation:** https://docs.github.com/en/rest/search/search
- **Endpoint used:** `GET https://api.github.com/search/repositories`
- **Purpose:** Fetches real repositories similar to the user's project idea
- **Rate limit:** 60 req/hr unauthenticated · 5,000 req/hr with a token
- **Auth:** Optional GitHub Personal Access Token (improves rate limits)
- **Credit:** GitHub, Inc.

### 2. Stack Exchange API
- **Documentation:** https://api.stackexchange.com/docs
- **Endpoint used:** `GET https://api.stackexchange.com/2.3/search/advanced`
- **Purpose:** Fetches real developer questions related to the project idea
- **Rate limit:** 300 req/day unauthenticated (no key required for read-only access)
- **Auth:** None required for public access
- **Credit:** Stack Exchange, Inc.

### 3. Anthropic Claude API
- **Documentation:** https://docs.anthropic.com/en/api
- **Endpoint used:** `POST https://api.anthropic.com/v1/messages`
- **Model:** `claude-sonnet-4-20250514`
- **Purpose:** Analyzes real GitHub + Stack Exchange data to produce scores, difficulty level, tech stack, and suggestions
- **Credit:** Anthropic, PBC

---

## 🚀 Running Locally

### Prerequisites

- **Node.js** v18 or higher
- An **Anthropic API key** (required) — get one at https://console.anthropic.com/
- A **GitHub Personal Access Token** (optional but recommended)

### Step-by-Step

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/ideaforge-validator.git
cd ideaforge-validator

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Open .env and fill in your keys:
#   ANTHROPIC_API_KEY=sk-ant-...
#   GITHUB_TOKEN=ghp_...  (optional)
#   PORT=3000

# 4. Start the server
npm start

# 5. Open in your browser
# Visit http://localhost:3000
```

The app is now running locally. Type any project idea and click **VALIDATE** or press `Ctrl+Enter`.

---

## 🌐 Deployment to Web Servers (Part Two)

This project is deployed on two web servers behind a Nginx load balancer.

### Server Setup

The two web servers are **Web01** and **Web02**. These steps are identical for both.

```bash
# SSH into the web server
ssh ubuntu@WEB01_IP   # or WEB02_IP

# Install Node.js 18 (if not installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone the project
git clone https://github.com/YOUR_USERNAME/ideaforge-validator.git
cd ideaforge-validator

# Install dependencies
npm install

# Create the .env file with API keys
nano .env
# Paste in:
#   ANTHROPIC_API_KEY=sk-ant-...
#   GITHUB_TOKEN=ghp_...
#   PORT=3000

# Install PM2 to keep the app running
sudo npm install -g pm2

# Start the app with PM2
pm2 start server.js --name ideaforge

# Save the PM2 process list so it restarts on reboot
pm2 save
pm2 startup    # follow the printed command
```

Repeat these exact steps on both **Web01** and **Web02**.

### Load Balancer Configuration (Lb01)

The load balancer uses **Nginx** to distribute traffic between the two web servers.

```bash
# SSH into the load balancer
ssh ubuntu@LB01_IP

# Install Nginx
sudo apt-get update
sudo apt-get install -y nginx

# Create the load balancer config
sudo nano /etc/nginx/sites-available/ideaforge
```

Paste the following Nginx configuration:

```nginx
upstream ideaforge_backend {
    server WEB01_IP:3000;
    server WEB02_IP:3000;
}

server {
    listen 80;
    server_name LB01_IP;

    location / {
        proxy_pass http://ideaforge_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }

    location /health {
        proxy_pass http://ideaforge_backend;
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/ideaforge /etc/nginx/sites-enabled/

# Remove the default Nginx site to avoid conflicts
sudo rm /etc/nginx/sites-enabled/default

# Test the Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

**Accessing the app:** Open `http://LB01_IP` in your browser. Nginx will automatically distribute requests between Web01 and Web02 using round-robin by default.

**Verifying load balancing:**

```bash
# Check that the health endpoint responds
curl http://LB01_IP/health

# Check which server handled the request (run multiple times)
# You can also look at PM2 logs on each server:
pm2 logs ideaforge --lines 20
```

---

## 📁 Project Structure

```
ideaforge-validator/
├── public/
│   └── index.html      # Frontend (single-page, HTML/CSS/JS)
├── server.js           # Express backend (API routes, GitHub, Stack Exchange, Claude)
├── package.json        # Node.js project manifest
├── .env.example        # Environment variable template
├── .env                # Your actual keys (NOT committed — in .gitignore)
├── .gitignore          # Excludes node_modules, .env, etc.
└── README.md           # This file
```

---

## 🔒 Security Notes

- All API keys are stored in a `.env` file which is listed in `.gitignore` — they are **never** committed to the repository.
- The `.env.example` file shows the required variables with placeholder values only.
- User input is sanitized and length-capped on the server before being sent to any external API.
- The GitHub token only requires public repo read access (no write scopes needed).

---

## ⚡ User Interaction Features

| Feature | Description |
|---|---|
| **Sort repos** | By ⭐ Stars, 🔀 Forks, or 🕐 Last Updated |
| **Filter repos by language** | Dynamic buttons built from real API data |
| **Search repos** | Live keyword search across repo names & descriptions |
| **Sort Stack Exchange questions** | By ▲ Votes, 💬 Answers, or 👁 Views |
| **Clickable links** | All repos and questions link directly to GitHub / Stack Overflow |
| **Quick examples** | Pre-filled idea chips to try immediately |
| **Ctrl+Enter shortcut** | Keyboard shortcut to submit |

---

## 🛠 Error Handling

- Invalid or too-short ideas are rejected with a clear message before any API call
- Each API call has a timeout (10s for GitHub/Stack Exchange, 30s for Claude)
- If GitHub or Stack Exchange fail, the app still proceeds and Claude analyzes what it has
- All errors are caught and displayed to the user in a non-crashing error box
- The `/health` endpoint always returns 200 so the load balancer can check server availability

---

## 🧩 Challenges & How I Solved Them

**1. No API key required for Stack Exchange but rate limits are strict**  
→ The Stack Exchange API allows anonymous access for basic search, which keeps the app simple to deploy without extra credentials.

**2. Making Claude's analysis grounded in real data**  
→ Instead of asking Claude to guess what exists, I first fetch real GitHub repos and Stack Exchange questions, then pass that data directly into the Claude prompt. This makes scores and recommendations data-driven rather than hallucinated.

**3. CORS and keeping API keys server-side**  
→ All API calls go through the Express backend (`/api/validate`). The frontend never touches any API key — it only calls the local server endpoint.

**4. Load balancing state**  
→ Since the app is stateless (no user sessions, no database), any server can handle any request without issue — making it perfectly suited for round-robin load balancing.

---

## 📦 Dependencies

| Package | Version | Purpose |
|---|---|---|
| `express` | ^4.19.2 | HTTP server and routing |
| `dotenv` | ^16.4.5 | Loading environment variables from `.env` |

> All external API calls use Node's built-in `https` module — no extra HTTP client library needed.

---

## 📜 Credits & Attribution

- **GitHub REST API** — © GitHub, Inc. — https://docs.github.com/en/rest
- **Stack Exchange API** — © Stack Exchange, Inc. — https://api.stackexchange.com/docs
- **Anthropic Claude API** — © Anthropic, PBC — https://docs.anthropic.com
- **Google Fonts** (Syne, DM Sans, DM Mono) — © Google LLC — https://fonts.google.com
- **Express.js** — MIT License — https://expressjs.com
- **dotenv** — BSD-2-Clause License — https://github.com/motdotla/dotenv
