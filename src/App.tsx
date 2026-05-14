import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import {
  createRppgSession,
  type Metrics,
  type RppgSession,
  type RppgSessionDiagnostics,
} from '@elata-biosciences/rppg-web';
import rppgWasmJsUrl from '@elata-biosciences/rppg-web/pkg/rppg_wasm.js?url';
import rppgWasmBinaryUrl from '@elata-biosciences/rppg-web/pkg/rppg_wasm_bg.wasm?url';

// ─── Types ──────────────────────────────────────────────────────────────────

type Screen = 'home' | 'lesson' | 'flashcard' | 'quiz' | 'results';

interface FlashCard {
  front: string;
  back: string;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
}

interface LearningModule {
  id: string;
  title: string;
  description: string;
  color: string;
  icon: string;
  lesson: { title: string; content: string }[];
  flashcards: FlashCard[];
  quiz: QuizQuestion[];
}

// ─── Module Content ──────────────────────────────────────────────────────────

const MODULES: LearningModule[] = [
  {
    id: 'blockchain',
    title: 'Blockchain Basics',
    description: 'Understand what blockchain is and how it works from the ground up.',
    color: '#2196F3',
    icon: '⛓️',
    lesson: [
      {
        title: 'What is a Blockchain?',
        content: `A blockchain is a special type of database that stores information in "blocks" that are chained together. Unlike a normal database controlled by one company, a blockchain is shared across thousands of computers worldwide — making it nearly impossible to hack or manipulate.

Each block contains:
• A list of transactions or data
• A timestamp of when it was created
• A unique fingerprint (called a "hash") of the previous block

This chaining of fingerprints is what makes blockchain so powerful. If someone tries to change an old block, its fingerprint changes — breaking the chain and alerting the entire network.`,
      },
      {
        title: 'How Does Consensus Work?',
        content: `Since no single person controls a blockchain, how does the network agree on what is true? This is done through "consensus mechanisms" — rules that all participants follow.

The two most common are:

Proof of Work (PoW) — Used by Bitcoin. Miners compete to solve complex math puzzles. The winner adds the next block and earns a reward. This requires a lot of computing power.

Proof of Stake (PoS) — Used by Ethereum. Validators lock up crypto as collateral. They are chosen to validate blocks based on their stake. Far more energy-efficient than PoW.

Both methods make it extremely expensive to cheat the network.`,
      },
      {
        title: 'Why Does Blockchain Matter?',
        content: `Blockchain solves a problem called the "double-spend problem" — how do you stop someone from sending the same digital money to two people at once?

Before Bitcoin, you needed a bank to verify transactions. Blockchain removes that middleman. This has massive implications:

Finance — Send money anywhere in the world without a bank, instantly and cheaply.

Healthcare — Store medical records that only you can authorize access to.

Voting — Create tamper-proof voting systems.

Africa specifically — Blockchain can provide financial services to millions of unbanked people who have a smartphone but no bank account.`,
      },
    ],
    flashcards: [
      { front: 'What is a Block?', back: 'A container that holds a batch of verified transactions, a timestamp, and a hash linking it to the previous block.' },
      { front: 'What is a Hash?', back: 'A unique digital fingerprint of data. If any data changes, the hash changes completely — making tampering immediately detectable.' },
      { front: 'What is Decentralization?', back: 'No single person or company controls the network. Thousands of computers (nodes) share and verify the same data.' },
      { front: 'What is Proof of Work?', back: 'A consensus method where miners solve math puzzles to earn the right to add a new block. Used by Bitcoin.' },
      { front: 'What is a Node?', back: 'Any computer that participates in a blockchain network by storing a full copy of the chain and validating transactions.' },
    ],
    quiz: [
      {
        question: 'What makes it nearly impossible to change old data on a blockchain?',
        options: ['A central server protects it', 'Each block contains the fingerprint of the previous block', 'Blocks are encrypted with passwords', 'Government regulations protect it'],
        correct: 1,
      },
      {
        question: 'What problem did Bitcoin originally solve?',
        options: ['Slow internet speeds', 'The double-spend problem', 'Password theft', 'Identity fraud'],
        correct: 1,
      },
      {
        question: 'Which consensus method does Ethereum currently use?',
        options: ['Proof of Work', 'Proof of Authority', 'Proof of Stake', 'Proof of History'],
        correct: 2,
      },
      {
        question: 'What is a node?',
        options: ['A type of cryptocurrency', 'A computer that participates in the blockchain network', 'A transaction fee', 'A type of wallet'],
        correct: 1,
      },
      {
        question: 'Which of these is TRUE about blockchain?',
        options: ['It is controlled by one company', 'Only banks can use it', 'It is shared across thousands of computers', 'It only works with the internet, not computers'],
        correct: 2,
      },
    ],
  },
  {
    id: 'wallets',
    title: 'Wallets & Security',
    description: 'Learn how crypto wallets work and how to keep your assets safe.',
    color: '#9C27B0',
    icon: '🔐',
    lesson: [
      {
        title: 'What is a Crypto Wallet?',
        content: `A crypto wallet does NOT store your crypto. Your crypto lives on the blockchain. What a wallet stores is your private key — a secret code that proves you own the crypto at a specific address.

Think of it like this:
• Your wallet address = your bank account number (public, shareable)
• Your private key = your PIN (secret, never share!)

There are two main types:

Hot Wallets — Connected to the internet (e.g. Trust Wallet, MetaMask). Convenient for daily use but slightly more vulnerable.

Cold Wallets — Offline hardware devices (e.g. Ledger). Most secure for storing large amounts long-term.`,
      },
      {
        title: 'Seed Phrases — Your Master Key',
        content: `When you create a wallet, you are given a seed phrase — 12 or 24 random words in a specific order. This is the MOST important thing in crypto.

Your seed phrase can:
• Restore your wallet on any device if your phone is lost
• Give full access to ALL wallets in that account

Never:
• Screenshot your seed phrase
• Store it in cloud storage (Google Drive, iCloud, email)
• Share it with ANYONE — not even "support staff"
• Type it into any website

Write it on paper. Store it in a safe place. Some people use fireproof, waterproof metal backups.`,
      },
      {
        title: 'Common Scams and How to Avoid Them',
        content: `Most crypto losses come not from hacking, but from social engineering — tricking people into giving away their keys.

Seed phrase scams — Fake support agents ask for your seed phrase to "verify" your wallet. Legitimate services NEVER ask for this.

Fake websites — Scammers create exact copies of MetaMask, Trust Wallet, and exchanges. Always verify the URL carefully before connecting.

Send X get 2X back — No legitimate person doubles your money. These are always scams, even if the account looks like a celebrity.

Rug pulls — New tokens launch with hype, founders collect investor money, then disappear. Research the team before investing.

Rule of thumb: If it sounds too good to be true, it is.`,
      },
    ],
    flashcards: [
      { front: 'What does a crypto wallet actually store?', back: 'Your private key — not your crypto itself. The crypto lives on the blockchain.' },
      { front: 'What is a seed phrase?', back: '12 or 24 words that can fully restore your wallet. Must be kept secret and stored offline.' },
      { front: 'What is a hot wallet?', back: 'A wallet connected to the internet, like Trust Wallet or MetaMask. Convenient but less secure than cold storage.' },
      { front: 'What is a private key?', back: 'A secret code that proves ownership of your crypto address. Never share it with anyone, ever.' },
      { front: 'What is a rug pull?', back: 'A scam where developers hype a project, collect investor funds, then abandon it and disappear with the money.' },
    ],
    quiz: [
      {
        question: 'What does your crypto wallet actually store?',
        options: ['Your cryptocurrency coins', 'Your private key', 'Your transaction history', 'Your identity documents'],
        correct: 1,
      },
      {
        question: 'Where should you store your seed phrase?',
        options: ['In Google Drive for easy access', 'Screenshot on your phone', 'Written on paper in a safe place', 'In your email drafts'],
        correct: 2,
      },
      {
        question: 'What type of wallet is most secure for large amounts?',
        options: ['Hot wallet', 'Mobile wallet', 'Cold wallet (hardware)', 'Exchange wallet'],
        correct: 2,
      },
      {
        question: 'A support agent asks for your seed phrase to fix your wallet. What do you do?',
        options: ['Provide it — they need it to help', 'Only give the first 6 words', 'Refuse — legitimate support never asks for this', 'Send it via encrypted message'],
        correct: 2,
      },
      {
        question: 'What is a rug pull?',
        options: ['A type of hardware wallet', 'When developers abandon a project and steal investor funds', 'A network upgrade gone wrong', 'A government crypto ban'],
        correct: 1,
      },
    ],
  },
  {
    id: 'defi',
    title: 'DeFi Fundamentals',
    description: 'Explore decentralized finance — banking without banks.',
    color: '#00BCD4',
    icon: '🏦',
    lesson: [
      {
        title: 'What is DeFi?',
        content: `DeFi stands for Decentralized Finance. It is a system of financial services — lending, borrowing, trading, earning interest — that runs on blockchain instead of banks.

Traditional Finance:
• You need a bank account (millions in Africa do not have one)
• Banks set the interest rates and can change them anytime
• Banks can freeze your account
• Banks are closed on weekends and holidays

DeFi:
• Anyone with a smartphone and internet can access it
• Smart contracts set the rules automatically and transparently
• No one can freeze your funds
• Available 24/7, 365 days a year

DeFi is particularly powerful for Africa, where mobile penetration is high but banking access remains low.`,
      },
      {
        title: 'Smart Contracts and Liquidity Pools',
        content: `Smart contracts are self-executing programs on the blockchain. When conditions are met, they execute automatically — no lawyer, bank, or middleman needed.

Example: IF Person A sends 1 ETH AND Person B sends $3000 USDC to this contract, THEN automatically swap them. This happens instantly, transparently, and without a broker.

Liquidity Pools are how DeFi exchanges work:
• Users deposit token pairs (e.g. ETH + USDC) into a pool
• Traders swap against this pool instead of matching with another buyer/seller
• Liquidity providers earn a share of every trading fee

This replaces the traditional order book model used by stock exchanges.`,
      },
      {
        title: 'Yield, Risk and Opportunities',
        content: `DeFi offers ways to earn passive income with your crypto:

Lending — Deposit crypto, earn interest when others borrow it (e.g. Aave, Compound).

Yield Farming — Provide liquidity and earn token rewards on top of trading fees. High rewards, higher risk.

Staking — Lock up tokens to help secure a network and earn rewards (e.g. staking ETH on Ethereum).

DeFi Risks to know:
• Smart contract bugs — Code errors can be exploited by attackers
• Impermanent loss — Liquidity providers can lose value vs just holding
• Rug pulls — Fake DeFi projects steal funds
• High gas fees — Some blockchain transactions can be expensive

Always start small. Never invest more than you can afford to lose.`,
      },
    ],
    flashcards: [
      { front: 'What does DeFi stand for?', back: 'Decentralized Finance — financial services built on blockchain that operate without banks or other traditional intermediaries.' },
      { front: 'What is a smart contract?', back: 'A self-executing program on the blockchain that automatically enforces agreed-upon rules when predefined conditions are met.' },
      { front: 'What is a liquidity pool?', back: 'A pool of token pairs deposited by users that enables decentralized trading. Depositors earn a share of trading fees.' },
      { front: 'What is yield farming?', back: 'Providing liquidity to DeFi protocols in exchange for token rewards. High potential returns but also comes with higher risk.' },
      { front: 'What is impermanent loss?', back: 'A potential loss for liquidity providers when the price ratio of their deposited tokens changes significantly after deposit.' },
    ],
    quiz: [
      {
        question: 'What makes DeFi different from traditional banking?',
        options: ['It requires a credit score', 'It runs on blockchain with no central authority', 'It is only available in wealthy countries', 'Banks control it behind the scenes'],
        correct: 1,
      },
      {
        question: 'What is a smart contract?',
        options: ['A legal document stored online', 'A self-executing program that runs on blockchain', 'A government-regulated financial agreement', 'An encrypted email contract'],
        correct: 1,
      },
      {
        question: 'How do liquidity providers earn money in DeFi?',
        options: ['They earn salaries from the protocol team', 'They earn a share of trading fees', 'They earn by reporting scams', 'They earn government subsidies'],
        correct: 1,
      },
      {
        question: 'Which of these is a real DeFi risk?',
        options: ['Internet connection fees', 'Smart contract bugs being exploited', 'Government bailouts', 'Market opening hours'],
        correct: 1,
      },
      {
        question: 'Why is DeFi especially valuable in Africa?',
        options: ['African governments fully support it', 'It provides financial access to people without bank accounts', 'It is cheaper to mine crypto in Africa', 'African banks invented DeFi'],
        correct: 1,
      },
    ],
  },
  {
    id: 'nfts',
    title: 'NFTs & Tokens',
    description: 'Understand digital ownership, token types, and real-world use cases.',
    color: '#FF9800',
    icon: '🎨',
    lesson: [
      {
        title: 'What is an NFT?',
        content: `NFT stands for Non-Fungible Token. "Fungible" means interchangeable — one dollar is equal to any other dollar. "Non-fungible" means unique — no two are the same.

An NFT is a token on the blockchain that proves ownership of a unique digital or physical item.

What can be an NFT?
• Digital art
• Music
• In-game items
• Certificates and diplomas
• Property deeds
• Event tickets

Key insight: NFTs solve the problem of digital ownership. Before NFTs, anyone could copy a digital file. NFTs do not prevent copying — but they create a verifiable, immutable proof of who owns the original.`,
      },
      {
        title: 'Token Standards and Types',
        content: `Tokens are digital assets issued on a blockchain. There are different standards with different rules:

ERC-20 — The most common standard. Fungible tokens used for currencies, governance, and utility (e.g. USDC, UNI, LINK).

ERC-721 — The NFT standard. Each token is unique and non-interchangeable. Used for art, collectibles, and digital identity.

ERC-1155 — Multi-token standard. A single contract can issue both fungible and non-fungible tokens. Perfect for gaming.

Beyond Ethereum:
• Solana uses SPL tokens
• BNB Chain uses BEP-20
• Each blockchain has its own standards, but the concepts are the same`,
      },
      {
        title: 'Real-World Use Cases for NFTs',
        content: `Beyond digital art, NFTs have practical applications that matter for everyday life:

Education credentials — Your university degree as an NFT. Employers verify it instantly on the blockchain. No more fake certificates.

Medical records — Your health history as an NFT that only you can authorize access to.

Digital identity — A self-sovereign identity NFT that proves who you are without a government ID.

Ticketing — NFT event tickets that cannot be faked or scalped unfairly.

Land registry in Africa — Many African countries have unreliable land records. NFT-based land deeds could prevent fraud and corruption permanently.

The hype cycle around JPEG NFTs will pass — but the underlying technology and its utility will remain.`,
      },
    ],
    flashcards: [
      { front: 'What does NFT stand for?', back: 'Non-Fungible Token — a unique digital token on the blockchain that proves ownership of a specific item.' },
      { front: 'What is ERC-20?', back: 'An Ethereum token standard for fungible tokens — interchangeable units used for currencies, governance, and utility.' },
      { front: 'What is ERC-721?', back: 'The Ethereum standard for NFTs. Each token is unique and cannot be exchanged 1:1 with any other token.' },
      { front: 'What problem do NFTs solve?', back: 'Digital ownership. They create a verifiable, immutable record of who owns the original version of a digital asset.' },
      { front: 'What is ERC-1155?', back: 'A multi-token standard allowing one contract to manage both fungible and non-fungible tokens — ideal for gaming and complex apps.' },
    ],
    quiz: [
      {
        question: 'What does "non-fungible" mean?',
        options: ['Cannot be traded', 'Unique and not interchangeable with another token', 'Stored offline', 'Backed by gold'],
        correct: 1,
      },
      {
        question: 'Which token standard is used for NFTs on Ethereum?',
        options: ['ERC-20', 'BEP-20', 'ERC-721', 'SPL'],
        correct: 2,
      },
      {
        question: 'What real-world problem could NFTs help solve in Africa?',
        options: ['Slow mobile data', 'Unreliable land registry and fake certificates', 'Lack of smartphones', 'Power outages'],
        correct: 1,
      },
      {
        question: 'What does ERC-20 represent?',
        options: ['A unique digital collectible', 'A fungible token standard for currencies and utility', 'A hardware wallet type', 'A DeFi protocol'],
        correct: 1,
      },
      {
        question: 'What does an NFT actually prove?',
        options: ['That you created the original file', 'Ownership of the original version of a digital asset', 'That no copies of the file exist', 'The current market value of the asset'],
        correct: 1,
      },
    ],
  },
];

// ─── Helper Functions (unchanged from v1) ────────────────────────────────────

const EMPTY_METRICS: Metrics = {
  bpm: null,
  confidence: 0,
  signal_quality: 0,
};

function formatMetric(value: number | null | undefined, digits = 2): string {
  if (value == null || Number.isNaN(value)) return '—';
  return value.toFixed(digits);
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

function getFocusState(bpm: number | null | undefined): { label: string; message: string; color: string } {
  if (bpm == null) return { label: 'Warming up...', message: 'Stay still and face the camera to begin.', color: '#888' };
  if (bpm < 65) return { label: 'Very Calm', message: 'You are very relaxed. Great state for absorbing new knowledge!', color: '#4CAF50' };
  if (bpm < 80) return { label: 'Focused', message: 'Optimal focus zone! Keep learning — you are in the zone.', color: '#2196F3' };
  if (bpm < 95) return { label: 'Elevated', message: 'Slightly elevated. Take a slow breath and continue.', color: '#FF9800' };
  return { label: 'Stressed', message: 'High stress detected. Consider a short break before continuing.', color: '#F44336' };
}

function getStatusMessage(diagnostics: RppgSessionDiagnostics | null): string {
  if (!diagnostics) return 'Starting session…';
  if (diagnostics.lastError) return diagnostics.lastError.message;
  if (diagnostics.backendMode !== 'wasm') return 'WASM backend not active.';
  if (diagnostics.issues.includes('no_samples_yet') || diagnostics.issues.includes('insufficient_window')) {
    return 'Warming up — hold still, face the camera.';
  }
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

function getFocusScore(avgBpm: number | null): { score: number; label: string; color: string } {
  if (avgBpm == null) return { score: 0, label: 'No data collected', color: '#888' };
  if (avgBpm < 65) return { score: 98, label: 'Exceptional Focus', color: '#4CAF50' };
  if (avgBpm < 75) return { score: 90, label: 'Strong Focus', color: '#4CAF50' };
  if (avgBpm < 85) return { score: 78, label: 'Good Focus', color: '#2196F3' };
  if (avgBpm < 95) return { score: 62, label: 'Moderate Focus', color: '#FF9800' };
  return { score: 45, label: 'High Stress Detected', color: '#F44336' };
}

// ─── App Component ────────────────────────────────────────────────────────────

export default function App() {

  const primaryBtnStyle: CSSProperties = {
    background: '#2196F3', color: '#fff', border: 'none',
    borderRadius: '8px', padding: '10px 20px', cursor: 'pointer',
    fontWeight: 'bold', fontSize: '0.9rem',
  };

  const secondaryBtnStyle: CSSProperties = {
    background: 'transparent', color: '#aaa', border: '1px solid #333',
    borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontSize: '0.9rem',
  };

  const backBtnStyle: CSSProperties = {
    background: 'transparent', color: '#666', border: '1px solid #333',
    borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '0.8rem',
  };

  // ── rPPG state (all unchanged from v1) ─────────────────────────────────
  const videoRef = useRef<HTMLVideoElement>(null);
  const sessionRef = useRef<RppgSession | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState('Requesting camera…');
  const [metrics, setMetrics] = useState<Metrics>(EMPTY_METRICS);
  const [diagnostics, setDiagnostics] = useState<RppgSessionDiagnostics | null>(null);

  const [sessionActive, setSessionActive] = useState(false);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [sessionSummary, setSessionSummary] = useState<{ duration: number; avgBpm: number | null } | null>(null);
  const bpmReadingsRef = useRef<number[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Learning state ─────────────────────────────────────────────────────
  const [screen, setScreen] = useState<Screen>('home');
  const [activeModule, setActiveModule] = useState<LearningModule | null>(null);
  const [lessonPage, setLessonPage] = useState(0);
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [cardFlipped, setCardFlipped] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);

  // ── rPPG sync (unchanged from v1) ──────────────────────────────────────
  const syncFromSession = useCallback(() => {
    const session = sessionRef.current;
    if (!session) return;
    const nextDiagnostics = session.getDiagnostics();
    const nextMetrics = session.getMetrics();
    setMetrics(nextMetrics);
    setDiagnostics(nextDiagnostics);
    setStatus(getStatusMessage(nextDiagnostics));
    if (nextMetrics.bpm != null) {
      bpmReadingsRef.current.push(nextMetrics.bpm);
    }
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
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });
      } catch {
        setStatus('Camera unavailable — allow access and reload.');
        return;
      }
      if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
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
          onDiagnostics: () => { syncFromSession(); },
          onError: (error) => { setStatus(error.message); },
        });
        if (cancelled) { await session.dispose(); return; }
        sessionRef.current = session;
        syncFromSession();
        intervalId = setInterval(syncFromSession, 400);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Could not start the rPPG session.';
        setStatus(message);
      }
    }

    void init();

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
      if (sessionRef.current) { void sessionRef.current.dispose(); sessionRef.current = null; }
      if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
    };
  }, [syncFromSession]);

  // ── Session controls (unchanged from v1) ───────────────────────────────
  const startSession = () => {
    bpmReadingsRef.current = [];
    setSessionSeconds(0);
    setSessionSummary(null);
    setSessionActive(true);
    timerRef.current = setInterval(() => { setSessionSeconds((s) => s + 1); }, 1000);
  };

  const stopSession = () => {
    setSessionActive(false);
    if (timerRef.current) clearInterval(timerRef.current);
    const readings = bpmReadingsRef.current;
    const avgBpm = readings.length > 0 ? readings.reduce((a, b) => a + b, 0) / readings.length : null;
    setSessionSummary({ duration: sessionSeconds, avgBpm });
  };

  // ── Module navigation ──────────────────────────────────────────────────
  const startModule = (mod: LearningModule) => {
    setActiveModule(mod);
    setLessonPage(0);
    setFlashcardIndex(0);
    setCardFlipped(false);
    setQuizIndex(0);
    setSelectedAnswer(null);
    setQuizScore(0);
    setScreen('lesson');
    if (!sessionActive) startSession();
  };

  const goToFlashcards = () => {
    setFlashcardIndex(0);
    setCardFlipped(false);
    setScreen('flashcard');
  };

  const nextFlashcard = () => {
    if (!activeModule) return;
    if (flashcardIndex < activeModule.flashcards.length - 1) {
      setFlashcardIndex(i => i + 1);
      setCardFlipped(false);
    } else {
      setScreen('quiz');
    }
  };

  const handleAnswer = (idx: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(idx);
    if (activeModule && idx === activeModule.quiz[quizIndex].correct) {
      setQuizScore(s => s + 1);
    }
  };

  const nextQuestion = () => {
    if (!activeModule) return;
    if (quizIndex < activeModule.quiz.length - 1) {
      setQuizIndex(i => i + 1);
      setSelectedAnswer(null);
    } else {
      stopSession();
      setScreen('results');
    }
  };

  const backToHome = () => {
    setScreen('home');
    setActiveModule(null);
    setSessionSummary(null);
  };

  // ── Derived values ─────────────────────────────────────────────────────
  const statusTone = getStatusTone(diagnostics);
  const readinessLabel = diagnostics?.estimationAvailable && metrics.bpm != null ? 'Ready' : 'Warm-up';
  const confidencePct = Math.round(clamp01(metrics.confidence) * 100);
  const qualityPct = Math.round(clamp01(metrics.signal_quality) * 100);
  const focusState = getFocusState(metrics.bpm);

  // ── Screen renderers ───────────────────────────────────────────────────

  function renderHome() {
    return (
      <div style={{ padding: '24px 0' }}>
        <h2 style={{ color: '#fff', marginBottom: '8px', fontSize: '1.4rem' }}>Choose a Learning Module</h2>
        <p style={{ color: '#888', marginBottom: '24px', fontSize: '0.9rem' }}>
          Select a topic below. NeuroLearn will track your focus as you learn.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {MODULES.map(mod => (
            <button
              key={mod.id}
              onClick={() => startModule(mod)}
              style={{
                background: '#1a1a2e', border: `2px solid ${mod.color}`,
                borderRadius: '12px', padding: '20px', cursor: 'pointer', textAlign: 'left',
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>{mod.icon}</div>
              <div style={{ color: mod.color, fontWeight: 'bold', fontSize: '1rem', marginBottom: '6px' }}>{mod.title}</div>
              <div style={{ color: '#aaa', fontSize: '0.8rem', lineHeight: '1.4' }}>{mod.description}</div>
              <div style={{ marginTop: '12px', color: '#555', fontSize: '0.75rem' }}>
                {mod.lesson.length} lessons · {mod.flashcards.length} cards · {mod.quiz.length} questions
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
      <div style={{ padding: '24px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <button onClick={backToHome} style={backBtnStyle}>Back to Modules</button>
          <span style={{ color: activeModule.color, fontWeight: 'bold' }}>{activeModule.icon} {activeModule.title}</span>
          <span style={{ color: '#555', marginLeft: 'auto', fontSize: '0.8rem' }}>Lesson {lessonPage + 1} of {activeModule.lesson.length}</span>
        </div>
        <div style={{
          background: '#1a1a2e', borderRadius: '12px', padding: '24px', marginBottom: '20px',
          borderLeft: `4px solid ${activeModule.color}`, maxHeight: '360px', overflowY: 'auto',
        }}>
          <h3 style={{ color: '#fff', marginBottom: '16px', fontSize: '1.15rem' }}>{page.title}</h3>
          <p style={{ color: '#ccc', lineHeight: '1.9', fontSize: '0.92rem', whiteSpace: 'pre-line' }}>{page.content}</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {lessonPage > 0
            ? <button onClick={() => setLessonPage(p => p - 1)} style={secondaryBtnStyle}>Previous</button>
            : <div />}
          <div style={{ flex: 1 }} />
          {!isLast
            ? <button onClick={() => setLessonPage(p => p + 1)} style={{ ...primaryBtnStyle, background: activeModule.color }}>Next</button>
            : <button onClick={goToFlashcards} style={{ ...primaryBtnStyle, background: activeModule.color }}>Start Flashcards</button>
          }
        </div>
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginTop: '20px' }}>
          {activeModule.lesson.map((_, i) => (
            <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', background: i === lessonPage ? activeModule.color : '#333' }} />
          ))}
        </div>
      </div>
    );
  }

  function renderFlashcards() {
    if (!activeModule) return null;
    const card = activeModule.flashcards[flashcardIndex];
    const isLast = flashcardIndex === activeModule.flashcards.length - 1;
    return (
      <div style={{ padding: '24px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <button onClick={() => setScreen('lesson')} style={backBtnStyle}>Back to Lesson</button>
          <span style={{ color: activeModule.color, fontWeight: 'bold' }}>{activeModule.icon} Flashcards</span>
          <span style={{ color: '#555', marginLeft: 'auto', fontSize: '0.8rem' }}>Card {flashcardIndex + 1} of {activeModule.flashcards.length}</span>
        </div>
        <p style={{ color: '#777', fontSize: '0.82rem', marginBottom: '14px', textAlign: 'center' }}>
          {cardFlipped ? 'Answer revealed! Ready for the next card?' : 'Tap the card to reveal the answer'}
        </p>
        <div
          onClick={() => setCardFlipped(f => !f)}
          style={{
            background: cardFlipped ? '#1a2a1a' : '#1a1a2e',
            border: `2px solid ${cardFlipped ? '#4CAF50' : activeModule.color}`,
            borderRadius: '16px', padding: '40px 24px', minHeight: '190px',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer', textAlign: 'center',
            marginBottom: '20px', transition: 'all 0.25s',
          }}
        >
          <p style={{ color: '#555', fontSize: '0.7rem', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
            {cardFlipped ? 'ANSWER' : 'QUESTION'}
          </p>
          <p style={{ color: '#fff', fontSize: '1.05rem', lineHeight: '1.7' }}>
            {cardFlipped ? card.back : card.front}
          </p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          {cardFlipped && (
            <button onClick={nextFlashcard} style={{ ...primaryBtnStyle, background: activeModule.color }}>
              {isLast ? 'Take Quiz' : 'Next Card'}
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginTop: '20px' }}>
          {activeModule.flashcards.map((_, i) => (
            <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', background: i <= flashcardIndex ? activeModule.color : '#333' }} />
          ))}
        </div>
      </div>
    );
  }

  function renderQuiz() {
    if (!activeModule) return null;
    const q = activeModule.quiz[quizIndex];
    return (
      <div style={{ padding: '24px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <button onClick={() => setScreen('flashcard')} style={backBtnStyle}>Back to Flashcards</button>
          <span style={{ color: activeModule.color, fontWeight: 'bold' }}>{activeModule.icon} Quiz</span>
          <span style={{ color: '#555', marginLeft: 'auto', fontSize: '0.8rem' }}>Q{quizIndex + 1} of {activeModule.quiz.length}</span>
        </div>
        <div style={{ background: '#1a1a2e', borderRadius: '12px', padding: '24px', marginBottom: '20px' }}>
          <p style={{ color: '#fff', fontSize: '1.05rem', lineHeight: '1.65', marginBottom: '20px' }}>{q.question}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {q.options.map((opt, idx) => {
              let bg = '#0f0f1a';
              let border = '#2a2a3a';
              let color = '#ccc';
              if (selectedAnswer !== null) {
                if (idx === q.correct) { bg = '#1a2a1a'; border = '#4CAF50'; color = '#4CAF50'; }
                else if (idx === selectedAnswer) { bg = '#2a1a1a'; border = '#F44336'; color = '#F44336'; }
              }
              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  disabled={selectedAnswer !== null}
                  style={{
                    background: bg, border: `2px solid ${border}`, borderRadius: '8px',
                    padding: '12px 16px', color, cursor: selectedAnswer !== null ? 'default' : 'pointer',
                    textAlign: 'left', fontSize: '0.9rem', transition: 'all 0.2s',
                  }}
                >
                  <span style={{ fontWeight: 'bold', marginRight: '8px' }}>{String.fromCharCode(65 + idx)}.</span>
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
        {selectedAnswer !== null && (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={nextQuestion} style={{ ...primaryBtnStyle, background: activeModule.color }}>
              {quizIndex < activeModule.quiz.length - 1 ? 'Next Question' : 'See Results'}
            </button>
          </div>
        )}
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginTop: '20px' }}>
          {activeModule.quiz.map((_, i) => (
            <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', background: i < quizIndex ? activeModule.color : i === quizIndex ? '#fff' : '#333' }} />
          ))}
        </div>
      </div>
    );
  }

  function renderResults() {
    if (!activeModule) return null;
    const focusScore = getFocusScore(sessionSummary?.avgBpm ?? null);
    const quizPct = Math.round((quizScore / activeModule.quiz.length) * 100);
    return (
      <div style={{ padding: '24px 0' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '8px' }}>🎉</div>
          <h2 style={{ color: '#fff', marginBottom: '4px', fontSize: '1.4rem' }}>{activeModule.title} Complete!</h2>
          <p style={{ color: '#888', fontSize: '0.9rem' }}>Here is your session breakdown</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div style={{ background: '#1a1a2e', borderRadius: '12px', padding: '20px', textAlign: 'center', border: '1px solid #2a2a3a' }}>
            <p style={{ color: '#888', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Quiz Score</p>
            <p style={{ color: '#fff', fontSize: '2.4rem', fontWeight: 'bold', marginBottom: '4px' }}>{quizPct}%</p>
            <p style={{ color: '#666', fontSize: '0.8rem' }}>{quizScore}/{activeModule.quiz.length} correct</p>
            <p style={{ color: quizPct >= 80 ? '#4CAF50' : quizPct >= 60 ? '#FF9800' : '#F44336', fontSize: '0.85rem', marginTop: '10px' }}>
              {quizPct >= 80 ? 'Excellent!' : quizPct >= 60 ? 'Good effort!' : 'Keep practicing'}
            </p>
          </div>
          <div style={{ background: '#1a1a2e', borderRadius: '12px', padding: '20px', textAlign: 'center', border: `1px solid ${focusScore.color}44` }}>
            <p style={{ color: '#888', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Focus Score</p>
            <p style={{ color: focusScore.color, fontSize: '2.4rem', fontWeight: 'bold', marginBottom: '4px' }}>{focusScore.score}</p>
            <p style={{ color: '#666', fontSize: '0.8rem' }}>{focusScore.label}</p>
            <p style={{ color: '#555', fontSize: '0.75rem', marginTop: '10px' }}>
              Avg BPM: {sessionSummary?.avgBpm != null ? Math.round(sessionSummary.avgBpm) : 'N/A'}
            </p>
          </div>
        </div>
        <div style={{ background: '#0f0f1a', borderRadius: '12px', padding: '14px', textAlign: 'center', marginBottom: '24px', border: '1px solid #1a1a2a' }}>
          <p style={{ color: '#555', fontSize: '0.75rem', marginBottom: '4px' }}>Total Study Time</p>
          <p style={{ color: '#fff', fontSize: '1.6rem', fontWeight: 'bold' }}>{sessionSummary ? formatTime(sessionSummary.duration) : '—'}</p>
        </div>
        <button onClick={backToHome} style={{ ...primaryBtnStyle, background: activeModule.color, width: '100%', padding: '12px 20px' }}>
          Back to Modules
        </button>
      </div>
    );
  }

  // ── Main render ─────────────────────────────────────────────────────────

  return (
    <div className="app">
      <header className="topbar" aria-label="Application header">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <span className="brand-name">NeuroLearn</span>
        </div>
        <span className="topbar-sep" aria-hidden="true" />
        <span className="topbar-tagline">Web3 Learning Focus Tracker</span>
        <div className="topbar-spacer" />
        <div className={`session-chip session-chip--${statusTone}`}>
          <span className={`status-dot${statusTone === 'error' ? ' error' : statusTone === 'warn' ? ' warn' : ''}`} aria-hidden="true" />
          <span className="session-chip-text">{status}</span>
        </div>
      </header>

      <main className="main">
        <section className="stage" aria-labelledby="stage-heading">
          <h1 id="stage-heading" className="visually-hidden">NeuroLearn Focus Session</h1>

          {/* LEFT: Learning content */}
          <div className="stage-video-wrap" style={{ flex: 2, minWidth: 0 }}>
            {screen === 'home' && renderHome()}
            {screen === 'lesson' && renderLesson()}
            {screen === 'flashcard' && renderFlashcards()}
            {screen === 'quiz' && renderQuiz()}
            {screen === 'results' && renderResults()}
          </div>

          {/* RIGHT: rPPG sidebar — always visible */}
          <aside className="readouts" aria-label="Focus metrics">
            <div style={{ marginBottom: '14px' }}>
              <div className="video-chrome">
                <div className="video-chrome-corners" aria-hidden="true" />
                <video ref={videoRef} autoPlay muted playsInline className="stage-video" />
                <div className="video-label">
                  <span className="video-label-dot" aria-hidden="true" />
                  Live input
                </div>
              </div>
              <p style={{ color: '#444', fontSize: '0.72rem', marginTop: '6px', textAlign: 'center' }}>
                Face the light · fill the frame · stay steady
              </p>
            </div>

            <div className="bpm-block">
              <p className="bpm-label">Heart Rate</p>
              <div className="bpm-value-row">
                <span className="bpm-number">{metrics.bpm != null ? formatMetric(metrics.bpm, 0) : '—'}</span>
                <span className="bpm-unit">BPM</span>
              </div>
              <p className="bpm-sub">{readinessLabel}</p>
            </div>

            <div style={{ padding: '10px 12px', background: '#1a1a2e', borderRadius: '8px', marginBottom: '10px', borderLeft: `4px solid ${focusState.color}` }}>
              <p style={{ color: focusState.color, fontWeight: 'bold', fontSize: '0.82rem', marginBottom: '3px' }}>{focusState.label}</p>
              <p style={{ color: '#aaa', fontSize: '0.76rem', lineHeight: '1.4' }}>{focusState.message}</p>
            </div>

            <div className="meter-group">
              <div className="meter">
                <div className="meter-head">
                  <span>Confidence</span><span className="meter-pct">{confidencePct}%</span>
                </div>
                <div className="meter-track" role="presentation">
                  <div className="meter-fill meter-fill--confidence" style={{ width: `${confidencePct}%` }} />
                </div>
              </div>
              <div className="meter">
                <div className="meter-head">
                  <span>Signal quality</span><span className="meter-pct">{qualityPct}%</span>
                </div>
                <div className="meter-track" role="presentation">
                  <div className="meter-fill meter-fill--quality" style={{ width: `${qualityPct}%` }} />
                </div>
              </div>
            </div>

            <div style={{ marginTop: '12px', padding: '10px 12px', background: '#0f0f1a', borderRadius: '8px', textAlign: 'center' }}>
              <p style={{ color: '#555', fontSize: '0.72rem', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>SESSION TIME</p>
              <p style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '8px' }}>{formatTime(sessionSeconds)}</p>
              {!sessionActive
                ? <button onClick={startSession} style={{ background: '#2196F3', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 16px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.82rem' }}>Start Session</button>
                : <button onClick={stopSession} style={{ background: '#F44336', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 16px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.82rem' }}>End Session</button>
              }
            </div>
          </aside>
        </section>
      </main>

      <footer className="footer">
        <span>NeuroLearn v2 · Powered by Elata rPPG · Web3 Focus Tracker</span>
      </footer>
    </div>
  );
}
