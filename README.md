# Sentiment - AI-Powered Stock Recommendation App

A GenAI hackathon project that uses multiple AI agents to analyze stocks and provide sentiment-based recommendations.

## Architecture

The app uses a 3-stage AI pipeline with integrated TypeScript/Express brief generation:

1. **agent.py** - Scrapes relevant data using Agentuity and Tavily → `var/agentFindings.json`
2. **sentiment.py** - Performs sentiment analysis using Openrouter's Claude → `var/sentimentAnalyzed.json`
3. **brief.py** - Generates final report → `var/finalBrief.json`
4. **Express Brief Server** - Creates formatted brief with citations and Retell voice integration

## Tech Stack

**Frontend:**
- Next.js 16 (React 19.2)
- TypeScript
- Tailwind CSS with Vaporwave design

**Backend:**
- Python Flask (port 8000) - Main AI pipeline
- Express/TypeScript (port 3001) - Brief generation server
- Next.js API Routes - Integration layer

**AI Services:**
- OpenRouter (Claude) - Sentiment analysis & summarization
- Retell AI - Voice generation
- Agentuity - Agent orchestration
- Tavily - Web scraping

## Setup

### 1. Install Python Dependencies

\`\`\`bash
cd backend
pip install -r requirements.txt
\`\`\`

### 2. Install Node Dependencies

\`\`\`bash
npm install
\`\`\`

### 3. Environment Variables

Create a `.env.local` file in the root directory:

\`\`\`env
# OpenRouter
OPENROUTER_API_KEY=your_openrouter_key
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
OPENROUTER_BRIEF_MODEL=mistralai/mistral-7b-instruct

# Retell AI (optional for voice)
RETELL_API_KEY=your_retell_key
RETELL_AGENT_ID=your_retell_agent_id

# Brief Server Configuration
BRIEF_SERVER_PORT=3001
BRIEF_DOMAIN_ALLOWLIST=example.com,news.com
\`\`\`

### 4. Add Your Python AI Files

Place your AI processing scripts in the `backend/` folder:
- `agent.py` - Agent scraping logic
- `sentiment.py` - Sentiment analysis
- `brief.py` - Brief creation

These scripts should:
- Accept the user prompt as a command-line argument
- Read from the previous stage's JSON file in `var/`
- Write output to their designated JSON file in `var/`

## Running the Application

You need to run **3 servers simultaneously**:

### Terminal 1: Python Flask Backend
\`\`\`bash
cd backend
python main.py
\`\`\`
Runs on `http://localhost:8000`

### Terminal 2: Express Brief Server
\`\`\`bash
npm run server
\`\`\`
Runs on `http://localhost:3001`

### Terminal 3: Next.js Frontend
\`\`\`bash
npm run dev
\`\`\`
Runs on `http://localhost:3000`

## How It Works

1. User enters a stock query in the vaporwave frontend
2. Frontend calls Flask backend at `/analyze`
3. Flask orchestrates the 3-stage Python AI pipeline:
   - Runs `agent.py` with the prompt → writes `var/agentFindings.json`
   - Runs `sentiment.py` with the prompt → writes `var/sentimentAnalyzed.json`
   - Runs `brief.py` with the prompt → writes `var/finalBrief.json`
4. Flask returns rankings to the frontend
5. Frontend calls Next.js API `/api/brief`
6. Next.js proxies to Express brief server at port 3001
7. Express server reads `var/sentimentAnalyzed.json` and generates formatted brief
8. Results display in the UI with rankings and brief

## File Structure

\`\`\`
├── app/
│   ├── api/
│   │   ├── analyze/route.ts          # Sentiment analysis (unused in current flow)
│   │   ├── brief/route.ts            # Brief generation proxy to Express
│   │   ├── run-full-analysis/route.ts # Full TypeScript pipeline (alternative)
│   │   └── summarize/route.ts        # Summarization endpoint
│   ├── page.tsx                      # Main vaporwave frontend
│   └── layout.tsx
├── backend/
│   ├── main.py                       # Flask server orchestrating Python pipeline
│   ├── agent.py                      # Your agent scraping code
│   ├── sentiment.py                  # Your sentiment analysis code
│   └── brief.py                      # Your brief creation code
├── lib/
│   ├── brief/
│   │   ├── server.ts                # Express brief server (port 3001)
│   │   └── retellSummary.ts         # Retell AI voice integration
│   └── rank/
│       ├── ai.ts                    # OpenRouter AI helper functions
│       ├── sentiment-analysis.ts     # TypeScript type definitions
│       └── ranking-logic.ts          # Stock ranking algorithms
├── var/
│   ├── agentFindings.json           # Stage 1: Agent scraping output
│   ├── sentimentAnalyzed.json       # Stage 2: Sentiment analysis output
│   └── finalBrief.json              # Stage 3: Brief creation output
└── package.json
\`\`\`

## API Endpoints

### Flask Backend (port 8000)
- `GET /` - API information
- `GET /health` - Health check
- `POST /analyze` - Main analysis endpoint
  - Request: `{ "prompt": "your query here" }`
  - Response: `{ "status": "success", "rankings": [...], "brief": "...", ... }`

### Express Brief Server (port 3001)
- `POST /brief` - Generate formatted brief with citations
  - Request: `{ "userPrompt": "optional instructions" }`
  - Response: `{ "text": "...", "links": [...], "events": [...] }`

### Next.js API Routes (port 3000)
- `POST /api/brief` - Proxies to Express brief server

## Dependencies

All required packages are in `package.json`. No additional installations needed beyond:

\`\`\`bash
npm install
\`\`\`

**Key packages:**
- `express` - Brief server
- `cors` - Cross-origin requests
- `dotenv` - Environment variables
- `retell-sdk` - Retell AI integration
- `ts-node` - TypeScript execution

## Troubleshooting

- **CORS errors**: Ensure all 3 servers are running on correct ports
- **Port conflicts**: Check ports 3000, 3001, and 8000 are available
- **Missing data**: Verify Python scripts write to correct JSON files in `var/`
- **API errors**: Check all environment variables are set in `.env.local`
- **Import errors**: Run `npm install` to ensure all TypeScript packages are installed

## Integration with Your Code

Replace the subprocess calls in `backend/main.py` with your actual module imports once your Python files are ready. The current implementation uses subprocess for flexibility during development.
