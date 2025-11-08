"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

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

  return (
    <div className="overflow-hidden bg-card border-y border-border py-3">
      <div
        className="flex gap-8 whitespace-nowrap"
        style={{
          transform: `translateX(-${offset}%)`,
          transition: "transform 0.05s linear",
        }}
      >
        {[...stocks, ...stocks, ...stocks].map((stock, idx) => (
          <div key={idx} className="flex items-center gap-3 px-4">
            <span className="font-bold text-foreground">{stock.symbol}</span>
            <span className="text-muted-foreground">${stock.price.toFixed(2)}</span>
            <span className={stock.change >= 0 ? "text-green-600" : "text-red-600"}>
              {stock.change >= 0 ? "+" : ""}
              {stock.change.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function StockGraph({ data, color }: { data: number[]; color: string }) {
  const width = 300
  const height = 100
  const padding = 10

  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1

  const points = data
    .map((value, index) => {
      const x = padding + (index / (data.length - 1)) * (width - padding * 2)
      const y = height - padding - ((value - min) / range) * (height - padding * 2)
      return `${x},${y}`
    })
    .join(" ")

  return (
    <svg width={width} height={height} className="w-full h-full">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={points.split(" ").pop()?.split(",")[0]}
        cy={points.split(" ").pop()?.split(",")[1]}
        r="3"
        fill={color}
      />
    </svg>
  )
}

function StockTile({ stock }: { stock: (typeof detailedStocks)[0] }) {
  return (
    <Card className="flex-shrink-0 w-80 transition-all hover:shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-2xl">{stock.symbol}</CardTitle>
            <CardDescription>{stock.name}</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-foreground">${stock.price.toFixed(2)}</div>
            <div className={`text-sm font-medium ${stock.change >= 0 ? "text-green-600" : "text-red-600"}`}>
              {stock.change >= 0 ? "+" : ""}
              {stock.change.toFixed(2)}%
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-24">
          <StockGraph data={stock.history} color={stock.change >= 0 ? "#16a34a" : "#dc2626"} />
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Volume</div>
            <div className="font-medium text-foreground">{stock.volume}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Market Cap</div>
            <div className="font-medium text-foreground">{stock.marketCap}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function Page() {
  const [count, setCount] = useState(0)

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Nova 2025</h1>
          <p className="text-muted-foreground mt-1">A Modern Design System</p>
        </div>
      </div>

      {/* Stock Ticker */}
      <StockTicker />

      <div className="border-y border-border bg-card py-6">
        <div className="container mx-auto px-4">
          <h3 className="text-2xl font-bold text-foreground mb-4">Live Stock Tracker</h3>
        </div>
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-6 px-4 pb-4">
            {detailedStocks.map((stock) => (
              <StockTile key={stock.symbol} stock={stock} />
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Hero Section */}
          <section className="text-center space-y-4 py-8">
            <h2 className="text-5xl font-bold tracking-tight text-foreground">Build Faster, Ship Better</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              A comprehensive design system built with Next.js 16, Tailwind CSS v4, and shadcn/ui. Perfect for
              hackathons and rapid prototyping.
            </p>
            <div className="flex gap-4 justify-center pt-4">
              <Button size="lg">Get Started</Button>
              <Button size="lg" variant="outline">
                View Docs
              </Button>
            </div>
          </section>

          <section className="space-y-6">
            <div>
              <h3 className="text-3xl font-bold text-foreground">Stock Tracker</h3>
              <p className="text-muted-foreground mt-1">Drag tiles to rearrange and track multiple stocks visually</p>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {detailedStocks.map((stock) => (
                <StockTile key={stock.symbol} stock={stock} />
              ))}
            </div>
          </section>

          {/* Components Grid */}
          <section className="space-y-6">
            <h3 className="text-3xl font-bold text-foreground">Components</h3>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Buttons</CardTitle>
                  <CardDescription>Multiple variants and sizes</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Button>Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="destructive">Destructive</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Interactive Counter</CardTitle>
                  <CardDescription>State management demo</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-4xl font-bold text-center text-foreground">{count}</div>
                  <div className="flex gap-2">
                    <Button onClick={() => setCount(count - 1)} variant="outline" className="flex-1">
                      -
                    </Button>
                    <Button onClick={() => setCount(count + 1)} className="flex-1">
                      +
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Forms</CardTitle>
                  <CardDescription>Input components</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Input placeholder="Email address" type="email" />
                  <Input placeholder="Password" type="password" />
                  <Button className="w-full">Submit</Button>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Color System */}
          <section className="space-y-6">
            <h3 className="text-3xl font-bold text-foreground">Color System</h3>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <div className="h-24 rounded-lg bg-background border border-border"></div>
                <p className="text-sm font-medium text-foreground">Background</p>
              </div>
              <div className="space-y-2">
                <div className="h-24 rounded-lg bg-primary"></div>
                <p className="text-sm font-medium text-foreground">Primary</p>
              </div>
              <div className="space-y-2">
                <div className="h-24 rounded-lg bg-secondary"></div>
                <p className="text-sm font-medium text-foreground">Secondary</p>
              </div>
              <div className="space-y-2">
                <div className="h-24 rounded-lg bg-accent"></div>
                <p className="text-sm font-medium text-foreground">Accent</p>
              </div>
            </div>
          </section>

          {/* Typography */}
          <section className="space-y-6">
            <h3 className="text-3xl font-bold text-foreground">Typography</h3>
            <Card>
              <CardContent className="pt-6 space-y-4">
                <h1 className="text-4xl font-bold text-foreground">Heading 1</h1>
                <h2 className="text-3xl font-bold text-foreground">Heading 2</h2>
                <h3 className="text-2xl font-bold text-foreground">Heading 3</h3>
                <p className="text-lg text-foreground leading-relaxed">
                  Body text with proper line height and spacing for optimal readability.
                </p>
                <p className="text-sm text-muted-foreground">Small text for captions and metadata</p>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </main>
  )
}
