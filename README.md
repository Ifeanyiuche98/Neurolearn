# NeuroLearn v3 ⚡

> **Biosignal-Powered Web3 Learning — Built on the Elata Biosciences Platform**

[![Live App](https://img.shields.io/badge/Live%20App-neurolearn--sooty.vercel.app-teal)](https://neurolearn-sooty.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-Ifeanyiuche98%2FNeurolearn-181717?logo=github)](https://github.com/Ifeanyiuche98/Neurolearn)
[![Platform](https://img.shields.io/badge/Platform-Elata%20Biosciences-6B4C9A)](https://elata.bio)
[![App ID](https://img.shields.io/badge/App%20ID-146-blue)]()
[![PWA](https://img.shields.io/badge/PWA-Android%20Chrome-green)]()

---

## Table of Contents

- [Overview](#overview)
- [What Is NeuroLearn?](#what-is-neurolearn)
- [Learning Modules](#learning-modules)
- [Features](#features)
  - [Onboarding System](#onboarding-system)
  - [Biosignal Integration](#biosignal-integration)
  - [Gamification Layer](#gamification-layer)
  - [Progress-Based Unlocking](#progress-based-unlocking)
  - [Leaderboard](#leaderboard)
  - [BPM Cheat Detection](#bpm-cheat-detection)
  - [PWA Configuration](#pwa-configuration)
  - [Language Feature (Archived)](#language-feature-archived)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [XP Formula](#xp-formula)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Build for Production](#build-for-production)
  - [First-Time User Flow](#first-time-user-flow)
- [Roadmap](#roadmap)
- [Elata Biosciences Platform](#elata-biosciences-platform)
- [Why NeuroLearn Matters for Africa](#why-neurolearn-matters-for-africa)
- [Acknowledgements](#acknowledgements)
- [Built By](#built-by)
- [License](#license)

---

## Overview

| | |
|:---|:---|
| **Live App** | [neurolearn-sooty.vercel.app](https://neurolearn-sooty.vercel.app) |
| **GitHub** | [github.com/Ifeanyiuche98/Neurolearn](https://github.com/Ifeanyiuche98/Neurolearn) |
| **Platform** | Elata Biosciences |
| **App ID** | 146 (Elata testnet) |
| **Unlock Model** | Progress-based — complete a quiz to unlock the next module |
| **Deployment** | Vercel — auto-deploys on every GitHub push |

---

## What Is NeuroLearn?

NeuroLearn is the world's first **biosignal-powered Web3 learning app**. It uses real-time heart rate tracking through your webcam (**rPPG — remote photoplethysmography**) to monitor your focus while you study Web3 topics. **No wearable device is needed.**

The app is built on the **Elata Biosciences platform** and integrates a full gamification layer: daily streaks, timed quizzes, XP rewards, combo multipliers, a progress-based module unlock system, and Supabase leaderboards.

Modules unlock sequentially as you complete each quiz — no tokens, no paywalls, no friction. The focus is entirely on learning.

It is designed primarily for **African learners** — particularly **Nigeria** — where Web3 education infrastructure lags far behind adoption, and where biosignal-aware, incentive-driven learning has the highest potential impact.

---

## Learning Modules

Each module follows this structure: **Lesson → Flashcards → Timed Quiz → Results**

| Icon | Module | Lessons | Flashcards | Quiz Qs | Unlock Condition |
|:---:|:---|:---:|:---:|:---:|:---|
| ⛓️ | Blockchain Basics | 6 | 8 | 8 | Always available |
| 🔐 | Wallets & Security | 6 | 8 | 8 | Complete Module 1 quiz |
| 🏦 | DeFi Fundamentals | 6 | 8 | 8 | Complete Module 2 quiz |
| 🎨 | NFTs & Tokens | 6 | 8 | 8 | Complete Module 3 quiz |
| 📈 | Trading, Careers & Life in Web3 | 6 | 8 | 8 | Complete Module 4 quiz |
| 🤖 | AI x Crypto: The New Frontier | 6 | 8 | 8 | Complete Module 5 quiz |

**Total Content:** 36 lessons · 48 flashcards · 48 quiz questions across 6 modules

> All lesson content was sourced from AfroLearn Institute PDFs and updated for 2025–2026 accuracy, including Bitcoin ATH corrections, Ethereum post-Merge terminology, FTX/Binance events, BNB Chain renaming, and five completely new modules.

---

## Features

### Onboarding System

- **5-slide onboarding screen** (`Onboarding.tsx`) with smooth animation
- `useOnboarding` hook with `localStorage` persistence — shown once per device
- Slides cover: Welcome, How It Works, Progress Unlocking, Camera Access, Ready

---

### Biosignal Integration

NeuroLearn is built on the `@elata-biosciences/rppg-web` WebAssembly engine. Heart rate is read directly from webcam video without any wearable hardware.

| Signal | What It Measures |
|:---|:---|
| **BPM (Heart Rate)** | Real-time beats per minute via facial colour changes detected by webcam |
| **Focus Score** | Derived from average BPM across the full learning session (0–100) |
| **Signal Quality** | Confidence of the rPPG reading — displayed as a live percentage meter |
| **Confidence** | Detection reliability score — improves as face fills the camera frame |

#### Focus States

| State | BPM Range | Description | Score |
|:---|:---:|:---|:---:|
| 🧘 Very Calm | < 65 | Exceptional absorption state | 98 |
| 🎯 Focused | 65–79 | Optimal learning zone | 90 |
| ⚡ Elevated | 80–94 | Take a breath, continue | 62–78 |
| 🔥 Stressed | 95+ | Consider a short break | 45 |

---

### Gamification Layer

#### Daily Return Engine

| Feature | Description |
|:---|:---|
| **Daily Streak** | Tracks consecutive learning days |
| **XP Multiplier** | 1.0× base + 0.1× per streak day, capped at 2.5× |
| **Streak Freeze Tokens** | Protect your streak on missed days |
| **Comeback Bonus** | +50 XP when returning after a break |
| **Milestone Rewards** | Bonus XP at 3, 7, 14, 30, and 100-day streaks |
| **StreakBar** | Always-visible streak strip on the home screen |

#### Timed Quiz Engine

- ⏱️ **20-second countdown timer** per question with animated SVG circular indicator
- 🚀 **Speed bonus XP**: faster correct answers earn more points (0–50 bonus)
- 🔥 **Combo multiplier**: consecutive correct answers stack XP (up to +200 bonus)
- ⏭️ **Auto-advance on timeout**: correct answer revealed, combo resets
- 💫 **Live XP pop** displayed after every answer
- ⚠️ **Urgent/warning visual states** when time is running low

#### Results Screen

- Quiz Score (percentage + correct/total)
- Focus Score with colour coding and average BPM
- XP earned this session with streak multiplier applied
- Lifetime XP tracker
- Study time (session duration)
- Link to leaderboard

---

### Progress-Based Unlocking

> **Updated June 2026** — The previous ELTA token spend-to-unlock model has been removed per direct feedback from Andreas Melhede (Elata co-founder). Module access is now earned through learning, not token spend.

Modules unlock sequentially as you complete each module's quiz. Progress is stored in `localStorage` via the `useProgress` hook — no backend, no wallet, no friction.

| Module | Unlocks When |
|:---|:---|
| Module 1 — Blockchain Basics | Always available |
| Module 2 — Wallets & Security | Module 1 quiz completed |
| Module 3 — DeFi Fundamentals | Module 2 quiz completed |
| Module 4 — NFTs & Tokens | Module 3 quiz completed |
| Module 5 — Trading, Careers & Life in Web3 | Module 4 quiz completed |
| Module 6 — AI x Crypto: The New Frontier | Module 5 quiz completed |

When a locked module is accessed, `TierGatedScreen.tsx` shows the specific prerequisite required — no token prompts, no dead ends.

**Files removed as part of this change:**
- `useTokens.ts` — XP-to-token conversion and ELTA wallet state
- `useTiers.ts` — spend-to-unlock tier logic
- `TokenWallet.tsx` — ELTA balance display component
- `TierGate.tsx` — token payment gate UI

**File added:**
- `hooks/useProgress.ts` — localStorage progress tracker with sequential unlock rules

---

### Leaderboard (Supabase)

- **Global leaderboard** via Supabase — entries stored with `moduleTitle`, `quizScore`, `focusScore`, `XP`, `streak`
- **Username system**: `UsernamePrompt.tsx` collects username once, stored in Supabase and `localStorage`
- **Leaderboard.tsx** renders sorted sessions with module icons, scores, and XP
- **Personal session history** tracked locally

---

### BPM Cheat Detection

- `useBpmGuard` hook monitors rolling BPM variance and signal dropout
- Suspicious sessions logged to Supabase `suspicious_sessions` table
- **Silent-fail behaviour** — never interrupts the learner
- Logs: username, country, device type, session seconds, module, quiz score, suspicion level, average confidence, average quality
- **60-second dedupe window** prevents log flooding per user

---

### PWA Configuration

- `manifest.json` with NeuroLearn branding and icon set
- `sw.js` service worker for offline capability
- Service worker registration confirmed working on Android Chrome
- **Mobile-first biosignal pulse theme**: dark background, teal radial glow
- **Fonts**: Syne (display), DM Sans (body), JetBrains Mono (monospace)
- Floating BPM pill indicator on mobile

---

### Language Feature (Archived)

A full language selection and translation system was built and tested but removed after the Google Translate free API proved unreliable in Nigeria (blocked by network providers). The code is archived in `src/` for future reactivation.

- `LanguageSelect.tsx` — 13-language picker (English, French, German, Hausa, Portuguese, Swahili, Mandarin, Armenian, Igbo, Yoruba, Arabic, Spanish, Hindi)
- `useTranslation.ts` — hooks for translating lesson content, flashcards, and quiz questions on demand
- Session-level translation cache — each string translated only once per session
- Fallback to English on any API error — never breaks the lesson

> **Planned reactivation**: Google Cloud Translation API with a proper API key, or LibreTranslate (open source). Browser built-in translation (Chrome) works as an interim solution.

---

## Architecture

| File / Folder | Type | Purpose |
|:---|:---:|:---|
| `App.tsx` | Root | Main router — maps `currentScreen` state to screen components, wires rPPG, session control, and navigation |
| `screens/HomeScreen.tsx` | Screen | Module grid with progress bar, lock/unlock states, leaderboard CTA |
| `screens/LessonScreen.tsx` | Screen | Lesson reader with BPM overlay and lesson pagination |
| `screens/FlashcardScreen.tsx` | Screen | Flip-card flashcard deck per module |
| `screens/QuizScreen.tsx` | Screen | Timed quiz engine — 20s countdown, speed XP, combo multiplier |
| `screens/ResultsScreen.tsx` | Screen | Post-quiz results: score, XP, focus score, study time, leaderboard CTA |
| `screens/TierGatedScreen.tsx` | Screen | Progress lock screen — shows prerequisite module, no token gate |
| `Onboarding.tsx` | Component | 5-slide onboarding with `useOnboarding` hook and `localStorage` gate |
| `StreakBar.tsx` | Component | Always-visible streak strip showing streak, XP, multiplier, freezes |
| `BpmIndicator.tsx` | Component | Live BPM display, focus state label, confidence and quality meters |
| `Leaderboard.tsx` | Component | Global leaderboard screen with module icons, scores, and XP |
| `Analytics.tsx` | Component | Hidden analytics dashboard (5-tap logo easter egg) |
| `UsernamePrompt.tsx` | Component | First-time username collection overlay |
| `LanguageSelect.tsx` | Component | **ARCHIVED** — 13-language picker (reactivation-ready) |
| `hooks/useProgress.ts` | Hook | Progress-based module unlock — `localStorage`, sequential rules |
| `useStreak.ts` | Hook | Streak brain — XP, multiplier, freeze tokens, milestones |
| `useQuizTimer.ts` | Hook | Quiz engine — countdown, speed XP, combo tracker |
| `hooks/useBpmGuard.ts` | Hook | BPM anomaly detection — rolling variance + dropout |
| `useLeaderboard.ts` | Hook | Leaderboard state management — entries, sorting, `totalSessions` |
| `useUsername.ts` | Hook | Supabase username system — prompt once, persist globally |
| `useTranslation.ts` | Hook | **ARCHIVED** — translation hooks (reactivation-ready) |
| `lib/logSuspiciousSession.ts` | Util | Supabase logger for BPM guard alerts with 60s dedupe |
| `manifest.json` + `sw.js` | PWA | PWA config — offline support, Android Chrome confirmed |

---

## Tech Stack

| Layer | Technology |
|:---|:---|
| **Frontend** | React 18 + TypeScript |
| **Build Tool** | Vite |
| **Biosignal Engine** | `@elata-biosciences/rppg-web` (WebAssembly) |
| **State** | React hooks + `localStorage` |
| **Database** | Supabase (leaderboard + suspicious session logging) |
| **Deployment** | Vercel — auto-deploys on GitHub push |
| **Node Version** | Node v18+ (tested on v25.8.0) |

---

## XP Formula

```
Question XP  =  Base XP (100)  +  Speed Bonus (0–50)  +  Combo Bonus (combo × 25, max 200)

Session XP   =  Sum of all question XP

Lifetime XP  =  Session XP × Streak Multiplier (1.0 + streak × 0.1, capped at 2.5×)
```

XP is purely a learning incentive. There is no token conversion — XP tracks progress and feeds the leaderboard.

---

## Getting Started

### Prerequisites

- Node.js 18+ (tested on v25.8.0)
- A device with a **webcam**
- Modern browser (**Chrome recommended** for best rPPG performance)
- Good lighting — face the light and fill the camera frame for accurate BPM

### Installation

```bash
git clone https://github.com/Ifeanyiuche98/Neurolearn.git
cd neurolearn/my-app
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser. Camera permission is required for the rPPG focus tracking.

### Build for Production

```bash
npm run build
```

Output goes to the `dist/` folder. Deploy to Vercel by pushing to GitHub — Vercel auto-deploys on every commit.

### First-Time User Flow

1. **5-slide onboarding** (shown once, `localStorage`-gated)
2. **Camera permission request**
3. **Username prompt** (stored in Supabase)
4. **Home screen** — Module 1 available, Modules 2–6 locked until earned

> 💡 **Tip:** To reset the app as a new user, open DevTools → Console and run:
> ```javascript
> localStorage.clear()
> ```
> Then hard refresh (`Ctrl` + `Shift` + `R`).

---

## Roadmap

### ✅ v1 — Foundation

- [x] rPPG heart rate tracking via webcam
- [x] 4 Web3 learning modules (lesson + flashcard + quiz)
- [x] Focus Score from BPM data

### ✅ v2 — Polish

- [x] Dual results screen (Quiz Score + Focus Score)
- [x] Improved UI and module navigation
- [x] BPM warm-up and signal quality indicators

### ✅ v3 Phase 1 — Gamification

- [x] Daily streak system with XP multiplier
- [x] Timed quiz engine with speed bonus + combo multiplier
- [x] StreakBar UI component
- [x] XP tracking (session + lifetime)

### ✅ v3 Phase 2 — Leaderboard & Full Curriculum

- [x] Global leaderboard via Supabase
- [x] Username system (Supabase + `localStorage`)
- [x] BPM cheat detection (`useBpmGuard.ts` + Supabase logging)
- [x] PWA configuration (`manifest.json` + `sw.js`)
- [x] 5-slide onboarding with `useOnboarding` hook
- [x] 6 full modules (36 lessons, 48 flashcards, 48 quiz questions)
- [x] Language feature built and archived (`LanguageSelect.tsx` + `useTranslation.ts`)

### ✅ v3 Phase 3 — Token Removal & Progress Unlocking

- [x] Removed ELTA token wallet, tier gate, and spend-to-unlock model
- [x] Removed `useTokens.ts`, `useTiers.ts`, `TokenWallet.tsx`, `TierGate.tsx`
- [x] Added `useProgress.ts` — sequential progress-based module unlocking
- [x] Updated `HomeScreen.tsx` — progress bar, per-module lock/unlock state
- [x] Updated `TierGatedScreen.tsx` — prerequisite guidance, no payment gate
- [x] Updated `ResultsScreen.tsx` — removed ELTA pending/balance display
- [x] Improved topbar font readability (BPM pill, status chip)
- [x] App.tsx wires `markCompleted` on every quiz finish

### 🔮 v3 Phase 4 — Intelligence & Export (Planned)

- [ ] Session export CSV for Elata research dataset submission
- [ ] GLADYS AI integration endpoint (token risk analysis)
- [ ] Shareable result badge (social share card post-quiz)
- [ ] Push notification hook (daily streak reminder)
- [ ] On-chain wallet connect (Elata ecosystem — pending mainnet)
- [ ] Supabase real authentication (replace username-only with email/OAuth)
- [ ] Translation API reactivation (Google Cloud or LibreTranslate)

---

## Elata Biosciences Platform

NeuroLearn is a registered application on the **Elata Biosciences testnet**. Elata provides the rPPG WebAssembly engine that makes biosignal-based focus tracking possible in the browser without any hardware.

| Property | Value |
|:---|:---|
| **On-chain App ID** | 146 |
| **SDK** | `@elata-biosciences/rppg-web` (MIT License) |
| **Backend** | WebAssembly — runs entirely in-browser, no server required |
| **Token Integration** | Pending Elata mainnet launch — no active token dependency |

> NeuroLearn uses the Elata rPPG SDK under its MIT license. All biosignal processing and WebAssembly engine technology remain the intellectual property of Elata Biosciences.

---

## Why NeuroLearn Matters for Africa

Web3 adoption in Africa is accelerating — but education infrastructure has not kept up. Most crypto education is passive: read an article, watch a video, forget it by morning.

NeuroLearn combines three things no other platform does together:

1. 🧠 **Biosignal feedback** — learners see their own focus state in real time, making the learning experience self-aware
2. 🎮 **Gamified retention** — streaks, timers, combos, and progress unlocks create the habit loop that keeps people coming back
3. 📚 **Locally relevant content** — ELTA naira P2P alternatives, Nigerian regulatory context, Trust Wallet community, real career path framing

For Nigerian learners specifically, the curriculum addresses local realities: Bitget/Bybit P2P as current Binance P2P alternatives, FIRS crypto tax guidance, Superteam Nigeria, MetaMask meetups, and an honest framing of Web3 income expectations — content no generic global platform provides.

---

## Acknowledgements

| Contributor | Role | Contribution |
|:---|:---|:---|
| **Andreas Melhede** | Elata Biosciences Co-founder | Reviewed the app, directed removal of the token system, guided focus toward learning-first incentives |
| **Andrew** | Elata Discord Head Mod | Emphasized mobile-first UX and community feedback that shaped the gamification layer |
| **Elata Biosciences** | Platform Provider | rPPG WebAssembly platform that makes biosignal focus tracking possible without wearable hardware |
| **AfroLearn Institute** | Content Partner | Source PDFs for all 6 module content updates, updated for 2025–2026 accuracy |

---

## Built By

**Ifeanyi Raymond Uche**

- 🏗️ Web3 Builder, Educator, and Systems Thinker — Port Harcourt, Nigeria
- 🛡️ Trust Squad Member — Trust Wallet community education and safety
- 🎓 Tutor and Content Creator — AfroLearn Institute
- 💻 GitHub: [github.com/Ifeanyiuche98](https://github.com/Ifeanyiuche98)

---

## License

### Proprietary Software — All Rights Reserved

Copyright © 2026 Ifeanyi Raymond Uche. All rights reserved.

This software, including all source code, module content, curriculum materials, UI components, gamification logic, and associated documentation files (collectively, the "Software"), is the exclusive proprietary property of Ifeanyi Raymond Uche.

#### You May

- ✅ Access and use the live application at [neurolearn-sooty.vercel.app](https://neurolearn-sooty.vercel.app) for personal learning purposes
- ✅ Reference this repository for educational understanding of the architecture
- ✅ Fork the repository solely for the purpose of submitting pull requests or bug reports to the original author

#### You May Not

- ❌ Copy, reproduce, or redistribute any part of this codebase in any form without explicit written permission from the author
- ❌ Use the source code, module content, curriculum materials, or any derivative of them to build a competing product or service
- ❌ Sell, sublicense, or commercially exploit any part of this Software
- ❌ Remove or alter any copyright, attribution, or license notices from any part of the Software
- ❌ Deploy a modified or unmodified version of this application under a different name or brand without written consent

#### Third-Party Components

The following third-party components are used under their respective open-source licenses and are not covered by this proprietary license:

| Component | License |
|:---|:---|
| Elata Biosciences rPPG SDK (`@elata-biosciences/rppg-web`) | MIT License © Elata Biosciences |
| React, TypeScript, Vite | MIT License |
| Supabase client library | Apache 2.0 License |

> All biosignal processing, WebAssembly engine, and rPPG technology remain the intellectual property of Elata Biosciences.

#### No Warranty

This Software is provided "as is", without warranty of any kind, express or implied. The author accepts no liability for any damages arising from the use of this Software.

#### Contact

For licensing inquiries, collaboration requests, or permission to use any part of this Software, contact the author through the GitHub repository: [github.com/Ifeanyiuche98/Neurolearn](https://github.com/Ifeanyiuche98/Neurolearn)

---

<p align="center">
  <strong>NeuroLearn v3 · Powered by Elata rPPG · Built for Everyone </strong><br>
  <em>Clarity over complexity. Utility over hype. Long-term vision over short-term gains.</em>
</p>