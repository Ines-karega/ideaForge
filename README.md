# IdeaForge — Smart Project Idea Validator

**Author:** Ines Karega
**Live URL:** https://ideaforge.karega.tech
**Demo Video:** [paste your video link here]
**Repository:** https://github.com/Ines-karega/ideaForge

---

## What It Does

IdeaForge helps developers and students decide whether a project idea is worth building — before they invest time in it. Enter any idea and the app will:

- Check how many similar projects already exist on GitHub (originality check)
- Measure developer interest via Stack Overflow activity (market demand)
- Rate how difficult the project is to build (feasibility)
- Suggest a relevant tech stack and actionable improvements

This solves a real problem: most people waste weeks building something that already exists or has no audience.

---

## APIs Used & Credits

| API | Purpose | Docs |
|-----|---------|------|
| GitHub Search API — GitHub, Inc. | Finds similar repositories for the idea | [docs.github.com/en/rest/search](https://docs.github.com/en/rest/search/search) |
| Stack Exchange API — Stack Exchange, Inc. | Fetches Stack Overflow discussions on the topic | [api.stackexchange.com/docs](https://api.stackexchange.com/docs) |
| Groq Cloud API (Llama 3.3-70b) — Groq/Meta | AI analysis grounded in the real fetched data | [console.groq.com/docs](https://console.groq.com/docs) |
| Lucide Icons — Lucide Contributors | UI icons | [lucide.dev](https://lucide.dev) |
| Google Fonts — Google LLC | Fraunces, Instrument Sans, DM Mono | [fonts.google.com](https://fonts.google.com) |

**Other tools:** Express.js, Node.js, PM2, Nginx, Let's Encrypt (Certbot)

> All API keys are stored in a `.env` file, excluded from the repository via `.gitignore`, and never exposed to the browser. The Express backend acts as a secure proxy for all external requests.

---

## User Interaction

Once results load, users can:
- **Sort** GitHub repos by Stars, Forks, or Last Updated
- **Filter** repos by programming language
- **Search** repos by name or description in real time
- **Sort** Stack Overflow discussions by Votes, Answers, or Views
- Press `Ctrl + Enter` to quickly submit an idea

---

## Error Handling

- Input is validated (minimum 5 characters, capped at 500, type-checked) before any API call is made
- Both GitHub and Stack Exchange are fetched in parallel — if one fails, the other still returns results
- All external API calls have timeouts (10s for GitHub/Stack Exchange, 60s for Groq) to prevent hanging
- Loading animation shown during API calls so users know the app is working
- Empty results show a friendly message instead of a blank section
- Any network or API failure returns a clear, readable error message to the user

---

## SSL Certificate

The app is secured with a **Let's Encrypt SSL certificate** configured on the load balancer via Certbot. All traffic is encrypted over HTTPS (TLS 1.2/1.3) and HTTP requests are automatically redirected to HTTPS. The certificate auto-renews every 90 days.

---

## Why a Backend?

A Node.js/Express backend was necessary for two reasons:
1. **Security** — API keys must never be exposed in browser code. The backend acts as a secure proxy.
2. **CORS** — External APIs block direct browser requests. The server makes all API calls server-side and returns the data safely.

---

## Running Locally

**Prerequisites:** Node.js v18+, a [Groq API key](https://console.groq.com/), and optionally a [GitHub token](https://github.com/settings/tokens)

```bash
git clone https://github.com/Ines-karega/ideaForge.git
cd ideaForge
npm install
cp .env.example .env        # then add your keys inside .env
npm start                   # visit http://localhost:3000
```

**.env file:**
```
GROQ_API_KEY=your_key_here
GITHUB_TOKEN=your_token_here
```

---

## Deployment

### Architecture
```
User → [ lb-01: 13.218.204.39 ] → [ web-01: 54.204.136.7  ]
                                 → [ web-02: 44.201.166.17 ]
```

### Web Servers (web-01 & web-02)
```bash
ssh ubuntu@54.204.136.7        # repeat for web-02
git clone https://github.com/Ines-karega/ideaForge.git
cd ideaForge && npm install
nano .env                      # add API keys
pm2 start server.js --name ideaforge
pm2 save && pm2 startup
```

Verify the app is running:
```bash
curl http://localhost:3000/health
# Expected: {"status":"ok","timestamp":"..."}
```

### Firewall (UFW) — web-01 & web-02
```bash
sudo ufw allow ssh
sudo ufw allow 'Nginx HTTP'
sudo ufw allow 'Nginx HTTPS'
sudo ufw enable
```
This blocks direct access to port 3000 — traffic only flows through Nginx.

### Load Balancer — lb-01 (Nginx, round-robin)
```nginx
upstream ideaforge_backend {
    server 54.204.136.7:3000;
    server 44.201.166.17:3000;
}
server {
    listen 80;
    server_name ideaforge.karega.tech;
    location / {
        proxy_pass http://ideaforge_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```
```bash
sudo nginx -t && sudo systemctl reload nginx
```

### SSL — lb-01
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d ideaforge.karega.tech --redirect
```

### Firewall (UFW) — lb-01
```bash
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### Verify Load Balancing
```bash
for i in {1..4}; do curl -s https://ideaforge.karega.tech/health; echo; done
```
Both servers should respond, confirming traffic is distributed correctly.

---

## Challenges & Solutions

| Challenge | Solution |
|-----------|----------|
| AI was generating made-up scores | Fetched real GitHub and Stack Overflow data first, then passed it to the AI as context so scores are based on actual evidence |
| API keys at risk of browser exposure | All API calls moved to the Express backend; keys stored in `.env` and never sent to the frontend |
| CORS errors on direct browser requests | Express server handles all outgoing API requests server-side, bypassing browser CORS restrictions |
| App needed to work identically on two servers | Designed to be fully stateless — no sessions or local storage — so either server handles any request independently |

---

## Project Structure

```
ideaForge/
├── public/index.html    # Frontend (HTML, CSS, JavaScript)
├── server.js            # Express backend — secure API proxy
├── .env                 # API keys (not committed)
├── .env.example         # Key template
└── .gitignore
```
