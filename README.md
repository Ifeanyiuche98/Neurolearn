NeuroLearn v3  ⚡
Biosignal-Powered Web3 Learning — Built on Elata Biosciences Platform
Live App:  https://neurolearn-sooty.vercel.app
GitHub:  https://github.com/Ifeanyiuche98/Neurolearn
Platform:  Elata Biosciences  —  App ID 146  —  Token: NEUROLEARN

What Is NeuroLearn?
NeuroLearn is the world's first biosignal-powered Web3 learning app. It uses real-time heart rate tracking through your webcam (rPPG — remote photoplethysmography) to monitor your focus while you study Web3 topics. No wearable device is needed.
The app is built on the Elata Biosciences platform and integrates a full gamification layer: daily streaks, timed quizzes, XP rewards, combo multipliers, a tier-based access system, Supabase leaderboards, and a token ecosystem built around ELTA — the Elata native token.
It is designed primarily for African learners — particularly Nigeria — where Web3 education infrastructure lags far behind adoption, and where biosignal-aware, incentive-driven learning has the highest potential impact.

Learning Modules (6 Total)
Each module flows: Lesson → Flashcards → Timed Quiz → Results

Icon	Module	Lessons	Flashcards	Quiz Qs	Tier
⛓️	Blockchain Basics	6	8	8	Free
🔐	Wallets & Security	6	8	8	Scholar
🏦	DeFi Fundamentals	6	8	8	Expert
🎨	NFTs & Tokens	6	8	8	Expert
📈	Trading, Careers & Life in Web3	6	8	8	Pro
🤖	AI x Crypto: The New Frontier	6	8	8	Pro

Total content: 36 lessons  ·  48 flashcards  ·  48 quiz questions across 6 modules
All lesson content was sourced from AfroLearn Institute PDFs and updated for 2025–2026 accuracy including Bitcoin ATH corrections, Ethereum post-Merge terminology, FTX/Binance events, BNB Chain renaming, and five completely new modules.

Full Feature Set (v3)
Onboarding System
•	5-slide onboarding screen (Onboarding.tsx) with smooth animation
•	useOnboarding hook with localStorage persistence — shown once per device
•	Slides cover: Welcome, How It Works (6 modules updated), ELTA Token, Camera Access, Ready

Biosignal Integration — Elata rPPG
NeuroLearn is built on the @elata-biosciences/rppg-web WebAssembly engine. Heart rate is read directly from webcam video without any wearable hardware.

Signal	What It Measures
BPM (Heart Rate)	Real-time beats per minute via facial colour changes detected by webcam
Focus Score	Derived from average BPM across the full learning session (0–100)
Signal Quality	Confidence of the rPPG reading — displayed as a live percentage meter
Confidence	Detection reliability score — improves as face fills the camera frame

Focus States:
•	Very Calm (BPM < 65) — Exceptional absorption state — Score: 98
•	Focused (BPM 65–79) — Optimal learning zone — Score: 90
•	Elevated (BPM 80–94) — Take a breath, continue — Score: 62–78
•	Stressed (BPM 95+) — Consider a short break — Score: 45

Gamification Layer
Daily Return Engine
•	Daily streak counter tracks consecutive learning days
•	XP multiplier: 1.0x base + 0.1x per streak day, capped at 2.5x
•	Streak Freeze Tokens protect your streak on missed days
•	Comeback Bonus: +50 XP when returning after a break
•	Milestone rewards: bonus XP at 3, 7, 14, 30, and 100-day streaks
•	StreakBar component always visible on the home screen


Timed Quiz Engine
•	20-second countdown timer per question with animated SVG circular indicator
•	Speed bonus XP: faster correct answers earn more points (0–50 bonus)
•	Combo multiplier: consecutive correct answers stack XP (up to +200 bonus)
•	Auto-advance on timeout: correct answer revealed, combo resets
•	Live XP pop displayed after every answer
•	Urgent/warning visual states when time is running low

Results Screen
•	Quiz Score (percentage + correct/total)
•	Focus Score with colour coding and average BPM
•	XP earned this session with streak multiplier applied
•	Pending ELTA token display
•	Lifetime XP tracker
•	Study time (session duration)
•	Links to leaderboard

Tier System
Modules are progressively unlocked using ELTA tokens. The tier system uses a spend-to-unlock model directed by Elata co-founder Andreas Melhede.

Tier	Cost	Modules Unlocked	Description
Free	0 ELTA	Module 1	Start your Web3 journey
Scholar	100 ELTA	Modules 1–2	Build real blockchain literacy
Expert	250 ELTA	Modules 1–4	Go deep into DeFi and beyond
Pro ☆	500 ELTA	All 6 Modules	Full access. Full focus. Full leaderboard.

Tier costs are placeholders pending Elata mainnet tokenomics confirmation. TierGate.tsx blocks access and guides users to spend tokens to unlock.

Token System (ELTA)
•	Token name: NeuroLearn Token (ELTA) — Beta/Simulated
•	XP-to-token conversion: 500 XP = 1 ELTA (configurable)
•	Token balance, pending XP, and claimable tokens tracked in TokenWallet component
•	Spend-to-unlock model: tokens burned to access higher tiers
•	On-chain redemption activates when Elata mainnet launches

App ID:  146
Token Symbol:  NEUROLEARN
Token Contract:  0x3c02fbab968542f5aeda45ed90075cb970590ede
Ownership Wallet:  0xa65ec2f67349c8c06912cbf7b2fb9e2cf54a0b58
Target Chain:  EVM-compatible (Ethereum + L2s, confirmed at Elata launch)

Leaderboard (Supabase)
•	Global leaderboard via Supabase — entries stored with moduleTitle, quizScore, focusScore, XP, streak
•	Username system: UsernamePrompt.tsx collects username once, stored in Supabase and localStorage
•	Leaderboard.tsx renders sorted sessions with module icons, scores, and XP
•	Personal session history tracked locally

BPM Cheat Detection
•	useBpmGuard hook monitors rolling BPM variance and signal dropout
•	Suspicious sessions logged to Supabase suspicious_sessions table
•	Silent-fail behaviour — never interrupts the learner
•	Logs: username, country, device type, session seconds, module, quiz score, suspicion level, average confidence, average quality

PWA Configuration
•	manifest.json with NeuroLearn branding and icon set
•	sw.js service worker for offline capability
•	Service worker registration confirmed working on Android Chrome
•	Mobile-first biosignal pulse theme: dark background, teal radial glow
•	Fonts: Syne (display), DM Sans (body), JetBrains Mono (monospace)
•	Floating BPM pill indicator on mobile

Language Feature (Archived)
A full language selection and translation system was built and tested but removed after the Google Translate free API proved unreliable in Nigeria (blocked by network providers). The code is archived in src/ for future reactivation.
•	LanguageSelect.tsx — 13-language picker (English, French, German, Hausa, Portuguese, Swahili, Mandarin, Armenian, Igbo, Yoruba, Arabic, Spanish, Hindi)
•	useTranslation.ts — hooks for translating lesson content, flashcards, and quiz questions on demand
•	Session-level translation cache — each string translated only once per session
•	Fallback to English on any API error — never breaks the lesson
Planned reactivation: Google Cloud Translation API with a proper API key, or LibreTranslate (open source). Browser built-in translation (Chrome, Comet) works as interim solution.

Architecture

File / Folder	Purpose
App.tsx	Main app — all 6 modules, all screens, rPPG wiring, tier gating
Onboarding.tsx	5-slide onboarding with useOnboarding hook and localStorage gate
useStreak.ts	Streak brain — XP, multiplier, freeze tokens, milestones (localStorage)
useQuizTimer.ts	Quiz engine — countdown, speed XP, combo tracker
useTokens.ts	ELTA token wallet — balance, pending XP, claimable tokens
useTiers.ts	Sequential unlock logic — canAccessModule(), spend-to-unlock model
useBpmGuard.ts	Cheat detection — rolling variance + dropout logging to Supabase
useLeaderboard.ts	Leaderboard state management — entries, sorting, totalSessions
useUsername.ts	Supabase username system — prompt once, persist globally
StreakBar.tsx	Always-visible streak strip on home screen
TokenWallet.tsx	ELTA balance display with XP pending and claimable state
TierGate.tsx	Locked module UI — shows cost and spend-to-unlock button
BpmIndicator.tsx	Live BPM display, focus state, confidence and quality meters
Leaderboard.tsx	Global leaderboard screen with module icons and scores
Analytics.tsx	Hidden analytics dashboard (5-tap logo access)
UsernamePrompt.tsx	First-time username collection overlay
LanguageSelect.tsx	ARCHIVED — 13-language picker (reactivation-ready)
useTranslation.ts	ARCHIVED — translation hooks (reactivation-ready)
lib/logSuspiciousSession.ts	Supabase logger for BPM guard alerts
hooks/useBpmGuard.ts	BPM anomaly detection hook
manifest.json + sw.js	PWA configuration — offline support, Android Chrome confirmed



Tech Stack

Layer	Technology
Frontend	React + TypeScript
Build Tool	Vite
Biosignal Engine	@elata-biosciences/rppg-web (WebAssembly)
State	React hooks + localStorage
Database	Supabase (leaderboard + suspicious session logging)
Deployment	Vercel — https://neurolearn-sooty.vercel.app

Node Version	Node v25.8.0
Token Chain	EVM-compatible (Ethereum + L2s, confirmed at Elata launch)

XP Formula
Question XP  =  Base XP (100)  +  Speed Bonus (0–50)  +  Combo Bonus (combo × 25, max 200)
Session XP   =  Sum of all question XP
Lifetime XP  =  Session XP × Streak Multiplier (1.0 + streak × 0.1, capped at 2.5×)
ELTA Tokens  =  Lifetime XP ÷ 500  (configurable, pending mainnet tokenomics)

Getting Started
Prerequisites
•	Node.js 18+ (tested on v25.8.0)
•	A device with a webcam
•	Modern browser (Chrome recommended for best rPPG performance)
•	Good lighting — face the light and fill the camera frame for accurate BPM

Installation
git clone https://github.com/Ifeanyiuche98/Neurolearn.git
cd neurolearn/my-app
npm install
npm run dev
Open http://localhost:5173 in your browser. Camera permission is required for the rPPG focus tracking.

Build for Production
npm run build
Output goes to the dist/ folder. Deploy to Vercel by pushing to GitHub — Vercel auto-deploys on every commit.

First-Time User Flow
1.	Language picker (archived — defaults to English)
2.	5-slide onboarding
3.	Camera permission request
4.	Username prompt (stored in Supabase)
5.	Home screen — Module 1 unlocked, Modules 2–6 locked by tier
Tip: To reset the app as a new user, open DevTools → Console and run: localStorage.clear()  then hard refresh (Ctrl+Shift+R).

Roadmap
✅ v1 — Foundation
•	rPPG heart rate tracking via webcam
•	4 Web3 learning modules (lesson + flashcard + quiz)
•	Focus Score from BPM data

✅ v2 — Polish
•	Dual results screen (Quiz Score + Focus Score)
•	Improved UI and module navigation
•	BPM warm-up and signal quality indicators

✅ v3 Phase 1 — Gamification
•	Daily streak system with XP multiplier
•	Timed quiz engine with speed bonus + combo multiplier
•	StreakBar UI component
•	XP tracking (session + lifetime)
•	Token-ready architecture

✅ v3 Phase 2 — Token Rewards + Leaderboard
•	Simulated ELTA token rewards for quiz completions
•	XP-to-token conversion logic
•	Global leaderboard via Supabase
•	Username system (Supabase + localStorage)
•	Tier system with spend-to-unlock model (useTiers.ts + TierGate.tsx)
•	BPM cheat detection (useBpmGuard.ts + Supabase logging)
•	PWA configuration (manifest.json + sw.js)
•	5-slide onboarding with useOnboarding hook
•	6 full modules (36 lessons, 48 flashcards, 48 quiz questions)
•	Language feature built and archived (LanguageSelect.tsx + useTranslation.ts)

🔮 v3 Phase 3 — BPM Intelligence Layer (Planned)
•	BPM pattern logger per quiz session
•	Anomaly detection: spike = guessing vs. calm = knowledge
•	Suspicion score (0–10 scale) improvements
•	Session export schema (CSV/JSON) for Elata research dataset
•	GLADYS AI integration endpoint
•	Proper translation API (Google Cloud or LibreTranslate) reactivation

Elata Biosciences Platform
NeuroLearn is a registered application on the Elata Biosciences testnet. Elata provides the rPPG WebAssembly engine that makes biosignal-based focus tracking possible in the browser without any hardware.

On-chain App ID:  146
Token Symbol:  NEUROLEARN
Token Contract:  0x3c02fbab968542f5aeda45ed90075cb970590ede
Ownership Wallet:  0xa65ec2f67349c8c06912cbf7b2fb9e2cf54a0b58
Contributor Split:  0x98bd9420e82a2ed7e7c85845120bb7c52ef81704

The ELTA token is not yet live on mainnet. The simulated reward system will connect directly to the on-chain contract when Elata launches by updating a single config variable in useTokens.ts.

Why NeuroLearn Matters for Africa
Web3 adoption in Africa is accelerating — but education infrastructure has not kept up. Most crypto education is passive: read an article, watch a video, forget it by morning.
NeuroLearn combines three things no other platform does together:
•	Biosignal feedback — learners see their own focus state in real time, making the learning experience self-aware
•	Gamified retention — streaks, timers, combos, and tier unlocks create the habit loop that keeps people coming back
•	Web3-native incentives — ELTA token rewards align learning with real value, not just certificates
For Nigerian learners specifically, the curriculum addresses local realities: naira-denominated examples, Bitget/Bybit P2P as Binance alternatives, FIRS crypto tax guidance, the Trust Wallet community context, and the African First Network DePIN vision.

Acknowledgements
•	Andreas Melhede — Elata Biosciences Co-founder. Directed the spend-to-unlock token model and requested the onboarding experience.
•	Andrew — Elata Discord head mod. Emphasized mobile-first UX and community feedback that shaped the gamification layer.
•	Elata Biosciences — For the rPPG WebAssembly platform that makes focus tracking possible without any wearable hardware.
•	AfroLearn Institute — Source PDFs for all 6 module content updates, updated for 2025–2026 accuracy.

Built By
Ifeanyi Raymond Uche
•	Web3 Builder, Educator, and Systems Thinker — Port Harcourt, Nigeria
•	Trust Squad Member — Trust Wallet community education and safety
•	Tutor and Content Creator — AfroLearn Institute
•	GitHub: https://github.com/Ifeanyiuche98

License
Proprietary Software — All Rights Reserved
Copyright © 2026 Ifeanyi Raymond Uche. All rights reserved.

This software, including all source code, module content, curriculum materials, UI components, gamification logic, token architecture, and associated documentation files (collectively, the “Software”), is the exclusive proprietary property of Ifeanyi Raymond Uche.

You May
•	Access and use the live application at https://neurolearn-sooty.vercel.app for personal learning purposes
•	Reference this repository for educational understanding of the architecture
•	Fork the repository solely for the purpose of submitting pull requests or bug reports to the original author

You May Not
•	Copy, reproduce, or redistribute any part of this codebase in any form without explicit written permission from the author
•	Use the source code, module content, curriculum materials, or any derivative of them to build a competing product or service
•	Sell, sublicense, or commercially exploit any part of this Software
•	Remove or alter any copyright, attribution, or license notices from any part of the Software
•	Deploy a modified or unmodified version of this application under a different name or brand without written consent

Third-Party Components
The following third-party components are used under their respective open-source licenses and are not covered by this proprietary license:
•	Elata Biosciences rPPG SDK (@elata-biosciences/rppg-web) — MIT License © Elata Biosciences. All biosignal processing, WebAssembly engine, and rPPG technology remain the intellectual property of Elata Biosciences.
•	React, TypeScript, Vite — MIT License
•	Supabase client library — Apache 2.0 License

No Warranty
This Software is provided "as is", without warranty of any kind, express or implied. The author accepts no liability for any damages arising from the use of this Software.

Contact
For licensing inquiries, collaboration requests, or permission to use any part of this Software, contact the author through the GitHub repository: https://github.com/Ifeanyiuche98/Neurolearn


NeuroLearn v3  ·  Powered by Elata rPPG  ·  Built for Africa 🇳🇬
Clarity over complexity. Utility over hype. Long-term vision over short-term gains.
