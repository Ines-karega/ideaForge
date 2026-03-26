# IdeaForge — Smart Project Idea Validator

IdeaForge is a web application that helps developers and students validate their project ideas using real-world data and AI analysis. 

Instead of relying on AI hallucinations, IdeaForge fetches live data from GitHub and Stack Exchange to see if similar projects exist and if developers are asking questions about the topic. It then uses Groq AI (LLaMA 3.3) to analyze this data and provide realistic feedback.

## How It Works

1. **User Input:** Enter your project idea (e.g., "AI chatbot for healthcare").
2. **Data Gathering:** The Express backend fetches real, similar repositories using the **GitHub Search API**, and related developer discussions using the **Stack Exchange API**.
3. **AI Analysis:** The raw API data is sent to the **Groq API**.
4. **Actionable Results:** The AI processes the real data to return:
   - Market Demand, Originality, and Feasibility scores.
   - Estimated difficulty level with explanation.
   - Recommended tech stack.
   - Specific, actionable suggestions for your project.

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript (Vanilla)
- **Backend:** Node.js, Express.js
- **APIs:** GitHub REST API, Stack Exchange API, Groq API

## Running Locally

### Prerequisites
- Node.js v18+
- [Groq API Key](https://console.groq.com/) (Required)
- GitHub Personal Access Token (Optional, but recommended for better rate limits)

### Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd ideaForge
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   Add your `GROQ_API_KEY` (and optionally `GITHUB_TOKEN`) to the `.env` file.

4. **Start the server:**
   ```bash
   npm start
   ```

5. **Open your browser:** Go to `http://localhost:3000`.
