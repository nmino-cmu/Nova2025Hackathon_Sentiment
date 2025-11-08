# Nova2025Hackathon_Sentiment

# Sentiment - AI-Powered Stock Recommendation App

A GenAI hackathon project that uses multiple AI agents to analyze stocks and provide sentiment-based recommendations.

The app uses a multi-stage AI pipeline:

1. **agent.py** - Scrapes relevant data using Agentuity and Tavily
2. **refine.py** - Processes scraped data using Openrouter's Claude
3. **rank.py** - Performs sentiment analysis and ranking using Claude
4. **brief.py** - Generates voice report using Retell and text summary

## Setup
Dependencies Required:
$pip install -r requirements.txt
$npm install

### Backend (Flask)
Run the Flask server:
$python main.py

The API will be available at `http://localhost:8000`

### Frontend (Next.js)
Run the development server:
$npm run dev

The frontend will be available at `http://localhost:3000`

## Integration Steps

To connect your actual AI pipeline files:

1. Place your Python files (`agentDoc.py`, `refineDoc.py`, `rankDoc.py`, `briefDoc.py`) in the `backend` folder

2. Update the imports in `backend/main.py`:
from agentDoc import scrape_data
from refineDoc import refine_data
from rankDoc import rank_data
from briefDoc import generate_brief

3. Replace the placeholder functions with actual calls to your modules

## API Endpoints

- `GET /` - API information
- `GET /health` - Health check
- `POST /analyze` - Main analysis endpoint
  - Request: `{ "prompt": "your query here" }`
  - Response: Analysis results with rankings and brief
