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
import Onboarding, { useOnboarding } from './Onboarding';
import { useTiers }        from './useTiers';
import TierGate            from './TierGate';

// ── Supabase username imports ─────────────────────────────────────────────────
import { useUsername }    from './useUsername';
import UsernamePrompt     from './UsernamePrompt';

// ── Cheat detection imports ───────────────────────────────────────────────────
import { useBpmGuard }          from './hooks/useBpmGuard';
import { logSuspiciousSession } from './lib/logSuspiciousSession';

// ─── Types ────────────────────────────────────────────────────────────────────

type Screen = 'home' | 'lesson' | 'flashcard' | 'quiz' | 'results' | 'leaderboard' | 'analytics' | 'tiergated';

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

  // ── MODULE 1: BLOCKCHAIN BASICS ───────────────────────────────────────────
  {
    id: 'blockchain', title: 'Blockchain Basics',
    description: 'Understand what blockchain is and how it works from the ground up.',
    color: '#3d9eff', icon: '⛓️',
    lesson: [
      {
        title: 'What Is a Blockchain?',
        content: `A blockchain is a new kind of database — one that no single person or company controls.

Instead of storing data on one central server, a blockchain copies and shares its records across thousands of computers worldwide. Every participant holds the same version of the truth.

Here is how it works:

• Transactions are grouped into a block
• Each block is given a unique digital fingerprint called a hash
• That hash is embedded into the next block — creating a chain
• Once recorded, no block can be changed without breaking every block after it

This makes blockchain records tamper-proof, transparent, and permanent.

Bitcoin introduced this concept in 2009. By 2026, blockchain technology underpins financial systems, identity platforms, supply chains, and decentralized applications used by millions of people globally.`
      },
      {
        title: 'How Blockchains Reach Agreement',
        content: `With no central authority, how does a blockchain decide what is true? Through a system called a consensus mechanism — a set of rules all participants follow to agree on valid transactions.

The two most important mechanisms today:

Proof of Work (PoW)
Used by Bitcoin. Computers compete to solve complex mathematical puzzles. The winner adds the next block and earns a reward. This process, called mining, is energy-intensive but has secured Bitcoin for over 15 years.

Proof of Stake (PoS)
Used by Ethereum since 2022. Validators lock up cryptocurrency as collateral. The network selects them to confirm transactions based on their stake. Far more energy-efficient — Ethereum reduced its energy use by approximately 99.9% after switching.

Both mechanisms make cheating the network extraordinarily expensive. To alter past records, an attacker would need to overpower the entire global network simultaneously.`
      },
      {
        title: 'Why Blockchain Changes Everything',
        content: `Before blockchain, digital transactions required a trusted middleman — a bank, payment processor, or government authority — to verify that the same money was not spent twice. This is known as the double-spend problem.

Blockchain solves this without any middleman. Every transaction is verified by the network, recorded permanently, and visible to all.

The implications are enormous:

Finance — Send value anywhere in the world instantly, without a bank, for a fraction of traditional fees.

Identity — Store and control your own credentials without relying on a central authority.

Ownership — Prove ownership of digital assets through an immutable public record.

Transparency — Every transaction on a public blockchain is auditable by anyone, anywhere.

By 2026, institutional investors, governments, and global corporations actively use blockchain infrastructure. Spot Bitcoin ETFs launched in the US in January 2024 attracted tens of billions in institutional capital within months — cementing blockchain's place in mainstream finance.`
      },
    ],
    flashcards: [
      {
        front: 'What is a blockchain?',
        back: 'A distributed, immutable ledger shared across thousands of computers. Transactions are grouped in blocks, cryptographically linked, and secured by network consensus. No single entity controls it.'
      },
      {
        front: 'What is a hash?',
        back: 'A unique digital fingerprint generated from a block\'s data. If any data changes, the hash changes completely — making tampering instantly detectable across the entire chain.'
      },
      {
        front: 'What is Proof of Stake?',
        back: 'A consensus mechanism where validators lock up cryptocurrency as collateral to earn the right to confirm transactions. Used by Ethereum since 2022. Far more energy-efficient than Proof of Work.'
      },
      {
        front: 'What is the double-spend problem?',
        back: 'The risk that the same digital funds could be spent more than once. Blockchain solves this by recording every transaction permanently on a public ledger verified by a global network.'
      },
      {
        front: 'What is decentralization?',
        back: 'The distribution of control across a global network of participants rather than a single authority. It removes single points of failure, censorship, and gatekeepers from financial and data systems.'
      },
    ],
    quiz: [
      {
        question: 'What makes it nearly impossible to alter historical records on a blockchain?',
        options: [
          'A government agency monitors all transactions',
          'Each block contains the cryptographic fingerprint of the previous block',
          'Blocks are password-protected by the network founder',
          'Only verified users can read the blockchain'
        ],
        correct: 1
      },
      {
        question: 'Which consensus mechanism does Ethereum use since The Merge in 2022?',
        options: [
          'Proof of Work',
          'Proof of Authority',
          'Proof of History',
          'Proof of Stake'
        ],
        correct: 3
      },
      {
        question: 'What problem did Bitcoin originally solve?',
        options: [
          'Slow broadband internet speeds',
          'The double-spend problem in digital transactions',
          'Identity theft on social media platforms',
          'International tax compliance'
        ],
        correct: 1
      },
      {
        question: 'What happened when US spot Bitcoin ETFs launched in January 2024?',
        options: [
          'They were immediately shut down by regulators',
          'They attracted tens of billions in institutional capital and became the fastest-growing ETF category in Wall Street history',
          'They had no impact on Bitcoin\'s price or adoption',
          'They were only available to government institutions'
        ],
        correct: 1
      },
      {
        question: 'Which of these best describes a public blockchain?',
        options: [
          'A private database controlled by one corporation',
          'A shared, transparent ledger anyone can read and verify, maintained by a decentralized network',
          'A government-issued digital currency system',
          'An encrypted messaging platform'
        ],
        correct: 1
      },
    ],
  },

  // ── MODULE 2: WALLETS & SECURITY ──────────────────────────────────────────
  {
    id: 'wallets', title: 'Wallets & Security',
    description: 'Learn how crypto wallets work and how to keep your assets safe.',
    color: '#a855f7', icon: '🔐',
    lesson: [
      {
        title: 'How Crypto Wallets Actually Work',
        content: `A common misconception: crypto wallets do not store your cryptocurrency. Your assets live on the blockchain. What a wallet stores is your private key — the cryptographic proof that you own those assets.

Think of it this way:
• Your wallet address = your account number (public, shareable)
• Your private key = your master password (secret, never share)
• Your seed phrase = a human-readable backup of that key (12 or 24 words)

Two fundamental types of wallets:

Hot Wallets — Connected to the internet. Examples: Trust Wallet, MetaMask, Phantom. Convenient for everyday use and interacting with DeFi applications. Slightly more exposed to online threats.

Cold Wallets — Offline hardware devices. Examples: Ledger Nano X, Trezor Model T. Your private key never touches the internet. The gold standard for securing significant holdings.

The core principle of crypto security: Not your keys, not your coins. If a third party holds your private keys — as exchanges do — your assets are an IOU, not true ownership. The collapse of FTX in 2022, which lost approximately $8 billion in customer funds, proved this catastrophically.`
      },
      {
        title: 'Seed Phrases and Key Management',
        content: `Your seed phrase is the single most important piece of information in crypto. It is a sequence of 12 to 24 random words generated when you create a wallet. Anyone with these words can access every asset in your wallet — from any device, anywhere in the world.

Protecting your seed phrase:

✓ Write it on paper immediately
✓ Store it in at least two secure physical locations
✓ Consider a fireproof, waterproof metal backup for significant holdings
✓ Verify your backup works before depositing any funds

Never:
✗ Screenshot or photograph your seed phrase
✗ Store it in cloud storage, email, or messaging apps
✗ Type it into any website or application
✗ Share it with anyone — including support agents, moderators, or developers

In 2025-2026, two advanced security upgrades have become standard for serious holders:

Passphrase (25th word) — An additional word added to your seed phrase, creating a completely separate hidden wallet. Even if your seed phrase is discovered, funds remain protected.

Multi-signature wallets — Require more than one private key to authorize transactions. Used by major organizations and high-net-worth individuals to eliminate single points of failure.`
      },
      {
        title: 'The Threat Landscape in 2026',
        content: `The majority of crypto losses come not from technical hacking but from social engineering — manipulating people into giving away their keys or approving malicious transactions.

Critical threats to know in 2026:

SIM-Swap Attacks — Criminals convince your mobile carrier to transfer your phone number to their device, intercepting SMS verification codes. Solution: remove SMS-based two-factor authentication from all crypto accounts immediately. Use an authenticator app like Google Authenticator or Authy instead.

AI-Powered Phishing — Artificial intelligence now generates flawless phishing emails and deepfake video or voice impersonations of known figures. Verify any extraordinary request through multiple official channels before acting.

Clipboard Hijacking — Malware silently replaces copied wallet addresses with an attacker's address. Always verify the first and last four characters of any address before confirming a transaction.

Fake Wallet Apps — Fraudulent apps impersonate Trust Wallet, MetaMask, and others. Only download wallets from official websites or verified app store listings linked directly from the project's official site.

Address Poisoning — Attackers send tiny transactions from addresses resembling your contacts, hoping you copy the wrong address from your history. Never copy recipient addresses from transaction history.

Rule of thumb: No legitimate project, exchange, or support team will ever ask for your seed phrase or private key through any channel, ever.`
      },
    ],
    flashcards: [
      {
        front: 'What does a crypto wallet actually store?',
        back: 'Your private key — not your cryptocurrency. The crypto lives on the blockchain. The wallet is the tool that uses your private key to authorize transactions on your behalf.'
      },
      {
        front: 'What is a seed phrase?',
        back: 'A sequence of 12 to 24 words that serves as a human-readable backup of your private key. Anyone with these words has full access to your wallet. Store it offline, in a secure physical location.'
      },
      {
        front: 'What is the difference between a hot and cold wallet?',
        back: 'Hot wallets are internet-connected — convenient for daily use but more exposed to online threats. Cold wallets store private keys offline, making them immune to remote attacks. Best practice: hot wallet for daily use, cold wallet for significant holdings.'
      },
      {
        front: 'What is a SIM-swap attack?',
        back: 'A social engineering attack where a criminal convinces your mobile carrier to transfer your phone number to their device. They then intercept SMS verification codes. Mitigate by replacing SMS 2FA with an authenticator app on all crypto accounts.'
      },
      {
        front: 'What is the core principle behind "not your keys, not your coins"?',
        back: 'If a third party — like an exchange — holds your private keys, your crypto is an IOU from them, not true ownership. If they are hacked, go bankrupt, or freeze withdrawals, you have no recourse. Self-custody is the only true ownership.'
      },
    ],
    quiz: [
      {
        question: 'What does a crypto wallet actually store?',
        options: [
          'Your cryptocurrency coins and tokens',
          'Your private key, which proves ownership of assets on the blockchain',
          'A backup copy of the blockchain',
          'Your transaction history and receipts'
        ],
        correct: 1
      },
      {
        question: 'The FTX exchange collapsed in 2022, losing approximately $8 billion in customer funds. What core lesson does this teach?',
        options: [
          'Crypto exchanges are always safe if they are large enough',
          'Governments should control all crypto platforms',
          'Keeping assets on an exchange means you do not truly own them — not your keys, not your coins',
          'Bitcoin should be banned to prevent future collapses'
        ],
        correct: 2
      },
      {
        question: 'A stranger contacts you claiming to be from your wallet\'s support team and asks for your seed phrase to resolve an issue. What do you do?',
        options: [
          'Provide it — support teams need it to verify your account',
          'Share only the first six words as a partial verification',
          'Refuse immediately — no legitimate service ever asks for your seed phrase',
          'Send it via an encrypted messaging app for safety'
        ],
        correct: 2
      },
      {
        question: 'Which two-factor authentication method is most vulnerable to SIM-swap attacks?',
        options: [
          'Google Authenticator app',
          'Hardware security key (YubiKey)',
          'SMS text message codes',
          'Biometric fingerprint verification'
        ],
        correct: 2
      },
      {
        question: 'What is clipboard hijacking malware?',
        options: [
          'Software that copies your seed phrase from cloud storage',
          'Malware that silently replaces copied wallet addresses with an attacker\'s address when you paste',
          'A virus that deletes your wallet application',
          'Spyware that records your screen while you type passwords'
        ],
        correct: 1
      },
    ],
  },

  // ── MODULE 3: DEFI FUNDAMENTALS ───────────────────────────────────────────
  {
    id: 'defi', title: 'DeFi Fundamentals',
    description: 'Explore decentralized finance — banking without banks.',
    color: '#00e5cc', icon: '🏦',
    lesson: [
      {
        title: 'What Is Decentralized Finance?',
        content: `Decentralized Finance — DeFi — rebuilds traditional financial services on blockchain. Lending, borrowing, trading, saving, and earning interest all happen through smart contracts, with no bank, broker, or intermediary involved.

Traditional finance requires:
• A bank account to access basic services
• Credit history to borrow
• Business hours to transact
• Intermediaries who can freeze or restrict your access

DeFi requires only:
• A crypto wallet
• An internet connection
• No approval from anyone

Smart contracts are the engine behind DeFi. They are self-executing programs deployed on a blockchain that automatically carry out financial transactions when predefined conditions are met. The code runs exactly as written — no human interference, no hidden terms.

By 2026, DeFi has matured from an experimental concept into a multi-hundred-billion dollar ecosystem. Layer 2 networks — built on top of Ethereum — have reduced transaction fees to fractions of a cent, making DeFi genuinely accessible to everyday users for the first time at scale.`
      },
      {
        title: 'How DeFi Protocols Work',
        content: `DeFi is built from several interconnected protocol types, each replacing a different part of the traditional financial system.

Decentralized Exchanges (DEXs)
Trade tokens directly from your wallet with no company holding your funds. DEXs use liquidity pools instead of traditional order books. Users deposit token pairs into a pool — traders swap against that pool and liquidity providers earn a share of every trading fee. Leading DEXs include Uniswap on Ethereum and Jupiter on Solana.

Lending and Borrowing
Deposit crypto to earn interest, or borrow against your holdings without a credit check. Protocols like Aave and Compound set interest rates algorithmically based on supply and demand. Loans require over-collateralization — depositing more than you borrow — to protect the protocol against price volatility.

Liquid Staking
Stake assets like ETH and receive a tradeable receipt token in return. For example, staking ETH with Lido returns stETH, which accrues daily rewards while remaining usable across DeFi. In 2025-2026, liquid staking has become one of the most widely used DeFi strategies globally.

Stablecoins
The backbone of DeFi. Dollar-pegged assets like USDT and USDC provide a stable unit of account in an otherwise volatile market. Decentralized stablecoins like DAI are backed by on-chain collateral and governed by smart contracts — resistant to centralized censorship.`
      },
      {
        title: 'DeFi Risks and Real Yields',
        content: `DeFi offers genuine financial opportunity — but carries risks that every participant must understand before committing funds.

Smart Contract Risk
DeFi protocols run on code. Bugs or vulnerabilities in that code can be exploited. Even audited contracts have been hacked — the Ronin Bridge lost $625 million in 2022, Euler Finance lost $197 million in 2023. Never deposit more than you can afford to lose into any single protocol.

Liquidation Risk
Borrowing against collateral comes with a liquidation threshold. If your collateral value drops below the required ratio due to price movements, the protocol automatically sells your collateral to repay the loan. Monitor your health factor constantly when borrowing.

Impermanent Loss
When providing liquidity to a DEX pool, significant price divergence between your deposited tokens can leave you with less value than simply holding them. Understand this before providing liquidity.

The 2026 Reality
The era of unsustainable 1,000% APY yield farming fuelled by token inflation has largely ended. Credible DeFi protocols in 2026 compete on real yield — income derived from genuine economic activity such as lending fees, trading commissions, and protocol revenue. Real yield is sustainable. Inflated token rewards are not.

Tools every DeFi user should know: DefiLlama for protocol data, Revoke.cash for managing token approvals, and Aave or Compound for entry-level lending.`
      },
    ],
    flashcards: [
      {
        front: 'What is DeFi?',
        back: 'Decentralized Finance — an ecosystem of financial services including lending, borrowing, trading, and saving built on blockchain networks. It operates through smart contracts with no banks or intermediaries required.'
      },
      {
        front: 'What is a smart contract?',
        back: 'A self-executing program deployed on a blockchain that automatically carries out transactions when predefined conditions are met. It runs exactly as written — no human intervention, no hidden terms, no possibility of interference.'
      },
      {
        front: 'How do DEX liquidity pools work?',
        back: 'Users deposit pairs of tokens into a shared pool. Traders swap against the pool rather than matching with individual buyers or sellers. Liquidity providers earn a share of every trading fee generated by the pool in proportion to their deposit.'
      },
      {
        front: 'What is liquidation risk in DeFi lending?',
        back: 'When you borrow against crypto collateral, if the collateral\'s value drops below the required threshold, the protocol automatically sells your collateral to repay the loan. Always monitor your health factor to avoid unexpected liquidation.'
      },
      {
        front: 'What is liquid staking?',
        back: 'A method of staking assets where you receive a tradeable receipt token representing your staked position plus accrued rewards. For example, staking ETH with Lido returns stETH — which earns staking yields while remaining usable across DeFi.'
      },
    ],
    quiz: [
      {
        question: 'What is the key difference between DeFi and traditional finance?',
        options: [
          'DeFi is controlled by central banks and regulated institutions',
          'DeFi requires a credit score and government-issued ID to access',
          'DeFi operates through smart contracts on blockchain with no intermediaries — accessible to anyone with a wallet and internet connection',
          'DeFi is only available to institutional investors and hedge funds'
        ],
        correct: 2
      },
      {
        question: 'What is a smart contract?',
        options: [
          'A legal agreement drafted by lawyers and stored digitally',
          'A self-executing program on a blockchain that automatically carries out transactions when conditions are met',
          'A government-regulated financial instrument traded on exchanges',
          'An AI system that manages investment portfolios automatically'
        ],
        correct: 1
      },
      {
        question: 'How do liquidity providers earn money in a DEX pool?',
        options: [
          'They receive a salary paid by the DEX development team',
          'They earn government-backed interest on their deposits',
          'They earn a share of every trading fee generated by swaps through their pool',
          'They earn rewards by reporting fraudulent transactions'
        ],
        correct: 2
      },
      {
        question: 'What happened to the era of 1,000%+ APY yield farming in DeFi?',
        options: [
          'It continues today and is the primary way people use DeFi',
          'It was banned by regulators in 2023',
          'It largely ended as unsustainable — credible protocols in 2026 compete on real yield from genuine economic activity',
          'It was replaced by government-backed stablecoin programs'
        ],
        correct: 2
      },
      {
        question: 'What is impermanent loss?',
        options: [
          'The fee paid to validators for processing DeFi transactions',
          'A potential loss for liquidity providers when the price ratio of their deposited tokens changes significantly after deposit',
          'The penalty charged for withdrawing funds before a lock-up period ends',
          'A tax applied to DeFi earnings by regulatory authorities'
        ],
        correct: 1
      },
    ],
  },

  // ── MODULE 4: NFTs & TOKENS ───────────────────────────────────────────────
  {
    id: 'nfts', title: 'NFTs & Tokens',
    description: 'Understand digital ownership, token types, real utility, and how to evaluate crypto projects.',
    color: '#f59e0b', icon: '🎨',
    lesson: [
      {
        title: 'What Is an NFT? Ownership in the Digital Age',
        content: `An NFT — Non-Fungible Token — is a unique digital asset recorded on a blockchain that proves ownership and authenticity of a specific item.

The key word is non-fungible. Here is the difference:

Fungible: A ₦1,000 note is fungible — your note and mine are identical and interchangeable.
Non-Fungible: A signed certificate of land ownership is non-fungible — it refers to one specific piece of land that cannot be swapped for another.

NFTs bring verifiable, unique ownership to the digital world.

How an NFT is created:
• Minting — Creating an NFT by recording a unique token on a blockchain. The token points to metadata (an image, file, or credential) stored on IPFS or Arweave — decentralized storage networks.
• Smart Contract — Each NFT collection is governed by a smart contract defining rules: total supply, royalty percentages, transfer conditions.
• Ownership Record — The blockchain permanently records who owns each NFT. Transfers are publicly verifiable. No company can revoke, delete, or alter this record.

⚠️ Storage matters: The NFT token is on-chain, but the linked image or file is usually stored separately. If that storage is centralized (a regular company server), the image can disappear even if the token still exists. Decentralized storage on IPFS or Arweave is far more permanent.

Key insight: NFTs do not prevent copying a digital file. But they create an immutable, verifiable proof of who owns the original — something that did not exist before blockchain.`
      },
      {
        title: 'Real NFT Utility in 2026: Beyond the Hype',
        content: `The 2021–2022 NFT bubble — where digital images sold for millions — collapsed when speculative money left the market. Most collections lost 90–99% of their value. But the technology itself did not disappear.

In 2025–2026, NFTs have genuine utility in six areas:

🎮 Gaming & Digital Ownership
Traditional games: your items belong to the company. When the game shuts down, they disappear. NFT-based games let players truly own in-game assets, trade them freely, and carry value across platforms.

🎵 Music & Creator Royalties
Smart contracts embedded in music NFTs automatically pay the creator a royalty every time the NFT is resold — impossible in traditional music licensing. African musicians can reach global collectors directly, bypass labels, and embed permanent royalty rights into their work.

🎟️ Event Tickets & Anti-Fraud
An NFT ticket is verifiably authentic and impossible to duplicate. Smart contracts can limit resale prices or pay the venue a royalty on secondary sales. Nigerian concert promoters can use this to eliminate fake tickets and recapture scalper profits.

🪪 Digital Identity & Credentials
Academic certificates, professional licences, and membership credentials can be issued as NFTs — permanently verifiable, unforgeable, and controlled by the holder.

Soulbound Tokens (SBTs) are a special type: non-transferable NFTs permanently tied to a wallet. They cannot be sold. Ideal for university degrees and professional licences. Nigeria's challenge with certificate forgery could be directly addressed by SBT-based degree verification.

🏠 Real-World Asset Certificates
Land titles, property deeds, gold certificates, and commodity ownership can be represented as NFTs — enabling fractional ownership and global tradability. African land registries exploring blockchain-based title deeds would make ownership permanently verifiable and impossible to forge.

🎯 Loyalty Programs
Brands are replacing traditional loyalty points with NFT-based rewards that customers genuinely own, can trade, and that create secondary market value.`
      },
      {
        title: 'Token Standards & How to Evaluate Projects',
        content: `Every token follows a technical standard — a set of rules defining how it is created, transferred, and used. Understanding standards tells you exactly what a token can do.

The Major Token Standards:

ERC-20 — Fungible tokens on Ethereum and all EVM chains (Arbitrum, Base, Polygon, BNB Chain). USDT, USDC, UNI, LINK, AAVE — all ERC-20. Used for currencies, governance, and utility.

ERC-721 — The original NFT standard. Each token has a unique ID. No two are alike within the collection. Used for art, credentials, event tickets, land titles.

ERC-1155 — Multi-token standard. One contract manages both fungible and non-fungible tokens. Batch transfers reduce gas costs dramatically. Ideal for gaming with complex asset economies.

TRC-20 (Tron) — USDT on Tron is the most-used token in Nigerian P2P trading. Near-zero fees ($0.01–0.10). Conceptually identical to ERC-20 but cheaper.

⚠️ Critical rule: Sending USDT on ERC-20 to a TRC-20 address (or vice versa) results in permanent loss of funds. Always verify the network before confirming any transfer.

Tokenomics Basics: How to Evaluate a Token

Tokenomics = token + economics. The economic design of a token determines whether it holds value long-term or collapses.

Three things to always check:

1. Supply — What is the maximum supply? What percentage is currently circulating? A token with only 5% circulating means 95% of tokens are locked and will eventually create sell pressure.

2. Fully Diluted Valuation (FDV) — Current price × Maximum supply. This is the project's real total valuation. If FDV is 20–50x higher than market cap, massive future dilution is coming.

3. Utility — What does the token actually do? Genuine utility (pay transaction fees, earn protocol revenue, governance that matters) sustains demand. Vague utility — like "ecosystem participation" — is a warning sign.

🚩 Red Flags: Anonymous team with large token allocation. No vesting schedule. Token used only to earn more of the same token. No verifiable revenue. Promised returns with no clear source.

✅ Green Flags: Experienced, verifiable team. 3–4 year vesting with 1-year cliff. High community allocation. Growing protocol revenue. Active GitHub.`
      },
    ],
    flashcards: [
      {
        front: 'What is the difference between fungible and non-fungible tokens?',
        back: 'Fungible: every unit is identical and interchangeable — 1 USDT = any other 1 USDT. Non-fungible: every token is unique — NFT #1 is not equal to NFT #2. Fungible tokens are currencies and utility tokens. Non-fungible tokens represent unique ownership of specific assets.'
      },
      {
        front: 'What are ERC-721 and ERC-1155, and when is each used?',
        back: 'ERC-721: the original NFT standard — each token has a unique ID. Best for 1-of-1 art, credentials, and title deeds. ERC-1155: multi-token standard managing both fungible and non-fungible tokens in one contract, with gas-efficient batch transfers. Best for gaming economies with diverse asset types.'
      },
      {
        front: 'What is a Soulbound Token (SBT)?',
        back: 'A non-transferable NFT permanently tied to one wallet — it cannot be sold or moved. Used for credentials, achievements, and verified memberships. Ideal for university degrees, professional licences, and DAO membership — solving Nigeria\'s certificate forgery problem with unforgeable on-chain verification.'
      },
      {
        front: 'What is Fully Diluted Valuation (FDV) and why does it matter?',
        back: 'FDV = current price × maximum token supply. It shows the project\'s real total valuation if all tokens were circulating today. If FDV is 20–50x higher than market cap, most tokens are still locked — and when they unlock, they create enormous sell pressure. Always check FDV before investing.'
      },
      {
        front: 'Why does TRC-20 USDT dominate African P2P trading, and what is the critical network rule?',
        back: 'TRC-20 USDT runs on Tron, with transaction fees of just $0.01–0.10 vs $5–20+ on Ethereum mainnet. It dominates Nigerian P2P platforms like Binance P2P and Noones. Critical rule: sending USDT across the wrong network (e.g. ERC-20 to a TRC-20 address) results in permanent, unrecoverable loss of funds. Always verify the network before confirming.'
      },
    ],
    quiz: [
      {
        question: 'A ₦1,000 note is fungible. What makes an NFT "non-fungible"?',
        options: [
          'It cannot be transferred to another wallet',
          'It is unique — it cannot be exchanged 1:1 with any other token, even in the same collection',
          'It is stored offline on a hardware device',
          'It is backed by a physical commodity like gold'
        ],
        correct: 1
      },
      {
        question: 'You want to send USDT to a friend in Lagos at near-zero cost. Which network should you use?',
        options: [
          'ERC-20 on Ethereum mainnet',
          'TRC-20 on Tron',
          'BTC on Bitcoin',
          'SPL on Solana'
        ],
        correct: 1
      },
      {
        question: 'A university issues your degree as a Soulbound Token (SBT). What is the key feature of an SBT?',
        options: [
          'It can be sold on OpenSea for profit',
          'It is permanently tied to your wallet and cannot be transferred or sold',
          'It expires after 10 years',
          'It requires annual renewal fees paid in ETH'
        ],
        correct: 1
      },
      {
        question: 'A new token has a market cap of $5 million but a Fully Diluted Valuation (FDV) of $500 million. What does this tell you?',
        options: [
          'The token is a guaranteed good investment at this low price',
          'Only 1% of tokens are circulating — 99% are locked and will eventually enter the market, creating future sell pressure',
          'The team has burned 99% of the supply permanently',
          'The token is backed by $500 million in real assets'
        ],
        correct: 1
      },
      {
        question: 'Which token standard allows a single smart contract to manage both fungible currencies and unique NFT items — making it ideal for blockchain games?',
        options: [
          'ERC-20',
          'ERC-721',
          'ERC-1155',
          'TRC-20'
        ],
        correct: 2
      },
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

  const { showOnboarding, completeOnboarding } = useOnboarding();

  // ── Username / Supabase ───────────────────────────────────────────────────
  const { username, showPrompt, submitUsername } = useUsername();

  const streakData      = useStreak();
  const quizTimer       = useQuizTimer();
  const tokenData       = useTokens();
  const leaderboardData = useLeaderboard();
  const tierData        = useTiers(tokenData.balance, tokenData.spendTokens);
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

  // ── Derived signal values ─────────────────────────────────────────────────
  const statusTone     = getStatusTone(diagnostics);
  const readinessLabel = diagnostics?.estimationAvailable && metrics.bpm != null ? 'Ready' : 'Warm-up';
  const confidencePct  = Math.round(clamp01(metrics.confidence) * 100);
  const qualityPct     = Math.round(clamp01(metrics.signal_quality) * 100);
  const focusState     = getFocusState(metrics.bpm);

  // ── Cheat detection ───────────────────────────────────────────────────────
  const guard = useBpmGuard(metrics.bpm, confidencePct, sessionSeconds);

  // Running average of signal quality across the session
  const qualityHistoryRef = useRef<number[]>([]);
  if (qualityPct > 0) {
    qualityHistoryRef.current.push(qualityPct);
    if (qualityHistoryRef.current.length > 60) qualityHistoryRef.current.shift();
  }
  const avgQuality = qualityHistoryRef.current.length > 0
    ? Math.round(qualityHistoryRef.current.reduce((a, b) => a + b, 0) / qualityHistoryRef.current.length)
    : 0;

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

    // ── Log suspicious session to Supabase for Elata research ────────────────
    if (guard.suspicionLevel !== 'none') {
      void logSuspiciousSession({
        username:      username ?? 'anonymous',
        country:       '',
        deviceType:    /Mobi/.test(navigator.userAgent) ? 'mobile' : 'desktop',
        sessionSeconds,
        moduleTitle:   mod?.title ?? 'unknown',
        quizScore:     mod ? Math.round((score / mod.quiz.length) * 100) : 0,
        guard,
        avgConfidence: confidencePct,
        avgQuality,
      });
    }
  };

  const startModule = (mod: LearningModule, moduleIndex: number) => {
    if (!tierData.canAccessModule(moduleIndex)) {
      setActiveModule(mod);
      setScreen('tiergated');
      return;
    }
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

  function renderHome() {
    return (
      <div style={{ paddingTop: '8px' }} className="animate-in">
        <StreakBar streakData={streakData} />
        <TokenWallet tokenData={tokenData} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-card)', border: '1px solid rgba(32,210,155,0.15)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Current Tier</span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.82rem', color: tierData.getTierByName(tierData.currentTier).color }}>
              {tierData.getTierByName(tierData.currentTier).label}
            </span>
          </div>
          {tierData.nextTier && (
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {tierData.eltaNeeded > 0 ? `${tierData.eltaNeeded} ELTA to ${tierData.nextTier.label}` : `Ready to unlock ${tierData.nextTier.label}!`}
            </span>
          )}
        </div>
        <button onClick={() => setScreen('leaderboard')} style={{ width: '100%', marginBottom: '20px', minHeight: '48px', background: 'var(--bg-card)', border: '1px solid var(--border-soft)', borderRadius: 'var(--radius-md)', color: '#00e5cc', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' }}>
          🏆 View Leaderboard
          {leaderboardData.totalSessions > 0 && (<span style={pill('rgba(0,229,204,0.08)', '#00e5cc')}>{leaderboardData.totalSessions} session{leaderboardData.totalSessions !== 1 ? 's' : ''}</span>)}
        </button>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '6px', letterSpacing: '-0.02em' }}>Choose a Module</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '16px' }}>NeuroLearn tracks your focus as you learn.</p>
        <div className="module-grid">
          {MODULES.map((mod, index) => (
            <button key={mod.id} onClick={() => startModule(mod, index)} className="module-card" style={{ '--accent': mod.color } as CSSProperties}>
              <div style={{ fontSize: '1.8rem', marginBottom: '10px', lineHeight: 1 }}>{mod.icon}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', color: mod.color, marginBottom: '6px', letterSpacing: '-0.01em' }}>{mod.title}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', lineHeight: 1.5, marginBottom: '8px' }}>{mod.description}</div>
              {!tierData.canAccessModule(index) && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '6px', padding: '3px 8px', fontSize: '10px', color: '#f59e0b', marginBottom: '8px', fontFamily: 'var(--font-mono)' }}>
                  🔒 Locked
                </div>
              )}
              <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <span>{mod.lesson.length} lessons</span><span>·</span><span>{mod.flashcards.length} cards</span><span>·</span><span>{mod.quiz.length} questions</span>
              </div>
            </button>
          ))}
        </div>
        {username && (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '20px', fontFamily: 'var(--font-mono)' }}>
            Playing as <span style={{ color: '#20d29b', fontWeight: 700 }}>{username}</span>
          </p>
        )}
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

  function renderTierGated() {
    if (!activeModule) return null;
    const moduleIndex = MODULES.findIndex(m => m.id === activeModule.id);
    return (
      <div style={{ paddingTop: '8px' }} className="animate-in">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <button className="btn-ghost" onClick={backToHome}>← Modules</button>
        </div>
        <TierGate
          tierData={tierData}
          moduleIndex={moduleIndex}
          moduleTitle={activeModule.title}
          moduleIcon={activeModule.icon}
          moduleColor={activeModule.color}
          onUnlockSuccess={() => startModule(activeModule, moduleIndex)}
        />
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <div className="app">
      {showPrompt && <UsernamePrompt onSubmit={submitUsername} />}
      {showOnboarding && <Onboarding onComplete={completeOnboarding} />}
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
            {screen === 'tiergated'   && renderTierGated()}
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
