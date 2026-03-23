require('dotenv').config();
const express = require('express');
const path = require('path');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ============================================================
//  HELPER: generic HTTPS GET (no extra deps)
// ============================================================
function httpsGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'User-Agent': 'IdeaForge-Validator/1.0',
        Accept: 'application/json',
        ...headers,
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          reject(new Error('Failed to parse response'));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('Request timed out')); });
    req.end();
  });
}

// ============================================================
//  GitHub API
// ============================================================
async function searchGitHub(query) {
  const encodedQuery = encodeURIComponent(query);
  const url = `https://api.github.com/search/repositories?q=${encodedQuery}&sort=stars&order=desc&per_page=5`;

  const headers = {};
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  try {
    const { status, data } = await httpsGet(url, headers);
    if (status !== 200) throw new Error('GitHub API error: ' + status);
    return (data.items || []).map((r) => ({
      name: r.name,
      full_name: r.full_name,
      description: r.description,
      html_url: r.html_url,
      stargazers_count: r.stargazers_count,
      forks_count: r.forks_count,
      language: r.language,
      updated_at: r.updated_at,
      open_issues_count: r.open_issues_count,
    }));
  } catch (err) {
    console.error('GitHub fetch error:', err.message);
    return [];
  }
}

// ============================================================
//  Stack Exchange API
// ============================================================
async function searchStackExchange(query) {
  const encoded = encodeURIComponent(query);
  const url = `https://api.stackexchange.com/2.3/search/advanced?order=desc&sort=votes&q=${encoded}&site=stackoverflow&pagesize=5&filter=default`;

  try {
    const { status, data } = await httpsGet(url);
    if (status !== 200) throw new Error('Stack Exchange API error: ' + status);
    return (data.items || []).map((q) => ({
      title: q.title,
      link: q.link,
      score: q.score,
      answer_count: q.answer_count,
      view_count: q.view_count,
      is_answered: q.is_answered,
      tags: q.tags,
    }));
  } catch (err) {
    console.error('Stack Exchange fetch error:', err.message);
    return [];
  }
}

// ============================================================
//  Groq AI Analysis
// ============================================================
async function analyzeWithGroq(idea, githubRepos, stackQuestions) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not set in environment');

  const reposSummary = githubRepos.length
    ? githubRepos.map((r) => `- ${r.full_name}: ${r.stargazers_count} stars, ${r.language}`).join('\n')
    : 'No repositories found.';

  const qaSummary = stackQuestions.length
    ? stackQuestions.map((q) => `- "${q.title}" (${q.score} votes, ${q.answer_count} answers)`).join('\n')
    : 'No discussions found.';

  const systemPrompt = `You are a smart project idea validator that helps students and developers evaluate project concepts using real data.
You receive: the project idea, actual GitHub repositories found, and actual Stack Exchange questions found.
Analyze all provided data and return ONLY valid JSON — no markdown, no backticks, no preamble.

Return exactly this JSON structure:
{
  "scores": {
    "market_demand": <0-100 integer based on Stack Exchange activity and GitHub stars>,
    "market_label": "<Low|Moderate|High|Very High>",
    "originality": <0-100 integer based on how many similar GitHub repos exist>,
    "originality_label": "<Very Common|Common|Somewhat Unique|Unique>",
    "feasibility": <0-100 integer based on complexity signals from repos and questions>,
    "feasibility_label": "<Complex|Moderate|Achievable|Easy>"
  },
  "difficulty": {
    "level": "<Beginner|Intermediate|Advanced>",
    "reason": "<2-3 sentences explaining the difficulty based on the real data found>"
  },
  "tech_stack": [
    { "name": "<technology>", "category": "<Language|Framework|Library|Database|API|Tool>" },
    { "name": "<technology>", "category": "<Language|Framework|Library|Database|API|Tool>" },
    { "name": "<technology>", "category": "<Language|Framework|Library|Database|API|Tool>" },
    { "name": "<technology>", "category": "<Language|Framework|Library|Database|API|Tool>" },
    { "name": "<technology>", "category": "<Language|Framework|Library|Database|API|Tool>" },
    { "name": "<technology>", "category": "<Language|Framework|Library|Database|API|Tool>" }
  ],
  "suggestions": [
    "<specific actionable improvement suggestion>",
    "<specific actionable improvement suggestion>",
    "<specific actionable improvement suggestion>",
    "<specific actionable improvement suggestion>"
  ]
}`;

  const userMsg = `Validate this project idea: "${idea}"

Real GitHub repositories found:
${reposSummary}

Real Stack Exchange questions found:
${qaSummary}

Base your analysis on this real data.`;

  const body = JSON.stringify({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 1000,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMsg }
    ],
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.groq.com',
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let rawBody = '';
      res.on('data', (c) => (rawBody += c));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(rawBody);
          if (parsed.error) return reject(new Error(parsed.error.message));
          const text = parsed.choices[0].message.content;
          const clean = text.replace(/```json|```/g, '').trim();
          resolve(JSON.parse(clean));
        } catch (e) {
          reject(new Error('Failed to parse Groq response: ' + e.message));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('Groq API timed out')); });
    req.write(body);
    req.end();
  });
}

// ============================================================
//  VALIDATE ENDPOINT
// ============================================================
app.post('/api/validate', async (req, res) => {
  const { idea } = req.body;

  if (!idea || typeof idea !== 'string' || idea.trim().length < 5) {
    return res.status(400).json({ error: 'Please provide a valid idea (at least 5 characters).' });
  }

  const sanitizedIdea = idea.trim().substring(0, 500);

  try {
    const [githubRepos, stackQuestions] = await Promise.all([
      searchGitHub(sanitizedIdea),
      searchStackExchange(sanitizedIdea),
    ]);

    const analysis = await analyzeWithGroq(sanitizedIdea, githubRepos, stackQuestions);

    res.json({
      idea: sanitizedIdea,
      github_repos: githubRepos,
      stack_questions: stackQuestions,
      scores: analysis.scores,
      difficulty: analysis.difficulty,
      tech_stack: analysis.tech_stack,
      suggestions: analysis.suggestions,
    });
  } catch (err) {
    console.error('Validation error:', err.message);
    res.status(500).json({ error: err.message || 'Internal server error. Please try again.' });
  }
});

// Health check endpoint (for load balancer)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`IdeaForge server running on port ${PORT}`);
});
