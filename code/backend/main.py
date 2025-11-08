from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
import subprocess
from pathlib import Path

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

VAR_DIR = Path(__file__).parent.parent / "var"
AGENT_FINDINGS_PATH = VAR_DIR / "agentFindings.json"
SENTIMENT_ANALYZED_PATH = VAR_DIR / "sentimentAnalyzed.json"
FINAL_BRIEF_PATH = VAR_DIR / "finalBrief.json"

# Ensure var directory exists
VAR_DIR.mkdir(exist_ok=True)

def run_agent_scrape(prompt: str):
    """
    Calls agent.py to scrape data using Agentuity and Tavily
    Writes results to agentFindings.json
    """
    try:
        # Write prompt to a temp file or pass as argument
        # Call your agent.py script
        subprocess.run(["python", "agent.py", prompt], check=True, cwd=Path(__file__).parent)
        
        # Read the output from agentFindings.json
        with open(AGENT_FINDINGS_PATH, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error in agent scrape: {e}")
        # Return mock data if agent.py doesn't exist yet
        mock_data = {
            "sources": ["source1.com", "source2.com"],
            "raw_data": ["Opinion 1", "Statistic 1", "Opinion 2"]
        }
        with open(AGENT_FINDINGS_PATH, 'w') as f:
            json.dump(mock_data, f, indent=2)
        return mock_data

def run_sentiment_analysis(prompt: str):
    """
    Calls sentiment analysis script (sentiment.py or rankDoc.py)
    Reads from agentFindings.json
    Writes results to sentimentAnalyzed.json
    """
    try:
        # Call your sentiment analysis script
        subprocess.run(["python", "sentiment.py", prompt], check=True, cwd=Path(__file__).parent)
        
        # Read the output from sentimentAnalyzed.json
        with open(SENTIMENT_ANALYZED_PATH, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error in sentiment analysis: {e}")
        # Return mock data if sentiment.py doesn't exist yet
        mock_data = {
            "rankings": [
                {"stock": "AAPL", "score": 92, "sentiment": "positive"},
                {"stock": "GOOGL", "score": 78, "sentiment": "neutral"},
                {"stock": "MSFT", "score": 88, "sentiment": "positive"}
            ],
            "overall_sentiment": "positive"
        }
        with open(SENTIMENT_ANALYZED_PATH, 'w') as f:
            json.dump(mock_data, f, indent=2)
        return mock_data

def run_brief_creation(prompt: str):
    """
    Calls brief.py to generate report and voice output with Retell
    Reads from sentimentAnalyzed.json
    Writes results to finalBrief.json
    """
    try:
        # Call your brief creation script
        subprocess.run(["python", "brief.py", prompt], check=True, cwd=Path(__file__).parent)
        
        # Read the output from finalBrief.json
        with open(FINAL_BRIEF_PATH, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error in brief creation: {e}")
        # Return mock data if brief.py doesn't exist yet
        mock_data = {
            "brief": "Based on current market sentiment and analysis, the top recommendations are...",
            "audio_url": None
        }
        with open(FINAL_BRIEF_PATH, 'w') as f:
            json.dump(mock_data, f, indent=2)
        return mock_data

@app.route('/')
def root():
    return jsonify({
        "message": "Sentiment Stock Recommendation API",
        "status": "running",
        "endpoints": {
            "/analyze": "POST - Submit a prompt for stock analysis"
        }
    })

@app.route('/health')
def health_check():
    return jsonify({"status": "healthy"})

@app.route('/analyze', methods=['POST'])
def analyze_stocks():
    """
    Main endpoint that runs the 3-stage AI pipeline:
    1. Agent Scrape - Scrapes data using Agentuity and Tavily → agentFindings.json
    2. Sentiment Analysis - Analyzes sentiment with Claude → sentimentAnalyzed.json
    3. Brief Creation - Generates report and voice output → finalBrief.json
    """
    try:
        data = request.get_json()
        prompt = data.get('prompt', '')
        
        if not prompt:
            return jsonify({"error": "Prompt is required"}), 400
        
        agent_data = run_agent_scrape(prompt)
        
        sentiment_data = run_sentiment_analysis(prompt)
        
        brief_result = run_brief_creation(prompt)
        
        return jsonify({
            "status": "success",
            "prompt": prompt,
            "agent_data": agent_data,
            "sentiment_data": sentiment_data,
            "brief": brief_result.get("brief"),
            "audio_url": brief_result.get("audio_url"),
            "rankings": sentiment_data.get("rankings", [])
        })
        
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == "__main__":
    print("Starting Flask server on http://localhost:8000")
    print(f"JSON files will be stored in: {VAR_DIR.absolute()}")
    app.run(host="0.0.0.0", port=8000, debug=True)
