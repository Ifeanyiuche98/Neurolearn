# NeuroLearn — Web3 Learning Focus Tracker

**Live App:** https://neurolearn-sooty.vercel.app/

NeuroLearn is a biosignal-powered learning companion built for the Web3 generation. Using your device's webcam and Elata's rPPG technology, NeuroLearn tracks your heart rate in real-time and interprets your focus state — helping you understand how your body responds while you learn blockchain and crypto concepts.

Built on the Elata Biosciences platform. Registered on Elata testnet (AppId: 146 · Symbol: NEUROLEARN).

---

## What NeuroLearn Does

- Tracks heart rate and focus state in real-time via webcam — no wearable hardware required
- Guides users through structured Web3 learning modules (lessons → flashcards → quiz)
- Generates a **Quiz Score** and biometric **Focus Score** at the end of every module
- Records total study session duration
- All processing happens on-device — no data is sent to external servers

---

## Learning Modules

| Module | Lessons | Flashcards | Quiz Questions |
|---|---|---|---|
| ⛓️ Blockchain Basics | 3 | 5 | 5 |
| 🔐 Wallets & Security | 3 | 5 | 5 |
| 🏦 DeFi Fundamentals | 3 | 5 | 5 |
| 🎨 NFTs & Tokens | 3 | 5 | 5 |

---

## Focus States

| State | BPM Range | Meaning |
|---|---|---|
| 😌 Very Calm | Below 65 BPM | Deeply relaxed — ideal for absorbing complex information |
| 🎯 Focused | 65–80 BPM | Optimal learning zone — keep going! |
| ⚡ Elevated | 80–95 BPM | Slightly heightened — take a breath and continue |
| 🔥 Stressed | Above 95 BPM | High stress detected — consider a short break |

---

## Session Results

At the end of every module, NeuroLearn delivers:
- **Quiz Score** — percentage of correct answers with instant feedback
- **Focus Score** — biometric score (0–100) based on average heart rate during the session
- **Total Study Time** — full session duration tracked from module start to quiz completion

---

## Tech Stack

- **Frontend:** React + TypeScript (Vite)
- **Biometrics:** Elata rPPG SDK (`@elata-biosciences/rppg-web`)
- **Deployment:** Vercel
- **Platform:** Elata Biosciences (docs.elata.bio)

---

## Requirements

- A modern browser with camera access (Chrome recommended)
- Permission to use the camera
- Good frontal lighting for accurate rPPG readings
- `npm` to install dependencies

---

## Run It Locally

```bash
git clone https://github.com/Ifeanyiuche98/Neurolearn.git
cd Neurolearn/my-app
npm install
npm run dev
```

Then open `http://localhost:5173` in your browser.

---

## How rPPG Works

NeuroLearn reads your pulse through subtle changes in facial skin tone captured by your webcam — the same principle used in medical photoplethysmography (PPG), adapted for standard cameras. No wearable device or EEG headset needed.

Powered by `createRppgSession()` from the `@elata-biosciences/rppg-web` SDK, using WASM-based processing entirely in the browser.

---

## Version History

| Version | Description |
|---|---|
| v2.0.0 | Added 4 Web3 learning modules with lessons, flashcards, quiz, Focus Score, and Quiz Score |
| v1.0.0 | Initial release — real-time rPPG heart rate and focus state tracking |

---

## Built By

**Ifeanyi Raymond Uche** — Web3 builder and educator, Nigeria.
Co-founder, African First Network (AFN).
Trust Squad Member, Trust Wallet Nigeria.

---

*Powered by [Elata Biosciences](https://docs.elata.bio) rPPG technology.*
