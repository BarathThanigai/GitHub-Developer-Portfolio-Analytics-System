require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());

//DB Pool
const pool = mysql.createPool({ 
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'devmatch',
  waitForConnections: true,
  connectionLimit: 10,
});

// DB Schema Context for LLM
const SCHEMA_CONTEXT = `
TASK: You are a MySQL query generator. Generate ONLY a single valid MySQL SELECT statement.
Your responses must be syntactically correct, executable MySQL code with no explanations.

DATABASE SCHEMA:
- user(user_id INT, username VARCHAR, email VARCHAR, state VARCHAR, country VARCHAR, followers_count INT)
- repository(repo_id INT, repo_name VARCHAR, visibility ENUM, created_at DATETIME, user_id INT, parent_repo_id INT)
- commit_table(commit_id VARCHAR, commit_message VARCHAR, commit_time DATETIME, lines_added INT, lines_deleted INT, repo_id INT, user_id INT)
- programming_language(language_id INT, language_name VARCHAR)
- repository_language(repo_id INT, language_id INT, usage_percentage DECIMAL)
- pull_request(pr_id INT, repo_id INT, status ENUM('open','closed','merged'), created_at DATETIME, merged_at DATETIME, closed_at DATETIME, user_id INT)
- repository_stat(repo_id INT, stars_count INT, forks_count INT, recorded_date TIMESTAMP)

IMPORTANT - LOCATION COLUMNS:
- u.state contains INDIAN STATES ONLY. Examples: 'Tamil Nadu', 'Kerala', 'Karnataka', 'Delhi', 'Maharashtra', 'Uttar Pradesh', 'Rajasthan', etc.
- u.country contains COUNTRY NAMES. Examples: 'India', 'USA', 'UK', 'Canada', 'Australia'
- When user asks for "developers in Tamil Nadu", "Chennai developers", "Bangalore area" -> USE u.state COLUMN
- When user asks for "developers in USA", "Indian developers" -> USE u.country COLUMN
- CITIES MAP TO STATES: Chennai->Tamil Nadu, Bangalore->Karnataka, Mumbai->Maharashtra, Delhi->Delhi, Hyderabad->Andhra Pradesh

LOCATION MAPPING:
Indian States: Tamil Nadu, Telangana, Andhra Pradesh, Karnataka, Kerala, Odisha, Jharkhand, Bihar, Punjab, Haryana, Rajasthan, Uttar Pradesh, Madhya Pradesh, West Bengal, Assam, Goa, Tripura, Meghalaya, Manipur, Mizoram, Nagaland, Sikkim, Arunachal Pradesh, Himachal Pradesh, Uttarakhand, Delhi, Chandigarh, Puducherry, Daman and Diu, Dadra and Nagar Haveli, Lakshadweep, Andaman and Nicobar Islands

CRITICAL RULES - MUST FOLLOW:
1. ALWAYS use valid MySQL syntax - every keyword, parenthesis, and comma must be correct
2. NEVER duplicate SELECT, FROM, WHERE, JOIN, or GROUP BY clauses
3. NEVER use LIMIT inside GROUP_CONCAT() or any aggregate function
4. Table aliases MUST be: u=user, r=repository, rl=repository_language, pl=programming_language, ct=commit_table, pr=pull_request, rs=repository_stat
5. Use LEFT JOINs (never INNER JOIN) to preserve users with no data
6. ALWAYS include GROUP BY with ALL non-aggregated columns: GROUP BY u.user_id, u.username, u.email, u.country, u.followers_count
7. CASE WHEN statements: Only reference columns that exist in the current table scope (use COALESCE for null safety)
8. Separated counting: Merged PRs should be: COUNT(DISTINCT CASE WHEN pr.status = 'merged' THEN pr.pr_id END)
9. Always use COALESCE for aggregates to return 0 instead of NULL: COALESCE(COUNT(...), 0), COALESCE(SUM(...), 0)

AGGREGATION PATTERNS - FOLLOW EXACTLY:
- Language skills: GROUP_CONCAT(DISTINCT pl.language_name ORDER BY rl.usage_percentage DESC SEPARATOR ', ') AS skills
- Language usage: ROUND(AVG(rl.usage_percentage), 1) AS avg_language_usage
- Commits: COALESCE(COUNT(DISTINCT ct.commit_id), 0) AS total_commits
- Stars: COALESCE(SUM(rs.stars_count), 0) AS total_stars
- Merged PRs: COALESCE(COUNT(DISTINCT CASE WHEN pr.status = 'merged' THEN pr.pr_id END), 0) AS merged_prs
- Score: ROUND((lang*0.2) + (commits*0.4) + (stars*0.2) + (merged_prs*2*0.2), 1) AS computed_score

COMPLETE EXAMPLE TEMPLATE:
SELECT 
  u.user_id, u.username, u.email, u.country, u.followers_count,
  GROUP_CONCAT(DISTINCT pl.language_name ORDER BY rl.usage_percentage DESC SEPARATOR ', ') AS skills,
  ROUND(AVG(rl.usage_percentage), 1) AS avg_language_usage,
  COALESCE(COUNT(DISTINCT ct.commit_id), 0) AS total_commits,
  COALESCE(SUM(rs.stars_count), 0) AS total_stars,
  COALESCE(COUNT(DISTINCT CASE WHEN pr.status = 'merged' THEN pr.pr_id END), 0) AS merged_prs,
  ROUND((COALESCE(AVG(rl.usage_percentage), 0)*0.2) + (COALESCE(COUNT(DISTINCT ct.commit_id), 0)*0.4) + (COALESCE(SUM(rs.stars_count), 0)*0.2) + (COALESCE(COUNT(DISTINCT CASE WHEN pr.status = 'merged' THEN pr.pr_id END), 0)*2*0.2), 1) AS computed_score
FROM user u
LEFT JOIN repository r ON u.user_id = r.user_id
LEFT JOIN repository_language rl ON r.repo_id = rl.repo_id
LEFT JOIN programming_language pl ON rl.language_id = pl.language_id
LEFT JOIN commit_table ct ON u.user_id = ct.user_id
LEFT JOIN pull_request pr ON u.user_id = pr.user_id
LEFT JOIN repository_stat rs ON r.repo_id = rs.repo_id
WHERE [APPLY LANGUAGE FILTER HERE BASED ON USER REQUEST]
GROUP BY u.user_id, u.username, u.email, u.country, u.followers_count
HAVING COUNT(DISTINCT r.repo_id) > 0 OR COUNT(DISTINCT ct.commit_id) > 0
ORDER BY computed_score DESC
LIMIT 50;

LANGUAGE FILTER EXAMPLES:
- If user asks for "JavaScript or TypeScript": WHERE pl.language_name IN ('JavaScript', 'TypeScript')
- If user asks for "Python": WHERE pl.language_name = 'Python'
- If user asks for "Java or Go": WHERE pl.language_name IN ('Java', 'Go')
- If user asks for "C++": WHERE pl.language_name = 'C++'
- If NO language is mentioned: WHERE 1=1 (show all developers)

LOCATION FILTER EXAMPLES:
- If user asks for "developers in Tamil Nadu" or "Chennai": WHERE u.state = 'Tamil Nadu'
- If user asks for "Bangalore developers": WHERE u.state = 'Karnataka'
- If user asks for "Mumbai area": WHERE u.state = 'Maharashtra'
- If user asks for "USA developers": WHERE u.country = 'USA'
- If user asks for "Indian developers": WHERE u.country = 'India'
- CRITICAL: For city names (Chennai, Bangalore, Mumbai), map to their state, NOT country
- If multiple filters: Use AND to combine WHERE conditions

INSTRUCTIONS:
- Return ONLY the SELECT statement - no markdown, no explanation, no extra text
- EXTRACT languages mentioned in the user request and build the WHERE clause dynamically
- EXTRACT location (city/state/country) and filter by correct column (state for Indian locations, country otherwise)
- Common languages to recognize: JavaScript, TypeScript, Python, Java, Go, Rust, C++, PHP, Ruby, C#, Swift, Kotlin, R, Julia, MATLAB, Scala, Groovy, Haskell, Elixir, Clojure, LUA, VB.Net, etc.
- Use HAVING clause to filter for active developers (must have repos or commits)
- Use LIMIT 50 unless user specifies a different number
- Check that all table aliases match the schema exactly
- Verify all parentheses are balanced and commas are correct`;

// Smaller prompt for slower local models (phi3:mini on CPU, etc.)
const COMPACT_SCHEMA_CONTEXT = `
Generate ONLY one MySQL SELECT query (no markdown/explanation).

Schema:
- user(user_id, username, email, state, country, followers_count)
- repository(repo_id, repo_name, visibility, created_at, user_id, parent_repo_id)
- commit_table(commit_id, commit_message, commit_time, lines_added, lines_deleted, repo_id, user_id)
- programming_language(language_id, language_name)
- repository_language(repo_id, language_id, usage_percentage)
- pull_request(pr_id, status, created_at, merged_at, closed_at, repo_id, user_id)
- repository_stat(repo_id, stars_count, forks_count, recorded_date)

Rules:
- SELECT only, safe and valid MySQL.
- Use aliases: u, r, rl, pl, ct, pr, rs.
- Use LEFT JOINs.
- Use COALESCE on aggregates.
- Group by non-aggregated user columns.
- Return top 50 by computed_score.
- City mapping: Chennai->Tamil Nadu, Bangalore/Bengaluru->Karnataka, Mumbai->Maharashtra.
- For Indian places use u.state; countries use u.country.
`;

const STRICT_RETRY_PROMPT = `
Return exactly one valid MySQL SELECT statement ending with semicolon.
No explanation, no markdown, no comments, no extra text.
Use only these tables: user u, repository r, repository_language rl, programming_language pl, commit_table ct, pull_request pr, repository_stat rs.
Always use LEFT JOINs and GROUP BY user columns.
Never use unknown aliases or tables.
`;

//Ollama Health Check
async function checkOllamaHealth() {
  const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
  try {
    const fetchPromise = fetch(`${ollamaUrl}/api/tags`, { method: 'GET' });
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), 5000)
    );
    
    const response = await Promise.race([fetchPromise, timeoutPromise]);
    
    if (response.ok) {
      const data = await response.json();
      return { status: 'connected', models: data.models || [] };
    }
    return { status: 'error', message: `HTTP ${response.status}` };
  } catch (err) {
    return { status: 'disconnected', message: err.message };
  }
}

// Ollama Query Generator
async function generateSQLFromOllama(userQuery) {
  const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
  const model = process.env.OLLAMA_MODEL || 'llama3';
  const ollamaTimeoutMs = Number(process.env.OLLAMA_TIMEOUT_MS || 120000);
  const ollamaNumPredict = Number(process.env.OLLAMA_NUM_PREDICT || 160);
  const ollamaNumCtx = Number(process.env.OLLAMA_NUM_CTX || 1024);
  const ollamaPromptMode = (process.env.OLLAMA_PROMPT_MODE || 'compact').toLowerCase();

  const promptContext = ollamaPromptMode === 'full' ? SCHEMA_CONTEXT : COMPACT_SCHEMA_CONTEXT;

  async function callOllama(prompt) {
    const fetchPromise = fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        options: {
          temperature: 0,
          top_k: 10,
          top_p: 0.5,
          num_predict: ollamaNumPredict,
          num_ctx: ollamaNumCtx,
          stop: ['```', '\n\nUser request:', '\n\nExplanation:']
        }
      }),
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Ollama request timeout (${Math.round(ollamaTimeoutMs / 1000)}s)`)), ollamaTimeoutMs)
    );

    const response = await Promise.race([fetchPromise, timeoutPromise]);
    if (!response.ok) {
      throw new Error(`Ollama request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return (data.response || '').trim();
  }

  function extractSql(rawText) {
    let sql = (rawText || '')
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      .replace(/```sql\n?/gi, '')
      .replace(/```\n?/g, '')
      .trim();

    const startIndex = sql.search(/\b(SELECT|WITH)\b/i);
    if (startIndex === -1) return null;
    sql = sql.slice(startIndex).trim();

    const firstStatement = sql.split(';').find((s) => s && s.trim().length > 0);
    if (!firstStatement) return null;

    sql = firstStatement.trim().replace(/;?\s*$/, ';');

    if (!/^(SELECT|WITH)\b/i.test(sql)) return null;
    if (/SELECT\s+.*\s+INTO\s+/i.test(sql)) return null;
    return sql;
  }

  try {
    const basePrompt = `${promptContext}\nUser request: "${userQuery}"\n\nGenerate the query:`;
    const firstRaw = await callOllama(basePrompt);
    const firstSql = extractSql(firstRaw);
    if (firstSql && isValidSQL(firstSql)) return firstSql;

    // Retry once with a stricter, shorter prompt for weaker models.
    const retryPrompt = `${STRICT_RETRY_PROMPT}\nUser request: "${userQuery}"\nSQL:`;
    const retryRaw = await callOllama(retryPrompt);
    const retrySql = extractSql(retryRaw);
    if (retrySql && isValidSQL(retrySql)) return retrySql;

    throw new Error('No valid SQL after strict retry');
  } catch (err) {
    throw new Error(`Ollama connection failed: ${err.message}`);
  }
}

// SQL Validation
function isValidSQL(sql) {
  if (!sql || typeof sql !== 'string') return false;
  
  const trimmed = sql.trim().toUpperCase();

  if (!(trimmed.startsWith('SELECT') || trimmed.startsWith('WITH'))) return false;

  if (!/\bSELECT\b/i.test(sql) || !/\bFROM\b/i.test(sql)) return false;

  if (/\bDROP\s+TABLE\b|\bDELETE\s+FROM\b|\bUPDATE\s+\w+\b|\bTRUNCATE\b|\bINSERT\s+INTO\b/i.test(sql)) {
    return false;
  }

  // Basic malformed SQL guardrails for weak local models.
  const deEscaped = sql.replace(/''/g, '');
  const singleQuotes = (deEscaped.match(/'/g) || []).length;
  if (singleQuotes % 2 !== 0) return false;

  const openParens = (sql.match(/\(/g) || []).length;
  const closeParens = (sql.match(/\)/g) || []).length;
  if (openParens !== closeParens) return false;

  if (sql.length > 10000) return false;

  return true;
}
function getFallbackQuery(userQuery) {
  const q = userQuery.toLowerCase();
  let locationFilter = '';
  let languageFilter = '';

  // Indian states
  const indianStates = {
    'tamil nadu': 'Tamil Nadu',
    'tn': 'Tamil Nadu',
    'tamil': 'Tamil Nadu',
    'chennai': 'Tamil Nadu',
    'kerala': 'Kerala',
    'karnataka': 'Karnataka',
    'bangalore': 'Karnataka',
    'bengaluru': 'Karnataka',
    'delhi': 'Delhi',
    'new delhi': 'Delhi',
    'maharashtra': 'Maharashtra',
    'mumbai': 'Maharashtra',
    'punjab': 'Punjab',
    'chandigarh': 'Punjab',
    'uttar pradesh': 'Uttar Pradesh',
    'up': 'Uttar Pradesh',
    'rajasthan': 'Rajasthan',
    'jaipur': 'Rajasthan',
    'andhra pradesh': 'Andhra Pradesh',
    'hyderabad': 'Andhra Pradesh',
    'telangana': 'Telangana',
    'west bengal': 'West Bengal',
    'kolkata': 'West Bengal',
    'bihar': 'Bihar',
    'jharkhand': 'Jharkhand',
    'haryana': 'Haryana',
    'goa': 'Goa',
    'assam': 'Assam',
    'meghalaya': 'Meghalaya'
  };

  // Define countries
  const countries = {
    'india': 'India',
    'usa': 'United States of America',
    'united states': 'United States of America',
    'us': 'United States of America',
    'uk': 'UK',
    'united kingdom': 'UK',
    'canada': 'Canada',
    'australia': 'Australia',
    'germany': 'Germany',
    'france': 'France',
    'japan': 'Japan',
    'china': 'China',
    'singapore': 'Singapore',
    'dubai': 'UAE',
    'uae': 'UAE'
  };

  // Auto-detect state vs country
  let stateFound = false;
  for (const [key, value] of Object.entries(indianStates)) {
    if (q.includes(key)) {
      locationFilter = `AND LOWER(u.state) = '${value.toLowerCase()}'`;
      stateFound = true;
      break;
    }
  }

  if (!stateFound) {
    for (const [key, value] of Object.entries(countries)) {
      if (q.includes(key)) {
        locationFilter = `AND LOWER(u.country) = '${value.toLowerCase()}'`;
        break;
      }
    }
  }

  // Language-based filters
  if (q.includes('python') || q.includes('ai') || q.includes('ml') || q.includes('data')) {
    languageFilter = `AND pl.language_name IN ('Python', 'R', 'Julia', 'MATLAB')`;
  } else if (q.includes('javascript') || q.includes('js') || q.includes('typescript') || q.includes('ts') || q.includes('frontend') || q.includes('react') || q.includes('vue')) {
    languageFilter = `AND pl.language_name IN ('JavaScript', 'TypeScript')`;
  } else if (q.includes('java') || q.includes('backend') || q.includes('server')) {
    languageFilter = `AND pl.language_name IN ('Java', 'Go', 'Node.js', 'Python')`;
  } else if (q.includes('go') || q.includes('golang')) {
    languageFilter = `AND pl.language_name = 'Go'`;
  } else if (q.includes('rust')) {
    languageFilter = `AND pl.language_name = 'Rust'`;
  } else if (q.includes('c++') || q.includes('cpp')) {
    languageFilter = `AND pl.language_name = 'C++'`;
  }

  // Return query
  return `
    SELECT 
      u.user_id,
      u.username,
      u.email,
      u.state,
      u.country,
      u.followers_count,
      GROUP_CONCAT(DISTINCT pl.language_name ORDER BY rl.usage_percentage DESC SEPARATOR ', ') AS skills,
      ROUND(AVG(rl.usage_percentage), 1) AS avg_language_usage,
      COALESCE(COUNT(DISTINCT ct.commit_id), 0) AS total_commits,
      COALESCE(SUM(rs.stars_count), 0) AS total_stars,
      COALESCE(COUNT(DISTINCT CASE WHEN pr.status = 'merged' THEN pr.pr_id END), 0) AS merged_prs,
      ROUND(
        (COALESCE(AVG(rl.usage_percentage), 0) * 0.2) +
        (COALESCE(COUNT(DISTINCT ct.commit_id), 0) * 0.4) +
        (COALESCE(SUM(rs.stars_count), 0) * 0.2) +
        (COALESCE(COUNT(DISTINCT CASE WHEN pr.status = 'merged' THEN pr.pr_id END), 0) * 2 * 0.2)
      , 1) AS computed_score
    FROM user u
    LEFT JOIN repository r ON u.user_id = r.user_id
    LEFT JOIN repository_language rl ON r.repo_id = rl.repo_id
    LEFT JOIN programming_language pl ON rl.language_id = pl.language_id
    LEFT JOIN commit_table ct ON u.user_id = ct.user_id
    LEFT JOIN pull_request pr ON u.user_id = pr.user_id
    LEFT JOIN repository_stat rs ON r.repo_id = rs.repo_id
    WHERE 1=1 ${locationFilter} ${languageFilter}
    GROUP BY u.user_id, u.username, u.email, u.state, u.country, u.followers_count
    HAVING COUNT(DISTINCT r.repo_id) > 0 OR COUNT(DISTINCT ct.commit_id) > 0
    ORDER BY computed_score DESC
    LIMIT 50
  `;
}

function shouldUseFallbackImmediately(userQuery) {
  const q = (userQuery || '').toLowerCase();

  // Fast-path common simple lookups to avoid waiting on slow local models.
  const simpleLocationQuery =
    /(developers?|engineers?|coders?).*(from|in)\s+[a-z\s]+/.test(q) ||
    /(from|in)\s+(india|usa|united states|us|uk|canada|australia|germany|france|japan|china|singapore|uae)/.test(q);

  const simpleLanguageQuery =
    /(developers?|engineers?).*(python|javascript|typescript|java|go|rust|c\+\+|php|ruby|c#|swift|kotlin|r)\b/.test(q);

  return simpleLocationQuery || simpleLanguageQuery;
}

//Routes 

// Health check for database
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    const ollamaStatus = await checkOllamaHealth();
    res.json({ 
      status: 'ok',
      database: 'connected',
      ollama: ollamaStatus
    });
  } catch (err) {
    res.status(500).json({ 
      status: 'error', 
      database: err.message,
      ollama: 'unknown'
    });
  }
});

// Ollama health check
app.get('/api/health/ollama', async (req, res) => {
  try {
    const ollamaStatus = await checkOllamaHealth();
    if (ollamaStatus.status === 'connected') {
      res.json(ollamaStatus);
    } else {
      res.status(503).json(ollamaStatus);
    }
  } catch (err) {
    res.status(503).json({ 
      status: 'error', 
      message: err.message 
    });
  }
});

// Get all developers
app.get('/api/developers', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        u.user_id, u.username, u.email, u.country, u.followers_count, u.state,
        GROUP_CONCAT(DISTINCT pl.language_name ORDER BY rl.usage_percentage DESC SEPARATOR ', ') AS skills,
        ROUND(AVG(rl.usage_percentage), 1) AS avg_language_usage,
        COALESCE(COUNT(DISTINCT ct.commit_id), 0) AS total_commits,
        COALESCE(SUM(rs.stars_count), 0) AS total_stars,
        COALESCE(COUNT(DISTINCT CASE WHEN pr.status = 'merged' THEN pr.pr_id END), 0) AS merged_prs,
        ROUND(
          (COALESCE(AVG(rl.usage_percentage), 0) * 0.2) +
          (COALESCE(COUNT(DISTINCT ct.commit_id), 0) * 0.4) +
          (COALESCE(SUM(rs.stars_count), 0) * 0.2) +
          (COALESCE(COUNT(DISTINCT CASE WHEN pr.status = 'merged' THEN pr.pr_id END), 0) * 2 * 0.2)
        , 1) AS computed_score
      FROM user u
      LEFT JOIN repository r ON u.user_id = r.user_id
      LEFT JOIN repository_language rl ON r.repo_id = rl.repo_id
      LEFT JOIN programming_language pl ON rl.language_id = pl.language_id
      LEFT JOIN commit_table ct ON u.user_id = ct.user_id
      LEFT JOIN pull_request pr ON u.user_id = pr.user_id
      LEFT JOIN repository_stat rs ON r.repo_id = rs.repo_id
      GROUP BY u.user_id, u.username, u.email, u.country, u.followers_count, u.state
      HAVING COUNT(DISTINCT r.repo_id) > 0 OR COUNT(DISTINCT ct.commit_id) > 0
      ORDER BY computed_score DESC
      LIMIT 100
    `);
    res.json({ developers: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get stats for dashboard
app.get('/api/stats', async (req, res) => {
  try {
    const [[{ total_users }]] = await pool.query('SELECT COUNT(*) as total_users FROM `user`');    const [[{ total_repos }]] = await pool.query('SELECT COUNT(*) as total_repos FROM repository');
    const [[{ total_commits }]] = await pool.query('SELECT COUNT(*) as total_commits FROM commit_table');
    const [[{ total_languages }]] = await pool.query('SELECT COUNT(DISTINCT language_id) as total_languages FROM repository_language');
    res.json({ total_users, total_repos, total_commits, total_languages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get language distribution
app.get('/api/languages', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT pl.language_name, 
             COUNT(DISTINCT rl.repo_id) as repo_count,
             AVG(rl.usage_percentage) as avg_usage,
             SUM(rl.usage_percentage) as total_usage
      FROM programming_language pl
      LEFT JOIN repository_language rl ON pl.language_id = rl.language_id
      GROUP BY pl.language_id, pl.language_name
      ORDER BY repo_count DESC
      LIMIT 15
    `);
    res.json({ languages: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Search Endpoint
app.post('/api/search', async (req, res) => {
  const { query } = req.body;
  if (!query || query.trim().length < 2) {
    return res.status(400).json({ error: 'Query is too short.' });
  }

  let generatedSQL = null;
  let usedFallback = false;
  let ollamaError = null;
  const ollamaMode = (process.env.OLLAMA_MODE || 'auto').toLowerCase();
  const fastPathEnabled = (process.env.OLLAMA_FAST_PATH || 'true').toLowerCase() !== 'false';
  const forceFastPath = fastPathEnabled && shouldUseFallbackImmediately(query);

  // Optional fast-path / disable switch for slow local inference.
  if (ollamaMode === 'off' || forceFastPath) {
    generatedSQL = getFallbackQuery(query);
    usedFallback = true;
    if (ollamaMode === 'off') {
      ollamaError = 'Ollama disabled by OLLAMA_MODE=off';
    } else {
      ollamaError = 'Using fast fallback for simple query';
    }
  } else {
    // Ollama
    try {
      generatedSQL = await generateSQLFromOllama(query);
      if (!isValidSQL(generatedSQL)) {
        throw new Error('AI SQL malformed (auto-fallback)');
      }
    } catch (err) {
      ollamaError = err.message;
      console.warn('Ollama unavailable or invalid, using fallback:', err.message);
      generatedSQL = getFallbackQuery(query);
      usedFallback = true;
    }
  }

  // Execute the SQL
  try {
    const [rows] = await pool.query(generatedSQL);
    res.json({
      results: rows,
      generated_sql: generatedSQL,
      used_fallback: usedFallback,
      ollama_error: ollamaError,
      query_type: usedFallback ? 'rule-based' : 'ai-generated',
    });
  } catch (sqlErr) {
    console.error('SQL execution error:', sqlErr.message);
    console.error('Attempted SQL:', generatedSQL);
    // If AI SQL failed, try fallback
    if (!usedFallback) {
      try {
        const fallbackSQL = getFallbackQuery(query);
        const [rows] = await pool.query(fallbackSQL);
        return res.json({
          results: rows,
          generated_sql: fallbackSQL,
          used_fallback: true,
          query_type: 'rule-based (sql-error fallback)',
          original_error: sqlErr.message,
        });
      } catch (fallbackErr) {
        console.error('Fallback query also failed:', fallbackErr.message);
        return res.status(500).json({ error: 'Query execution failed. Try rephrasing your search.' });
      }
    }
    console.error('SQL error (AI query):', sqlErr.message);
    res.status(500).json({ error: 'Query execution failed. Try rephrasing your search.' });
  }
});

// User Detail Endpoint
app.get('/api/developers/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    //Core profile
    const [[user]] = await pool.query(`
      SELECT user_id, username, email, state, country, followers_count
      FROM \`user\`
      WHERE user_id = ?
    `, [userId]);

    if (!user) return res.status(404).json({ error: 'User not found' });

    //Repositories with stats
    const [repos] = await pool.query(`
      SELECT
        r.repo_id, r.repo_name, r.visibility, r.created_at,
        r.parent_repo_id,
        COALESCE(rs.stars_count, 0) AS stars_count,
        COALESCE(rs.forks_count, 0) AS forks_count,
        GROUP_CONCAT(DISTINCT pl.language_name SEPARATOR ', ') AS languages
      FROM repository r
      LEFT JOIN repository_stat rs ON r.repo_id = rs.repo_id
      LEFT JOIN repository_language rl ON r.repo_id = rl.repo_id
      LEFT JOIN programming_language pl ON rl.language_id = pl.language_id
      WHERE r.user_id = ?
      GROUP BY r.repo_id, r.repo_name, r.visibility, r.created_at,
               r.parent_repo_id, rs.stars_count, rs.forks_count
      ORDER BY stars_count DESC
    `, [userId]);

    //Language breakdown
    const [languages] = await pool.query(`
      SELECT
        pl.language_name,
        ROUND(AVG(rl.usage_percentage), 1) AS avg_usage,
        COUNT(DISTINCT rl.repo_id) AS repo_count
      FROM repository r
      JOIN repository_language rl ON r.repo_id = rl.repo_id
      JOIN programming_language pl ON rl.language_id = pl.language_id
      WHERE r.user_id = ?
      GROUP BY pl.language_id, pl.language_name
      ORDER BY avg_usage DESC
    `, [userId]);

    //Recent commits
    const [commits] = await pool.query(`
      SELECT
        ct.commit_id, ct.commit_message, ct.commit_time,
        ct.lines_added, ct.lines_deleted,
        r.repo_name
      FROM commit_table ct
      JOIN repository r ON ct.repo_id = r.repo_id
      WHERE ct.user_id = ?
      ORDER BY ct.commit_time DESC
      LIMIT 10
    `, [userId]);

    //Pull requests
    const [pullRequests] = await pool.query(`
      SELECT
        pr.pr_id, pr.status, pr.created_at, pr.merged_at, pr.closed_at,
        r.repo_name
      FROM pull_request pr
      JOIN repository r ON pr.repo_id = r.repo_id
      WHERE pr.user_id = ?
      ORDER BY pr.created_at DESC
      LIMIT 10
    `, [userId]);

    //Aggregate stats
    const [[aggr]] = await pool.query(`
      SELECT
        COUNT(DISTINCT r.repo_id)                                          AS total_repos,
        COALESCE(SUM(rs.stars_count), 0)                                   AS total_stars,
        COALESCE(SUM(rs.forks_count), 0)                                   AS total_forks,
        COALESCE(COUNT(DISTINCT ct.commit_id), 0)                          AS total_commits,
        COALESCE(SUM(ct.lines_added), 0)                                   AS total_lines_added,
        COALESCE(SUM(ct.lines_deleted), 0)                                 AS total_lines_deleted,
        COALESCE(COUNT(DISTINCT CASE WHEN pr.status='merged' THEN pr.pr_id END), 0) AS merged_prs,
        COALESCE(COUNT(DISTINCT CASE WHEN pr.status='open'   THEN pr.pr_id END), 0) AS open_prs
      FROM \`user\` u
      LEFT JOIN repository r        ON u.user_id = r.user_id
      LEFT JOIN repository_stat rs  ON r.repo_id = rs.repo_id
      LEFT JOIN commit_table ct     ON u.user_id = ct.user_id
      LEFT JOIN pull_request pr     ON u.user_id = pr.user_id
      WHERE u.user_id = ?
    `, [userId]);

    res.json({ user, repos, languages, commits, pullRequests, stats: aggr });

  } catch (err) {
    console.error('User detail error:', err.message);
    res.status(500).json({ error: 'Failed to fetch user details.' });
  }
});

app.get('/api/search/repos', async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 1) return res.json({ developers: [] });

  try {
    // check if the repo even exists
    const [repoCheck] = await pool.query(
      `SELECT repo_id, repo_name, user_id FROM repository WHERE LOWER(repo_name) LIKE LOWER(?)`,
      [`%${q.trim()}%`]
    );
    console.log(`Repo search for "${q}" found ${repoCheck.length} repos:`, repoCheck.map(r => r.repo_name));

    if (repoCheck.length === 0) {
      return res.json({ developers: [], debug: `No repos found matching "${q}"` });
    }

    const [rows] = await pool.query(`
      SELECT
        u.user_id,
        u.username,
        u.email,
        u.country,
        u.followers_count,
        GROUP_CONCAT(DISTINCT pl.language_name ORDER BY rl.usage_percentage DESC SEPARATOR ', ') AS skills,
        COALESCE(COUNT(DISTINCT ct.commit_id), 0) AS total_commits,
        COALESCE(SUM(rs.stars_count), 0)          AS total_stars,
        COALESCE(COUNT(DISTINCT pr.pr_id), 0)     AS total_prs,
        ROUND(
          (COALESCE(AVG(rl.usage_percentage), 0) * 0.2) +
          (COALESCE(COUNT(DISTINCT ct.commit_id), 0) * 0.4) +
          (COALESCE(SUM(rs.stars_count), 0) * 0.2) +
          (COALESCE(COUNT(DISTINCT CASE WHEN pr.status = 'merged' THEN pr.pr_id END), 0) * 2 * 0.2)
        , 1) AS computed_score,
        GROUP_CONCAT(DISTINCT matched_r.repo_name SEPARATOR ', ') AS matched_repos
      FROM \`user\` u
      JOIN repository matched_r ON u.user_id = matched_r.user_id
        AND LOWER(matched_r.repo_name) LIKE LOWER(?)
      LEFT JOIN repository r         ON u.user_id = r.user_id
      LEFT JOIN repository_language rl ON r.repo_id = rl.repo_id
      LEFT JOIN programming_language pl ON rl.language_id = pl.language_id
      LEFT JOIN commit_table ct        ON u.user_id = ct.user_id
      LEFT JOIN pull_request pr        ON u.user_id = pr.user_id
      LEFT JOIN repository_stat rs     ON r.repo_id = rs.repo_id
      GROUP BY u.user_id, u.username, u.email, u.country, u.followers_count
      ORDER BY computed_score DESC
      LIMIT 50
    `, [`%${q.trim()}%`]);

    res.json({ developers: rows, debug: `Matched repos: ${repoCheck.map(r => r.repo_name).join(', ')}` });
  } catch (err) {
    console.error('Repo search error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

//Server
const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
  console.log(`\n DevMatch backend running on http://localhost:${PORT}`);
  console.log(` MySQL: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}/${process.env.DB_NAME || 'DBMS_PROJECT'}`);
  
  // Check Ollama status on startup
  const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
  const ollamaModel = process.env.OLLAMA_MODEL || 'llama3';
  const ollamaStatus = await checkOllamaHealth();
  
  if (ollamaStatus.status === 'connected') {
    console.log(` Ollama: ${ollamaUrl} (model: ${ollamaModel}) - CONNECTED`);
    if (ollamaStatus.models && ollamaStatus.models.length > 0) {
      const availableModels = ollamaStatus.models.map(m => m.name || m).join(', ');
      console.log(`   Available models: ${availableModels}`);
    }
  } else {
    console.log(`Ollama: ${ollamaUrl} - ${ollamaStatus.status.toUpperCase()}`);
    console.log(`   Message: ${ollamaStatus.message}`);
    console.log(`   Fallback queries will be used for /api/search`);
  }
  console.log('');
});
