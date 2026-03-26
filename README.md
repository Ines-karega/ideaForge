# IdeaForge — Smart Project Idea Validator

IdeaForge is a full-stack web application designed to help developers and students validate their project ideas. Instead of relying on guesswork or AI hallucinations, IdeaForge fetches **live data** from GitHub and Stack Overflow to see if similar projects exist and if developers are actively discussing them. It then uses **Groq AI (LLaMA 3.3)** to analyze this real-world data and provide actionable feedback.

---

## 🤔 What It Does

When you enter a project idea (e.g., *"AI chatbot for healthcare"*), IdeaForge provides a comprehensive analysis:

- **Real-time Market Data:** Fetches up to 6 of the most relevant GitHub repositories and Stack Overflow discussions.
- **AI-Powered Validation:** Analyzes the real data to generate scores (0-100) for **Market Demand**, **Originality**, and **Feasibility**.
- **Difficulty Assessment:** Categorizes the project as Beginner, Intermediate, or Advanced, with a clear rationale.
- **Tech Stack Recommendations:** Suggests the best languages, frameworks, and databases for the specific idea.
- **Actionable Suggestions:** Provides 4 specific tips to improve the project's viability or uniqueness.
- **Interactive UI:** Users can sort GitHub repos (by stars, forks, or date), search through results, and sort Stack Exchange discussions.

---

## ⚙️ How It Works (Under the Hood)

IdeaForge is completely stateless, meaning it doesn't use a database. Here is the data flow for a single validation request:

1. **User Request:** The user types an idea and hits "Validate" on the frontend.
2. **Backend Routing:** The request hits the Express.js (`/api/validate`) endpoint.
3. **Parallel API Calls:** The Node.js server concurrently fetches data from:
   - **GitHub Search API:** Finding real repos related to the idea.
   - **Stack Exchange API:** Finding relevant Stack Overflow questions.
4. **AI Processing:** The backend takes the raw JSON data from GitHub and Stack Exchange and injects it into a prompt for the **Groq API**.
5. **JSON Response:** Groq's LLaMA 3.3 model acts as the validator, reading the *real* data and strictly outputting a JSON response containing scores, difficulty, and suggestions.
6. **Frontend Rendering:** The vanilla JS frontend parses the JSON response, animating the score bars and dynamically rendering the repository cards and tech stack tags.

---

## 🛠️ How I Built It & Challenges Solved

### Tech Stack
- **Frontend:** HTML, CSS (Vanilla), JavaScript
- **Backend:** Node.js, Express.js
- **APIs:** GitHub REST API, Stack Exchange API, Groq Cloud API
- **Deployment:** PM2, Nginx, Multiple Web Servers

### Key Technical Decisions & Solutions

**1. No Heavy Client Libraries**  
To keep the backend lightweight, I avoided heavy SDKs (like `axios` or official GitHub/Groq clients). Instead, I built a custom, reusable `httpsGet` and POST wrapper using Node's native `https` module.

**2. Grounding AI in Reality**  
One major challenge with LLMs is hallucination. By deliberately fetching real repositories and Stack Overflow posts *first*, and then feeding that exact data into Groq's prompt, the AI's analysis is strictly grounded in actual market reality.

**3. API Rate Limiting**  
The Stack Exchange API allows anonymous access but has strict limits. I implemented error handling to ensure that if GitHub or Stack Exchange limits are hit, the application doesn't crash—it gracefully falls back and lets Groq analyze the idea based on its internal knowledge.

**4. Scalable & Stateless Architecture**  
Because the app relies purely on external APIs and keeps no internal state, it is horizontally scalable. I deployed this project behind an **Nginx Load Balancer**, distributing traffic evenly across two separate Node.js web servers.

---

## 🚀 Running Locally

### Prerequisites
- **Node.js** v18+
- A **Groq API Key** ([Get one here](https://console.groq.com/))
- A **GitHub Personal Access Token** (Optional, to avoid rate limits)

### Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/ideaforge-validator.git
   cd ideaforge-validator
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   ```bash
   cp .env.example .env
   ```
   Open `.env` and configure your API keys.

4. **Start the server:**
   ```bash
   npm start
   ```

5. **Test it out:**  
   Open `http://localhost:3000` in your browser.
