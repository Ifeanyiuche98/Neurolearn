# NeuroLearn v3 🧠⚡

> **Biosignal-Powered Web3 Learning — Built on Elata Biosciences Platform**

NeuroLearn is a Web3 education app that uses real-time heart rate tracking (rPPG via webcam) to monitor your focus while you learn. v3 introduces a full gamification layer — daily streaks, timed quizzes, combo multipliers, XP rewards, and a token-ready architecture.

**Live App:** [https://neurolearn-sooty.vercel.app](https://neurolearn-sooty.vercel.app)

---

## 🚀 What's New in v3

### 🔁 Daily Return Engine
Never lose your learning habit. The streak system tracks consecutive daily visits and rewards consistency.

- 🔥 **Daily streak counter** — tracks consecutive learning days
- ⚡ **XP multiplier** — 10% bonus per streak day, up to 2.5x
- ❄️ **Streak Freeze Tokens** — protect your streak if you miss a day
- 💪 **Comeback Bonus** — +50 XP when you return after a break
- 🏆 **Milestone rewards** — bonus XP at 3, 7, 14, 30, and 100-day streaks
- 📊 **StreakBar UI** — always-visible strip on the home screen

### 🎮 Gamified Quiz Engine
Every question now has tension, urgency, and reward.

- ⏱ **20-second countdown timer** per question
- 🚀 **Speed bonus XP** — faster correct answers earn more points
- 🔗 **Combo multiplier** — consecutive correct answers stack XP (up to +200 bonus)
- ❌ **Auto-advance on timeout** — correct answer revealed, combo resets
- 📈 **Live XP pop** — see exactly what you earned after every answer
- 🎯 **Post-quiz performance card** — XP earned, streak multiplier, lifetime total

### 📊 Results Screen Upgrade
- Session XP earned with streak multiplier applied
- Lifetime XP tracker
- Streak label on results (e.g. "1 day streak", "🔥 7 day streak")
- All existing v2 scores retained (Quiz Score + Focus Score + BPM)

---

## 📚 Learning Modules

| Module | Lessons | Flashcards | Quiz Questions |
|---|---|---|---|
| ⛓️ Blockchain Basics | 3 | 5 | 5 |
| 🔐 Wallets & Security | 3 | 5 | 5 |
| 🏦 DeFi Fundamentals | 3 | 5 | 5 |
| 🎨 NFTs & Tokens | 3 | 5 | 5 |

Each module flows: **Lesson → Flashcards → Timed Quiz → Results**

---

## 🧬 Biosignal Integration

NeuroLearn is built on the **Elata Biosciences rPPG platform** — a WebAssembly-powered remote photoplethysmography engine that reads heart rate through your webcam in real time. No wearable required.

| Signal | What it measures |
|---|---|
| BPM (Heart Rate) | Real-time beats per minute via facial colour changes |
| Focus Score | Derived from average BPM across the learning session |
| Signal Quality | Confidence of the rPPG reading |
| Confidence | Detection reliability score |

**Focus States:**
- 🟢 Very Calm (BPM < 65) — Exceptional absorption state
- 🔵 Focused (BPM 65–79) — Optimal learning zone
- 🟠 Elevated (BPM 80–94) — Take a breath, continue
- 🔴 Stressed (BPM 95+) — Consider a short break

---

## 🏗️ Architecture

```
src/
├── App.tsx              # Main app — all screens + rPPG wiring
├── useStreak.ts         # Streak brain — XP, multiplier, freeze tokens (localStorage)
├── useQuizTimer.ts      # Quiz engine — countdown, speed XP, combo tracker
├── StreakBar.tsx         # Streak UI strip — home screen header component
├── main.tsx             # App entry point
├── styles.css           # Global styles
└── vite-env.d.ts        # Vite type definitions
```

### State & Persistence
- All streak and XP data persists in **localStorage** — survives refresh and browser close
- No backend required for Phase 1
- Quiz timer state is session-only (React state)

### XP Formula
```
Question XP = Base XP (100) + Speed Bonus (0–50) + Combo Bonus (combo × 25, max 200)
Session XP  = Sum of all question XP
Lifetime XP = Session XP × Streak Multiplier (1.0 + streak × 0.1, max 2.5x)
```

---

## 🗺️ Roadmap

### ✅ v1 — Foundation
- rPPG heart rate tracking via webcam
- 4 Web3 learning modules (lesson + flashcard + quiz)
- Focus Score from BPM data

### ✅ v2 — Polish
- Dual results screen (Quiz Score + Focus Score)
- Improved UI and module navigation
- BPM warm-up and signal quality indicators

### ✅ v3 Phase 1 — Gamification
- Daily streak system with XP multiplier
- Timed quiz engine with speed bonus + combo multiplier
- StreakBar UI component
- XP tracking (session + lifetime)
- Token-ready architecture (config hooks in place)

### ✅ v3 Phase 2 — Token Rewards + Leaderboard (Current)
- Simulated ELT token rewards for quiz completions
- XP-to-token conversion logic
- Global leaderboard (all-time + weekly reset)
- Personal rank tracker
- Wallet connect scaffold (chain-agnostic, EVM-ready)
- Personal session leaderboard (localStorage — global multi-user leaderboard via Supabase coming post-launch)

### 🔮 v3 Phase 3 — BPM Intelligence Layer
- BPM pattern logger per quiz session
- Anomaly detection (spike = guessing vs. calm = knowledge)
- Suspicion score (0–10 scale)
- Session export schema (CSV/JSON) for Elata research dataset
- GLADYS AI integration endpoint

---

## 🔑 Token Architecture (Beta)

NeuroLearn has a token deployed within the Elata ecosystem (currently in beta). When the Elata platform goes live, the simulated reward system will connect directly to the on-chain contract.

```
Ownership Wallet:     0xa65ec2f67349c8c06912cbf7b2fb9e2cf54a0b58
Contributor Split:    0x98bd9420e82a2ed7e7c85845120bb7c52ef81704
Token Contract:       0x3c02fbab968542f5aeda45ed90075cb970590ede
On-chain App ID:      144
Target Chain:         EVM-compatible (Ethereum + L2s, to be confirmed at launch)
```

> The token is not yet live. The architecture is designed to swap from simulated balances to on-chain rewards by updating a single config variable when Elata goes live.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript |
| Build tool | Vite |
| Biosignal engine | `@elata-biosciences/rppg-web` (WASM) |
| State | React hooks + localStorage |
| Deployment | Vercel |
| Wallet (future) | wagmi / ethers.js (EVM chain-agnostic) |

---

## ⚙️ Getting Started

### Prerequisites
- Node.js 18+
- A device with a webcam
- Modern browser (Chrome recommended for best rPPG performance)

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/neurolearn.git

# Navigate into the project
cd neurolearn/my-app

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

> **Camera permission required.** NeuroLearn needs webcam access for the rPPG focus tracking. Allow camera access when prompted.

### Build for Production

```bash
npm run build
```

Output goes to the `dist/` folder. Deploy to Vercel, Netlify, or any static host.

---

## 🌍 Why NeuroLearn Matters for Africa

Web3 adoption in Africa is accelerating — but education infrastructure hasn't kept up. Most crypto education is passive: read an article, watch a video, forget it by morning.

NeuroLearn combines three things no other platform does together:

1. **Biosignal feedback** — you can see your own focus state in real time, making learning self-aware
2. **Gamified retention** — streaks, timers, and combos create the habit loop that keeps people coming back
3. **Web3-native incentives** — token rewards align learning with real value, not just certificates

Built by **Ifeanyi Raymond Uche**, Co-founder of [African First Network (AFN)](https://github.com/Ifeanyiuche98) — a decentralized infrastructure initiative building community-owned wireless networks and tokenized ecosystems for African communities.

---

## 🤝 Acknowledgements

- **Andreas Melhede** — Elata Biosciences Co-founder. Feedback: *"Focus on daily return mechanics."* → Built the entire streak engine.
- **Andrew** — Community feedback: *"Gamify the quiz with timers, add token rewards, build a leaderboard."* → Built the timed quiz engine + XP system.
- **Elata Biosciences** — For the rPPG WebAssembly platform that makes focus tracking possible without any wearable hardware.

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

**NeuroLearn v3 · Powered by Elata rPPG · Built for Africa 🇳🇬**

*Clarity over complexity. Utility over hype. Long-term vision over short-term gains.*

</div>
