import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import {
  createRppgSession,
  type Metrics,
  type RppgSession,
  type RppgSessionDiagnostics,
} from '@elata-biosciences/rppg-web';
import rppgWasmJsUrl from '@elata-biosciences/rppg-web/pkg/rppg_wasm.js?url';
import rppgWasmBinaryUrl from '@elata-biosciences/rppg-web/pkg/rppg_wasm_bg.wasm?url';

// ── v3 imports ────────────────────────────────────────────────────────────────
import { useStreak }      from './useStreak';
import { useQuizTimer }   from './useQuizTimer';
import { useTokens }      from './useTokens';
import { useLeaderboard } from './useLeaderboard';
import StreakBar           from './StreakBar';
import TokenWallet         from './TokenWallet';
import Leaderboard         from './Leaderboard';
import Analytics           from './Analytics';
import BpmIndicator        from './BpmIndicator';
import Onboarding, { useOnboarding } from './Onboarding'; // ── LINE 1 added

// ─── Types ────────────────────────────────────────────────────────────────────

type Screen = 'home' | 'lesson' | 'flashcard' | 'quiz' | 'results' | 'leaderboard' | 'analytics';

interface FlashCard { front: string; back: string; }
interface QuizQuestion { question: string; options: string[]; correct: number; }
interface LearningModule {
  id: string; title: string; description: string;
  color: string; icon: string;
  lesson: { title: string; content: string }[];
  flashcards: FlashCard[];
  quiz: QuizQuestion[];
}

// ─── Module Content ───────────────────────────────────────────────────────────

const MODULES: LearningModule[] = [
  {
    id: 'blockchain', title: 'Blockchain Basics',
    description: 'Understand what blockchain is and how it works from the ground up.',
    color: '#3d9eff', icon: '⛓️',
    lesson: [
      { title: 'What is a Blockchain?', content: `A blockchain is a special type of database that stores information in "blocks" that are chained together. Unlike a normal database controlled by one company, a blockchain is shared across thousands of computers worldwide — making it nearly impossible to hack or manipulate.\n\nEach block contains:\n• A list of transactions or data\n• A timestamp of when it was created\n• A unique fingerprint (called a "hash") of the previous block\n\nThis chaining of fingerprints is what makes blockchain so powerful. If someone tries to change an old block, its fingerprint changes — breaking the chain and alerting the entire network.` },
      { title: 'How Does Consensus Work?', content: `Since no single person controls a blockchain, how does the network agree on what is true? This is done through "consensus mechanisms" — rules that all participants follow.\n\nThe two most common are:\n\nProof of Work (PoW) — Used by Bitcoin. Miners compete to solve complex math puzzles. The winner adds the next block and earns a reward. This requires a lot of computing power.\n\nProof of Stake (PoS) — Used by Ethereum. Validators lock up crypto as collateral. They are chosen to validate blocks based on their stake. Far more energy-efficient than PoW.\n\nBoth methods make it extremely expensive to cheat the network.` },
      { title: 'Why Does Blockchain Matter?', content: `Blockchain solves a problem called the "double-spend problem" — how do you stop someone from sending the same digital money to two people at once?\n\nBefore Bitcoin, you needed a bank to verify transactions. Blockchain removes that middleman. This has massive implications:\n\nFinance — Send money anywhere in the world without a bank, instantly and cheaply.\n\nHealthcare — Store medical records that only you can authorize access to.\n\nVoting — Create tamper-proof voting systems.\n\nAfrica specifically — Blockchain can provide financial services to millions of unbanked people who have a smartphone but no bank account.` },
    ],
    flashcards: [
      { front: 'What is a Block?', back: 'A container that holds a batch of verified transactions, a timestamp, and a hash linking it to the previous block.' },
      { front: 'What is a Hash?', back: 'A unique digital fingerprint of data. If any data changes, the hash changes completely — making tampering immediately detectable.' },
      { front: 'What is Decentralization?', back: 'No single person or company controls the network. Thousands of computers (nodes) share and verify the same data.' },
      { front: 'What is Proof of Work?', back: 'A consensus method where miners solve math puzzles to earn the right to add a new block. Used by Bitcoin.' },
      { front: 'What is a Node?', back: 'Any computer that participates in a blockchain network by storing a full copy of the chain and validating transactions.' },
    ],
    quiz: [
      { question: 'What makes it nearly impossible to change old data on a blockchain?', options: ['A central server protects it', 'Each block contains the fingerprint of the previous block', 'Blocks are encrypted with passwords', 'Government regulations protect it'], correct: 1 },
      { question: 'What problem did Bitcoin originally solve?', options: ['Slow internet speeds', 'The double-spend problem', 'Password theft', 'Identity fraud'], correct: 1 },
      { question: 'Which consensus method does Ethereum currently use?', options: ['Proof of Work', 'Proof of Authority', 'Proof of Stake', 'Proof of History'], correct: 2 },
      { question: 'What is a node?', options: ['A type of cryptocurrency', 'A computer that participates in the blockchain network', 'A transaction fee', 'A type of wallet'], correct: 1 },
      { question: 'Which of these is TRUE about blockchain?', options: ['It is controlled by one company', 'Only banks can use it', 'It is shared across thousands of computers', 'It only works with the internet, not computers'], correct: 2 },
    ],
  },
  {
    id: 'wallets', title: 'Wallets & Security',
    description: 'Learn how crypto wallets work and how to keep your assets safe.',
    color: '#a855f7', icon: '🔐',
    lesson: [
      { title: 'What is a Crypto Wallet?', content: `A crypto wallet does NOT store your crypto. Your crypto lives on the blockchain. What a wallet stores is your private key — a secret code that proves you own the crypto at a specific address.\n\nThink of it like this:\n• Your wallet address = your bank account number (public, shareable)\n• Your private key = your PIN (secret, never share!)\n\nThere are two main types:\n\nHot Wallets — Connected to the internet (e.g. Trust Wallet, MetaMask). Convenient for daily use but slightly more vulnerable.\n\nCold Wallets — Offline hardware devices (e.g. Ledger). Most secure for storing large amounts long-term.` },
      { title: 'Seed Phrases — Your Master Key', content: `When you create a wallet, you are given a seed phrase — 12 or 24 random words in a specific order. This is the MOST important thing in crypto.\n\nYour seed phrase can:\n• Restore your wallet on any device if your phone is lost\n• Give full access to ALL wallets in that account\n\nNever:\n• Screenshot your seed phrase\n• Store it in cloud storage (Google Drive, iCloud, email)\n• Share it with ANYONE — not even "support staff"\n• Type it into any website\n\nWrite it on paper. Store it in a safe place. Some people use fireproof, waterproof metal backups.` },
      { title: 'Common Scams and How to Avoid Them', content: `Most crypto losses come not from hacking, but from social engineering — tricking people into giving away their keys.\n\nSeed phrase scams — Fake support agents ask for your seed phrase to "verify" your wallet. Legitimate services NEVER ask for this.\n\nFake websites — Scammers create exact copies of MetaMask, Trust Wallet, and exchanges. Always verify the URL carefully before connecting.\n\nSend X get 2X back — No legitimate person doubles your money. These are always scams, even if the account looks like a celebrity.\n\nRug pulls — New tokens launch with hype, founders collect investor money, then disappear. Research the team before investing.\n\nRule of thumb: If it sounds too good to be true, it is.` },
    ],
    flashcards: [
      { front: 'What does a crypto wallet actually store?', back: 'Your private key — not your crypto itself. The crypto lives on the blockchain.' },
      { front: 'What is a seed phrase?', back: '12 or 24 words that can fully restore your wallet. Must be kept secret and stored offline.' },
      { front: 'What is a hot wallet?', back: 'A wallet connected to the internet, like Trust Wallet or MetaMask. Convenient but less secure than cold storage.' },
      { front: 'What is a private key?', back: 'A secret code that proves ownership of your crypto address. Never share it with anyone, ever.' },
      { front: 'What is a rug pull?', back: 'A scam where developers hype a project, collect investor funds, then abandon it and disappear with the money.' },
    ],
    quiz: [
      { question: 'What does your crypto wallet actually store?', options: ['Your cryptocurrency coins', 'Your private key', 'Your transaction history', 'Your identity documents'], correct: 1 },
      { question: 'Where should you store your seed phrase?', options: ['In Google Drive for easy access', 'Screenshot on your phone', 'Written on paper in a safe place', 'In your email drafts'], correct: 2 },
      { question: 'What type of wallet is most secure for large amounts?', options: ['Hot wallet', 'Mobile wallet', 'Cold wallet (hardware)', 'Exchange wallet'], correct: 2 },
      { question: 'A support agent asks for your seed phrase to fix your wallet. What do you do?', options: ['Provide it — they need it to help', 'Only give the first 6 words', 'Refuse — legitimate support never asks for this', 'Send it via encrypted message'], correct: 2 },
      { question: 'What is a rug pull?', options: ['A type of hardware wallet', 'When developers abandon a project and steal investor funds', 'A network upgrade gone wrong', 'A government crypto ban'], correct: 1 },
    ],
  },
  {
    id: 'defi', title: 'DeFi Fundamentals',
    description: 'Explore decentralized finance — banking without banks.',
    color: '#00e5cc', icon: '🏦',
    lesson: [
      { title: 'What is DeFi?', content: `DeFi stands for Decentralized Finance. It is a system of financial services — lending, borrowing, trading, earning interest — that runs on blockchain instead of banks.\n\nTraditional Finance:\n• You need a bank account (millions in Africa do not have one)\n• Banks set the interest rates and can change them anytime\n• Banks can freeze your account\n• Banks are closed on weekends and holidays\n\nDeFi:\n• Anyone with a smartphone and internet can access it\n• Smart contracts set the rules automatically and transparently\n• No one can freeze your funds\n• Available 24/7, 365 days a year\n\nDeFi is particularly powerful for Africa, where mobile penetration is high but banking access remains low.` },
      { title: 'Smart Contracts and Liquidity Pools', content: `Smart contracts are self-executing programs on the blockchain. When conditions are met, they execute automatically — no lawyer, bank, or middleman needed.\n\nExample: IF Person A sends 1 ETH AND Person B sends $3000 USDC to this contract, THEN automatically swap them. This happens instantly, transparently, and without a broker.\n\nLiquidity Pools are how DeFi exchanges work:\n• Users deposit token pairs (e.g. ETH + USDC) into a pool\n• Traders swap against this pool instead of matching with another buyer/seller\n• Liquidity providers earn a share of every trading fee\n\nThis replaces the traditional order book model used by stock exchanges.` },
      { title: 'Yield, Risk and Opportunities', content: `DeFi offers ways to earn passive income with your crypto:\n\nLending — Deposit crypto, earn interest when others borrow it (e.g. Aave, Compound).\n\nYield Farming — Provide liquidity and earn token rewards on top of trading fees. High rewards, higher risk.\n\nStaking — Lock up tokens to help secure a network and earn rewards (e.g. staking ETH on Ethereum).\n\nDeFi Risks to know:\n• Smart contract bugs — Code errors can be exploited by attackers\n• Impermanent loss — Liquidity providers can lose value vs just holding\n• Rug pulls — Fake DeFi projects steal funds\n• High gas fees — Some blockchain transactions can be expensive\n\nAlways start small. Never invest more than you can afford to lose.` },
    ],
    flashcards: [
      { front: 'What does DeFi stand for?', back: 'Decentralized Finance — financial services built on blockchain that operate without banks or other traditional intermediaries.' },
      { front: 'What is a smart contract?', back: 'A self-executing program on the blockchain that automatically enforces agreed-upon rules when predefined conditions are met.' },
      { front: 'What is a liquidity pool?', back: 'A pool of token pairs deposited by users that enables decentralized trading. Depositors earn a share of trading fees.' },
      { front: 'What is yield farming?', back: 'Providing liquidity to DeFi protocols in exchange for token rewards. High potential returns but also comes with higher risk.' },
      { front: 'What is impermanent loss?', back: 'A potential loss for liquidity providers when the price ratio of their deposited tokens changes significantly after deposit.' },
    ],
    quiz: [
      { question: 'What makes DeFi different from traditional banking?', options: ['It requires a credit score', 'It runs on blockchain with no central authority', 'It is only available in wealthy countries', 'Banks control it behind the scenes'], correct: 1 },
      { question: 'What is a smart contract?', options: ['A legal document stored online', 'A self-executing program that runs on blockchain', 'A government-regulated financial agreement', 'An encrypted email contract'], correct: 1 },
      { question: 'How do liquidity providers earn money in DeFi?', options: ['They earn salaries from the protocol team', 'They earn a share of trading fees', 'They earn by reporting scams', 'They earn government subsidies'], correct: 1 },
      { question: 'Which of these is a real DeFi risk?', options: ['Internet connection fees', 'Smart contract bugs being exploited', 'Government bailouts', 'Market opening hours'], correct: 1 },
      { question: 'Why is DeFi especially valuable in Africa?', options: ['African governments fully support it', 'It provides financial access to people without bank accounts', 'It is cheaper to mine crypto in Africa', 'African banks invented DeFi'], correct: 1 },
    ],
  },
  {
    id: 'nfts', title: 'NFTs & Tokens',
    description: 'Understand digital ownership, token types, and real-world use cases.',
    color: '#f59e0b', icon: '🎨',
    lesson: [
      { title: 'What is an NFT?', content: `NFT stands for Non-Fungible Token. "Fungible" means interchangeable — one dollar is equal to any other dollar. "Non-fungible" means unique — no two are the same.\n\nAn NFT is a token on the blockchain that proves ownership of a unique digital or physical item.\n\nWhat can be an NFT?\n• Digital art\n• Music\n• In-game items\n• Certificates and diplomas\n• Property deeds\n• Event tickets\n\nKey insight: NFTs solve the problem of digital ownership. Before NFTs, anyone could copy a digital file. NFTs do not prevent copying — but they create a verifiable, immutable proof of who owns the original.` },
      { title: 'Token Standards and Types', content: `Tokens are digital assets issued on a blockchain. There are different standards with different rules:\n\nERC-20 — The most common standard. Fungible tokens used for currencies, governance, and utility (e.g. USDC, UNI, LINK).\n\nERC-721 — The NFT standard. Each token is unique and non-interchangeable. Used for art, collectibles, and digital identity.\n\nERC-1155 — Multi-token standard. A single contract can issue both fungible and non-fungible tokens. Perfect for gaming.\n\nBeyond Ethereum:\n• Solana uses SPL tokens\n• BNB Chain uses BEP-20\n• Each blockchain has its own standards, but the concepts are the same` },
      { title: 'Real-World Use Cases for NFTs', content: `Beyond digital art, NFTs have practical applications that matter for everyday life:\n\nEducation credentials — Your university degree as an NFT. Employers verify it instantly on the blockchain. No more fake certificates.\n\nMedical records — Your health history as an NFT that only you can authorize access to.\n\nDigital identity — A self-sovereign identity NFT that proves who you are without a government ID.\n\nTicketing — NFT event tickets that cannot be faked or scalped unfairly.\n\nLand registry in Africa — Many African countries have unreliable land records. NFT-based land deeds could prevent fraud and corruption permanently.\n\nThe hype cycle around JPEG NFTs will pass — but the underlying technology and its utility will remain.` },
    ],
    flashcards: [
      { front: 'What does NFT stand for?', back: 'Non-Fungible Token — a unique digital token on the blockchain that proves ownership of a specific item.' },
      { front: 'What is ERC-20?', back: 'An Ethereum token standard for fungible tokens — interchangeable units used for currencies, governance, and utility.' },
      { front: 'What is ERC-721?', back: 'The Ethereum standard for NFTs. Each token is unique and cannot be exchanged 1:1 with any other token.' },
      { front: 'What problem do NFTs solve?', back: 'Digital ownership. They create a verifiable, immutable record of who owns the original version of a digital asset.' },
      { front: 'What is ERC-1155?', back: 'A multi-token standard allowing one contract to manage both fungible and non-fungible tokens — ideal for gaming and complex apps.' },
    ],
    quiz: [
      { question: 'What does "non-fungible" mean?', options: ['Cannot be traded', 'Unique and not interchangeable with another token', 'Stored offline', 'Backed by gold'], correct: 1 },
      { question: 'Which token standard is used for NFTs on Ethereum?', options: ['ERC-20', 'BEP-20', 'ERC-721', 'SPL'], correct: 2 },
      { question: 'What real-world problem could NFTs help solve in Africa?', options: ['Slow mobile data', 'Unreliable land registry and fake certificates', 'Lack of smartphones', 'Power outages'], correct: 1 },
      { question: 'What does ERC-20 represent?', options: ['A unique digital collectible', 'A fungible token standard for currencies and utility', 'A hardware wallet type', 'A DeFi protocol'], correct: 1 },
      { question: 'What does an NFT actually prove?', options: ['That you created the original file', 'Ownership of the original version of a digital asset', 'That no copies of the file exist', 'The current market value of the asset'], correct: 1 },
    ],
  },
];

// ─── Helper Functions ─────────────────────────────────────────────────────────

const EMPTY_METRICS: Metrics = { bpm: null, confidence: 0, signal_quality: 0 };

function formatMetric(value: number | null | undefined, digits = 2): string {
  if (value == null || Number.isNaN(value)) return '—';
  return value.toFixed(digits);
}
function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.min(1, Math.max(0, n));
}
function getFocusState(bpm: number | null | undefined) {
  if (bpm == null) return { label: 'Warming up...', message: 'Stay still and face the camera to begin.', color: '#7a9db0' };
  if (bpm < 65)   return { label: 'Very Calm',  message: 'You are very relaxed. Great state for absorbing new knowledge!', color: '#22c55e' };
  if (bpm < 80)   return { label: 'Focused',    message: 'Optimal focus zone! Keep learning — you are in the zone.',      color: '#00e5cc' };
  if (bpm < 95)   return { label: 'Elevated',   message: 'Slightly elevated. Take a slow breath and continue.',           color: '#f59e0b' };
  return               { label: 'Stressed',    message: 'High stress detected. Consider a short break before continuing.', color: '#ef4444' };
}
function getStatusMessage(diagnostics: RppgSessionDiagnostics | null): string {
  if (!diagnostics) return 'Starting session…';
  if (diagnostics.lastError) return diagnostics.lastError.message;
  if (diagnostics.backendMode !== 'wasm') return 'WASM backend not active.';
  if (diagnostics.issues.includes('no_samples_yet') || diagnostics.issues.includes('insufficient_window'))
    return 'Warming up — hold still, face the camera.';
  return 'Monitoring your focus…';
}
function getStatusTone(diagnostics: RppgSessionDiagnostics | null): 'live' | 'warn' | 'error' {
  if (diagnostics?.lastError) return 'error';
  if (!diagnostics || diagnostics.backendMode !== 'wasm' || !diagnostics.estimationAvailable) return 'warn';
  return 'live';
}
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}
function getFocusScore(avgBpm: number | null) {
  if (avgBpm == null) return { score: 0,  label: 'No data collected',    color: '#7a9db0' };
  if (avgBpm < 65)    return { score: 98, label: 'Exceptional Focus',    color: '#22c55e' };
  if (avgBpm < 75)    return { score: 90, label: 'Strong Focus',         color: '#22c55e' };
  if (avgBpm < 85)    return { score: 78, label: 'Good Focus',           color: '#00e5cc' };
  if (avgBpm < 95)    return { score: 62, label: 'Moderate Focus',       color: '#f59e0b' };
  return                   { score: 45, label: 'High Stress Detected',  color: '#ef4444' };
}

const card = (accent = 'rgba(255,255,255,0.06)'): CSSProperties => ({
  background: 'var(--bg-card)',
  border: `1px solid ${accent}`,
  borderRadius: 'var(--radius-lg)',
  padding: '20px',
  boxShadow: 'var(--shadow-card)',
});

const pill = (bg: string, color: string): CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: '4px',
  background: bg, color,
  borderRadius: 'var(--radius-pill)',
  padding: '3px 12px',
  fontSize: '0.72rem', fontWeight: 600,
  whiteSpace: 'nowrap' as const,
  border: `1px solid ${color}44`,
});

// ─── App Component ────────────────────────────────────────────────────────────

export default function App() {

  // ── LINE 2: Onboarding hook ───────────────────────────────────────────────
  const { showOnboarding, completeOnboarding } = useOnboarding();

  // ── v3 hooks ──────────────────────────────────────────────────────────────
  const streakData      = useStreak();
  const quizTimer       = useQuizTimer();
  const tokenData       = useTokens();
  const leaderboardData = useLeaderboard();
  const [lastQuestionXP, setLastQuestionXP] = useState(0);

  const [logoTaps, setLogoTaps]   = useState(0);
  const tapTimerRef               = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLogoTap = () => {
    const next = logoTaps + 1;
    if (next >= 5) { setLogoTaps(0); setScreen('analytics'); return; }
    setLogoTaps(next);
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    tapTimerRef.current = setTimeout(() => setLogoTaps(0), 3000);
  };

  const videoRef    = useRef<HTMLVideoElement>(null);
  const sessionRef  = useRef<RppgSession | null>(null);
  const streamRef   = useRef<MediaStream | null>(null);
  const [status, setStatus]           = useState('Requesting camera…');
  const [metrics, setMetrics]         = useState<Metrics>(EMPTY_METRICS);
  const [diagnostics, setDiagnostics] = useState<RppgSessionDiagnostics | null>(null);
  const [sessionActive, setSessionActive]   = useState(false);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [sessionSummary, setSessionSummary] = useState<{ duration: number; avgBpm: number | null } | null>(null);
  const bpmReadingsRef = useRef<number[]>([]);
  const timerRef       = useRef<ReturnType<typeof setInterval> | null>(null);

  const [screen, setScreen]               = useState<Screen>('home');
  const [activeModule, setActiveModule]   = useState<LearningModule | null>(null);
  const [lessonPage, setLessonPage]       = useState(0);
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [cardFlipped, setCardFlipped]     = useState(false);
  const [quizIndex, setQuizIndex]         = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizScore, setQuizScore]         = useState(0);

  const syncFromSession = useCallback(() => {
    const session = sessionRef.current;
    if (!session) return;
    const d = session.getDiagnostics();
    const m = session.getMetrics();
    setMetrics(m); setDiagnostics(d); setStatus(getStatusMessage(d));
    if (m.bpm != null) bpmReadingsRef.current.push(m.bpm);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    async function init() {
      const video = videoRef.current;
      if (!video) return;
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false,
        });
      } catch { setStatus('Camera unavailable — allow access and reload.'); return; }
      if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
      streamRef.current = stream;
      video.srcObject = stream;
      await video.play().catch(() => undefined);
      const sampleRate = stream.getVideoTracks()[0]?.getSettings().frameRate ?? 30;
      setStatus('Starting rPPG…');
      try {
        const session = await createRppgSession({
          video, sampleRate, backend: 'auto', faceMesh: 'auto',
          wasmJsUrl: rppgWasmJsUrl, wasmBinaryUrl: rppgWasmBinaryUrl,
          enableTracker: { minBpm: 55, maxBpm: 150, numParticles: 200 },
          roiSmoothingAlpha: 0.25, useSkinMask: true,
          onDiagnostics: () => syncFromSession(),
          onError: error => setStatus(error.message),
        });
        if (cancelled) { await session.dispose(); return; }
        sessionRef.current = session;
        syncFromSession();
        intervalId = setInterval(syncFromSession, 400);
      } catch (error) {
        setStatus(error instanceof Error ? error.message : 'Could not start the rPPG session.');
      }
    }
    void init();
    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
      if (sessionRef.current) { void sessionRef.current.dispose(); sessionRef.current = null; }
      if (streamRef.current)  { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    };
  }, [syncFromSession]);

  const startSession = () => {
    bpmReadingsRef.current = [];
    setSessionSeconds(0); setSessionSummary(null); setSessionActive(true);
    timerRef.current = setInterval(() => setSessionSeconds(s => s + 1), 1000);
  };

  const stopSession = (mod: LearningModule | null, score: number, sessionXP: number, focusScoreValue: number) => {
    setSessionActive(false);
    if (timerRef.current) clearInterval(timerRef.current);
    const readings = bpmReadingsRef.current;
    const avgBpm   = readings.length > 0 ? readings.reduce((a, b) => a + b, 0) / readings.length : null;
    setSessionSummary({ duration: sessionSeconds, avgBpm });
    if (mod) {
      const quizPct = Math.round((score / mod.quiz.length) * 100);
      leaderboardData.addEntry({ moduleTitle: mod.title, moduleIcon: mod.icon, quizScore: quizPct, focusScore: focusScoreValue, xpEarned: sessionXP, streak: streakData.streak });
      tokenData.addPendingXP(sessionXP);
    }
  };

  const startModule = (mod: LearningModule) => {
    setActiveModule(mod); setLessonPage(0); setFlashcardIndex(0);
    setCardFlipped(false); setQuizIndex(0); setSelectedAnswer(null); setQuizScore(0);
    setScreen('lesson');
    if (!sessionActive) startSession();
  };

  const goToFlashcards = () => { setFlashcardIndex(0); setCardFlipped(false); setScreen('flashcard'); };

  const nextFlashcard = () => {
    if (!activeModule) return;
    if (flashcardIndex < activeModule.flashcards.length - 1) {
      setFlashcardIndex(i => i + 1); setCardFlipped(false);
    } else { quizTimer.resetQuiz(); setScreen('quiz'); }
  };

  const handleAnswer = (idx: number) => {
    if (selectedAnswer !== null) return;
    quizTimer.stopTimer();
    const isCorrect = activeModule !== null && idx === activeModule.quiz[quizIndex].correct;
    if (isCorrect) setQuizScore(s => s + 1);
    const rawXP    = quizTimer.calcXP(isCorrect);
    const actualXP = streakData.addXP(rawXP);
    setLastQuestionXP(actualXP);
    setSelectedAnswer(idx);
  };

  const nextQuestion = () => {
    if (!activeModule) return;
    if (quizIndex < activeModule.quiz.length - 1) {
      setQuizIndex(i => i + 1); setSelectedAnswer(null); setLastQuestionXP(0); quizTimer.startTimer();
    } else {
      const readings = bpmReadingsRef.current;
      const avgBpm   = readings.length > 0 ? readings.reduce((a, b) => a + b, 0) / readings.length : null;
      const fs       = getFocusScore(avgBpm);
      const finalScore = quizScore + (activeModule && selectedAnswer === activeModule.quiz[quizIndex].correct ? 1 : 0);
      stopSession(activeModule, finalScore, quizTimer.totalQuizXP, fs.score);
      setScreen('results');
    }
  };

  useEffect(() => {
    if (screen === 'quiz' && selectedAnswer === null) quizTimer.startTimer();
  }, [screen, quizIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (quizTimer.timeExpired && selectedAnswer === null) { setSelectedAnswer(-1); setLastQuestionXP(0); }
  }, [quizTimer.timeExpired, selectedAnswer]);

  const backToHome = () => {
    setScreen('home'); setActiveModule(null); setSessionSummary(null); quizTimer.resetQuiz();
  };

  const statusTone     = getStatusTone(diagnostics);
  const readinessLabel = diagnostics?.estimationAvailable && metrics.bpm != null ? 'Ready' : 'Warm-up';
  const confidencePct  = Math.round(clamp01(metrics.confidence) * 100);
  const qualityPct     = Math.round(clamp01(metrics.signal_quality) * 100);
  const focusState     = getFocusState(metrics.bpm);

  function renderHome() {
    return (
      <div style={{ paddingTop: '8px' }} className="animate-in">
        <StreakBar streakData={streakData} />
        <TokenWallet tokenData={tokenData} />
        <button onClick={() => setScreen('leaderboard')} style={{ width: '100%', marginBottom: '20px', minHeight: '48px', background: 'var(--bg-card)', border: '1px solid var(--border-soft)', borderRadius: 'var(--radius-md)', color: '#00e5cc', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' }}>
          🏆 View Leaderboard
          {leaderboardData.totalSessions > 0 && (<span style={pill('rgba(0,229,204,0.08)', '#00e5cc')}>{leaderboardData.totalSessions} session{leaderboardData.totalSessions !== 1 ? 's' : ''}</span>)}
        </button>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '6px', letterSpacing: '-0.02em' }}>Choose a Module</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '16px' }}>NeuroLearn tracks your focus as you learn.</p>
        <div className="module-grid">
          {MODULES.map(mod => (
            <button key={mod.id} onClick={() => startModule(mod)} className="module-card" style={{ '--accent': mod.color } as CSSProperties}>
              <div style={{ fontSize: '1.8rem', marginBottom: '10px', lineHeight: 1 }}>{mod.icon}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', color: mod.color, marginBottom: '6px', letterSpacing: '-0.01em' }}>{mod.title}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', lineHeight: 1.5, marginBottom: '12px' }}>{mod.description}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <span>{mod.lesson.length} lessons</span><span>·</span><span>{mod.flashcards.length} cards</span><span>·</span><span>{mod.quiz.length} questions</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  function renderLesson() {
    if (!activeModule) return null;
    const page = activeModule.lesson[lessonPage];
    const isLast = lessonPage === activeModule.lesson.length - 1;
    return (
      <div style={{ paddingTop: '8px' }} className="animate-in">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <button className="btn-ghost" onClick={backToHome}>← Modules</button>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: activeModule.color, fontSize: '0.88rem' }}>{activeModule.icon} {activeModule.title}</span>
          <span style={{ color: 'var(--text-muted)', marginLeft: 'auto', fontSize: '0.72rem' }}>{lessonPage + 1}/{activeModule.lesson.length}</span>
        </div>
        <div style={{ ...card(`${activeModule.color}33`), borderLeft: `3px solid ${activeModule.color}`, maxHeight: '55vh', overflowY: 'auto', marginBottom: '16px' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '14px', letterSpacing: '-0.02em' }}>{page.title}</h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.85, fontSize: '0.88rem', whiteSpace: 'pre-line' }}>{page.content}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {lessonPage > 0 ? <button className="btn-secondary" onClick={() => setLessonPage(p => p - 1)}>Previous</button> : <div />}
          <div style={{ flex: 1 }} />
          {!isLast ? <button className="btn-primary" style={{ background: activeModule.color }} onClick={() => setLessonPage(p => p + 1)}>Next</button> : <button className="btn-primary" style={{ background: activeModule.color }} onClick={goToFlashcards}>Flashcards →</button>}
        </div>
        <div className="progress-dots" style={{ marginTop: '16px' }}>
          {activeModule.lesson.map((_, i) => (<div key={i} className={`progress-dot${i === lessonPage ? ' active' : i < lessonPage ? ' done' : ''}`} style={{ width: i === lessonPage ? '20px' : '6px' }} />))}
        </div>
      </div>
    );
  }

  function renderFlashcards() {
    if (!activeModule) return null;
    const card2 = activeModule.flashcards[flashcardIndex];
    const isLast = flashcardIndex === activeModule.flashcards.length - 1;
    return (
      <div style={{ paddingTop: '8px' }} className="animate-in">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <button className="btn-ghost" onClick={() => setScreen('lesson')}>← Lesson</button>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: activeModule.color, fontSize: '0.88rem' }}>{activeModule.icon} Flashcards</span>
          <span style={{ color: 'var(--text-muted)', marginLeft: 'auto', fontSize: '0.72rem' }}>{flashcardIndex + 1}/{activeModule.flashcards.length}</span>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: '12px', textAlign: 'center' }}>{cardFlipped ? 'Answer revealed — ready for next?' : 'Tap the card to reveal the answer'}</p>
        <div onClick={() => setCardFlipped(f => !f)} style={{ background: cardFlipped ? 'rgba(34, 197, 94, 0.05)' : 'var(--bg-card)', border: `1px solid ${cardFlipped ? 'rgba(34, 197, 94, 0.3)' : activeModule.color + '44'}`, borderRadius: 'var(--radius-xl)', padding: '40px 24px', minHeight: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', textAlign: 'center', marginBottom: '16px', transition: 'all 0.3s', boxShadow: cardFlipped ? '0 0 30px rgba(34,197,94,0.08)' : 'var(--shadow-card)' }}>
          <p style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600 }}>{cardFlipped ? 'ANSWER' : 'QUESTION'}</p>
          <p style={{ color: 'var(--text-primary)', fontSize: '1rem', lineHeight: 1.7, fontFamily: 'var(--font-body)' }}>{cardFlipped ? card2.back : card2.front}</p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          {cardFlipped && (<button className="btn-primary" style={{ background: activeModule.color }} onClick={nextFlashcard}>{isLast ? 'Take Quiz →' : 'Next Card →'}</button>)}
        </div>
        <div className="progress-dots">
          {activeModule.flashcards.map((_, i) => (<div key={i} className={`progress-dot${i === flashcardIndex ? ' active' : i < flashcardIndex ? ' done' : ''}`} style={{ width: i === flashcardIndex ? '20px' : '6px' }} />))}
        </div>
      </div>
    );
  }

  function renderQuiz() {
    if (!activeModule) return null;
    const q = activeModule.quiz[quizIndex];
    const answered = selectedAnswer !== null;
    const isUrgent = quizTimer.timeLeft <= 5 && !answered;
    const isWarning = quizTimer.timeLeft <= 10 && !answered;
    const RADIUS = 28;
    const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
    const strokeDashoffset = answered ? 0 : CIRCUMFERENCE * (1 - quizTimer.timerPercent / 100);
    const circleColor = answered ? '#22c55e' : quizTimer.timerColor;
    return (
      <div style={{ paddingTop: '8px' }} className="animate-in">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <button className="btn-ghost" onClick={() => setScreen('flashcard')}>← Flashcards</button>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: activeModule.color, fontSize: '0.88rem' }}>{activeModule.icon} Quiz</span>
          <span style={{ color: 'var(--text-muted)', marginLeft: 'auto', fontSize: '0.72rem' }}>Q{quizIndex + 1}/{activeModule.quiz.length}</span>
        </div>
        <div style={{ background: 'var(--bg-card)', border: `1px solid ${answered ? 'rgba(34,197,94,0.25)' : isUrgent ? 'rgba(239,68,68,0.4)' : isWarning ? 'rgba(245,158,11,0.3)' : 'var(--pulse-border)'}`, borderRadius: 'var(--radius-lg)', padding: '14px 16px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '14px', transition: 'border-color 0.3s', boxShadow: isUrgent ? '0 0 20px rgba(239,68,68,0.1)' : 'var(--shadow-card)' }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {isUrgent && (<div style={{ position: 'absolute', inset: '-6px', borderRadius: '50%', border: '2px solid rgba(239,68,68,0.5)', animation: 'pulse 0.8s ease-in-out infinite' }} />)}
            <svg width="72" height="72" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="36" cy="36" r={RADIUS} fill="none" stroke="var(--bg-surface)" strokeWidth="6" />
              <circle cx="36" cy="36" r={RADIUS} fill="none" stroke={circleColor} strokeWidth="6" strokeLinecap="round" strokeDasharray={CIRCUMFERENCE} strokeDashoffset={strokeDashoffset} style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s' }} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: answered ? '1.4rem' : '1.2rem', fontWeight: 800, color: circleColor }}>{answered ? '✓' : quizTimer.timeLeft}</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: answered ? '#22c55e' : isUrgent ? '#ef4444' : isWarning ? '#f59e0b' : '#00e5cc' }}>{answered ? '✅ Answered' : isUrgent ? '⚡ Hurry up!' : isWarning ? '⏳ Running low...' : '🕐 Time remaining'}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{answered ? 'Next →' : `${quizTimer.timeLeft}s`}</span>
            </div>
            <div style={{ height: '12px', background: 'var(--bg-surface)', borderRadius: '6px', overflow: 'hidden', marginBottom: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ height: '100%', width: `${answered ? 100 : quizTimer.timerPercent}%`, background: answered ? '#22c55e' : isUrgent ? 'linear-gradient(90deg,#ef4444,#ff6b6b)' : isWarning ? 'linear-gradient(90deg,#f59e0b,#fbbf24)' : 'linear-gradient(90deg,#00e5cc,#3d9eff)', borderRadius: '6px', transition: 'width 0.9s linear, background 0.3s' }} />
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {quizTimer.comboCount > 1 && <span style={pill('rgba(245,158,11,0.1)', '#f59e0b')}>🔗 {quizTimer.comboCount}x Combo</span>}
              {lastQuestionXP > 0 && answered && <span style={pill('rgba(0,229,204,0.1)', '#00e5cc')}>+{lastQuestionXP} XP</span>}
              {!answered && quizTimer.comboCount > 0 && <span style={{ ...pill('rgba(34,197,94,0.06)', '#22c55e88'), border: 'none' }}>{quizTimer.comboCount} in a row</span>}
            </div>
          </div>
        </div>
        {selectedAnswer === -1 && (<div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius-md)', padding: '10px 14px', color: '#ef4444', fontSize: '0.82rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}><span>⏱</span><span>Time's up! The correct answer is highlighted below.</span></div>)}
        <div style={{ ...card(), marginBottom: '14px' }}>
          <p style={{ color: 'var(--text-primary)', fontSize: '1rem', lineHeight: 1.65, marginBottom: '18px', fontWeight: 500 }}>{q.question}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {q.options.map((opt, idx) => {
              let bg = 'var(--bg-input)', border = 'rgba(255,255,255,0.06)', color = 'var(--text-secondary)';
              if (answered) {
                if (idx === q.correct) { bg = 'rgba(34,197,94,0.08)'; border = 'rgba(34,197,94,0.4)'; color = '#22c55e'; }
                else if (idx === selectedAnswer && selectedAnswer !== -1) { bg = 'rgba(239,68,68,0.08)'; border = 'rgba(239,68,68,0.35)'; color = '#ef4444'; }
              }
              return (<button key={idx} onClick={() => handleAnswer(idx)} disabled={answered} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 'var(--radius-md)', padding: '13px 16px', color, cursor: answered ? 'default' : 'pointer', textAlign: 'left', fontSize: '0.88rem', transition: 'all 0.2s', fontFamily: 'var(--font-body)', minHeight: '48px' }}><span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', marginRight: '10px', opacity: 0.5 }}>{String.fromCharCode(65 + idx)}</span>{opt}</button>);
            })}
          </div>
        </div>
        {answered && (<div style={{ display: 'flex', justifyContent: 'flex-end' }}><button className="btn-primary" style={{ background: activeModule.color, color: '#020408' }} onClick={nextQuestion}>{quizIndex < activeModule.quiz.length - 1 ? 'Next Question →' : 'See Results 🎉'}</button></div>)}
        <div className="progress-dots">
          {activeModule.quiz.map((_, i) => (<div key={i} className={`progress-dot${i === quizIndex ? ' active' : i < quizIndex ? ' done' : ''}`} style={{ width: i === quizIndex ? '20px' : '6px' }} />))}
        </div>
        <style>{`@keyframes pulse{0%,100%{transform:scale(1);opacity:.8}50%{transform:scale(1.2);opacity:.3}}`}</style>
      </div>
    );
  }

  function renderResults() {
    if (!activeModule) return null;
    const focusScore = getFocusScore(sessionSummary?.avgBpm ?? null);
    const quizPct = Math.round((quizScore / activeModule.quiz.length) * 100);
    const sessionXP = quizTimer.totalQuizXP;
    return (
      <div style={{ paddingTop: '8px' }} className="animate-in">
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '2.8rem', marginBottom: '8px' }}>🎉</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.4rem', color: 'var(--text-primary)', letterSpacing: '-0.03em', marginBottom: '4px' }}>{activeModule.title} Complete!</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Here is your session breakdown</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
          <div style={card()}>
            <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600 }}>Quiz Score</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.04em', marginBottom: '2px' }}>{quizPct}%</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginBottom: '8px' }}>{quizScore}/{activeModule.quiz.length} correct</p>
            <p style={{ color: quizPct >= 80 ? '#22c55e' : quizPct >= 60 ? '#f59e0b' : '#ef4444', fontSize: '0.78rem', fontWeight: 600 }}>{quizPct >= 80 ? 'Excellent!' : quizPct >= 60 ? 'Good effort!' : 'Keep practicing'}</p>
          </div>
          <div style={{ ...card(`${focusScore.color}22`) }}>
            <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600 }}>Focus Score</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 800, color: focusScore.color, letterSpacing: '-0.04em', marginBottom: '2px' }}>{focusScore.score}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginBottom: '8px' }}>{focusScore.label}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Avg BPM: {sessionSummary?.avgBpm != null ? Math.round(sessionSummary.avgBpm) : 'N/A'}</p>
          </div>
        </div>
        <div style={{ ...card('var(--pulse-border)'), marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>XP This Session</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800, color: '#00e5cc', letterSpacing: '-0.04em' }}>+{sessionXP.toLocaleString()}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>Multiplier</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800, color: '#a855f7' }}>{streakData.xpMultiplier.toFixed(1)}x</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>{streakData.getStreakLabel()}</p>
          </div>
        </div>
        <div style={{ ...card('rgba(245,158,11,0.2)'), background: 'rgba(245,158,11,0.04)', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>Pending ELTA</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: '#f59e0b' }}>{tokenData.claimableTokens > 0 ? `${tokenData.claimableTokens} ready to claim! 🎉` : `${tokenData.pendingXP.toLocaleString()} XP pending`}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>Balance</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: '#f59e0b' }}>{tokenData.balance} ELTA</p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
          <div style={{ ...card(), textAlign: 'center' }}>
            <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>Lifetime XP</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>{streakData.totalXP.toLocaleString()}</p>
          </div>
          <div style={{ ...card(), textAlign: 'center' }}>
            <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>Study Time</p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '1.3rem', fontWeight: 600, color: 'var(--text-primary)' }}>{sessionSummary ? formatTime(sessionSummary.duration) : '—'}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setScreen('leaderboard')} style={{ flex: 1, minHeight: '48px', background: 'var(--bg-card)', border: '1px solid var(--border-soft)', borderRadius: 'var(--radius-md)', color: '#00e5cc', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>🏆 Leaderboard</button>
          <button className="btn-primary" onClick={backToHome} style={{ flex: 2, background: activeModule.color, color: '#020408' }}>Back to Modules</button>
        </div>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <div className="app">

      {/* ── LINE 3: Onboarding overlay — shows once on first visit ───────── */}
      {showOnboarding && <Onboarding onComplete={completeOnboarding} />}

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <header className="topbar">
        <div className="brand" onClick={handleLogoTap} style={{ cursor: 'pointer' }}>
          <span className="brand-mark" />
          <span className="brand-name">NeuroLearn</span>
          {logoTaps > 0 && logoTaps < 5 && (<span style={{ fontSize: '0.55rem', color: 'var(--pulse-border)', marginLeft: '4px' }}>{'●'.repeat(logoTaps)}{'○'.repeat(5 - logoTaps)}</span>)}
        </div>
        <span className="topbar-sep" />
        <span className="topbar-tagline">Web3 Learning · Focus Tracker</span>
        <div className="topbar-spacer" />
        <div className={`session-chip session-chip--${statusTone}`}>
          <span className={`status-dot${statusTone === 'error' ? ' error' : statusTone === 'warn' ? ' warn' : ''}`} />
          <span className="session-chip-text">{status}</span>
        </div>
      </header>

      {/* ── Main ─────────────────────────────────────────────────────────── */}
      <main className="main">
        <section className="stage">
          <h1 className="visually-hidden">NeuroLearn Focus Session</h1>
          <div style={{ display: 'block' }} className="stage-content">
            <BpmIndicator metrics={metrics} diagnostics={diagnostics} sessionSeconds={sessionSeconds} sessionActive={sessionActive} onStartSession={startSession} onStopSession={() => stopSession(null, 0, 0, 0)} videoRef={videoRef} confidencePct={confidencePct} qualityPct={qualityPct} focusState={focusState} readinessLabel={readinessLabel} />
            {screen === 'home'        && renderHome()}
            {screen === 'lesson'      && renderLesson()}
            {screen === 'flashcard'   && renderFlashcards()}
            {screen === 'quiz'        && renderQuiz()}
            {screen === 'results'     && renderResults()}
            {screen === 'leaderboard' && <Leaderboard leaderboardData={leaderboardData} onBack={backToHome} />}
            {screen === 'analytics'   && <Analytics onBack={backToHome} />}
          </div>

          <aside className="readouts">
            <div>
              <div className="video-chrome">
                <video ref={videoRef} autoPlay muted playsInline className="stage-video" />
                <div className="video-label"><span className="video-label-dot" />Live input</div>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.65rem', marginTop: '6px', textAlign: 'center' }}>Face the light · fill the frame · stay steady</p>
            </div>
            <div className="bpm-block">
              <p className="bpm-label">Heart Rate</p>
              <div className="bpm-value-row">
                <span className="bpm-number">{metrics.bpm != null ? formatMetric(metrics.bpm, 0) : '—'}</span>
                <span className="bpm-unit">BPM</span>
              </div>
              <p className="bpm-sub">{readinessLabel}</p>
            </div>
            <div style={{ background: `${focusState.color}0f`, border: `1px solid ${focusState.color}33`, borderRadius: 'var(--radius-md)', padding: '12px 14px' }}>
              <p style={{ color: focusState.color, fontWeight: 700, fontSize: '0.82rem', marginBottom: '3px' }}>{focusState.label}</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', lineHeight: 1.5 }}>{focusState.message}</p>
            </div>
            <div className="meter-group">
              <div className="meter">
                <div className="meter-head"><span>Confidence</span><span className="meter-pct">{confidencePct}%</span></div>
                <div className="meter-track"><div className="meter-fill meter-fill--confidence" style={{ width: `${confidencePct}%` }} /></div>
              </div>
              <div className="meter">
                <div className="meter-head"><span>Signal quality</span><span className="meter-pct">{qualityPct}%</span></div>
                <div className="meter-track"><div className="meter-fill meter-fill--quality" style={{ width: `${qualityPct}%` }} /></div>
              </div>
            </div>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-md)', padding: '14px', textAlign: 'center' }}>
              <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>SESSION TIME</p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px' }}>{formatTime(sessionSeconds)}</p>
              {!sessionActive
                ? <button className="btn-primary" style={{ width: '100%', fontSize: '0.8rem', padding: '8px 16px', minHeight: '36px' }} onClick={startSession}>Start Session</button>
                : <button style={{ width: '100%', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-sm)', padding: '8px 16px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', fontFamily: 'var(--font-body)', minHeight: '36px' }} onClick={() => stopSession(null, 0, 0, 0)}>End Session</button>}
            </div>
          </aside>
        </section>
      </main>

      <footer className="footer">
        NeuroLearn v3 · Powered by Elata rPPG · Built for Everyone
      </footer>
    </div>
  );
}
