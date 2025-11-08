"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"

interface StockRecommendation {
  stock: string
  score: number
  sentiment: string
}

interface AnalysisResult {
  status: string
  prompt: string
  ranked_data?: {
    rankings: StockRecommendation[]
    overall_sentiment: string
  }
  brief?: string
  audio_url?: string
}

const stocks = [
  { symbol: "AAPL", price: 178.23, change: 2.45 },
  { symbol: "GOOGL", price: 142.87, change: -1.23 },
  { symbol: "MSFT", price: 412.56, change: 5.67 },
  { symbol: "TSLA", price: 242.84, change: 8.92 },
  { symbol: "AMZN", price: 178.35, change: -0.87 },
  { symbol: "META", price: 489.23, change: 12.34 },
]

const detailedStocks = [
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    price: 178.23,
    change: 2.45,
    volume: "52.3M",
    marketCap: "2.8T",
    history: [165, 168, 172, 169, 175, 178, 180, 177, 182, 178, 185, 183, 178],
  },
  {
    symbol: "GOOGL",
    name: "Alphabet Inc.",
    price: 142.87,
    change: -1.23,
    volume: "28.1M",
    marketCap: "1.8T",
    history: [155, 152, 148, 145, 150, 147, 143, 145, 142, 140, 138, 141, 143],
  },
  {
    symbol: "MSFT",
    name: "Microsoft Corp.",
    price: 412.56,
    change: 5.67,
    volume: "35.2M",
    marketCap: "3.1T",
    history: [380, 385, 390, 395, 398, 400, 405, 408, 410, 407, 415, 418, 413],
  },
  {
    symbol: "TSLA",
    name: "Tesla Inc.",
    price: 242.84,
    change: 8.92,
    volume: "112.5M",
    marketCap: "770B",
    history: [210, 215, 220, 218, 225, 230, 228, 235, 240, 238, 245, 248, 243],
  },
  {
    symbol: "AMZN",
    name: "Amazon.com Inc.",
    price: 178.35,
    change: -0.87,
    volume: "45.7M",
    marketCap: "1.9T",
    history: [185, 182, 180, 178, 175, 177, 180, 176, 178, 175, 179, 177, 178],
  },
  {
    symbol: "META",
    name: "Meta Platforms Inc.",
    price: 489.23,
    change: 12.34,
    volume: "32.1M",
    marketCap: "1.2T",
    history: [450, 455, 460, 465, 470, 475, 478, 482, 485, 487, 490, 495, 489],
  },
  {
    symbol: "NVDA",
    name: "NVIDIA Corp.",
    price: 875.28,
    change: 15.67,
    volume: "89.2M",
    marketCap: "2.2T",
    history: [750, 770, 790, 810, 825, 840, 855, 860, 870, 865, 880, 890, 875],
  },
  {
    symbol: "NFLX",
    name: "Netflix Inc.",
    price: 587.45,
    change: -3.21,
    volume: "18.5M",
    marketCap: "258B",
    history: [620, 615, 610, 605, 600, 595, 590, 595, 590, 585, 583, 585, 587],
  },
]

function StockTicker() {
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setOffset((prev) => (prev + 1) % 100)
    }, 50)
    return () => clearInterval(interval)
  }, [])

  const allStocks = [...stocks, ...stocks, ...stocks]

  return (
    <div
      className="overflow-hidden bg-card/50 backdrop-blur-sm border-y-2 border-primary/50 py-4 neon-border"
      style={{ borderColor: "rgba(255, 0, 255, 0.5)" }}
    >
      <div
        className="flex gap-8 whitespace-nowrap"
        style={{
          transform: `translateX(-${offset}%)`,
          transition: "transform 0.05s linear",
        }}
      >
        {allStocks.map((stock, idx) => {
          const isPositive = stock.change >= 0
          const changeColor = isPositive ? "text-secondary" : "text-primary"
          return (
            <div key={idx} className="flex items-center gap-3 px-4">
              <span className="font-bold text-primary neon-text">{stock.symbol}</span>
              <span className="text-secondary">${stock.price.toFixed(2)}</span>
              <span className={`${changeColor} font-bold`}>
                {isPositive ? "▲" : "▼"} {Math.abs(stock.change).toFixed(2)}%
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StockGraph({ data, isPositive }: { data: number[]; isPositive: boolean }) {
  const width = 300
  const height = 100
  const padding = 10

  const maxVal = Math.max(...data)
  const minVal = Math.min(...data)
  const range = maxVal - minVal || 1

  const points = data
    .map((value, index) => {
      const x = padding + (index / (data.length - 1)) * (width - padding * 2)
      const y = height - padding - ((value - minVal) / range) * (height - padding * 2)
      return `${x},${y}`
    })
    .join(" ")

  const strokeColor = isPositive ? "rgb(0, 255, 255)" : "rgb(255, 0, 255)"
  const glowColor = isPositive ? "rgba(0, 255, 255, 0.5)" : "rgba(255, 0, 255, 0.5)"

  return (
    <svg width={width} height={height} className="w-full h-full">
      <defs>
        <filter id={`glow-${isPositive ? "cyan" : "pink"}`}>
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <polyline
        points={points}
        fill="none"
        stroke={strokeColor}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#glow-${isPositive ? "cyan" : "pink"})`}
        style={{ filter: `drop-shadow(0 0 8px ${glowColor})` }}
      />
    </svg>
  )
}

function StockTile({ stock }: { stock: (typeof detailedStocks)[0] }) {
  const isPositive = stock.change >= 0
  const changeColor = isPositive ? "text-secondary neon-text" : "text-primary neon-text"

  return (
    <Card
      className="flex-shrink-0 w-80 transition-all hover:shadow-lg bg-card/80 backdrop-blur-sm border-2 border-primary/30 neon-border hover:scale-105"
      style={{ borderColor: "rgba(255, 0, 255, 0.3)" }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-2xl text-primary neon-text">{stock.symbol}</CardTitle>
            <CardDescription className="text-secondary/80">{stock.name}</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-foreground">${stock.price.toFixed(2)}</div>
            <div className={`text-sm font-bold ${changeColor}`}>
              {isPositive ? "▲" : "▼"} {Math.abs(stock.change).toFixed(2)}%
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-24 grid-bg rounded-lg p-2">
          <StockGraph data={stock.history} isPositive={isPositive} />
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Volume</div>
            <div className="font-medium text-accent">{stock.volume}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Market Cap</div>
            <div className="font-medium text-accent">{stock.marketCap}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function Page() {
  const [count, setCount] = useState(0)
  const [scrollY, setScrollY] = useState(0)
  const [prompt, setPrompt] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleAnalyze = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt")
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("http://localhost:8000/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      })

      if (!response.ok) {
        throw new Error("Analysis failed")
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background relative overflow-x-hidden">
      {/* Background grid effect */}
      <div className="vaporwave-grid" style={{ opacity: 0.3 }} />

      {/* Animated stars */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.3 + 0.1,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${Math.random() * 2 + 1}s`,
            }}
          />
        ))}
      </div>

      <div className="relative border-b-4 border-primary/50 bg-gradient-to-b from-purple-900/50 via-pink-900/30 to-transparent backdrop-blur-sm pb-24">
        <div className="container mx-auto px-4 py-16 relative z-20">
          <h1
            className="text-7xl font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 text-center classy-vaporwave"
            style={{
              WebkitTextStroke: "0.5px rgba(255,255,255,0.15)",
              textShadow: "0 0 3px rgba(255, 0, 255, 0.4), 0 2px 6px rgba(0, 0, 0, 0.3)",
            }}
          >
            sentiment
          </h1>
          <p className="text-secondary/90 mt-4 text-center text-xl tracking-widest" style={{ fontFamily: "monospace" }}>
            AI-Powered Stock Sentiment Analysis
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Search Card */}
          <Card
            className="bg-card/80 backdrop-blur-sm border-2 border-primary/30 neon-border"
            style={{ borderColor: "rgba(255, 0, 255, 0.3)" }}
          >
            <CardHeader>
              <CardTitle className="text-3xl text-primary neon-text" style={{ fontFamily: "monospace" }}>
                ═══ ANALYZE STOCKS ═══
              </CardTitle>
              <CardDescription className="text-secondary/80">
                Enter your query to get AI-powered sentiment analysis and stock recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Input
                  placeholder="e.g., What are the best tech stocks right now?"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !loading && handleAnalyze()}
                  className="border-primary/50 bg-background/50 text-foreground placeholder:text-muted-foreground flex-1"
                  disabled={loading}
                />
                <Button
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="bg-primary hover:bg-primary/80 text-primary-foreground neon-border font-bold px-8"
                  style={{ borderColor: "rgba(255, 0, 255, 0.8)" }}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    "ANALYZE"
                  )}
                </Button>
              </div>

              {error && (
                <div className="p-4 border-2 border-destructive bg-destructive/10 rounded-lg">
                  <p className="text-destructive font-medium">{error}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results Section */}
          {result && (
            <div className="space-y-6">
              {/* Brief Summary */}
              {result.brief && (
                <Card
                  className="bg-card/80 backdrop-blur-sm border-2 border-secondary/30 neon-border"
                  style={{ borderColor: "rgba(0, 255, 255, 0.3)" }}
                >
                  <CardHeader>
                    <CardTitle className="text-2xl text-secondary neon-text" style={{ fontFamily: "monospace" }}>
                      ═══ ANALYSIS BRIEF ═══
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground leading-relaxed">{result.brief}</p>
                    {result.audio_url && (
                      <div className="mt-4">
                        <audio controls className="w-full">
                          <source src={result.audio_url} type="audio/mpeg" />
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Rankings */}
              {result.ranked_data && (
                <Card
                  className="bg-card/80 backdrop-blur-sm border-2 border-accent/30 neon-border"
                  style={{ borderColor: "rgba(255, 105, 180, 0.3)" }}
                >
                  <CardHeader>
                    <CardTitle className="text-2xl text-accent neon-text" style={{ fontFamily: "monospace" }}>
                      ═══ STOCK RANKINGS ═══
                    </CardTitle>
                    <CardDescription className="text-secondary/80">
                      Overall Sentiment: {result.ranked_data.overall_sentiment}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {result.ranked_data.rankings.map((stock, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-4 border-2 border-primary/20 rounded-lg bg-background/50"
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className="text-3xl font-bold text-primary neon-text"
                              style={{ fontFamily: "monospace" }}
                            >
                              #{idx + 1}
                            </div>
                            <div>
                              <div className="text-xl font-bold text-foreground">{stock.stock}</div>
                              <div className="text-sm text-muted-foreground capitalize">{stock.sentiment}</div>
                            </div>
                          </div>
                          <div className="text-3xl font-bold text-secondary neon-text">{stock.score}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div
        className="border-t-2 border-primary/50 mt-16 py-8 text-center text-muted-foreground grid-bg"
        style={{ borderColor: "rgba(255, 0, 255, 0.5)" }}
      >
        <p className="text-secondary neon-text" style={{ fontFamily: "monospace" }}>
          ═══ SENTIMENT 2025 • AI STOCK ANALYSIS ═══
        </p>
      </div>
    </main>
  )
}
