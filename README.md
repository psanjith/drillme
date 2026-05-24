# DrillMe — AI Interview & Speaking Coach

AI-powered interview prep and speaking coach. Practice with realistic AI panellists, get instant structured feedback, track your weaknesses cross-session, and improve your speaking with coach Alex.

**Total running cost: $0**

## Stack

- **Framework**: Next.js 14+ (App Router, fullstack)
- **AI**: Google Gemini 2.0 Flash (free — aistudio.google.com)
- **Database/Auth**: Supabase (free tier)
- **Voice**: Web Speech API (browser-native, free)
- **Styling**: Tailwind CSS
- **Deployment**: Cloudflare Pages (free tier)

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run the SQL in `data/schema.sql` in the SQL editor
3. Copy your project URL and anon key

### 2. Gemini API Key

Get a free API key at [aistudio.google.com](https://aistudio.google.com)

### 3. Environment Variables

```bash
cp .env.local.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, GEMINI_API_KEY
```

### 4. Seed Questions

```bash
npm run dev
# Visit: http://localhost:3000/api/seed?secret=your-secret-seed-key
```

### 5. Run Locally

```bash
npm run dev
```

## Cloudflare Pages Deployment

1. Push to GitHub
2. Connect repo in Cloudflare Pages dashboard
3. Build command: `npx @cloudflare/next-on-pages`
4. Output directory: `.vercel/output/static`
5. Set environment variables in Pages dashboard → Settings → Environment Variables
6. Enable `nodejs_compat` compatibility flag

## Features

- **Interview Setup**: Paste a JD or quick configure. Gemini extracts company, role, and requirements.
- **Interview Room**: 3 AI panellists with distinct voices and personas. Real-time voice input, silent background evaluation, follow-up questions, help system.
- **Debrief**: Per-question scoring (4 dimensions), specific feedback, optimal frameworks.
- **Weakness Tracking**: Cross-session weakness profile with severity scores and trends.
- **Drill Mode**: Targeted 10-15 minute sessions attacking your highest-severity weaknesses.
- **Speaking Practice**: 5 session types with coach Alex. Filler word detection, annotated transcripts, clarity/structure scoring.
- **Dashboard**: Readiness score over time, weakness heatmap, AI focus recommendations.

## Question Bank

150+ manually curated questions tagged by company, role level, topic, and frequency:
- 40 behavioural (conflict, leadership, failure, communication)
- 40 DSA (arrays, strings, trees, graphs, DP, sorting)
- 30 system design (URL shortener, rate limiter, news feed, etc.)
- 20 technical (databases, APIs, OOP, networking, security)
- 20 company & motivation
