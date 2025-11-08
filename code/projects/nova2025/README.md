# Nova 2025 Design System

A modern, hackathon-ready design system built with Next.js 16 and Tailwind CSS v4.

## Features

- 🎨 **OKLCH Color System** - Beautiful, perceptually uniform colors
- 🌓 **Dark Mode** - Automatic theme switching with perfect contrast
- ⚡ **Next.js 16** - Latest features including React 19 and Turbopack
- 🎯 **Type Safe** - Full TypeScript support
- 📦 **shadcn/ui** - Pre-configured component library
- 🚀 **Ready to Deploy** - Optimized for Vercel

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to see your app.

## Design Tokens

All design tokens are defined in `app/globals.css` using CSS custom properties. The color system uses OKLCH for consistent, accessible colors across light and dark themes.

## Project Structure

\`\`\`
projects/nova2025/
├── app/
│   ├── layout.tsx       # Root layout with fonts
│   ├── globals.css      # Design tokens and styles
│   └── page.tsx         # Home page
└── README.md            # Project documentation
\`\`\`

## Hackathon Tips

- All colors are theme-aware - use semantic tokens like `bg-background`, `text-foreground`
- Components from shadcn/ui are pre-installed in `/components/ui`
- Use the `cn()` utility from `/lib/utils.ts` for conditional classes

## Built With

- [Next.js 16](https://nextjs.org/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Geist Font](https://vercel.com/font)
