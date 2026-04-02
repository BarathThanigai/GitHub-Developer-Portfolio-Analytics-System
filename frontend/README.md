# DevMatch — AI Developer Analytics & Matching System

> Natural language → SQL → ranked developer profiles, powered by Ollama LLM + MySQL + React

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React + Vite)                  │
│   SearchPanel → natural language input                           │
│   DeveloperGrid → ranked results with metrics                    │
│   SQLViewer → shows generated SQL transparently                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP POST /api/search
┌──────────────────────────▼──────────────────────────────────────┐
│                    BACKEND (Node.js + Express)                    │
│   /api/search → sends query + schema context to Ollama           │
│   /api/developers → all devs, ranked                             │
│   /api/stats → aggregate platform stats                          │
│   /api/languages → language distribution                         │
└──────────┬──────────────────────────────┬───────────────────────┘
           │                              │
┌──────────▼──────────┐      ┌───────────▼──────────────┐
│   Ollama (local)     │      │   MySQL Database          │
│   llama3 / mistral  │      │   devmatch schema          │
│   Generates SQL      │      │   Executes SQL             │
└─────────────────────┘      └───────────────────────────┘
```

---

## Quick Start

### 1. Prerequisites

- **Node.js** v18+
- **MySQL** 8.0+
- **Ollama** installed and running locally
  - Install: https://ollama.ai
  - Pull model: `ollama pull llama3`

---

### 2. Database Setup

```bash
# Log into MySQL
mysql -u root -p

# Run schema + seed data
source /path/to/devmatch/backend/schema.sql
source /path/to/devmatch/backend/seed.sql
```

---

### 3. Backend Setup

```bash
cd devmatch/backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your MySQL credentials and Ollama settings

# Start server
npm run dev     # development (with nodemon)
npm start       # production
```

Backend runs on **http://localhost:3001**

---

### 4. Frontend Setup

```bash
cd devmatch/frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend runs on **http://localhost:5173**

---

### 5. Ollama Setup

```bash
# Make sure Ollama is running
ollama serve

# Pull the recommended model
ollama pull llama3

# Or use a lighter model:
ollama pull mistral
ollama pull phi3
```

Update `OLLAMA_MODEL` in your `.env` to match the model you pulled.

---

## Environment Variables

```env
# MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=devmatch

# Ollama
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3       # or mistral, phi3, etc.

# Server
PORT=3001
```

---

## API Endpoints

| Method | Endpoint           | Description                              |
|--------|--------------------|------------------------------------------|
| GET    | `/api/health`      | DB connection check                      |
| GET    | `/api/developers`  | All developers ranked by score           |
| GET    | `/api/stats`       | Platform aggregate statistics            |
| GET    | `/api/languages`   | Language usage distribution              |
| POST   | `/api/search`      | AI-powered natural language dev search   |

### POST /api/search

**Request:**
```json
{
  "query": "Find senior frontend developers skilled in React"
}
```

**Response:**
```json
{
  "results": [...],
  "generated_sql": "SELECT u.id, u.username ...",
  "used_fallback": false,
  "query_type": "ai-generated"
}
```

---

## Developer Score Formula

```
computed_score =
  (lines_of_code    × 0.40) +
  (total_commits    × 30 × 0.30) +
  (total_repo_stars × 20 × 0.20) +
  (merged_prs       × 30 × 0.10)
```

---

## Example Natural Language Queries

| User Input | What the AI generates |
|---|---|
| `"frontend developers"` | Filters `pl.category = 'frontend'` |
| `"top AI/ML engineers"` | Filters `pl.category = 'ai_ml'` |
| `"Python deep learning"` | Filters `pl.name IN ('Python', 'PyTorch', 'TensorFlow')` |
| `"most active contributors"` | Orders by commit count, no language filter |
| `"DevOps specialists with Docker"` | Filters Docker + Kubernetes |

---

## Fallback Behavior

If Ollama is unreachable, the backend automatically falls back to **rule-based SQL generation** using keyword matching on the user's query. The frontend displays whether the query was AI-generated or rule-based via the SQL viewer badge.

---

## Project Structure

```
devmatch/
├── backend/
│   ├── server.js          # Express API + Ollama integration
│   ├── schema.sql         # Database schema + language seed data
│   ├── seed.sql           # Developer sample data
│   ├── .env.example       # Environment template
│   └── package.json
└── frontend/
    ├── src/
    │   ├── App.jsx         # Root component + data fetching
    │   ├── App.css         # Global styles (dark terminal theme)
    │   ├── main.jsx        # React entry point
    │   └── components/
    │       ├── SearchPanel.jsx    # NL query input + quick chips
    │       ├── DeveloperGrid.jsx  # Ranked developer cards
    │       ├── StatsBar.jsx       # Platform stats
    │       └── SQLViewer.jsx      # Generated SQL display
    ├── index.html
    ├── vite.config.js
    └── package.json
```
