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
    description: 'Understand what blockchain is, how it works, and why it is reshaping the world.',
    color: '#3d9eff', icon: '⛓️',
    lesson: [
      {
        title: 'What Is a Blockchain — And Why Did We Need It?',
        content: `Imagine you lend your friend 5,000 Naira. No receipt. No witness. A week later he says it never happened. You have no proof. Now scale that problem to millions of strangers transacting across borders every single day — and you start to understand why blockchain was invented.

Before blockchain, every digital transaction relied on a trusted middleman: a bank, a payment processor, a government registry. These institutions kept the "official" record of who owns what. The system worked — but it had serious weaknesses. Middlemen could be corrupt, hacked, or simply inaccessible. In 2008, during the biggest banking collapse in modern history, a person (or group) using the name Satoshi Nakamoto published a nine-page document with a radical idea: what if the record didn't belong to any single institution? What if everyone kept a copy — and the math made lying impossible?

That idea became Bitcoin. And the underlying technology became blockchain.

**So what exactly is a blockchain?**

A blockchain is a shared digital record book — called a ledger — that is copied across thousands of computers around the world simultaneously. Every time a new transaction happens, it gets bundled together with other recent transactions into a "block." That block is then mathematically sealed and attached to the previous block — forming a chain. Hence: blockchain.

Here is what makes it different from a normal database:

• No single owner. A regular bank database is owned by the bank. A blockchain is owned by everyone and no one at the same time.
• Tamper-proof. Once a block is added to the chain, changing it would require recalculating every block that came after it — across thousands of computers simultaneously. This is computationally impossible on a well-established network.
• Always on. There is no head office, no closing time, no public holiday. The network runs 24 hours a day, 7 days a week, across every timezone on earth.

**A real-world picture**

Think of it like a community notice board in a small village. Everyone in the village has an identical copy of the board. When someone posts a new notice — say, "Kofi sold his bicycle to Tariq for 50 Ghana Cedis" — every villager updates their copy at the same time. If someone later tries to change their personal copy to say the price was 10 Cedis, the rest of the village's copies immediately contradict it. The fraud fails automatically.

Blockchain works the same way — except the village has millions of participants, the notice board updates in seconds, and the math is cryptographically unbreakable.

**The double-spending problem — solved**

Digital money had one critical flaw before blockchain: a digital file can be copied. If your money is just a file on a computer, what stops you from copying it and spending it twice? This was called the double-spending problem, and it was why digital cash seemed impossible before 2008.

Blockchain solved it by making every transaction visible to the entire network instantly. The moment you send 1 Bitcoin to someone, every node on the network records it. Trying to send that same Bitcoin to a second person milliseconds later? The network rejects it — the record already exists.

Takeaway: Blockchain is a shared, tamper-proof record book maintained by thousands of computers worldwide. No single person controls it, no one can change past entries, and it runs without stopping. It solved a problem that had made trustless digital money impossible for decades.`
      },
      {
        title: 'Inside a Blockchain — How Transactions Actually Work',
        content: `Every time someone sends cryptocurrency — whether it is Bitcoin from Berlin, USDT from Bangkok, or SOL from São Paulo — a precise sequence of events happens behind the scenes. Most users never see it. But understanding it changes how you think about what "sending money" actually means.

Let's walk through a real transaction step by step.

**Step 1 — You initiate the transaction**

Sophie is a freelance designer in Amsterdam. She just completed a project for a client in Singapore who pays her in USDC (a dollar-backed stablecoin). Sophie opens her wallet app, enters the client's wallet address, types the amount, and hits send.

At this moment, her wallet uses her private key — a secret cryptographic code unique to her — to create a digital signature. This signature mathematically proves that Sophie authorized this transfer, without revealing the private key itself. Think of it like a wax seal on an envelope: anyone can verify it's yours, but only you can create it.

**Step 2 — The transaction is broadcast to the network**

Sophie's transaction is now announced to thousands of computers (called nodes) running the blockchain software around the world. Each node receives the transaction and begins checking it: Does Sophie's wallet actually hold enough USDC? Is the digital signature valid? Has this exact transaction been submitted before?

This validation happens in seconds — not because one powerful computer processes it, but because thousands of computers check it simultaneously.

**Step 3 — Transactions are grouped into a block**

Sophie's transaction gets bundled with hundreds or thousands of other pending transactions into a new block. This block also contains a timestamp, a reference to the previous block (its cryptographic hash), and a unique fingerprint of all the transactions inside it.

That reference to the previous block is crucial — it is what creates the "chain." Each block is mathematically locked to the one before it.

**Step 4 — The network reaches consensus**

Before this new block can be officially added to the blockchain, the network must agree it is valid. This agreement process is called a consensus mechanism. Different blockchains use different methods. The key point: no single authority decides. The network decides, collectively.

**Step 5 — The block is added permanently**

Once consensus is reached, the new block is added to the chain on every node simultaneously. Sophie's transaction is now permanent. It cannot be deleted, reversed, or altered. Her client's wallet now shows the USDC. Sophie's wallet no longer does.

The entire process — from Sophie hitting send to the transaction being permanently recorded — takes anywhere from a few seconds (on Solana) to a few minutes (on Bitcoin).

**What is a hash — and why does it matter?**

A hash is a fixed-length digital fingerprint generated from any piece of data. Run the sentence "Sophie sent 500 USDC" through a hash function and you get a unique string of letters and numbers. Change even one character — "Sophie sent 499 USDC" — and the hash changes completely.

Every block contains the hash of the previous block. This means if anyone tries to alter an old transaction, its hash changes — which breaks the link to the next block — which breaks every block after it. The entire chain from that point becomes invalid. Detecting tampering is instant and automatic.

Takeaway: A blockchain transaction travels through five stages — initiation, broadcast, bundling, consensus, and permanent recording. Cryptographic hashes chain every block to the one before it, making the entire history tamper-proof. The math replaces the middleman.`
      },
      {
        title: 'Consensus Mechanisms — How Thousands of Strangers Agree',
        content: `Here is a genuinely strange problem: how do you get thousands of computers, owned by different people in different countries, who have never met and don't trust each other — to agree on the same version of the truth?

This is the consensus problem. And it is the most important engineering challenge blockchain had to solve. Without consensus, every node could have a different version of the ledger. The whole system would fall apart.

The solution? Consensus mechanisms — rules that force the network to reach agreement without needing anyone in charge.

**Proof of Work — The Original Solution**

Bitcoin's answer was Proof of Work (PoW). To add a new block to the chain, computers called miners must compete to solve a complex mathematical puzzle. The puzzle has no shortcut — the only way to solve it is by making billions of random guesses per second. The first miner to find the correct answer gets to add the next block and earns a reward in Bitcoin.

This is "mining" — and it is intentionally expensive. It requires massive amounts of electricity and specialized hardware. Why make it hard? Because making it hard makes cheating unprofitable. If you wanted to alter the blockchain's history, you would need to redo the Proof of Work for every block after the one you changed — while the rest of the network keeps adding new blocks ahead of you. You would need to control more than 50% of the entire network's computing power. On Bitcoin, that would cost billions of dollars.

The trade-off: it works extraordinarily well for security — Bitcoin has run for over 15 years without a successful attack — but it consumes enormous amounts of energy. This is a genuine environmental concern the industry has grappled with seriously.

**Proof of Stake — The Energy-Efficient Alternative**

Ethereum switched to Proof of Stake (PoS) in September 2022 in an event called "The Merge" — one of the most technically complex software upgrades in history.

In Proof of Stake, there are no miners racing to solve puzzles. Instead, validators are chosen to create new blocks based on how much cryptocurrency they "stake" — meaning lock up as collateral. The more you stake, the higher your chance of being selected to validate the next block and earn the reward.

If a validator tries to cheat — approving fraudulent transactions — they lose their staked funds. This is called "slashing." The economic punishment replaces the energy cost as the deterrent against dishonesty.

The result: Ethereum's energy consumption dropped by approximately 99.9% after The Merge. The environmental argument against crypto weakened dramatically overnight.

**Other mechanisms worth knowing:**

Proof of History (PoH) — Used by Solana. Creates a cryptographic record of time, allowing the network to process over 50,000 transactions per second.

Delegated Proof of Stake (DPoS) — Token holders vote for a smaller group of trusted validators, increasing speed at some cost to decentralization.

**A worked example — Marcus in Lagos**

Marcus runs a logistics company in Lagos and is exploring blockchain to track shipments across West Africa. Which blockchain should he use?

• Maximum security, cost not a priority: Bitcoin (PoW)
• Smart contracts, DeFi integration, reasonable fees: Ethereum (PoS)
• Speed and very low fees for high-volume small transactions: Solana (PoH)

The consensus mechanism isn't just a technical detail — it shapes everything about what a blockchain can do, how fast it runs, and how much it costs to use.

Takeaway: Consensus mechanisms allow thousands of independent computers to agree on truth without trusting each other. Proof of Work uses energy expenditure as a deterrent. Proof of Stake uses locked capital. Both work — but they make different trade-offs between security, speed, energy use, and decentralization.`
      },
      {
        title: 'Types of Blockchains — Not All Chains Are the Same',
        content: `When most people hear "blockchain," they picture Bitcoin — open, public, accessible to anyone on earth. But Bitcoin is just one type. By 2026, the ecosystem has expanded into several distinct categories, each designed for different purposes, users, and trade-offs.

**Public Blockchains — Open to the World**

A public blockchain is open to anyone. Anyone can read the ledger, submit transactions, and run a node. No permission required.

Examples: Bitcoin, Ethereum, Solana, BNB Chain.

These are the most decentralized and transparent blockchains. The entire transaction history is visible to anyone with an internet connection. This transparency creates accountability and removes the need to trust any single institution.

The trade-off: public chains are slower and more expensive than private alternatives, because every node must process every transaction, and consensus must be reached across the entire global network.

**Private Blockchains — Controlled Access**

A private blockchain is operated by a single organization. Only approved participants can join, read data, or submit transactions.

Example: Hyperledger Fabric, used by IBM and enterprise clients.

These are faster and more efficient — because there are fewer nodes and trust is already established. But they sacrifice decentralization entirely. A private blockchain is, in many ways, just a more sophisticated database.

Use case: A bank processing thousands of internal transactions per second that needs auditability but not openness.

**Consortium Blockchains — Shared Governance**

A consortium blockchain sits between public and private. Governed by a group of organizations rather than one, with restricted access to approved members.

Example: R3 Corda, used by a consortium of global banks for interbank settlement.

**Layer 1 vs Layer 2 — The Scaling Solution**

Layer 1 is the base blockchain — the foundation. Bitcoin and Ethereum are Layer 1s. They handle the final settlement of all transactions and provide ultimate security. But they have limits: Ethereum's base layer processes roughly 15–30 transactions per second. Visa processes 24,000.

Layer 2 networks are built on top of Layer 1s to handle transactions faster and cheaper. They process batches of transactions off the main chain, then submit a compressed proof back to Layer 1 for final settlement. Think of Layer 1 as a supreme court — it handles the final ruling. Layer 2 is the lower court system handling daily volume.

Examples of Ethereum Layer 2s: Arbitrum, Optimism, Base, zkSync.

After Ethereum's Dencun upgrade in March 2024, Layer 2 fees dropped by over 90% — in some cases to fractions of a cent. DeFi that was previously only affordable for wealthy users became accessible to someone in Accra, Nairobi, or Jakarta sending $10.

**A worked example — Priya in Mumbai**

Priya is building a supply chain tracking system for a textile export company. She needs blockchain for auditability — but suppliers need data privacy and corporate clients require confidentiality.

Her solution: a consortium blockchain shared between her company, trusted suppliers, and buyers. Shared tamper-proof records without exposing commercially sensitive data publicly — and without public network fees.

**Modular Blockchains — The Frontier**

The newest architectural approach separates blockchain functions into specialized layers: one layer handles execution, another handles consensus, another handles data availability. This modular approach, pioneered by projects like Celestia, allows each layer to be optimized independently — potentially solving the scalability challenges that have challenged blockchain engineers for years.

Takeaway: Public blockchains offer openness and decentralization. Private and consortium chains offer control and speed. Layer 2 networks make public blockchains affordable and scalable. The right blockchain depends entirely on the problem being solved — and in 2026, there is a type for almost every use case.`
      },
      {
        title: 'Why Blockchain Matters — Real Impact in the Real World',
        content: `It is easy to talk about blockchain in the abstract — distributed ledgers, cryptographic hashes, consensus mechanisms. But the reason this technology matters is not the engineering. It is what the engineering makes possible for real people solving real problems.

As of 2026, blockchain is no longer experimental. It is an active infrastructure used by millions of people daily — for payments, savings, identity, trade finance, healthcare, and governance.

**Remittances — Cutting the Cost of Sending Money Home**

Every year, hundreds of billions of dollars flow from diaspora communities back to families in developing countries. A Nigerian nurse in London sending money to Lagos. A Guatemalan construction worker in Houston supporting his family. A Filipino worker in Dubai funding her children's school fees.

The traditional system charges 5–10% in fees and takes 3–5 business days. On a $300 transfer, that's up to $30 gone before the money arrives.

Blockchain-based stablecoin transfers — particularly USDT on Tron's TRC-20 network — cost fractions of a cent and settle in seconds. The same $300 arrives as $299.99. For families living on those transfers, it is genuinely life-changing.

**Financial Inclusion — Banking the Unbanked**

Over 1.4 billion adults globally have no bank account. The reasons vary: no ID documents, no nearby bank branch, minimum balance requirements, or distrust of institutions that have failed them before.

Blockchain requires none of that. All you need is a smartphone and internet connection. No credit history. No proof of address. No approval from a bank manager.

James is a small trader in rural Kenya with no bank account but a basic Android phone. Through a mobile crypto wallet, he can hold dollar-equivalent savings in USDT, receive payments from clients in Nairobi, and access DeFi lending protocols — all without ever walking into a bank. This was not possible five years ago.

**Real-World Asset Tokenization — Unlocking Frozen Capital**

Much of the world's wealth is locked in illiquid assets: real estate, agricultural land, government bonds, private company shares. Selling a piece of farmland in rural Brazil takes months and requires lawyers, notaries, and significant fees.

Tokenization converts these assets into blockchain tokens that can be bought, sold, and traded in fractions — instantly, globally, 24/7. BlackRock's tokenized money market fund launched on Ethereum in 2024 and exceeded $1 billion in assets within months. This is the world's largest asset manager using blockchain as financial infrastructure.

**Decentralized Identity — Owning Your Own Credentials**

In the current system, your identity is owned by institutions. Blockchain-based decentralized identity (DID) systems let individuals store verifiable credentials on-chain, controlled entirely by themselves. A refugee can prove their qualifications to a new employer without depending on a government database that may no longer exist. A student in Zimbabwe can present a blockchain-verified degree that cannot be questioned or denied.

**DePIN — Communities Owning Their Own Infrastructure**

Decentralized Physical Infrastructure Networks allow communities to deploy their own wireless nodes and earn crypto rewards for providing coverage. In areas where traditional infrastructure investment has never arrived, DePIN offers connectivity owned by the community itself.

Takeaway: Blockchain's real-world impact spans remittances, financial inclusion, asset tokenization, identity, supply chains, and community infrastructure. The technology matters not because of its elegance but because of what it enables — the ability for anyone, anywhere, to participate in global economic systems without needing permission from an institution.`
      },
      {
        title: "Blockchain's Future — What 2026 and Beyond Looks Like",
        content: `Blockchain in 2026 looks very different from blockchain in 2017 — and dramatically different from what most people still imagine when they hear the word "crypto." The industry has grown up. The speculation has matured into infrastructure. And several developments have fundamentally changed what the technology is capable of and who it serves.

**What has already changed — the facts of 2025–2026**

Bitcoin is no longer just for technologists and speculators. In January 2024, the US SEC approved spot Bitcoin Exchange-Traded Funds — allowing ordinary investors to buy exposure to Bitcoin through normal brokerage accounts, the same way they buy stocks. Within months, BlackRock's Bitcoin ETF became one of the fastest-growing ETFs in Wall Street history. Pension funds, sovereign wealth managers, and Fortune 500 treasury departments now hold Bitcoin directly.

Bitcoin reached a new all-time high of $126,080 in October 2025. The "will Bitcoin survive?" question has been answered. The question now is: what role does it play in the global financial system?

Ethereum's infrastructure costs have collapsed. After the Dencun upgrade in March 2024, transaction fees on Layer 2 networks dropped by over 90%. DeFi protocols that were previously only affordable for large transactions are now accessible at scale — including to users in Africa and Southeast Asia making small, frequent transactions.

Regulatory clarity is arriving. The EU's MiCA regulation came into full effect in 2025, providing a comprehensive legal framework for crypto businesses across 27 countries. The United States passed federal crypto legislation clarifying asset classification. The era of regulatory ambiguity is ending — which is broadly good for the industry's long-term legitimacy.

**AI and blockchain — a convergence with real consequences**

As of 2025–2026, artificial intelligence agents are executing on-chain transactions autonomously. An AI agent can manage a DeFi portfolio — depositing into lending protocols, shifting liquidity, and withdrawing in response to risk signals — all without human intervention. This convergence cuts both ways: it makes DeFi more efficient and accessible, but raises new questions about accountability and security.

**The regulatory picture globally**

Nigeria's SEC and Central Bank have updated frameworks for Virtual Asset Service Providers. Rwanda and Mauritius are positioning as crypto-friendly financial hubs. Nigeria's eNaira — Africa's first Central Bank Digital Currency — has undergone multiple upgrades. CBDCs are government-controlled, making them fundamentally different from decentralized crypto, but they represent official acknowledgment that digital money is the future.

**What to watch for the rest of 2026**

• Bitcoin's post-halving trajectory — the April 2024 halving reduced miner rewards to 3.125 BTC per block. Historically, halvings precede significant price appreciation.
• The Layer 2 wars — Arbitrum, Base, Optimism, and zkSync competing intensely for developer activity. Base, built by Coinbase, has emerged as a strong contender for consumer applications.
• Tokenized government bonds — multiple governments exploring blockchain-based treasury issuance. Could become one of the largest use cases by volume in 2–3 years.
• DePIN expansion — community-owned wireless networks, storage nodes, and energy grids gaining real-world traction globally.

**An honest assessment**

Blockchain is not a solution to every problem. User experience remains genuinely difficult — seed phrases, gas fees, and wallet addresses confuse newcomers. The industry is improving (Account Abstraction makes wallets programmable and user-friendly) but the gap with traditional apps remains real. Scalability is improving but not fully solved. Bitcoin's energy consumption is real.

Lena is a developer in Berlin building a DeFi protocol. Ahmad is a remittance sender in Dubai supporting family in Karachi. Maria is a farmer in Brazil hoping to access global capital through tokenization. All three are connected to a technology that did not exist 17 years ago and that none of them would have predicted would become this relevant to their lives.

Blockchain is infrastructure now. Not hype. Not experiment. Infrastructure — with all the messiness, progress, and ongoing work that word implies.

Takeaway: As of 2026, blockchain has transitioned from speculative technology to active global infrastructure. Bitcoin ETFs, Ethereum's scaling upgrades, regulatory frameworks, and AI convergence have all accelerated this shift. Real challenges remain — UX, scalability, energy — but the trajectory is clear: this technology is embedding itself into the foundations of global finance, identity, and infrastructure.`
      },
    ],
    flashcards: [
      {
        front: 'What is a blockchain?',
        back: 'A shared digital ledger copied across thousands of computers worldwide. Transactions are grouped into blocks, each mathematically sealed and linked to the previous one. No single entity controls it, and past records cannot be altered.'
      },
      {
        front: 'What was the double-spending problem — and how did blockchain solve it?',
        back: 'The risk that the same digital money could be copied and spent twice. Blockchain solved it by broadcasting every transaction to the entire network instantly. Once recorded, the network rejects any attempt to spend the same funds again.'
      },
      {
        front: 'What is a cryptographic hash?',
        back: 'A fixed-length digital fingerprint generated from any piece of data. Each block contains the hash of the previous block. Changing even one character in any block changes its hash — breaking the chain and making tampering instantly detectable.'
      },
      {
        front: 'What is Proof of Work (PoW)?',
        back: 'A consensus mechanism where miners compete to solve complex mathematical puzzles to add new blocks. The first to solve it earns a cryptocurrency reward. Highly secure but energy-intensive. Used by Bitcoin.'
      },
      {
        front: 'What is Proof of Stake (PoS) and how does it differ from PoW?',
        back: 'Validators are chosen to create blocks based on how much cryptocurrency they stake as collateral. Cheating results in losing staked funds ("slashing"). Uses ~99.9% less energy than Proof of Work. Used by Ethereum since The Merge in 2022.'
      },
      {
        front: 'What is the difference between Layer 1 and Layer 2 blockchains?',
        back: 'Layer 1 is the base blockchain (e.g. Bitcoin, Ethereum) that handles final settlement and security. Layer 2 networks (e.g. Arbitrum, Base) are built on top to process transactions faster and cheaper, then settle compressed proofs back to Layer 1.'
      },
      {
        front: 'What are the five stages of a blockchain transaction?',
        back: '1) Initiation — user signs with private key. 2) Broadcast — sent to network nodes. 3) Bundling — grouped with other transactions into a block. 4) Consensus — network agrees on validity. 5) Permanent recording — block added to every node simultaneously.'
      },
      {
        front: 'What is Real-World Asset (RWA) tokenization?',
        back: 'Converting physical or traditional financial assets — like property, government bonds, or agricultural land — into blockchain tokens. Allows assets to be bought, sold, and traded in fractions, globally, 24/7, without traditional intermediaries.'
      },
    ],
    quiz: [
      {
        question: 'What fundamental problem did blockchain technology solve that had previously made trustless digital money impossible?',
        options: [
          'The bandwidth problem — slow internet connections could not support digital payments',
          'The double-spending problem — digital files could be copied and spent multiple times',
          'The inflation problem — governments kept printing too much money',
          'The identity problem — no one could prove who they were online'
        ],
        correct: 1
      },
      {
        question: 'In a blockchain, what is the purpose of including the previous block\'s hash in every new block?',
        options: [
          'To speed up transaction processing by referencing past data',
          'To identify which miner created the previous block',
          'To cryptographically chain blocks together so tampering with any block breaks all subsequent blocks',
          'To store a backup copy of the previous block\'s transactions'
        ],
        correct: 2
      },
      {
        question: 'Ethereum switched from Proof of Work to Proof of Stake in 2022. What was the primary result?',
        options: [
          'Ethereum transactions became free',
          'Energy consumption dropped by approximately 99.9%',
          'Transaction fees were reduced to zero',
          'The number of validators increased by 99.9%'
        ],
        correct: 1
      },
      {
        question: 'What process does the network use to agree that a new block of transactions is valid — without any single authority deciding?',
        options: [
          'Digital signature verification by the wallet provider',
          'Government-issued approval from a regulatory body',
          'A consensus mechanism — decentralized rules all nodes follow to reach agreement',
          'Manual review by the blockchain\'s founding team'
        ],
        correct: 2
      },
      {
        question: 'A hospital group wants to share patient records across 5 partner clinics with full auditability, but cannot expose data publicly. Which blockchain type is most appropriate?',
        options: [
          'Public blockchain like Ethereum',
          'Layer 2 network like Arbitrum',
          'Consortium blockchain shared between the partner organizations',
          'Bitcoin mainnet'
        ],
        correct: 2
      },
      {
        question: 'What made Ethereum-based DeFi significantly more affordable for everyday users in 2024?',
        options: [
          'Bitcoin\'s fourth halving reduced overall crypto fees',
          'Ethereum\'s Dencun upgrade reduced Layer 2 transaction fees by over 90%',
          'African governments removed taxes on crypto transactions',
          'Ethereum switched to Proof of Stake, directly reducing gas fees'
        ],
        correct: 1
      },
      {
        question: 'What is "slashing" in a Proof of Stake blockchain?',
        options: [
          'The process of cutting transaction fees in half during network upgrades',
          'The penalty where a validator loses their staked funds for attempting to approve fraudulent transactions',
          'The mechanism for removing duplicate transactions from a block',
          'A security upgrade that permanently removes old blockchain data'
        ],
        correct: 1
      },
      {
        question: 'Which of the following best describes why blockchain is especially impactful for international remittance senders?',
        options: [
          'Blockchain transactions are anonymous, protecting senders from government surveillance',
          'Blockchain eliminates the 5–10% fees and multi-day delays of traditional remittance services, with stablecoin transfers costing fractions of a cent',
          'Blockchain converts money automatically into the recipient\'s local currency',
          'Blockchain remittances are backed by government guarantees unlike traditional wire transfers'
        ],
        correct: 1
      },
    ],
  },

  // ── MODULE 2: WALLETS & SECURITY ──────────────────────────────────────────
  {
    id: 'wallets', title: 'Wallets & Security',
    description: 'Master crypto wallets, seed phrase protection, and the 2026 threat landscape.',
    color: '#a855f7', icon: '🔐',
    lesson: [
      {
        title: 'Crypto Wallets — What They Are and How They Really Work',
        content: `Picture this: Amara, a graphic designer in Accra, just received her first crypto payment for a logo project — 50 USDT sent to her wallet address. She opens her Trust Wallet app and sees the balance. She assumes the money is "inside her phone." It is not. And understanding why matters enormously for her security.

Your crypto does not live in your wallet. It lives on the blockchain — a permanent public record maintained by thousands of computers worldwide. What your wallet actually stores is your private key: a secret cryptographic code that proves you are the rightful owner of those assets and authorizes you to move them. Think of the blockchain as a giant public safety deposit vault, and your private key as the only key that opens your box.

This distinction is not just academic. It means that if your phone is destroyed, your crypto is not gone — as long as you have your private key backup. It also means that if someone steals your private key, they can drain your wallet from anywhere in the world, on any device, instantly.

Three pieces of information define your wallet identity:

• Your wallet address — a long string of letters and numbers, like a bank account number. You share this freely to receive funds. It is public.
• Your private key — the cryptographic secret that authorizes transactions. Never share this with anyone, ever.
• Your seed phrase — 12 to 24 random words generated when you create your wallet. This is a human-readable backup of your private key. Anyone with these words can access your entire wallet from any device on earth.

The most fundamental division in crypto storage is who controls those keys.

Custodial wallets — where an exchange or company holds your keys — are convenient but risky. When FTX collapsed in November 2022, approximately $8 billion in customer funds disappeared because users had trusted the exchange with custody of their keys. Their crypto was not theirs. It was an IOU from a company that turned out to be insolvent.

Non-custodial wallets — where you hold your own keys — give you complete ownership and sovereignty. No company can freeze your funds, go bankrupt with your assets, or block your withdrawals. The trade-off is personal responsibility: if you lose your seed phrase and your device breaks, no one can help you recover your funds.

The principle the entire industry has learned the hard way: Not your keys, not your coins.

Takeaway: A crypto wallet stores your private key, not your crypto. Your assets live on the blockchain. The most important decision you make in crypto is whether you hold your own keys or trust a third party — and the consequences of that choice are absolute.`
      },
      {
        title: 'Hot Wallets, Cold Wallets, and Choosing the Right One',
        content: `Not all wallets are created equal. Beyond the custodial vs. non-custodial question, wallets also differ in how they connect to the internet — and that difference defines their security profile.

Hot wallets are internet-connected. Cold wallets are offline. That single distinction is the most important factor in protecting significant crypto holdings.

Hot Wallets — Convenience for Daily Use

Think of a hot wallet like the cash in your physical wallet. You carry some for everyday spending — enough for daily needs, not your life savings.

Mobile wallets are the most widely used hot wallet type, especially across Africa and Southeast Asia where smartphone penetration is high. Apps like Trust Wallet, MetaMask, and Phantom run on your phone, supporting multiple blockchains and giving you access to DeFi, P2P trading, and payments anywhere with a signal.

Browser extension wallets — MetaMask, Phantom, Rabby — connect seamlessly to DeFi protocols and Web3 applications directly from your desktop browser. They are essential for interacting with DEXs, NFT platforms, and lending protocols.

Desktop wallets like Exodus store your private keys on your computer's hard drive. More secure than web-based options, but dependent on keeping your computer malware-free.

The weakness of all hot wallets: they exist in internet-connected environments that are actively targeted by hackers, phishing sites, and malware. They are appropriate for amounts you are actively using — not for long-term holdings.

Cold Wallets — The Security Gold Standard

Hardware wallets are physical devices — resembling a USB drive — that store your private keys entirely offline. When you make a transaction, it is signed on the device itself, meaning your private key never touches an internet-connected computer. Even if the computer you connect it to is compromised, the key stays safe on the device.

Leading hardware wallets in 2026: Ledger Nano X (multi-chain, Bluetooth), Ledger Flex (touchscreen), Trezor Model T, Trezor Safe 3. Prices range from $50 to $200.

Critical warning: Only purchase hardware wallets directly from the manufacturer's official website — ledger.com or trezor.io. Never buy from marketplace sellers, secondhand markets, or unofficial resellers. A tampered hardware wallet can steal your funds the moment you use it.

Two newer wallet types worth knowing:

Multi-signature wallets require more than one private key to authorize any transaction — for example, 2 of 3 designated keys must sign before funds move. Used by DAOs, companies, and serious individual holders. Safe (formerly Gnosis Safe) is the industry standard. Eliminates single points of failure entirely.

Account abstraction wallets (new in 2025–2026) make wallets programmable — adding features like social recovery (regain access without a seed phrase using trusted contacts), gasless transactions, and daily spending limits. Coinbase Smart Wallet and Argent are leading examples. Expect these features to become standard across major wallets through 2026.

A practical framework: hot wallet for daily use and DeFi, hardware wallet for significant holdings, multi-sig for large organizational or high-value personal treasuries.

Takeaway: Hot wallets offer convenience but exposure to online threats. Cold wallets — especially hardware wallets — provide maximum security by keeping private keys offline. Your security setup should match the value you are protecting: treat significant holdings like savings, not spending money.`
      },
      {
        title: 'Seed Phrases — The Master Key You Cannot Afford to Lose',
        content: `Here is a scenario that plays out somewhere in the world every single day. David, a developer in Nairobi, buys his first significant amount of Bitcoin. He sets up a hardware wallet, writes his 24-word seed phrase on a piece of paper, and tucks it inside a notebook on his bookshelf. Eight months later, a small kitchen fire damages his home. The notebook — and his seed phrase — are ash. His Bitcoin is perfectly safe on the blockchain. But David can never access it again. Not ever.

Your seed phrase is simultaneously the most powerful and most fragile thing in your crypto life.

What it is: When you create any non-custodial wallet — mobile, desktop, or hardware — the wallet generates a sequence of 12 to 24 random words. This seed phrase is a human-readable encoding of your master private key. It is not specific to one device or one app. Anyone who types those words into any compatible wallet app, anywhere in the world, gains complete, permanent access to all assets in that wallet.

What this means for security is stark: your seed phrase is your crypto. Protecting it is not optional.

How to store your seed phrase correctly:

Write it down immediately — by hand, in ink — the moment you create your wallet. Never type it into any digital device for storage purposes. Never take a photo of it. Never paste it into a notes app, cloud document, or messaging platform. Digital storage is a compromise waiting to happen.

Store it in at least two physically separate, secure locations. A fireproof safe at home plus a secure location elsewhere — a trusted family member's property, a safety deposit box, a second secure location you control. If one location is destroyed, the second survives.

For holdings above roughly $1,000 equivalent, consider a metal backup. Stainless steel seed phrase storage devices — like the Cryptosteel Capsule or Keystone Tablet — survive fire up to 1,400°C, water damage, and physical impact. Paper does not.

Advanced protection — the passphrase (25th word): Major hardware wallets support an optional passphrase — an additional secret word or phrase you add to your seed phrase. This creates a completely separate wallet derived from the same seed. Even if someone finds your physical seed phrase backup, they cannot access your funds without also knowing the passphrase. Store the passphrase separately from the seed phrase. Critical warning: the passphrase is not stored on the device and cannot be recovered if forgotten. Losing it means permanent loss of funds. Memorize it or store it with extreme care.

What never to do:

✗ Store your seed phrase in any digital format — no photos, no cloud notes, no messages
✗ Type it into any website, app, or form — ever
✗ Share it with anyone — no support agent, moderator, developer, or friend
✗ Store only one copy — one fire, flood, or theft ends everything

One final principle worth understanding: verifying your backup. Before you deposit significant funds into any wallet, test your seed phrase. Restore the wallet on a second device using only the seed phrase. Confirm it works. Catching a transcription error before there is money at stake costs nothing. Catching it after could cost everything.

Takeaway: Your seed phrase is your master key to your crypto. Lose it and your funds are gone forever. Store it in multiple secure physical locations, consider metal backups for significant holdings, and never expose it to any digital system. The passphrase adds a powerful second layer — but it must be protected just as carefully.`
      },
      {
        title: 'The 2026 Threat Landscape — How Attackers Actually Steal Crypto',
        content: `The popular image of a crypto hack involves sophisticated programmers breaching encrypted servers. The reality is far more human. The overwhelming majority of crypto theft in 2025–2026 does not involve breaking cryptography at all. It involves manipulating people — convincing them to hand over their keys, click a malicious link, or approve a transaction they do not fully understand.

Understanding the specific tactics attackers use is your most important security tool.

SIM-Swap Attacks — A Critical Warning

Tunde is a crypto trader in Lagos. He uses his phone number for SMS-based two-factor authentication on his exchange account. One afternoon, a criminal calls his mobile network provider, pretends to be Tunde, and convinces a customer service agent to transfer his phone number to a new SIM card. Within minutes, the attacker intercepts an SMS verification code, resets Tunde's exchange password, and withdraws everything.

SIM-swap attacks have cost crypto users tens of millions of dollars in 2024–2025. They exploit a human weakness at mobile carriers — not any technical flaw in your wallet.

The fix is immediate and non-negotiable: remove SMS-based two-factor authentication from every crypto account right now. Replace it with an authenticator app — Google Authenticator or Authy — or a hardware security key like a YubiKey. Also contact your mobile carrier and set a SIM lock or port-out protection PIN that must be verified before any SIM changes can be made.

AI-Powered Phishing and Deepfakes — New in 2025–2026

Artificial intelligence has made phishing dramatically more dangerous. Scammers now use AI to generate emails and messages that are grammatically perfect, personally tailored to the target, and indistinguishable from legitimate communications. More alarming: deepfake technology now enables convincing video and voice impersonations of known figures — crypto educators, project founders, even people you know personally.

Real examples from 2025: a deepfake video of a well-known educator announcing a fake airdrop. A voice call impersonating a Binance support agent. A fake Zoom meeting with an AI-generated "team member" asking for a seed phrase for "verification."

Mitigation: verify any extraordinary claim through multiple official channels before acting. Check official websites, official social media accounts, and official Discord or Telegram channels independently — never through links provided in the suspicious message itself. If someone you recognize makes an unusual request, verify through a completely separate channel before responding.

Fake Wallet Apps

Fraudulent apps designed to look identical to Trust Wallet, MetaMask, and other popular wallets appear regularly on app stores and circulate via WhatsApp and Telegram groups. Once installed, they capture your seed phrase at setup and drain your funds immediately.

The Trust Wallet official app is published by DApps Platform, Inc. MetaMask is published by ConsenSys. Check the developer name in the app store before installing — and only follow download links from the project's official verified website, never from links in messages.

Clipboard Hijacking

Malware silently monitors your clipboard. When you copy a wallet address, it replaces it with the attacker's address before you paste. You confirm what looks like the right address — and the funds go to the attacker.

Always verify the first four and last four characters of any wallet address before confirming a transaction. Do not rely on the middle — attackers generate addresses that match the beginning and end of your intended recipient's address.

Address Poisoning

Attackers send tiny transactions to your wallet from addresses that closely resemble your known contacts — differing only in a few middle characters. They are hoping you will copy the "familiar-looking" address from your transaction history for a future large payment.

Never copy recipient addresses from your transaction history. Always use the full, verified address provided directly by the recipient through a trusted channel.

Pig Butchering — Long-Term Confidence Scams

This scam involves building a relationship — often romantic — with a target over weeks or months, then introducing a fake crypto investment platform that shows fictional profits. When the victim tries to withdraw, they are asked for more fees, taxes, or deposits until they are completely drained. These scams are responsible for billions in global losses annually and are operated by organized criminal networks.

If someone you met online introduces a crypto investment opportunity: stop. Research the platform independently. If you cannot withdraw freely at any time, it is a scam.

Takeaway: The 2026 threat landscape is dominated by social engineering — not technical hacking. SIM-swaps, AI-powered phishing, fake apps, clipboard hijackers, and long-term confidence scams are the primary vectors. The defense is vigilance, verification, and never sharing your seed phrase or private key with any person or system under any circumstances.`
      },
      {
        title: 'Advanced Security — Protecting Serious Holdings',
        content: `There is a meaningful difference between someone holding $200 in crypto on a mobile wallet and someone managing $10,000 or more across multiple assets and protocols. The basic security practices — strong passwords, authenticator app, hardware wallet — are necessary for everyone. But serious holders need a more systematic approach.

This lesson is for anyone who takes their crypto security beyond the basics.

Device and Operational Security

Your biggest attack surface is not your wallet — it is the environment your wallet lives in. A browser full of extensions, a phone used for social media and crypto simultaneously, a laptop that clicks email links and also connects to DeFi: these are vulnerabilities waiting to be exploited.

A dedicated device strategy eliminates this risk. Use a separate browser — Brave or Firefox — exclusively for crypto activities. Keep general browsing in a different browser entirely. Better still, use a separate device for crypto: a clean phone used only for wallet management and authenticator apps, never for social media or messaging. Minimize browser extensions to the absolute minimum — every extension is a potential attack vector, and malicious extensions have drained wallets by capturing seed phrases entered into browser-based wallets.

Bookmark every exchange, DeFi protocol, and wallet interface you use — and access them only through those bookmarks. Never type crypto URLs directly or follow links from messages. Phishing sites use domains like "uniswap-app.com" instead of "app.uniswap.org" — check the exact domain before connecting your wallet.

Smart Contract and Token Approval Security

Every time you connect a wallet to a DeFi protocol and click "Approve," you may be granting that smart contract permission to spend your tokens indefinitely — until you revoke it. Most users accumulate dozens of forgotten approvals across protocols they no longer use.

Run Revoke.cash monthly. It shows every active token approval across your wallets on Ethereum, Arbitrum, BNB Chain, and other EVM chains, and lets you revoke them in one click. This is one of the most underused security practices in DeFi.

Before confirming any significant transaction, use Rabby Wallet's built-in transaction simulation, or the Fire browser extension — both show you exactly what a transaction will do to your wallet before you sign. A few seconds of simulation has saved many wallets from malicious approvals.

Exchange Account Hardening

Enable withdrawal address whitelisting on every exchange you use. Once enabled, withdrawals can only go to pre-approved addresses — even if an attacker gains full account access, they cannot send funds to a new address. Most exchanges apply a 24–48 hour delay before newly added addresses become active, giving you time to notice and respond.

Set an anti-phishing code on Binance and any other exchange that supports it. This is a personal code that appears in every official email from the exchange. If you receive an email without your code, it is phishing — regardless of how convincing it looks.

Portfolio Risk Architecture

Advanced security extends beyond technical measures to how you structure your holdings. Never hold more than 20–25% of your crypto on a single exchange, in a single protocol, or in a single wallet. Concentration is a risk vector — one hack, one collapse, one regulatory action should not be able to destroy your entire portfolio.

Maintain stablecoin reserves — USDT or USDC — that are readily accessible and not locked in illiquid positions. Know in advance how you would convert to fiat quickly if needed. Having a plan prevents panic decisions in a crisis.

For holdings above $10,000 equivalent, consider a multi-signature wallet structure through Safe (formerly Gnosis Safe). A 2-of-3 multi-sig with keys on separate hardware wallets in separate locations means any single compromise cannot move funds.

Finally: consider what happens to your crypto if something happens to you. Document recovery instructions — without exposing the seed phrase directly — for a trusted person. Shamir's Secret Sharing (supported natively by Trezor hardware wallets) splits your seed phrase into multiple shares where only a subset is needed to recover — eliminating the single point of failure of a traditional backup.

Takeaway: Advanced security means systematic thinking about your entire setup — not just individual practices. Dedicated devices, browser hygiene, token approval management, exchange hardening, portfolio diversification, and contingency planning together create a security posture that protects against both technical attacks and the unpredictable.`
      },
      {
        title: 'Crypto Communities — How to Learn, Contribute, and Stay Safe',
        content: `No one navigates crypto alone. The technology moves faster than any individual can track, the scam landscape evolves weekly, and the knowledge gap between beginners and experienced participants is significant. Crypto communities are where that gap closes — where people learn from each other, share security warnings in real time, build relationships, and find opportunities.

But communities are also where scammers hunt for victims. Understanding both sides of community participation is essential.

Where Crypto Communities Live in 2026

X (formerly Twitter) is the primary real-time hub of global crypto conversation. Breaking news, founder announcements, market analysis, and community debates all happen here first. X Spaces — live audio conversations — have become a major format for project AMAs, educational discussions, and community calls. Follow verified project accounts, credible analysts, and experienced educators. Apply critical thinking to everything you read before acting on it.

Telegram dominates in Africa, Asia, and emerging markets. Most crypto projects maintain official Telegram groups for announcements and community chat. P2P trading groups, local Web3 communities, and scam alert channels are all active on Telegram. The critical safety rule: legitimate admins and moderators in Telegram groups will never DM you first offering investments, airdrops, or support. Any unsolicited DM from someone claiming to be from a project is almost certainly a scam.

Discord is the primary platform for DeFi protocols, NFT projects, and developer communities. Serious Web3 projects maintain active Discord servers with channels for announcements, governance, support, and discussion. Discord is where the most engaged community members participate and where project opportunities — whitelists, alpha testing, early access — are often distributed first.

In-person events have grown significantly across Africa. Organizations and community groups run city-level meetups in Lagos, Nairobi, Accra, and Johannesburg that combine education, networking, and hands-on demonstrations. These events are among the most effective tools for genuine financial empowerment at the community level — converting abstract concepts into practical skills with real people.

How to Participate Well

The strongest communities are built by members who give as much as they take. Share relevant news. Answer beginner questions. Flag scams when you see them. Support educational initiatives. A community where everyone only consumes information is a weak community — and a vulnerable one.

Ask questions freely, but always cross-reference important information before acting. One community member's opinion — however confident — is not financial advice. Use communities for learning and signal discovery, then verify through official sources and your own research before making any financial decision.

Contribute with accuracy. Before sharing news, verify it through at least one reputable source: CoinDesk, CoinTelegraph, Decrypt, The Block, or official project documentation. Misinformation in crypto communities causes real financial harm.

Report scams and suspicious activity immediately. Fake giveaways, phishing links, impersonation accounts, and suspicious solicitations should be flagged to moderators the moment you see them. Protecting the community is a shared responsibility.

Community Safety Red Flags

• Anyone DMing you first with an investment opportunity, airdrop, or support offer
• "Guaranteed returns" or "risk-free" investment platforms introduced by community contacts
• Requests to connect your wallet to a link shared in a group or DM
• Pressure to act immediately — urgency is a manipulation tactic, not a legitimate feature of any real opportunity
• Requests for your seed phrase or private key for any reason, by any person, in any channel

Trusted Information Sources

For news and market data: CoinDesk, CoinTelegraph, Decrypt, Blockworks, The Block.
For DeFi data: DefiLlama (TVL, protocol revenue), Token Terminal (protocol earnings).
For market data: CoinGecko, CoinMarketCap.
For security: Revoke.cash, Scam Sniffer browser extension, Etherscan/Solscan for transaction verification.

Takeaway: Crypto communities accelerate learning, surface real-time security warnings, and create genuine opportunities — but they also attract scammers who specifically target engaged community members. Participate generously, verify independently, and treat any unsolicited DM or investment offer with immediate suspicion. Your community is an asset. Protect it.`
      },
    ],
    flashcards: [
      {
        front: 'What does a crypto wallet actually store — and where does your crypto live?',
        back: 'A wallet stores your private key — not your cryptocurrency. Your crypto lives on the blockchain. The wallet uses your private key to prove ownership and authorize transactions. If your phone is destroyed but your seed phrase is safe, your crypto is recoverable.'
      },
      {
        front: 'What is the difference between a custodial and non-custodial wallet?',
        back: 'Custodial: a third party (like an exchange) holds your private keys. Convenient but risky — if they collapse, your funds are gone (see FTX 2022). Non-custodial: you hold your own keys. Full ownership and sovereignty, but full personal responsibility. Not your keys, not your coins.'
      },
      {
        front: 'What is the difference between a hot wallet and a cold wallet?',
        back: 'Hot wallets are internet-connected (Trust Wallet, MetaMask) — convenient for daily use but exposed to online threats. Cold wallets store private keys offline (Ledger, Trezor) — immune to remote attacks. Use hot wallets for daily spending, cold wallets for significant holdings.'
      },
      {
        front: 'What is a seed phrase and how should it be stored?',
        back: '12–24 random words that are a human-readable backup of your private key. Anyone with these words controls your wallet from any device. Write it by hand, store in two physically separate secure locations, consider metal backup for significant holdings. Never photograph, type, or share it digitally.'
      },
      {
        front: 'What is a SIM-swap attack and how do you stop it?',
        back: 'A criminal convinces your mobile carrier to transfer your phone number to their SIM, then intercepts SMS verification codes to access your accounts. Fix: remove SMS 2FA from all crypto accounts immediately. Replace with Google Authenticator, Authy, or a YubiKey. Set a SIM lock PIN with your carrier.'
      },
      {
        front: 'What is clipboard hijacking and how do you defend against it?',
        back: 'Malware silently replaces a wallet address you copy with the attacker\'s address before you paste. You confirm what looks right — funds go to the attacker. Defense: always verify the first 4 and last 4 characters of any wallet address before confirming any transaction.'
      },
      {
        front: 'What is a passphrase (25th word) and what does it protect against?',
        back: 'An optional secret word added to your seed phrase that creates a completely separate hidden wallet. Even if an attacker finds your physical seed phrase backup, they cannot access your funds without the passphrase. Warning: the passphrase cannot be recovered if forgotten — store it separately and securely.'
      },
      {
        front: 'What is address poisoning and how do you avoid it?',
        back: 'Attackers send tiny transactions from addresses that closely resemble your known contacts, hoping you copy the wrong address from your transaction history for a future large payment. Defense: never copy recipient addresses from transaction history. Always get the full address directly from the recipient through a verified channel.'
      },
    ],
    quiz: [
      {
        question: 'Amara\'s phone is stolen. She had a Trust Wallet with 200 USDT. She also wrote down her 24-word seed phrase and stored it securely at home. What happens to her funds?',
        options: [
          'The funds are lost because the wallet app was on the stolen phone',
          'The funds are safe — she can restore her wallet on a new device using her seed phrase',
          'The funds are frozen by Trust Wallet until she proves her identity',
          'The thief can access the funds because they have her phone'
        ],
        correct: 1
      },
      {
        question: 'FTX collapsed in 2022, losing approximately $8 billion in customer funds. Which wallet type were affected users relying on?',
        options: [
          'Non-custodial hardware wallets',
          'Multi-signature wallets',
          'Custodial wallets — FTX held their private keys',
          'Paper wallets stored offline'
        ],
        correct: 2
      },
      {
        question: 'You receive a DM on Telegram from someone claiming to be a Trust Wallet support agent, saying your account has an issue and asking for your seed phrase to verify ownership. What do you do?',
        options: [
          'Provide it — support teams need it to verify accounts',
          'Share only the first 6 words as partial verification',
          'Ignore and report it — no legitimate service ever asks for your seed phrase',
          'Ask them to verify their identity first, then share it'
        ],
        correct: 2
      },
      {
        question: 'What is the most effective replacement for SMS-based two-factor authentication on crypto accounts?',
        options: [
          'Email-based verification codes',
          'A biometric fingerprint on your phone screen',
          'An authenticator app like Google Authenticator or Authy, or a hardware key like YubiKey',
          'A backup phone number from a different carrier'
        ],
        correct: 2
      },
      {
        question: 'You are about to send $500 worth of crypto to a friend. You copy their address and are about to confirm. What should you do before hitting send?',
        options: [
          'Send a small test transaction of $1 first to confirm the address',
          'Verify the first 4 and last 4 characters of the pasted address match what your friend sent you',
          'Check if the address appears in your recent transaction history',
          'Nothing — copied addresses are always accurate'
        ],
        correct: 1
      },
      {
        question: 'What does Revoke.cash do, and why should DeFi users run it regularly?',
        options: [
          'It converts your crypto back to fiat currency at the best rate',
          'It audits and revokes token approvals you have granted to smart contracts — removing persistent permissions that could be exploited',
          'It monitors your wallet for suspicious incoming transactions',
          'It backs up your seed phrase to a secure cloud server'
        ],
        correct: 1
      },
      {
        question: 'A new online contact introduces you to a crypto investment platform showing strong returns. When you try to withdraw your profits, you are told to pay a "tax fee" first. What is this?',
        options: [
          'A standard regulatory requirement for crypto withdrawals',
          'A pig butchering scam — a long-term confidence scam designed to extract maximum funds before disappearing',
          'A legitimate anti-money laundering verification process',
          'A temporary liquidity issue that all platforms experience'
        ],
        correct: 1
      },
      {
        question: 'Which of the following is a green flag that a crypto community is legitimate and worth engaging with?',
        options: [
          'Admins frequently DM members with exclusive investment opportunities',
          'The community promises guaranteed returns for members who recruit others',
          'Moderators actively flag and remove scam links, answer questions transparently, and never ask for private keys',
          'New members are required to share their wallet balance to prove they are serious'
        ],
        correct: 2
      },
    ],
  },

  // ── MODULE 3: DEFI FUNDAMENTALS ───────────────────────────────────────────
  {
    id: 'defi', title: 'DeFi Fundamentals',
    description: 'Explore decentralized finance — banking without banks, borders, or business hours.',
    color: '#00e5cc', icon: '🏦',
    lesson: [
      {
        title: 'What Is DeFi — And Why Does It Exist?',
        content: `Fatima is a textile trader in Kano. Her business crosses borders constantly — suppliers in Guangzhou, buyers in London, payments flowing in multiple directions. Every international transfer costs her 8–12% in fees and takes up to five business days. Her bank requires documentation she cannot always produce, charges she cannot always afford, and operates on hours that do not align with her working day.

Traditional finance was not designed with Fatima in mind. It was designed around banks, which exist to profit from being in the middle of every transaction — approving who gets access, setting the terms, and taking their cut.

Decentralized Finance — DeFi — is what happens when you remove the bank from that equation entirely.

DeFi is an ecosystem of financial services built directly on blockchain networks. Lending, borrowing, trading, saving, and earning interest all happen through smart contracts — self-executing programs that run exactly as written, automatically, without any human intermediary. No bank approves your loan. No broker executes your trade. No payment processor clips a percentage off your transfer. The code does it all.

What this makes possible is profound. Anyone with a smartphone and an internet connection can access the same financial services that were previously available only to people with bank accounts, credit histories, and government-issued ID. This is not a minor improvement. For the 1.4 billion adults globally who are unbanked, it is the difference between participation and exclusion.

The five principles that define DeFi:

Decentralization — no single entity controls DeFi protocols. Code is law: the smart contract executes exactly as programmed.

Transparency — every transaction and every line of protocol logic is recorded on a public blockchain. Anyone can audit it, verify it, track it.

Accessibility — open to anyone with a wallet and internet connection. No credit score. No ID requirement for most protocols. No bank manager to impress.

Permissionless — anyone can use DeFi services or build new protocols on top of existing ones without requiring approval from a gatekeeper.

Self-custody — your funds never leave your wallet's control when using non-custodial protocols. You remain in control.

As of 2026, DeFi has matured from a speculative experiment into a multi-hundred-billion dollar ecosystem. Crucially, Layer 2 networks have reduced transaction fees from $20–100 on Ethereum mainnet to fractions of a cent — making DeFi genuinely accessible to everyday users in Africa, Southeast Asia, and Latin America for the first time at scale.

Takeaway: DeFi rebuilds financial services on open, transparent, permissionless blockchain infrastructure — removing banks and brokers from the equation. It exists because traditional finance systematically excludes billions of people, and the technology now exists to do better.`
      },
      {
        title: 'Smart Contracts and How DeFi Protocols Actually Work',
        content: `If DeFi is a financial system without banks, something has to enforce the rules, execute the transactions, and make sure no one cheats. That something is a smart contract — and understanding it is the key to understanding how all of DeFi actually functions.

A smart contract is a program deployed directly on a blockchain. It contains a set of rules written in code, and it executes those rules automatically when the predefined conditions are met — without any human intervention, without any possibility of interference, and without any possibility of changing its mind halfway through.

A simple example: imagine a vending machine. You insert money, select your item, and the machine dispenses it automatically. There is no cashier who could decide to give your money to someone else, no manager who could override the transaction, no closing time. The rules are mechanical and the outcome is predictable. A smart contract is the digital equivalent — but infinitely more complex, capable of handling lending, trading, insurance, and governance simultaneously.

Here is how the DeFi architecture comes together:

The blockchain is the foundation — providing the secure, immutable infrastructure where every transaction is permanently recorded and verifiable by anyone.

Smart contracts are the operational engines. A lending protocol's smart contract defines every rule: collateral requirements, interest rate calculations, liquidation thresholds, fee structures. All executed by code, automatically, 24 hours a day.

dApps (decentralized applications) are the user interfaces — websites and apps that let you interact with those smart contracts without needing to write code yourself. When you visit app.aave.com or app.uniswap.org, you are connecting your wallet to a smart contract through a web interface.

Oracles are critical connectors that bring real-world data on-chain. DeFi protocols need to know the current price of ETH, the exchange rate between USDT and USDC, the interest rate on US Treasury bills. Oracles — led by Chainlink, which secures tens of billions in DeFi value — provide this data. Oracle manipulation attacks, where bad actors feed false price data to a protocol to drain its funds, are one of the most significant DeFi security risks.

Governance tokens give the community control. Many protocols issue tokens — UNI for Uniswap, AAVE for Aave, CRV for Curve — that allow holders to vote on protocol changes, fee structures, and treasury spending. DeFi governance is a genuinely new model of organizational decision-making: the users who depend on the protocol also govern it.

Composability is what makes DeFi uniquely powerful. Because DeFi protocols are open and interoperable, they can be combined like building blocks. A single transaction can borrow on Aave, swap on Uniswap, and deposit into a yield vault — all atomically, in one operation. This composability has enabled DeFi innovation to move at a speed that traditional finance simply cannot match.

Takeaway: Smart contracts are self-executing programs that enforce DeFi rules automatically without human intermediaries. The DeFi stack — blockchain, smart contracts, dApps, oracles, and governance tokens — works together to create financial services that are transparent, composable, and accessible to anyone.`
      },
      {
        title: 'DEXs and Lending — The Two Pillars of DeFi',
        content: `DeFi contains many protocol categories, but two dominate both usage and importance: decentralized exchanges (DEXs), where you trade assets, and lending protocols, where you borrow or earn interest. Understanding both gives you the foundation to navigate everything else in DeFi.

Decentralized Exchanges — Trading Without a Counterparty

On a traditional exchange — Binance, Coinbase, Kraken — you place an order and wait for another user to take the other side. The exchange matches your buy with someone's sell. It holds your funds, controls the process, and takes a fee.

A DEX works entirely differently. Instead of matching buyers and sellers, most DEXs use Automated Market Makers (AMMs) and liquidity pools.

Here is how it works: Instead of an order book, there is a pool of two tokens — say, ETH and USDC — deposited by liquidity providers (LPs). When you want to swap ETH for USDC, you trade against that pool. A mathematical formula (x × y = k) automatically adjusts the price based on how the ratio of tokens in the pool changes after your trade. The larger your trade relative to the pool, the more the price moves against you — this is called slippage.

Liquidity providers deposit equal values of both tokens into the pool. In return, they earn a share of every trading fee generated by swaps through their pool — typically 0.05% to 1% per trade, distributed proportionally to all LPs.

Leading DEXs in 2026:
• Uniswap — the original and largest DEX, operating across Ethereum and Layer 2 networks
• PancakeSwap — dominant on BNB Chain, popular entry point for African users
• Jupiter — the leading DEX aggregator on Solana, routing trades for best price across all Solana liquidity sources
• Curve Finance — specialized for stablecoin swaps with minimal slippage
• Hyperliquid — the leading perpetual DEX for leveraged trading directly from your wallet

Lending Protocols — Borrow Without a Credit Check

DeFi lending removes the bank from the lending equation. You can deposit crypto to earn interest — or borrow against your holdings without selling them and without a credit check.

Aave is the largest lending protocol by TVL (Total Value Locked). It operates across Ethereum and multiple Layer 2 networks and supports dozens of assets. Compound pioneered algorithmic interest rates that adjust automatically based on supply and demand — when more people borrow, rates rise; when more people deposit, rates fall.

The critical concept: over-collateralization. Unlike a bank loan where your creditworthiness determines how much you can borrow, DeFi loans require you to deposit more collateral than you borrow. To borrow $100 of USDC, you might need to deposit $150 of ETH. This protects the protocol against price volatility — if your collateral value drops significantly, the protocol liquidates it automatically to repay the loan before the debt exceeds the collateral value.

A practical example: Kwame holds ETH and believes it will appreciate, but needs USDC for a business expense. Rather than selling his ETH and missing the potential upside, he deposits it on Aave as collateral and borrows USDC against it. He pays interest on the loan, uses the USDC, and when he repays, he gets his ETH back — having kept his position throughout.

Takeaway: DEXs allow token trading through liquidity pools without a counterparty or custodian. Lending protocols allow borrowing against crypto collateral without a credit check. Together they form the foundation of DeFi — and both are now accessible at near-zero cost on Layer 2 networks.`
      },
      {
        title: 'Yield, Staking, and Advanced DeFi Strategies',
        content: `Beyond basic trading and lending, DeFi offers a sophisticated ecosystem of yield-generating strategies. Understanding these tools — and their risks — separates informed participants from those who get burned chasing returns they do not understand.

Liquid Staking — Earn While Staying Flexible

Standard staking on a Proof of Stake blockchain like Ethereum requires locking your assets for a period, during which they cannot be used elsewhere. Liquid staking solves this problem.

When you stake ETH through Lido Finance — the largest liquid staking protocol — you receive stETH (staked ETH) in return. This token represents your staked position plus accrued rewards, and it updates daily. The crucial difference: stETH is a normal ERC-20 token. You can use it as collateral on Aave, swap it on Uniswap, or provide liquidity with it — all while your underlying ETH continues earning staking rewards.

Rocket Pool offers a more decentralized alternative, issuing rETH. By 2025–2026, liquid staking has become one of the most widely used DeFi strategies globally.

Restaking — The Next Layer of Yield

EigenLayer on Ethereum pioneered restaking: taking already-staked ETH or liquid staking tokens and re-using them to secure additional protocols simultaneously. Your stake now secures both Ethereum and additional services — earning rewards from multiple sources at once.

The trade-off: restaking introduces additional slashing risk. If your chosen validator misbehaves on any of the protocols being secured, you can lose a portion of your staked assets. More yield, more complexity, more risk.

Real-World Asset (RWA) DeFi — Bridging On-Chain and Off-Chain

One of the fastest-growing DeFi categories in 2025–2026 brings real-world assets onto the blockchain. Ondo Finance tokenizes US Treasury bills, giving DeFi users access to institutional-grade government bond yields entirely on-chain. Centrifuge enables businesses to tokenize real-world invoices and loans as collateral in DeFi protocols.

For Africa, RWA DeFi holds particular promise. Agricultural cooperatives, SMEs, and community lenders could theoretically tokenize local assets — trade invoices, land titles, commodity stockpiles — as on-chain collateral, accessing global capital markets that were previously completely closed to them.

Yield Farming — Chasing Returns Responsibly

Yield farming involves providing liquidity or capital to DeFi protocols in exchange for rewards — typically a combination of trading fees and governance tokens. At its peak in 2020–2021, some protocols offered annual yields of 1,000% or more — but these were funded by inflating token supplies, not real economic activity.

The 2026 reality: the era of unsustainable token-inflation yields has largely ended. Credible DeFi protocols now compete on real yield — income from genuine economic activity: lending fees, trading commissions, protocol revenue. Real yield is sustainable. Inflated token rewards are temporary and often collapse when incentives end.

Practical DeFi tools for 2026:
• DefiLlama — the definitive DeFi dashboard showing TVL, protocol revenue, and yield opportunities across all chains
• Zapper / Zerion — portfolio trackers showing all your DeFi positions across multiple chains
• Dune Analytics — community-built dashboards for verifying protocol usage independently
• Nexus Mutual — DeFi insurance; check coverage cost before depositing significant funds into any protocol

Takeaway: Liquid staking, restaking, RWA DeFi, and yield farming offer increasingly sophisticated ways to generate returns on crypto assets. The key distinction for 2026: real yield from genuine economic activity is sustainable; inflated token incentives are not. Every additional yield layer adds complexity and risk that must be understood before committing capital.`
      },
      {
        title: 'DeFi Risks — What Can Go Wrong and How to Protect Yourself',
        content: `DeFi offers genuine financial opportunity. It also carries risks that do not exist in traditional finance — risks that have cost users billions of dollars and that every participant must understand before committing real funds.

The most important thing to know upfront: smart contracts are code, and code can have bugs. Unlike a bank that can reverse a fraudulent transaction, blockchain transactions are final. If a DeFi protocol is exploited, there is no customer service line to call and no deposit insurance to compensate you. This is the fundamental trade-off of DeFi: you get sovereignty and access, but you also get personal responsibility for the outcomes.

Smart Contract Risk

The Ronin Bridge — which connected Axie Infinity's gaming ecosystem to Ethereum — was hacked for $625 million in March 2022. Euler Finance, an Ethereum lending protocol, lost $197 million in March 2023. Both were audited protocols. Both failed.

Smart contract risk cannot be eliminated, only managed. Mitigations: use protocols that have been operating without incident for at least 12–18 months; check that multiple reputable audit firms have reviewed the code; diversify across protocols rather than concentrating in one; and never deposit more than you can afford to lose entirely.

Liquidation Risk

When you borrow against crypto collateral, you are exposed to liquidation. If the price of your collateral drops below the required collateral ratio — say your $150 of ETH collateral falls to $110 against a $100 loan — the protocol automatically sells your collateral to repay the debt, often at a penalty.

Manage this by maintaining a healthy buffer above the minimum collateral ratio, monitoring your position's health factor actively (Aave shows this clearly), and setting price alerts for your collateral asset.

Impermanent Loss

This is the most misunderstood risk in DeFi. When you provide liquidity to a DEX pool — say, ETH/USDC — you deposit equal values of both tokens. If the price of ETH changes significantly after your deposit, the AMM rebalances the pool automatically, leaving you with a different ratio of tokens than you started with. When you withdraw, you may have less total value than if you had simply held both tokens without providing liquidity.

Impermanent loss is only "realized" when you withdraw — if prices return to the original ratio, it disappears. But in practice, large price moves often mean LP positions underperform simple holding. Always calculate whether the trading fees earned exceed the impermanent loss risk before providing liquidity.

The Terra/LUNA Lesson — Algorithmic Stablecoin Risk

In May 2022, TerraUSD (UST) — an algorithmic stablecoin — lost its peg to the US dollar and collapsed within days, wiping out approximately $60 billion in value and triggering a broader crypto bear market. UST was not backed by real dollars or crypto collateral; it relied on a complex algorithmic mechanism that failed catastrophically under selling pressure.

The lesson: treat any algorithmic stablecoin with extreme caution. Stick to battle-tested stablecoins — USDT, USDC, or DAI — for DeFi positions where stability matters.

Oracle Manipulation and Rug Pulls

Protocols that use price feeds from unreliable oracles can be manipulated by attackers who temporarily distort prices to drain funds. Always check that any protocol you use sources price data from Chainlink or another battle-tested decentralized oracle network.

Rug pulls — where developers drain a protocol's liquidity and disappear — are common on newly launched DEX tokens. Check DefiLlama for TVL history before depositing. Sudden TVL drops are a major red flag. Use Token Sniffer or Rugcheck.xyz to assess new token contract risk.

A practical risk framework:
• Only use protocols with 12+ months of operating history and multiple audits
• Never concentrate more than 20–25% of your DeFi holdings in any single protocol
• Check Nexus Mutual for insurance coverage cost before large deposits — high premiums signal perceived risk
• Run Revoke.cash monthly to remove old token approvals
• Use Layer 2 networks to keep fees manageable

Takeaway: DeFi risks include smart contract bugs, liquidation, impermanent loss, algorithmic stablecoin failures, oracle manipulation, and rug pulls. These risks are real and have caused billions in losses. Managing them requires diversification, protocol due diligence, active position monitoring, and never depositing more than you can afford to lose.`
      },
      {
        title: 'Exchanges, the Crypto Economy, and DeFi\'s Role in Africa',
        content: `DeFi does not exist in isolation — it sits within a broader crypto economy that includes centralized exchanges, P2P trading networks, stablecoins, and the economic reality of millions of people across Africa who are using these tools for genuinely critical financial needs. Understanding how all of this connects gives you the full picture.

Centralized vs Decentralized Exchanges — Knowing When to Use Each

Centralized exchanges (CEXs) — Binance, Coinbase, Kraken, Bybit — are companies that hold your funds and facilitate trading through internal order books. They are the primary gateway for converting fiat currency into crypto. Their advantages: fast execution, high liquidity, beginner-friendly interfaces, and fiat on-ramps that accept local payment methods.

Their critical risk — as FTX demonstrated catastrophically in November 2022 — is custodial. When FTX collapsed, $8 billion in customer funds disappeared because users had trusted the exchange with custody of their assets. The exchange held the keys. The users held IOUs.

The post-FTX essential: Proof of Reserves. Reputable exchanges now publish regularly audited proof that they hold customer assets 1:1. Check this before trusting any exchange with significant funds. Always withdraw significant holdings to a non-custodial wallet after trading.

For African users specifically, Africa-founded exchanges offer critical advantages: Yellow Card operates across 20+ African countries with local currency support; Quidax, Busha, and Roqqu are Nigerian-founded platforms with naira support and local payment methods. Noones (founded by former Paxful co-founder Ray Youssef) specifically focuses on African and Global South P2P users.

DEXs complement CEXs rather than replace them — CEXs for fiat conversion and advanced features, DEXs for DeFi access, new token discovery, and trading without KYC.

The Broader Crypto Economy — How DeFi Changes Everything

The economic impact of DeFi and the broader crypto ecosystem is most visible where traditional finance has failed most visibly — and Africa is the clearest example.

Remittances: Africa receives over $90 billion annually in remittances. Traditional channels charge 5–10% in fees. USDT transfers via Tron's TRC-20 network settle in under 30 seconds for fractions of a cent. This is not a marginal improvement — on a $300 transfer, the difference between 8% and 0.01% is the difference between $24 lost and $0.03 lost. Multiplied across millions of transfers, the economic impact is enormous.

Dollar savings access: In Nigeria, Ghana, Zimbabwe, and other high-inflation economies, USDT and USDC function as practical dollar savings accounts for millions of people who cannot access US banking. This is monetary sovereignty at the individual level — the ability to preserve the value of your labor regardless of what your central bank does to the local currency.

Financial inclusion: With over 57% of sub-Saharan Africa's adult population unbanked, DeFi protocols offer immediate access to savings, borrowing, and yield — with no bank account, no credit history, and in many cases no identity documents required.

Career and economic opportunity: The crypto and DeFi ecosystem has created entirely new categories of employment — blockchain developers, smart contract auditors, community managers, DAO contributors, crypto educators. Nigeria, Kenya, and South Africa have growing Web3 developer communities. Africa's creator and builder community is increasingly participating in the global crypto economy, earning in crypto for work done in code, content, and community.

DePIN — Crypto as Infrastructure Funding

Decentralized Physical Infrastructure Networks represent one of the most direct connections between DeFi economics and African community development. Rather than waiting for a telecom company to invest in rural connectivity, communities can deploy wireless nodes and earn crypto rewards for providing coverage. The economic model is DeFi-native: provide a service, earn a token reward, participate in network governance.

This is the vision behind projects like Helium (wireless), Filecoin (storage), and community networks like African First Network — using crypto economic incentives to fund infrastructure that traditional capital markets have never reached.

Takeaway: DeFi sits within a broader crypto economy that is reshaping financial access globally. Centralized exchanges provide the fiat on-ramps; DEXs provide the DeFi access layer; stablecoins provide the stable unit of account; and together they create a financial system that is genuinely inclusive in ways traditional banking has never been — particularly across Africa.`
      },
    ],
    flashcards: [
      {
        front: 'What is DeFi and what are its five core principles?',
        back: 'DeFi (Decentralized Finance) is an ecosystem of financial services built on blockchain via smart contracts — no banks or intermediaries. Five principles: Decentralization (no single controller), Transparency (all on-chain), Accessibility (wallet + internet = access), Permissionless (no approval needed), Self-custody (your keys, your funds).'
      },
      {
        front: 'What is a smart contract and what makes it different from a traditional contract?',
        back: 'A program deployed on a blockchain that automatically executes financial transactions when predefined conditions are met. Unlike traditional contracts: no human enforcement needed, no possibility of interference, runs exactly as written 24/7, and all logic is publicly auditable by anyone.'
      },
      {
        front: 'How does an Automated Market Maker (AMM) work?',
        back: 'Instead of matching buyers and sellers, an AMM uses liquidity pools — reserves of two tokens deposited by liquidity providers. A formula (x × y = k) automatically sets prices based on pool ratios. You trade against the pool, not a counterparty. LPs earn a share of every trading fee.'
      },
      {
        front: 'What is over-collateralization in DeFi lending and why is it required?',
        back: 'DeFi loans require depositing more collateral than you borrow — e.g., deposit $150 of ETH to borrow $100 USDC. This protects the protocol against crypto price volatility. If collateral value drops below the required ratio, the protocol automatically liquidates it to repay the loan.'
      },
      {
        front: 'What is liquid staking and what problem does it solve?',
        back: 'Liquid staking lets you stake assets (like ETH) and receive a tradeable receipt token (like stETH from Lido) that earns staking rewards while remaining usable in DeFi. It solves the illiquidity problem of standard staking where assets are locked and cannot be used elsewhere.'
      },
      {
        front: 'What is impermanent loss?',
        back: 'A risk for liquidity providers in DEX pools. When token prices diverge significantly after you deposit, the AMM rebalances the pool, leaving you with a different token ratio. When you withdraw, you may have less total value than if you had simply held the tokens. Only realized on withdrawal.'
      },
      {
        front: 'What lesson did the Terra/LUNA collapse of May 2022 teach about stablecoins?',
        back: 'TerraUSD (UST) was an algorithmic stablecoin not backed by real assets — it used a complex mechanism that failed catastrophically, wiping out ~$60 billion in days. Lesson: treat algorithmic stablecoins with extreme caution. Stick to asset-backed stablecoins (USDT, USDC, DAI) for DeFi positions.'
      },
      {
        front: 'What is real yield in DeFi and why does it matter more than token incentives?',
        back: 'Real yield is income from genuine economic activity — lending fees, trading commissions, protocol revenue — that exists regardless of token price. Token incentive yields inflate from printing new tokens and collapse when incentives end. Real yield is sustainable; inflated token rewards are temporary. In 2026, credible DeFi protocols compete on real yield.'
      },
    ],
    quiz: [
      {
        question: 'Fatima is a trader in Kano. She wants to send $500 to a supplier in Dubai without paying 8% in bank fees. Which DeFi-adjacent tool is most appropriate?',
        options: [
          'A centralized exchange futures contract',
          'A stablecoin transfer (USDT/USDC) via Tron or Solana, settling in seconds for fractions of a cent',
          'A Bitcoin Lightning Network transaction requiring a specialized node setup',
          'A DAI algorithmic stablecoin transfer via Ethereum mainnet'
        ],
        correct: 1
      },
      {
        question: 'What is the primary function of an oracle in DeFi?',
        options: [
          'To validate and add new blocks to the blockchain',
          'To bring real-world data (like asset prices) on-chain so smart contracts can use it',
          'To audit smart contract code for security vulnerabilities',
          'To provide customer support for DeFi protocol users'
        ],
        correct: 1
      },
      {
        question: 'Kwame deposits $150 of ETH on Aave as collateral and borrows $100 USDC. ETH\'s price drops 40%. What happens?',
        options: [
          'Aave contacts Kwame to negotiate new loan terms',
          'The loan is automatically cancelled and Kwame keeps both the ETH and USDC',
          'The protocol may automatically liquidate Kwame\'s ETH collateral to repay the loan if the collateral ratio falls below the threshold',
          'The interest rate on the loan increases to compensate for the price drop'
        ],
        correct: 2
      },
      {
        question: 'What is the key advantage of liquid staking over standard staking?',
        options: [
          'Liquid staking earns higher rewards than standard staking',
          'Liquid staking has no slashing risk unlike standard staking',
          'You receive a tradeable receipt token that earns staking rewards while remaining usable in DeFi — solving the illiquidity problem',
          'Liquid staking is guaranteed by government insurance schemes'
        ],
        correct: 2
      },
      {
        question: 'You provide liquidity to an ETH/USDC pool on Uniswap. ETH\'s price doubles while your liquidity is deposited. When you withdraw, you notice you have less total value than if you had just held the tokens. What is this called?',
        options: [
          'Smart contract slippage',
          'Liquidation penalty',
          'Impermanent loss',
          'Gas fee accumulation'
        ],
        correct: 2
      },
      {
        question: 'TerraUSD (UST) collapsed in May 2022, wiping out ~$60 billion. What type of stablecoin was UST, and what does this teach us?',
        options: [
          'A centralized stablecoin backed by US dollar bank reserves — teach us to use DEXs instead of CEXs',
          'An algorithmic stablecoin not backed by real assets — teach us to treat algorithmic stablecoins with extreme caution',
          'A decentralized stablecoin backed by ETH collateral — teach us that over-collateralization is too risky',
          'A government-issued CBDC — teach us to avoid government-controlled digital currencies'
        ],
        correct: 1
      },
      {
        question: 'What is "real yield" in DeFi and why do credible protocols in 2026 compete on it?',
        options: [
          'Yield paid in stablecoins rather than volatile governance tokens',
          'Income from genuine economic activity (lending fees, trading commissions) that is sustainable — unlike inflated token incentives that collapse when rewards end',
          'Yield that is guaranteed by smart contract insurance protocols',
          'Returns that are verified by government-regulated auditors'
        ],
        correct: 1
      },
      {
        question: 'After the FTX collapse in 2022, what became the industry standard for exchange transparency?',
        options: [
          'Government-mandated daily trading reports submitted to regulators',
          'Real-time blockchain publishing of all internal order book data',
          'Proof of Reserves — independently audited confirmation that exchanges hold customer assets 1:1',
          'Mandatory insurance funds covering 100% of customer deposits'
        ],
        correct: 2
      },
    ],
  },

  // ── MODULE 4: NFTs & TOKENS ───────────────────────────────────────────────
  {
    id: 'nfts', title: 'NFTs & Tokens',
    description: 'Master digital ownership, token standards, tokenomics analysis, and NFT utility in 2026.',
    color: '#f59e0b', icon: '🎨',
    lesson: [
      {
        title: 'NFTs — What They Are and How They Actually Work',
        content: `In 2021, a digital image of a cartoon ape sold for $3.4 million. A year later, the same image was worth $30,000. By 2023, most NFT collections had lost 90–99% of their value. The hype collapsed — and took a lot of people's money with it.

But here is what did not collapse: the underlying technology. NFTs are still being used to verify university degrees, issue concert tickets, power gaming economies, and register land titles. The speculation failed. The technology did not. Understanding the difference is essential for anyone engaging with NFTs in 2026.

What Is an NFT?

A Non-Fungible Token is a unique digital asset recorded on a blockchain that proves ownership and authenticity of a specific item. The key word is non-fungible.

Fungible means interchangeable. One euro is identical to any other euro — they are perfectly substitutable. One Bitcoin equals any other Bitcoin of the same denomination. These are fungible assets.

Non-fungible means unique. A signed land title for a specific plot in Lagos cannot be swapped for another — it refers to one specific, irreplaceable thing. A first-edition signed book, a specific seat at a concert, a university degree in your name: these are non-fungible.

NFTs bring this concept of verifiable, unique ownership into the digital world for the first time.

How an NFT is created and what it contains:

Minting is the process of recording a unique token on a blockchain. When an NFT is minted, the blockchain permanently records: who created it, a unique token ID that distinguishes it from every other NFT in the collection, a pointer to the item's metadata (image, traits, description), and the ownership history from that moment forward.

Smart contracts govern every NFT collection. They define: total supply, royalty percentages for the creator on every secondary sale, transfer rules, and ownership records. These rules are written in code and enforced automatically — no company can override them.

One critical technical point: the NFT token lives on-chain permanently. But the image or file it points to is typically stored separately — on IPFS, Arweave, or sometimes a centralized server. If that storage disappears, the token still exists but the image it references is gone. Always check whether an NFT's metadata is stored on decentralized storage (IPFS or Arweave) before purchasing.

The honest reality of the bubble: The 2021–2022 NFT bubble was driven by cheap money, FOMO, and speculation — not by utility. Celebrities launched collections with no genuine value. Buyers paid millions hoping to sell to someone else at a higher price. When interest rates rose in 2022 and speculative capital left the market, that dynamic collapsed completely. The technology survived. The speculation did not.

Takeaway: An NFT is a blockchain record proving unique ownership of a specific digital or physical item. The technology creates something genuinely new — verifiable digital ownership. But ownership of something worthless is still worthless. The question is always: what does this NFT actually represent, and does that thing have genuine value?`
      },
      {
        title: 'Real NFT Utility in 2026 — Six Areas Where It Actually Works',
        content: `After the bubble cleared, what remained is a clearer picture of where NFT technology creates genuine, defensible value. In 2026, six application areas have demonstrated real-world utility that goes well beyond speculation.

Gaming and Digital Ownership

This is the most compelling NFT use case and the one most likely to reach mainstream scale. In traditional games — Call of Duty, FIFA, Fortnite — your items belong to the game company. When the game shuts down, your skins, weapons, and characters disappear. You spent real money on digital items that were never yours.

NFT-based games change this fundamentally. When you earn or purchase a weapon in a blockchain game, that weapon is an NFT in your wallet. You own it. You can sell it, trade it, or carry its value to other compatible games. Axie Infinity demonstrated this model at scale — providing real income for thousands of players in the Philippines and Venezuela during the pandemic. The game had economic design problems that later emerged, but the core proof of ownership concept worked.

As of 2025–2026, higher-production blockchain games like Illuvium and Gods Unchained are building on this foundation with more sustainable token economics and genuine gameplay.

Music and Creator Royalties

Smart contracts embedded in music NFTs automatically pay the creator a royalty every time the NFT changes hands — forever. In traditional music, an artist sells a record to a label and receives a one-time payment or a small royalty percentage. Every subsequent resale of that physical record earns the artist nothing.

Platforms like Royal.io allow artists to sell fractional ownership of their music royalty streams directly to fans. Sound.xyz allows musicians to sell limited editions of songs without labels as intermediaries. For African musicians — Afrobeats artists, highlife producers, amapiano creators — this represents a genuinely different economic model for their work.

Event Tickets and Anti-Fraud

An NFT ticket is cryptographically unique, traceable to its original purchaser, and can be programmed with rules that prevent unauthorized resale above face value — or that pay the artist a percentage of every secondary sale automatically.

For Nigerian concert promoters dealing with rampant ticket forgery, NFT ticketing through protocols like GET Protocol offers a direct technical solution. The ticket exists on a public blockchain. Its authenticity can be verified instantly by anyone with the contract address. It cannot be duplicated.

Digital Identity and Credentials

Soulbound Tokens (SBTs) — proposed by Vitalik Buterin in 2022 — are a non-transferable variant of NFTs permanently tied to one wallet. They cannot be sold or moved. This makes them ideal for representing credentials that should be permanently associated with a person: university degrees, professional licences, community membership, DAO governance rights.

Nigeria's challenge with certificate forgery — a documented, costly problem — could be directly addressed by SBT-based degree verification. An on-chain credential issued by a university is verifiable by any employer anywhere in the world, instantly, without calling anyone.

Real-World Asset Certificates

NFTs are increasingly used as digital certificates for tokenized physical assets. A land title issued as an NFT on a public blockchain is permanently verifiable and theoretically impossible to duplicate or forge. Several African governments are exploring blockchain land registries for exactly this reason — property disputes cost the continent billions annually.

Loyalty Programs and Brand Communities

Starbucks replaced its traditional loyalty points with NFT-based stamps through its Odyssey program. Members collect, trade, and redeem them for real rewards. Unlike traditional points that expire and have no secondary market, NFT rewards are owned by the customer and can be sold. Any business running a loyalty program can upgrade to this model.

Takeaway: In 2026, NFT utility is concentrated in gaming ownership, creator royalties, event ticketing, digital credentials, real-world asset certificates, and loyalty programs. These applications share a common feature: they solve a real problem that traditional systems handle poorly. Speculation failed. Genuine utility remains.`
      },
      {
        title: 'Token Standards — The Technical Rules Every Token Follows',
        content: `Every crypto token follows a set of technical rules called a token standard. These standards define how a token is created, transferred, approved for spending, and queried for balance. Understanding them is not just academic — knowing which standard a token uses tells you what it can do, how much it costs to send, and what security risks to watch for.

Think of token standards like electrical socket standards. A Nigerian Type D plug works in every socket built to that standard, anywhere it is installed. A Type G (UK) plug does not — even though both carry electricity. Token standards work the same way: a wallet built to support ERC-20 automatically supports every ERC-20 token ever created.

The Core Distinction: Fungible vs. Non-Fungible

Every token standard falls into one of two categories.

Fungible tokens: every unit is identical and interchangeable. 1 USDT equals any other 1 USDT. They are divisible — you can send 0.001 of them. Used for currencies, governance, and utility.

Non-fungible tokens: every token is unique. NFT #1 is not equal to NFT #2 even in the same collection. They are indivisible — you own them whole or not at all. Used for art, gaming items, credentials, and title deeds.

ERC-20 — The Universal Fungible Standard

Proposed in 2015, ERC-20 is the most widely deployed token standard in existence. Every EVM-compatible chain uses it: Ethereum, Arbitrum, Base, Optimism, Polygon, BNB Chain. USDT, USDC, DAI, UNI, AAVE, LINK — all ERC-20.

Security note: ERC-20's approval function lets you authorize smart contracts to spend your tokens. Approving unlimited amounts is risky — if that contract is exploited, your entire token balance can be drained. Run Revoke.cash monthly to audit and remove unnecessary approvals.

ERC-721 — The Original NFT Standard

Proposed in 2017, ERC-721 gives every token a unique ID that distinguishes it from every other token in the collection. Token #1 and Token #2 are different assets even within the same smart contract. Ownership is tracked per token ID, not per balance. Used for unique NFTs, ENS domain names, Uniswap v3 liquidity positions, academic credentials.

Soulbound Token variant: a non-transferable ERC-721 where transfer functions are disabled. Permanently tied to one wallet. Ideal for credentials and memberships.

ERC-1155 — The Multi-Token Standard

Proposed in 2018, ERC-1155 allows a single smart contract to manage both fungible and non-fungible tokens simultaneously. One contract handles the in-game currency, the common weapons, and the unique legendary items all at once. Batch transfers — sending multiple token types in a single transaction — dramatically reduce gas costs. The standard of choice for complex gaming economies.

TRC-20 — Africa's Most Important Standard

Tron's fungible token standard is technically nearly identical to ERC-20 — but transaction fees are $0.01–0.10 compared to $5–20 on Ethereum mainnet during congestion. This single economic difference explains why TRC-20 USDT dominates Nigerian P2P trading. The same dollar savings, the same stablecoin, a fraction of the cost.

Critical rule: USDT exists on multiple networks — ERC-20, TRC-20, BEP-20, SPL on Solana. Sending USDT on the wrong network — for example, sending ERC-20 USDT to a TRC-20 address — results in permanent, unrecoverable loss of funds. Always verify the network before confirming any transfer.

SPL Tokens — Solana's Standard

Solana uses SPL (Solana Program Library) tokens instead of Ethereum's ERC standards. USDC on Solana, Jupiter (JUP), Raydium (RAY) — all SPL. Solana's Metaplex standard governs NFTs. Compressed NFTs (cNFTs) — Solana's 2023 innovation — reduced minting costs by over 1,000x, making mass credential and ticket distribution genuinely affordable.

Bitcoin Ordinals — NFTs on Bitcoin

Launched in January 2023, Ordinals inscribe data directly onto individual satoshis — the smallest Bitcoin unit. Unlike ERC-721 NFTs that point to external storage, Ordinals store everything on-chain on Bitcoin itself. Maximum permanence, higher cost, limited flexibility.

Takeaway: Token standards are the technical rules defining how tokens behave. ERC-20 is the universal fungible standard. ERC-721 creates unique NFTs. ERC-1155 handles mixed asset economies. TRC-20 dominates African stablecoin transfers due to near-zero fees. Sending tokens on the wrong network causes permanent, unrecoverable loss — always verify the network.`
      },
      {
        title: 'Tokenomics — Reading Token Economics Like a Professional',
        content: `Imagine two projects. Project A has a beautiful website, a bold whitepaper, and a token trading at $0.50 with a market cap of $25 million. Project B is less flashy but has 3 years of verifiable operating history, growing protocol revenue, a team with locked tokens, and a fully diluted valuation that is reasonable. Which is the better investment?

Most beginners choose Project A because it looks exciting. Most professionals choose Project B because the numbers make sense. Tokenomics is the discipline that separates those two decisions.

Tokenomics (token + economics) refers to the complete economic system governing a token: how many exist, how they are distributed, how new ones are created or destroyed, what the token is used for, and how all of these factors create incentives — or destroy them.

Supply: The Foundation of Everything

Maximum supply is the absolute hard cap of tokens that will ever exist. Bitcoin's is 21 million — no more will ever be created. A hard cap creates predictable scarcity.

Circulating supply is the number of tokens actively tradeable right now. This is what determines the market cap you see on CoinGecko.

Market cap = current price × circulating supply.
Fully Diluted Valuation (FDV) = current price × maximum supply.

This distinction is critical and widely misunderstood. A token launching at $1 with 10 million tokens circulating has a market cap of $10 million. But if the total supply is 1 billion tokens, the FDV is $1 billion. The remaining 990 million tokens are locked — held by the team, investors, and reserves — and they will eventually unlock and enter the market. That is $990 million of potential sell pressure that the $10 million market cap does not reflect.

Never invest in any project without checking its FDV. If FDV is 20–50x higher than market cap, significant dilution is coming.

Token Distribution: Who Holds What

How tokens are allocated at launch reveals the project's true priorities.

Standard healthy ranges: team and founders 10–20% (vested over 3–4 years with a 1-year cliff where no tokens are accessible for the first 12 months); investors 15–25%; ecosystem and treasury 20–40% (governed by DAO, not centralized team); public sale and community as large as possible.

Red flags: team allocation above 25–30% with short vesting; no vesting schedule disclosed; private investors holding large allocations at deep discounts; treasury controlled entirely by the founding team; anonymous team with large token allocations.

Vesting Schedules and Unlock Risk

Vesting schedules control when locked tokens become available. A cliff is a period during which no tokens unlock at all. After the cliff, tokens release gradually (linear vesting) or in batches.

Use TokenUnlocks.app to check upcoming release schedules before investing in any project. If 40% of total supply unlocks in three months for team and VC holders who bought at 10 cents and the token is currently at $2, that represents enormous sell pressure. Position accordingly.

Token Utility: The Foundation of Sustainable Demand

A token's utility — what it is genuinely used for — determines whether demand for it is real or speculative. The strongest utility: gas tokens required for every transaction on a network (ETH on Ethereum — inescapable demand). Strong utility: governance over protocols generating real revenue; staking to participate in network security; protocol revenue share. Weak utility: governance over a protocol generating no revenue; vaguely described "ecosystem participation"; tokens used only to earn more of the same token.

Protocol Revenue: The New Standard for 2026

Use Token Terminal to check protocol revenue — fees paid to the protocol itself from genuine economic activity. A protocol with verifiable, growing revenue is sustainable. A protocol generating no revenue whose token yield depends entirely on token inflation is not. If a project does not appear on Token Terminal with measurable revenue, treat it with significant caution.

Takeaway: Professional tokenomics analysis checks four things: the FDV versus market cap (future dilution risk), token distribution (who holds what and when does it unlock), token utility (is demand real or speculative), and protocol revenue (is there genuine economic activity). Projects that pass all four checks are meaningfully better than those that do not.`
      },
      {
        title: 'How to Evaluate a Crypto Project — A Professional Framework',
        content: `Thousands of new tokens launch every month. The overwhelming majority will fail — through abandonment, fraud, poor design, or simply running out of momentum. A small number will create genuine value. The skill of separating them is one of the most practically valuable things you can develop as a crypto participant.

This lesson gives you a systematic evaluation framework used by serious investors and analysts.

Start with the Team

The team is the single most important factor in early-stage crypto projects. Technology can be copied. Code can be forked. Teams with specific knowledge, networks, and execution track records cannot.

Questions to answer: Are the founders and key team members publicly identified (doxxed) with verifiable real-world identities and professional histories? Have they successfully built and shipped products before? Are they active and communicative with the community? Do they have any history of scams, abandoned projects, or fraud?

An anonymous team with large token allocations and no track record is the single highest-risk combination in crypto. It is not necessarily a scam — some legitimate teams operate pseudonymously — but the risk profile demands proportionally higher scrutiny of every other element.

Read the Whitepaper — But Critically

The whitepaper is the project's foundational document. Read: the introduction (what specific problem does this solve, and is the problem real?); the technology section (what blockchain, what consensus mechanism, is it credible?); the use case section (who uses this, and why would they choose this over alternatives?); the tokenomics section (supply, distribution, vesting — cross-reference with on-chain data).

Check the GitHub. A whitepaper describes what the team intends to build. The GitHub repository shows what they have actually built. No GitHub activity in months is a significant warning sign. Open-source code that multiple contributors are actively developing signals genuine momentum.

Analyse the Market Position

Even excellent technology fails in a market dominated by a stronger competitor. Who are the top 3 direct competitors? How does this project's TVL, protocol revenue, and active user growth compare? Does it have a genuine competitive advantage — network effects, superior technology, liquidity depth, regulatory compliance, brand — that is difficult to replicate?

Use DefiLlama for TVL comparison across protocols. Use Token Terminal for revenue comparison. Use Dune Analytics to verify active user counts on-chain rather than relying on team-reported numbers.

Verify On-Chain Data

Blockchain data is public and permanent. Every claim a team makes about usage, growth, and community can be verified independently. This is one of crypto's most powerful advantages over traditional investment research — and most people do not use it.

Check: active addresses (daily unique wallets interacting with the protocol — rising is healthy, declining signals loss of interest); transaction volume (organic growth versus artificial wash trading); top token holder distribution (if the top 10 wallets hold 70%+ of supply, manipulation risk is high); smart contract interaction frequency (high frequency signals genuine use).

Apply the Red Flag Checklist

If multiple red flags appear simultaneously, extreme caution or avoidance is warranted:
• Anonymous team with large token allocation and no track record
• No audit from a reputable firm (CertiK, Hacken, Trail of Bits)
• FDV dramatically higher than market cap with near-term unlocks
• Team or VC allocation above 30% with short vesting
• Token utility described vaguely — "ecosystem participation"
• No verifiable protocol revenue on Token Terminal
• Promises of guaranteed returns or fixed high APY with no clear revenue source
• No on-chain activity verifiable via block explorer
• Closed-source code with no public GitHub

Green flags that indicate quality: doxxed, experienced team with verifiable track record; multiple independent audits publicly available; genuine protocol revenue growing over time; conservative team allocation under 20% with 3–4 year vesting; large community and ecosystem allocation governed by DAO; active GitHub with frequent commits from multiple contributors; growing active user base verifiable on-chain.

A practical exercise: take any token you are considering. Search it on CoinGecko for market cap and FDV. Search it on Token Terminal for protocol revenue. Search it on DefiLlama for TVL history. Check its GitHub for recent activity. If all four return positive signals, you have meaningfully better information than 95% of retail participants making the same decision based on social media and price charts alone.

Takeaway: Professional crypto project evaluation covers five areas: team credibility and track record, whitepaper quality and GitHub activity, competitive market position, on-chain data verification, and red flag screening. No single factor is conclusive — the combination builds conviction. Projects that pass a thorough evaluation are meaningfully lower-risk than those evaluated only on price momentum and community hype.`
      },
      {
        title: 'NFTs, Tokens, and the African Opportunity',
        content: `Technology has no inherent geography. But its impact is not evenly distributed — it concentrates most powerfully where existing systems are most broken. For NFTs and token economies, Africa is one of the most significant opportunity zones in the world.

Not because Africa needs charity. Because Africa has problems that these technologies are specifically suited to solve.

The Credential Problem — and the NFT Solution

Nigeria loses an estimated billions of naira annually to certificate forgery. Fake university degrees, fraudulent professional certificates, and forged credentials cost employers, institutions, and legitimate graduates enormously. The problem exists because credential verification relies on institutions that can be bribed, records that can be falsified, and processes that are slow and expensive.

A blockchain-based credential system changes the verification equation entirely. A degree issued as a Soulbound Token — permanently tied to the graduate's wallet, recorded immutably on a public blockchain — can be verified by any employer anywhere in the world in seconds. The contract address is public. The record cannot be altered. No call to the university is required.

Several African universities are beginning to explore exactly this. The technology exists. The implementation is a question of institutional will and technical capacity.

The Creator Economy — Direct Access to Global Markets

Africa has produced some of the world's most culturally influential music — Afrobeats, amapiano, highlife, Afro-fusion — yet African artists have historically received a fraction of the value their work generates. Labels take large cuts. Streaming platforms pay fractions of a cent per stream. Distributors and promoters extract value at every step.

Music NFTs and creator platforms offer a different model. An Afrobeats producer in Lagos can mint 100 limited-edition copies of an unreleased track as NFTs, sell them directly to global fans for $50 each, receive payment in USDC instantly, and embed a 10% royalty into the smart contract so every future resale pays them automatically — forever.

This is not theoretical. Artists globally are doing this today. For African creators with globally resonant work and historically broken distribution infrastructure, the opportunity is substantial.

The Land Registry Problem

Property disputes cost African countries billions annually. Land titles in many African jurisdictions are stored in paper registries, are subject to corruption, and can be altered, lost, or disputed with few reliable remedies. Multiple parties can hold conflicting documents for the same land.

An NFT-based land registry on a public blockchain is immutable and transparent. Ownership is recorded permanently. Transfer history is publicly auditable. Corruption of a single actor cannot alter the record. Rwanda, Ghana, and several other African governments are actively exploring blockchain land registries.

The Infrastructure Funding Problem — DePIN

Much of rural Africa lacks reliable internet connectivity because traditional capital markets do not fund infrastructure where returns on investment are uncertain or slow. DePIN — Decentralized Physical Infrastructure Networks — offers an alternative funding model.

Community members deploy wireless nodes, sensor networks, and data infrastructure and earn crypto token rewards for the coverage they provide. The economic incentive is local; the capital comes from a global token economy. Projects like Helium demonstrate this model. African First Network, founded by community builders, is pursuing exactly this vision for African community connectivity.

The Event Economy — Eliminating Ticket Fraud

Nigeria's live music and entertainment economy is massive. It is also plagued by ticket fraud — fake tickets printed and sold at scale, promoters losing revenue, fans turned away at doors. NFT ticketing eliminates this at the technical level. Every ticket is a unique, verifiable blockchain record. Its authenticity is instantly checkable. Its resale can be controlled by smart contract rules.

Building for What Comes Next

The most important observation about NFTs and tokens in Africa is not the current state — it is the trajectory. The infrastructure is maturing rapidly. Compressed NFTs on Solana have reduced minting costs to fractions of a cent, making mass credential and ticket issuance genuinely affordable. Account abstraction is making wallets easier to use for non-technical users. Stablecoin rails are making payment straightforward.

The question for builders, educators, and community leaders across Africa is not whether this technology will matter here. It is who will build the institutions, the products, and the communities that shape how it matters.

Takeaway: NFTs and token economies offer specific, practical solutions to real African problems: credential forgery, creator exploitation, property disputes, infrastructure funding gaps, and event ticket fraud. The technology is mature enough to deploy. The opportunity is real. The builders who understand both the technology and the local context are the ones who will define what comes next.`
      },
    ],
    flashcards: [
      {
        front: 'What is the difference between a fungible and a non-fungible token?',
        back: 'Fungible: every unit is identical and interchangeable — 1 USDT equals any other 1 USDT, divisible to fractions. Non-fungible: every token is unique — NFT #1 is not equal to NFT #2, indivisible. Fungible tokens are currencies and utility tokens. NFTs represent unique ownership of specific items.'
      },
      {
        front: 'What are ERC-721 and ERC-1155, and when is each used?',
        back: 'ERC-721: original NFT standard — each token has a unique ID. One token = one unique item. Best for 1-of-1 art, credentials, land titles. ERC-1155: multi-token standard managing both fungible and non-fungible tokens in one contract, with gas-efficient batch transfers. Best for gaming economies with diverse asset types.'
      },
      {
        front: 'What is a Soulbound Token (SBT) and what makes it different from a standard NFT?',
        back: 'A non-transferable NFT variant permanently tied to one wallet — it cannot be sold or moved. Transfer functions are disabled in the smart contract. Ideal for university degrees, professional licences, and DAO membership where credentials should be permanently associated with a specific person, not tradeable.'
      },
      {
        front: 'What is Fully Diluted Valuation (FDV) and why must you always check it?',
        back: 'FDV = current price × maximum token supply. It shows the project\'s real valuation if all tokens were circulating today. If FDV is 20–50x higher than market cap, most tokens are locked and will create massive sell pressure when they unlock. Never invest without checking FDV — market cap alone is misleading.'
      },
      {
        front: 'What is a token vesting schedule and what should a healthy one look like?',
        back: 'A vesting schedule controls when locked tokens (team, investors, advisors) become available for sale. A healthy schedule: 3–4 year total vesting with a 1-year cliff (no tokens accessible for the first 12 months). Red flags: vesting under 1 year, no cliff, team allocation above 30%, or no schedule disclosed at all.'
      },
      {
        front: 'Why does TRC-20 USDT dominate African P2P markets — and what is the critical safety rule?',
        back: 'TRC-20 USDT runs on Tron with fees of $0.01–0.10 vs $5–20+ on Ethereum mainnet. Near-zero cost makes it ideal for Nigerian P2P trades and remittances. Critical rule: sending USDT on the wrong network (e.g. ERC-20 to a TRC-20 address) results in permanent, unrecoverable loss of funds. Always verify the network before confirming any transfer.'
      },
      {
        front: 'What four on-chain data points should you check before investing in any crypto project?',
        back: '1) Active addresses — daily unique wallets interacting (rising = healthy). 2) Transaction volume — organic growth vs wash trading. 3) Top holder distribution — if top 10 wallets hold 70%+ of supply, manipulation risk is high. 4) GitHub activity — frequent commits from multiple contributors signal genuine development. All data is publicly verifiable on block explorers.'
      },
      {
        front: 'What is token utility and what distinguishes strong utility from weak utility?',
        back: 'Token utility is what the token is genuinely used for within its ecosystem. Strong: gas tokens required for every network transaction (ETH); governance over revenue-generating protocols; staking for network security; protocol revenue share. Weak: governance over protocols with no revenue; vague "ecosystem participation"; tokens used only to earn more of the same token with no external revenue source.'
      },
    ],
    quiz: [
      {
        question: 'A ₦1,000 note is fungible. Which of the following correctly explains what makes an NFT non-fungible?',
        options: [
          'NFTs cannot be transferred to another wallet once minted',
          'Each NFT has a unique token ID — NFT #1 and NFT #2 are different assets even within the same collection and cannot be exchanged 1:1',
          'NFTs are stored offline on hardware devices, making them physically unique',
          'NFTs are backed by physical commodities, giving each one a unique real-world value'
        ],
        correct: 1
      },
      {
        question: 'A new token has a market cap of $8 million but a Fully Diluted Valuation (FDV) of $800 million. Only 1% of tokens are circulating. What does this signal?',
        options: [
          'The token is extremely undervalued and represents a strong buying opportunity',
          'The team has burned 99% of the supply, making the token scarcer',
          'Massive future sell pressure is coming as the remaining 99% of locked tokens unlock — the real valuation is $800M, not $8M',
          'The token is backed by $800 million in treasury assets'
        ],
        correct: 2
      },
      {
        question: 'A Nigerian university wants to issue degrees that cannot be forged, can be verified instantly by any employer globally, and cannot be transferred or sold by the graduate. Which token type is most appropriate?',
        options: [
          'ERC-20 fungible tokens distributed to all graduates',
          'ERC-1155 multi-tokens with batch transfer capability',
          'Soulbound Tokens (SBTs) — non-transferable NFTs permanently tied to the graduate\'s wallet',
          'TRC-20 stablecoins redeemable for physical certificates'
        ],
        correct: 2
      },
      {
        question: 'You want to send $200 of USDT to a family member using the lowest possible fees. Which network should you use?',
        options: [
          'ERC-20 on Ethereum mainnet — highest security',
          'BTC on Bitcoin — most established network',
          'TRC-20 on Tron — fees of $0.01–0.10 vs $5–20+ on Ethereum mainnet',
          'BEP-20 on BNB Chain — regulated by Binance'
        ],
        correct: 2
      },
      {
        question: 'Which token standard allows a single smart contract to manage both in-game currency (fungible) and unique legendary weapons (non-fungible) with gas-efficient batch transfers — making it ideal for blockchain games?',
        options: [
          'ERC-20',
          'ERC-721',
          'ERC-1155',
          'TRC-20'
        ],
        correct: 2
      },
      {
        question: 'An Afrobeats producer mints 50 limited-edition NFTs of an unreleased track and embeds a 10% royalty in the smart contract. What does this mean?',
        options: [
          'The producer receives 10% of the initial sale price only — no future payments',
          'Every time any of the 50 NFTs is resold in the future, the producer automatically receives 10% of that resale price — enforced by the smart contract forever',
          'The producer must manually collect royalty payments from buyers each time',
          'The 10% royalty is paid by the NFT platform, not the buyer'
        ],
        correct: 1
      },
      {
        question: 'You are evaluating a new DeFi project. It has no entry on Token Terminal, its GitHub has had no commits in 4 months, the top 5 wallets hold 65% of supply, and the whitepaper describes token utility as "ecosystem participation." How should you assess this project?',
        options: [
          'Strong buy — low community awareness means early entry opportunity',
          'Multiple serious red flags — no verifiable revenue, inactive development, high supply concentration, and vague utility all signal high risk',
          'Neutral — wait for the next token unlock before deciding',
          'Positive — ecosystem participation tokens have historically outperformed governance tokens'
        ],
        correct: 1
      },
      {
        question: 'What does it mean when a DeFi protocol generates "real yield" — and why does it matter more in 2026 than token incentive yields?',
        options: [
          'Real yield is paid in stablecoins rather than governance tokens, making it more stable in price',
          'Real yield comes from genuine economic activity (trading fees, lending revenue) that exists regardless of token price — unlike inflated token incentive yields that collapse when rewards end',
          'Real yield is guaranteed by smart contract insurance and carries no risk of loss',
          'Real yield is verified by government regulators, making it legally protected income'
        ],
        correct: 1
      },
    ],
  },

  // ── MODULE 5: TRADING, CAREERS & LIFE IN WEB3 ────────────────────────────
  {
    id: 'trading', title: 'Trading, Careers & Life in Web3',
    description: 'From your first trade to building a Web3 career — practical skills for real life in the crypto economy.',
    color: '#f97316', icon: '📈',
    lesson: [
      {
        title: 'Trading Foundations — Principles, Setup, and the Nigerian Reality',
        content: `Cryptocurrency trading means buying and selling digital assets to benefit from price movements. Unlike long-term investing — where you buy and hold for years — trading can last minutes, days, or weeks depending on your strategy.

In 2026, trading happens across multiple types of platforms:
• Centralised exchanges (CEXs) like Binance and Bybit — you create an account, complete KYC, and trade through the platform
• Decentralised exchanges (DEXs) like Uniswap and Jupiter — you connect your wallet and trade directly on-chain, no account needed
• P2P platforms like Bitget P2P and Bybit P2P — you trade directly with other people, converting naira to crypto and back
• Perpetual DEXs like Hyperliquid — advanced platforms for leveraged trading without a centralised custodian

For Nigerian users starting out, the most practical entry point is a CEX with P2P support. Bitget Exchange and Bybit Exchange both offer active P2P markets where you can buy USDT with naira using your bank transfer, OPay, or PalmPay. Bitget DEX Wallet has also introduced a direct naira ↔ USDT swap feature inside the wallet itself — currently one of the most beginner-friendly on-ramp options available in Nigeria.

An important note on Binance P2P: it was the dominant naira-to-crypto platform for Nigerian users for many years. It was deactivated in 2024 and has not been restored as of 2026. If you search for it expecting it to work, you will be disappointed. Use Bitget P2P or Bybit P2P as your current alternatives. Busha is also used by Nigerian traders for simpler buy/sell of major assets with NGN support.

Before we go further — an honest word: trading is not the fastest path to wealth, and it is not right for everyone. Most beginners lose money in their first year. The goal of this lesson is not to make you excited about trading. It is to make sure that if you trade, you do it with your eyes open.

**The Five Principles Every Trader Must Know**

1. DYOR — Do Your Own Research. Never buy a cryptocurrency because someone on Twitter, Telegram, or WhatsApp told you to. Before trading anything, research the project yourself — its purpose, its team, its tokenomics, its real usage. On-chain tools like CoinGecko, DefiLlama, and Glassnode let you verify activity independently of marketing claims. If you cannot explain what a project does in two sentences, do not trade it.

2. Never trade more than you can afford to lose. Bitcoin fell over 75% in 2022. New tokens can lose 90% of their value in days. Keep your total crypto allocation below 5–10% of your savings. If losing the money would affect your ability to pay rent, school fees, or feed your family — it is too much.

3. Risk management comes before profit. Professional traders think about protecting their capital first and making profit second. This means setting a stop-loss before every trade — a price level where your position automatically closes to limit your loss. It also means calculating your risk-reward ratio before entering: if your target profit is 10% but your stop-loss is 5% away, your ratio is 2:1. A minimum 2:1 ratio is the standard most experienced traders require.

4. Have a trading plan and follow it. Undisciplined trading is one of the fastest ways to lose money. A trading plan means: you know why you are entering a trade, what price you are targeting, where your stop-loss is, and how much of your capital you are risking — all decided before you buy, not after.

5. Patience and discipline beat excitement. FOMO — Fear Of Missing Out — is one of the most dangerous forces in crypto. When a coin surges 50% in a day, the instinct is to jump in. That moment is usually exactly when experienced traders are selling to new buyers. The best trades require waiting for the right setup. If a trade does not meet your criteria, do not take it.

**The Seven Mistakes That Wipe Out Beginners**

Chasing pumps: buying after a 50–100% surge because of FOMO. You become exit liquidity for experienced traders.

Ignoring fees: trading fees, withdrawal fees, and spread costs accumulate quickly. Always calculate fees as part of your trade.

Using leverage too early: a 10x leveraged position can be fully wiped out by a 10% price move. Do not use leverage until you have at least 12 months of consistent, profitable spot trading behind you.

Leaving funds on exchanges long-term: FTX proved this at catastrophic scale. Move significant holdings to a non-custodial wallet after trading.

Panic selling: selling during a sharp dip out of fear, only for the price to recover. Set your stop-loss before entering — your exit should be decided by your plan, not your emotions in the moment.

Over-trading: making too many trades out of boredom. Most professional traders make relatively few, high-conviction trades.

Ignoring taxes: crypto trading is taxable in Nigeria. The FIRS has issued guidance and enforcement is increasing. Keep records of every trade. Lesson 6 covers this in full.

Takeaway: Trading is a skill, not a shortcut. The five principles — DYOR, size your risk, manage losses first, plan every trade, and stay disciplined — separate traders who survive from those who don't. For Nigerians, Bitget P2P and Bybit P2P are the current reliable naira on-ramp and off-ramp routes.`
      },
      {
        title: 'Order Types — How to Enter and Exit Trades Like a Professional',
        content: `The order type you choose determines how, when, and at what price your trade executes. Using the wrong order type in a volatile market can mean paying far more than intended or missing a trade entirely. Every serious trader understands these before placing their first position.

**Limit Order — Precision Entry**

A limit order lets you set the exact price at which you want to buy or sell. The order sits in the exchange's order book and only executes when the market reaches your specified price.

Advantages: price control — you will not pay more (when buying) or receive less (when selling) than your set price. Reduces slippage in volatile or low-liquidity markets.

Disadvantage: if the market never reaches your price, the order never fills.

Example: Bitcoin is trading at $95,000. You believe it will dip to $90,000 before recovering. You place a limit buy order at $90,000 for 0.1 BTC. If BTC drops to $90,000, your order fills. If it never reaches that price, your order stays open until you cancel it.

**Market Order — Immediate Execution**

A market order executes immediately at the best available price. It prioritizes speed over price precision.

Use for: high-liquidity assets (BTC, ETH, SOL) when you need immediate execution. Avoid for small-cap altcoins with thin order books — slippage can be significant.

**Stop-Loss Order — Your Most Important Risk Tool**

A stop-loss is an automatic sell that triggers when price falls to your pre-set level, limiting your downside.

Pro rule: set your stop-loss before entering the position, not after. Decide your maximum acceptable loss first. Also avoid round numbers — experienced traders know that stops cluster around obvious levels like $90,000 or $100,000, and prices are sometimes pushed there deliberately to trigger them. Set yours slightly below key levels.

Never remove a stop-loss out of hope. This is how small losses become catastrophic ones.

**Take-Profit Order — Locking In Gains**

A take-profit order automatically sells your position when it reaches your target price. It removes emotion from the exit — preventing the common mistake of holding too long and watching profits evaporate.

Pro approach: instead of one take-profit, scale out in portions. Sell 30% at your first target, 40% at a higher target, and keep 30% for a potential extended move. This balances capturing gains with staying in a winning trade.

**OCO — One Cancels the Other**

An OCO order combines a take-profit and a stop-loss set simultaneously. When one executes, the other is automatically cancelled. This is the most practical risk management tool for active traders — both your upside target and downside protection are set in advance. You can step away from the screen knowing your exit is handled.

Example: you buy ETH at $2,500. OCO setup: Take-Profit at $2,900. Stop-Loss at $2,350. Whichever price ETH hits first triggers that order and cancels the other.

**Trailing Stop — Riding Trends While Protecting Gains**

A trailing stop is a dynamic stop-loss that moves upward automatically as price rises. If price reverses by your set percentage from its peak, the trailing stop triggers and closes the position.

Example: you buy BTC at $95,000 with a 5% trailing stop. BTC rises to $110,000 — your stop rises to $104,500. BTC then falls to $104,500 — your trailing stop triggers, capturing most of the move.

Set the trailing distance wide enough to absorb normal market noise — too tight and you get stopped out before the trend resumes.

**Trigger / Conditional Order — Breakout Entries**

A trigger order activates a new buy or sell order only when a specific price is hit — useful for entering breakouts without watching the screen. Example: BTC consolidates below $100,000. You set a trigger buy at $100,200 — if BTC breaks above resistance, your buy order activates automatically.

**Order Types on DEXs**

DEX order types have improved significantly. Protocols like Hyperliquid, GMX, and dYdX now support limit orders, stop-losses, take-profits, and OCO on perpetual futures entirely on-chain — CEX-level features without custody risk.

On all DEXs, you set a slippage tolerance (e.g. 0.5–2%). If the market moves beyond this before your transaction confirms, it reverts. Set too tight and trades fail. Set too loose and MEV bots can extract value from your transaction by sandwiching it — buying just before and selling just after your swap.

Takeaway: Limit orders give you price control. Market orders give you speed. Stop-losses protect your downside. Take-profits lock in gains. OCO automates both exits simultaneously. Trailing stops ride trends. Trigger orders enter breakouts. Know all seven before trading anything — and always set your stop-loss before entering any position.`
      },
      {
        title: 'Reading the Market — Analysis Tools Every Trader Needs',
        content: `Experienced traders do not guess where prices are going. They use a combination of fundamental analysis and technical analysis to form a view — and then they act on that view with strict risk management. Neither method is a crystal ball. But both significantly improve the quality of your decisions.

**Fundamental Analysis (FA) — Is This Project Worth Owning?**

Fundamental analysis evaluates a cryptocurrency based on non-price factors: the project's technology, team, tokenomics, real-world adoption, revenue, partnerships, and competitive position. FA answers the question: does this asset have genuine value, or is the price driven by hype alone?

Key FA questions:
• Does this project solve a real problem? Is there evidence of genuine usage?
• Is the tokenomics sustainable? (Module 4 covered this in depth — apply that framework here)
• Does the protocol generate real revenue, or does it depend on token inflation?
• Who are the competitors, and does this project have a genuine advantage?

FA is especially important for long-term investment decisions. You can use FA to build conviction in an asset before using TA to find a good entry price.

On-chain analytics tools for FA: Glassnode (Bitcoin and Ethereum on-chain data — exchange inflows/outflows, whale activity, miner behaviour), Nansen (wallet labelling and smart money tracking), Dune Analytics (community-built on-chain dashboards for any protocol), DefiLlama (TVL and protocol revenue across all DeFi), Token Terminal (protocol earnings and P/E-equivalent ratios for crypto).

**Technical Analysis (TA) — Finding Entry and Exit Points**

Technical analysis uses historical price charts and trading volume data to forecast future price movements. TA assumes that all available information is already reflected in the price, and that price patterns tend to repeat because human psychology is consistent.

Support and Resistance Levels: Support is a price zone where buying interest has historically increased — a floor. Resistance is a price zone where selling pressure has historically been strong — a ceiling. Buying near support and selling near resistance is the foundation of most swing trading strategies. These levels are visible on any chart.

Moving Averages: The 50-day and 200-day moving averages are the most widely watched trend indicators in crypto. When price is above the 200-day MA, the long-term trend is considered bullish. When the 50-day MA crosses above the 200-day MA (a "golden cross"), it is often considered a bullish signal. The reverse (a "death cross") signals a potential downtrend.

RSI — Relative Strength Index: RSI measures whether an asset is overbought or oversold on a scale of 0–100. RSI above 70: the asset may be overbought — a potential sign that a pullback is coming. RSI below 30: the asset may be oversold — a potential buying opportunity. RSI is most useful in sideways or ranging markets. In strong trends, assets can remain overbought or oversold for extended periods.

MACD — Moving Average Convergence Divergence: MACD tracks the relationship between two moving averages and shows momentum. When the MACD line crosses above the signal line, it can indicate bullish momentum. When it crosses below, bearish momentum. MACD crossovers are more reliable when confirmed by volume.

Volume Analysis: High volume confirms price movements. A price breakout to new highs on high volume is more reliable than the same move on low volume. Volume spikes at key levels often signal genuine interest from large participants.

**The Macro Context — What Moves Crypto in 2026**

In 2025–2026, crypto is increasingly correlated with global macroeconomic conditions. Traders who ignore the macro context trade blindly.

US Federal Reserve interest rate decisions directly affect crypto. When rates are falling (easy money), risk assets including crypto tend to rise. When rates are rising (tight money), risk assets tend to fall. Watch the Fed's meeting schedule.

Bitcoin ETF flows: since January 2024, daily institutional ETF inflows and outflows have become a key market signal. Large inflows suggest institutional buying pressure. Monitor via CoinGlass.

Bitcoin Dominance Index: Bitcoin's share of total crypto market cap. When BTC dominance rises, altcoins typically underperform. When dominance falls, altcoin season conditions emerge. Available on CoinMarketCap.

Fear & Greed Index: a quick sentiment gauge. Extreme fear (index below 20) has historically been a buying opportunity. Extreme greed (index above 80) has historically preceded corrections. Available on CoinMarketCap. Use it as one input among many — not as a standalone signal.

⚠️ TA Limitation: Technical analysis is not a crystal ball. Crypto markets are heavily influenced by news events, regulatory announcements, and large wallet activity that no chart can predict. Use TA to identify high-probability setups, not as a definitive oracle. Always combine with FA and sound risk management.

Takeaway: FA tells you what to trade. TA tells you when to trade it. The macro context tells you what environment you are trading in. All three together give you a significantly more complete picture than price alone — but none of them removes the need for strict risk management on every position.`
      },
      {
        title: 'Trading Strategies — Choosing the Right Approach for Your Life',
        content: `There is no single "best" trading strategy. The best strategy is the one that fits your capital, your time availability, your risk tolerance, and your current level of knowledge. This lesson maps the major strategies honestly — including what each requires and what each risks.

**HODLing — Buy and Hold**

The simplest and historically most effective strategy for most participants. Buy quality assets — Bitcoin, Ethereum — and hold them through market cycles, ignoring short-term volatility. Requires patience and conviction but demands minimal active management.

Time requirement: very low. Check prices occasionally. No daily monitoring.
Capital requirement: any amount.
Skill requirement: low — primarily requires conviction and the emotional discipline to hold through drawdowns.
Risk: you will watch your portfolio fall 50–80% during bear markets. You must be able to hold without selling.

Best suited for: Bitcoin and Ethereum with strong long-term conviction. Not appropriate for speculative altcoins without genuine fundamentals.

**Dollar-Cost Averaging (DCA)**

Invest a fixed amount — say ₦20,000 or $20 — into a specific asset at regular intervals regardless of price. Weekly, bi-weekly, or monthly. DCA removes the pressure of timing the market, averages your purchase price over time, and reduces the emotional impact of volatility.

Example: investing $50 in Bitcoin every Monday regardless of price. Some weeks you buy when BTC is expensive, some weeks when it is cheap. Over time, your average cost is typically lower than trying to pick the perfect entry.

Widely recommended for beginners and long-term investors. Combined with HODLing, it is the approach most consistent with building wealth over time.

**Swing Trading**

Holding positions for days to weeks to capture medium-term price movements. Swing traders aim to buy at support levels and sell at resistance levels, using the TA tools from Lesson 3. Requires understanding of technical analysis and more active monitoring than HODLing.

Time requirement: moderate — check charts daily, execute trades a few times per week.
Skill requirement: moderate — requires TA literacy and emotional discipline.
Risk: getting caught in sideways markets, false breakouts, and overnight news events that gap price past your stop-loss.

**Day Trading**

Opening and closing positions within a single trading day to profit from intraday price movements. Requires significant time commitment, deep technical analysis skills, fast execution, and strong emotional discipline.

Honest assessment: even professional day traders frequently lose money. Transaction fees and spread costs accumulate quickly. The Nigerian crypto market context — electricity interruptions, internet reliability, platform access — adds operational risk that international traders do not face. Not recommended for beginners or anyone without dedicated time and infrastructure.

**Copy Trading**

Platforms like Bitget, Bybit, and Binance now offer copy trading — automatically mirroring the trades of experienced, verified traders in real time. This can be an educational entry point for beginners.

Honest limitations: past performance does not guarantee future results. Even top copy traders have significant losing periods. You do not learn the underlying skills. Always diversify across multiple copy traders, use stop-losses, and start with small amounts to understand how the feature works before committing significant capital.

**On-Chain and DeFi Trading**

Beyond CEXs, traders increasingly use DEXs to trade tokens not yet listed on centralized exchanges. On-chain trading gives earlier access to new projects — but requires self-custody skills, understanding of gas fees, and vigilance against scams and honeypot tokens.

Before buying any new token on a DEX: use Rugcheck.xyz or Token Sniffer to assess contract risk. Check the token on DefiLlama. Verify liquidity is locked. Never buy based solely on Telegram or social media hype.

**Choosing Your Strategy Honestly**

Ask yourself honestly: how much time can I dedicate to this per day? How much capital am I willing to risk? How would I respond emotionally to watching my portfolio drop 30% in a week?

For most Nigerians starting out: a DCA + HODL approach for Bitcoin and Ethereum, combined with genuine education before touching altcoins, is the most honest starting point. The complex strategies require skills and infrastructure that take months to build responsibly.

Takeaway: Every trading strategy makes different trade-offs between time, skill, capital, and risk. HODLing and DCA are the most accessible starting points. Swing trading requires TA skills. Day trading requires professional-grade commitment. Copy trading is accessible but does not build the underlying skills you need. Match your strategy to your actual situation, not to the strategy that sounds most exciting.`
      },
      {
        title: 'Web3 Careers & Income — Building a Life in the Crypto Economy',
        content: `Web3 is not just a technology — it is a global economic system that is actively hiring, rewarding contributors, and creating income streams that did not exist five years ago. For Africans with the right skills and knowledge, the Web3 economy offers access to global-rate income without leaving home, without a foreign visa, and without the barriers traditional global employment imposes.

This lesson gives you the honest, complete picture.

**Why Web3 Is Significant for African Income Seekers**

Location independence: Web3 jobs are overwhelmingly remote. A developer in Lagos, a community manager in Accra, or a researcher in Nairobi can compete for and win global-rate positions without relocating.

Payment in crypto: Web3 employers pay in cryptocurrency — bypassing expensive, slow international wire transfers. Request payment in USDT or USDC, receive it in minutes at near-zero cost, convert to naira via Bitget P2P or Bybit P2P.

Skills over credentials: Web3 hiring is heavily merit-based. A strong GitHub profile, a community reputation, verifiable on-chain activity, and demonstrated skills routinely outweigh formal degrees. This levels the playing field for African talent.

**The Income Map — What You Can Actually Earn**

Technical Roles (higher barrier, higher income): Blockchain Developer (Solidity for EVM chains, Rust for Solana) — one of the highest-paid roles in global tech. Smart Contract Auditor — reviews code for vulnerabilities; firms like CertiK and Hacken pay very well; start with bug bounties to build a portfolio. Frontend Web3 Developer — builds dApp interfaces using React and Web3 libraries; lower barrier than smart contract development. DevRel (Developer Relations) — bridges technical teams and developer communities; very accessible for technically curious Africans with communication skills.

Non-Technical Roles (lower barrier, variable income): Community Manager — moderates and grows project communities on Discord, Telegram, and X. Content Creator/Copywriter — writes blogs, threads, documentation, and social content for Web3 projects. Social Media Manager — manages protocol presence online. Crypto Educator — creates educational content for protocols, exchanges, and communities.

**The Honest Reality of Entry-Level Roles in Nigeria**

Many Nigerian Web3 communities advertise ambassadorial and community roles with inflated or vague incentives. Payment does exist in some cases, but it is frequently exaggerated in how it is presented publicly. Entry-level Web3 community roles in Nigeria often offer little to no reliable income, especially at the start.

This is not a reason to avoid these roles. It is a reason to be clear-eyed about what they actually provide: experience, reputation, and community connections — not immediate income. Treat early community work as building your portfolio and your network, not as a primary income source. The income follows the reputation, not the other way around.

**Where to Find Genuine Opportunities**

Superteam Nigeria: the most important platform for Nigerian Web3 job seekers. Join their Discord server — it is active, regularly updated with bounties and job postings, and has a strong community of serious builders. This is your first stop.

MetaMask Nigeria: has created a developer forum and runs regular in-person meetups in Nigeria. If you are interested in development, plug into this community.

Trust Squad Nigeria: the voluntary community arm of Trust Wallet. Community education and safety work. Hosting and representing Trust Wallet at local events — like the Port Harcourt meetup in March 2026 — is the kind of real-world community work that builds genuine credibility. Voluntary, but builds a portfolio of demonstrated activity.

Crypto Jobs List (cryptojobslist.com), Web3 Career (web3.career), and Wellfound (formerly AngelList) are job boards worth monitoring for remote roles.

Freelancing platforms: Gitcoin for bounties, Layer3 for on-chain tasks, and Braintrust for talent matching (freelancers keep 100% of earnings).

DAO contributions: Many protocols pay contributors in stablecoins for work that advances their ecosystem. Uniswap Grants, Aave Grants DAO, and the Arbitrum DAO all fund community builders. Research Africa-specific grant tracks — the Solana Foundation, Ethereum Foundation, and Cardano have all funded African projects.

**Getting Paid in Nigeria**

Request payment in USDT or USDC to avoid crypto price volatility eroding your earnings. Receive on a low-fee network — TRC-20 or Solana — to minimize transfer costs. Convert to naira via Bitget P2P or Bybit P2P at market rates using your bank account, OPay, or PalmPay. Keep records of every payment received — date, amount in USD, naira equivalent at time of receipt. This is essential for tax compliance.

Takeaway: Web3 career opportunities for Africans are real but require genuine skill development, patience, and consistent effort. Be honest about what entry-level community roles offer — experience and connections, not immediate income. Superteam Nigeria is your most important local entry point. Build in public, contribute before you earn, and specialize rather than spreading thin.`
      },
      {
        title: 'Crypto Taxes, Compliance & Playing the Long Game',
        content: `Cryptocurrency taxation is no longer an abstract concern for Nigerian crypto users — it is an active enforcement reality. The Federal Inland Revenue Service (FIRS) has issued guidance on crypto taxation, and global regulatory pressure is increasing. Ignorance of tax obligations is not a legal defence.

This lesson explains what you need to know. It is educational information, not legal or financial advice. Tax law is complex and evolving — consult a qualified Nigerian tax professional for guidance specific to your situation.

**Yes — Crypto Is Taxable in Nigeria**

The FIRS applies existing Nigerian tax law to crypto activities:
• Personal Income Tax Act (PITA): applies to income earned through crypto trading, staking, freelancing paid in crypto, and crypto employment.
• Capital Gains Tax Act (CGTA): applies to gains from the disposal of cryptocurrency. Nigeria's capital gains tax rate is 10% on net gains.
• Companies Income Tax Act (CITA): applies to registered companies earning income from crypto activities.

The FIRS issued a circular classifying cryptocurrency as property or an asset for tax purposes. Direction of enforcement has increased steadily through 2024–2026.

**What Is and Is Not a Taxable Event**

Taxable events — these create a tax obligation:
• Selling crypto for naira or foreign currency — converting any crypto to fiat is a disposal that triggers potential capital gains or income tax
• Trading one crypto for another — swapping Bitcoin for Ethereum is treated as a disposal of Bitcoin; any gain is potentially taxable
• Receiving crypto as income — payment for services, mining rewards, staking rewards, or airdrop income is taxable as ordinary income at fair market value at time of receipt
• Earning DeFi yields — lending interest and yield farming rewards are income in the period earned

Non-taxable events:
• Buying crypto with naira — establishes your cost basis, not a taxable event
• Transferring between your own wallets — not a taxable disposal
• HODLing — holding without selling does not trigger a tax event until disposal

**How Tax Is Calculated**

Capital gain = proceeds from disposal minus cost basis (what you originally paid).
Example: you bought 0.1 BTC for ₦1,800,000. You later sold for ₦2,500,000. Your capital gain is ₦700,000. At 10% CGT, your tax is ₦70,000.

For crypto received as income, the taxable amount is the naira-equivalent fair market value at time of receipt. Personal income tax rates are progressive from 7% to 24% depending on your total annual income.

Cost basis methods: FIFO (First In, First Out) — the first crypto you bought is the first you are considered to have sold. Average Cost — total paid divided by total quantity. Choose one method and apply it consistently.

**Record-Keeping — Your Most Important Obligation**

Without records, accurate tax calculation is impossible. For every transaction, document: date, type (buy/sell/trade/income), asset, quantity, USD price at time (use CoinGecko historical prices), naira equivalent (use CBN or P2P rate), platform used, transaction hash for on-chain transactions.

Tools: Koinly (koinly.io) — the most widely used crypto tax tool globally, supports Nigerian naira, connects to exchanges and wallets via API or CSV import. CoinTracker is an alternative. For simpler situations, a Google Sheets spreadsheet with the fields above is sufficient.

Download your full transaction history from every exchange monthly. Exchanges have been known to delete historical records. Your records are your responsibility.

**The Regulatory Framework**

SEC Nigeria has a VASP licensing framework requiring crypto exchanges operating in Nigeria to register. KYC/AML requirements apply to all registered VASPs. The 2024 Binance-Nigeria dispute — where Nigerian authorities detained a Binance executive over forex manipulation and tax compliance allegations — demonstrated that Nigerian authorities treat large-scale crypto activity through a financial crimes lens when compliance is absent.

For individual users: maintaining proper records, paying applicable taxes, and using registered platforms significantly reduces your regulatory exposure.

International context: Nigeria participates in global financial information exchange. Foreign exchanges with Nigerian user data may share it with FIRS. Do not assume foreign exchange accounts are invisible to Nigerian tax authorities.

**Playing the Long Game**

Legal tax efficiency — reducing your tax burden through legitimate structuring — is different from evasion. Some legal considerations: holding long-term defers tax until disposal. Selling losing positions in the same tax year as profitable disposals may offset your gains. Keep income-generating activity and investment activity in separate records.

The honest bottom line: crypto transactions are permanent, on-chain, and increasingly traceable. The cost of evasion — penalties, fines, potential criminal liability — far exceeds the cost of compliance. Start keeping records today, even if you have not done so historically. On-chain transactions can be retrieved via block explorers using your wallet address.

Takeaway: Crypto trading, income, and DeFi yields are taxable in Nigeria under existing tax law. The FIRS is actively developing enforcement capacity. Your most important obligation is record-keeping — every transaction, documented with date, amount, and naira equivalent. Use Koinly for automated tracking. Consult a Nigerian tax professional for your first filing. Compliance is not optional and it is far less costly than the alternative.`
      },
    ],
    flashcards: [
      {
        front: 'What does DYOR mean and why is it the golden rule of trading?',
        back: 'Do Your Own Research. Never buy based on social media hype, influencer tips, or Telegram recommendations alone. Always research a project\'s purpose, team, tokenomics, and real usage before trading. If you cannot explain what it does in two sentences, do not trade it.'
      },
      {
        front: 'What is a stop-loss order and when should you set it?',
        back: 'An automatic sell that triggers when price falls to a pre-set level, capping your loss. Set it BEFORE entering the position — not after. Decide your maximum acceptable loss first. Never remove a stop-loss out of hope. This is how small losses become catastrophic ones.'
      },
      {
        front: 'What is an OCO order and why is it useful?',
        back: 'One Cancels the Other — a linked pair of orders: a take-profit above current price and a stop-loss below it. Whichever price is hit first executes and automatically cancels the other. Lets you set both your upside target and downside protection simultaneously, then step away from the screen.'
      },
      {
        front: 'What is DCA and why is it recommended for beginners?',
        back: 'Dollar-Cost Averaging — investing a fixed amount at regular intervals regardless of price. Removes the pressure of timing the market, averages your purchase price over time, and reduces emotional impact of volatility. Example: $50 in Bitcoin every Monday. Simple, disciplined, and effective for long-term wealth building.'
      },
      {
        front: 'What happened to Binance P2P for Nigerian users — and what are the current alternatives?',
        back: 'Binance P2P was deactivated in 2024 and has not been restored as of 2026. Current reliable alternatives for naira ↔ crypto conversion: Bitget Exchange P2P, Bybit Exchange P2P, and Bitget DEX Wallet (direct naira ↔ USDT swap inside the wallet). Busha is also used by Nigerian traders.'
      },
      {
        front: 'What is RSI and what do the key levels mean?',
        back: 'Relative Strength Index — measures whether an asset is overbought or oversold on a 0–100 scale. RSI above 70: potentially overbought — pullback may be coming. RSI below 30: potentially oversold — buying opportunity may be emerging. Most reliable in ranging markets. In strong trends, assets can stay overbought/oversold for extended periods.'
      },
      {
        front: 'Is crypto taxable in Nigeria — and what is the capital gains tax rate?',
        back: 'Yes. The FIRS classifies cryptocurrency as property. Selling crypto for naira, trading crypto-to-crypto, receiving crypto as income, and earning DeFi yields are all taxable events. Nigeria\'s capital gains tax rate is 10% on net gains. Personal income from crypto is taxed at progressive rates of 7–24% under PITA.'
      },
      {
        front: 'What is the honest reality of entry-level Web3 community roles in Nigeria?',
        back: 'Many ambassadorial and community roles are advertised with inflated or unclear incentives. Payment exists in some cases but is frequently exaggerated. Treat early community work as building experience, reputation, and connections — not as a primary income source. Income follows reputation. Superteam Nigeria is the most reliable platform for genuine paid opportunities.'
      },
    ],
    quiz: [
      {
        question: 'Amara in Accra wants to place her first trade. She has ₦500,000 in savings. According to safe trading principles, what is the maximum she should allocate to crypto?',
        options: [
          '₦500,000 — go all in for maximum returns',
          '₦250,000 — half is a reasonable starting amount',
          '₦25,000–₦50,000 — no more than 5–10% of total savings',
          '₦100,000 — a quarter is always safe'
        ],
        correct: 2
      },
      {
        question: 'Tunde sees a coin that has surged 80% today and feels the urge to buy immediately. What is this feeling called — and what should he do?',
        options: [
          'FUD — he should buy to fight the negative sentiment',
          'FOMO — he should wait for his planned setup rather than chasing the move',
          'HODL — he should buy and hold for the long term',
          'Alpha — he should act fast before others catch on'
        ],
        correct: 1
      },
      {
        question: 'Which P2P platform is currently reliable for naira ↔ USDT conversion for Nigerian users in 2026?',
        options: [
          'Binance P2P — the original and still dominant platform',
          'LocalBitcoins — the most established peer-to-peer platform globally',
          'Bitget Exchange P2P — active, with security measures comparable to the old Binance P2P',
          'Coinbase P2P — available for Nigerian bank transfers'
        ],
        correct: 2
      },
      {
        question: 'You buy ETH at $2,500 and set up an OCO order: Take-Profit at $2,900, Stop-Loss at $2,300. ETH rises to $2,900. What happens?',
        options: [
          'Both orders execute simultaneously, selling your ETH at both prices',
          'The take-profit executes at $2,900 and the stop-loss order is automatically cancelled',
          'The stop-loss executes first because it was set lower',
          'Neither order executes — OCO only works on downward price movements'
        ],
        correct: 1
      },
      {
        question: 'David in Nairobi risks ₦10,000 on a trade targeting ₦15,000 profit. What is his risk-reward ratio — and does it meet the minimum standard?',
        options: [
          '1.5:1 — below the recommended minimum of 2:1',
          '2:1 — meets the standard exactly',
          '3:1 — exceeds the recommended standard',
          '1:1 — equal risk and reward, which is the standard'
        ],
        correct: 0
      },
      {
        question: 'RSI on a crypto chart is showing a reading of 78. What does this suggest?',
        options: [
          'The asset is oversold and likely to bounce upward soon',
          'The asset may be overbought — a potential pullback signal worth monitoring',
          'The asset is in a strong downtrend and should be sold immediately',
          'RSI of 78 is neutral — meaningful signals only occur above 90'
        ],
        correct: 1
      },
      {
        question: 'You receive 100 USDT as payment for content writing. On that day USDT trades at ₦1,600 per dollar. How should this be treated for Nigerian tax purposes?',
        options: [
          'Not taxable — crypto income is not covered by Nigerian tax law',
          'Taxable as capital gains at 10% only when you eventually sell the USDT',
          'Taxable as ordinary income — ₦160,000 is added to your annual income and taxed at your applicable PITA rate',
          'Taxable only if the amount exceeds ₦500,000 per year'
        ],
        correct: 2
      },
      {
        question: 'A Nigerian Web3 community is advertising an "Ambassador Program" with vague "incentives" and no clear payment structure. Based on the honest reality of such roles, what is the best approach?',
        options: [
          'Apply immediately — ambassador programs always pay well once you reach a certain follower count',
          'Avoid entirely — no legitimate Web3 role lacks a clear payment structure',
          'Participate with clear eyes: treat it as experience and network building, not reliable income, and scrutinize the incentive structure carefully before committing significant time',
          'Negotiate a guaranteed salary before accepting any community role'
        ],
        correct: 2
      },
    ],
  },

  // ── MODULE 6: AI x CRYPTO ─────────────────────────────────────────────────
  {
    id: 'aixcrypto', title: 'AI x Crypto: The New Frontier',
    description: 'Where artificial intelligence meets blockchain — the fastest-moving frontier in Web3 and what it means for you.',
    color: '#8b5cf6', icon: '🤖',
    lesson: [
      {
        title: 'The Convergence — Why AI and Crypto Need Each Other',
        content: `Two of the most transformative technologies of the 21st century are converging — and the result is reshaping finance, infrastructure, and how machines interact with the economy. To understand why AI and crypto found each other, you need to understand the problem they share.

AI systems are making decisions that increasingly affect people's lives — approving loans, recommending content, screening job applications, executing trades. But there is a fundamental problem: how do you verify that an AI system did what it claims? How do you prove it wasn't manipulated? How do you ensure its outputs are trustworthy without trusting the company that built it?

Blockchain's core properties — transparency, immutability, and decentralized verification — answer exactly these questions. A blockchain cannot lie about what happened. Records written to it are permanent and publicly auditable. No single company controls them.

Conversely, crypto systems have their own challenges that AI is uniquely positioned to solve. DeFi protocols manage billions of dollars across thousands of constantly shifting market conditions. Smart contract vulnerabilities hide in thousands of lines of code. Fraud patterns evolve faster than human analysts can track them. AI's ability to process vast data, identify patterns, and make autonomous decisions makes it a powerful tool for operating within crypto's complex, fast-moving ecosystem.

**The historical arc — how we got here**

2022–2023: The bear market cleared out speculative noise and forced both AI and crypto to focus on genuine utility. OpenAI's ChatGPT launch in late 2022 marked the beginning of mainstream AI awareness. Meanwhile, crypto was processing the lessons of Terra/LUNA and FTX — moving toward real utility and transparency.

2024: The launch of Bitcoin ETFs brought institutional capital into crypto at the same time that AI investment was exploding. Both industries matured simultaneously, attracting overlapping pools of capital and talent.

2025–2026: Autonomous AI agents began operating on-chain. Decentralized AI infrastructure projects crossed meaningful adoption thresholds. The convergence moved from theoretical to active. Analysts began tracking AI x Crypto as a distinct sector with its own market dynamics, and it became one of the most actively funded areas in Web3.

**Four major intersections**

The AI x Crypto convergence is not one thing — it is four distinct areas developing simultaneously:

1. AI agents transacting on-chain — autonomous software with crypto wallets, earning and spending independently
2. Decentralized AI infrastructure — open, permissionless alternatives to centralized AI providers
3. AI for blockchain security and analysis — smarter fraud detection, auditing, and market intelligence
4. Verifiable AI — using blockchain to make AI outputs trustworthy and auditable

Each of these represents a genuine technical development, not just a marketing narrative. The rest of this module examines each in depth.

**Why this convergence is different from past crypto hypes**

Previous crypto narratives — ICOs in 2017, DeFi summer in 2020, NFTs in 2021 — were primarily financial in nature. They were about new ways to create, trade, and speculate on digital assets.

AI x Crypto is infrastructure-level. It is about who controls the most powerful technology systems of the next decade — and whether that control is concentrated in a handful of corporations or distributed across open networks. That is a fundamentally different kind of stakes.

Takeaway: AI and crypto converge because they solve each other's core trust problems. Blockchain makes AI outputs verifiable and tamper-proof. AI makes blockchain systems more secure, efficient, and autonomous. The convergence is active in 2026 — not a future prediction but a present reality across four major technical areas.`
      },
      {
        title: 'Decentralized AI Infrastructure — Owning the Machines',
        content: `Here is a fact worth sitting with: as of 2026, a small number of corporations control the most powerful AI systems in the world. OpenAI, Google DeepMind, Anthropic, and Meta have spent tens of billions of dollars training models that the rest of the world accesses through their APIs, on their terms, at their prices, subject to their content policies.

This is a centralization problem — and it is exactly the kind of problem that crypto was designed to address.

Decentralized AI infrastructure projects are building open, permissionless alternatives. The goal is AI capability that no single entity controls — where the models, the computing power, and the data are distributed across a global network of participants who are economically incentivized to contribute.

**Bittensor (TAO) — The Decentralized Intelligence Network**

Bittensor is the most technically sophisticated and widely adopted decentralized AI project as of 2026. Its architecture is genuinely novel.

The network is organized into specialized subnets — each focused on a specific AI task: text generation, image recognition, financial prediction, data analysis, coding assistance. Within each subnet, AI models compete to produce the most valuable outputs. Validators score the quality of model outputs and distribute TAO token rewards to the best performers.

The result is a marketplace for intelligence — where anyone can contribute computing power and AI capability, and anyone can access that capability by spending TAO. No central company controls what models are available, what they can say, or who can use them.

The depth of Bittensor's technical design separates it from most AI x Crypto projects. It has genuine researchers, active subnet development, and a growing ecosystem of applications building on top of it.

**Fetch.ai (FET) and the ASI Alliance**

Fetch.ai built a platform specifically for deploying autonomous AI agents — software that can perceive its environment, make decisions, and interact with DeFi protocols, IoT devices, and other agents. In 2024, Fetch.ai merged with Ocean Protocol and SingularityNET to form the Artificial Superintelligence Alliance (ASI), creating the largest decentralized AI ecosystem by combined market cap and contributor base.

The ASI Alliance is building toward a future where AI development is governed by a broad coalition rather than a single corporation — with economic incentives ensuring that contributors to the network share in its value.

**Render Network (RNDR) — Decentralizing GPU Power**

AI training requires enormous amounts of GPU computing power. Currently, this is dominated by centralized cloud providers — AWS, Google Cloud, Microsoft Azure — who charge premium rates and control access.

Render Network creates a decentralized marketplace where individuals and businesses with spare GPU capacity can earn RNDR tokens by contributing to AI training, 3D rendering, and other compute-intensive tasks. Users who need computing power pay in RNDR to access it.

As GPU hardware becomes more accessible globally — including in Africa — Render represents a genuine income opportunity for anyone with capable hardware and reliable internet.

**Akash Network**

A decentralized cloud computing marketplace operating on similar principles to Render — providers offer spare computing capacity, users pay in AKT tokens to access it. Particularly focused on general-purpose cloud workloads including AI inference (running already-trained models).

**Ocean Protocol**

A decentralized marketplace for data — enabling data owners to monetize their datasets while maintaining control and privacy. AI models are only as good as the data they are trained on, and Ocean addresses the data side of the decentralized AI stack. Particularly relevant for African data owners whose local language data, agricultural data, and market data are severely underrepresented in global AI training sets.

**Evaluating these projects honestly**

Many projects claim decentralized AI credentials while remaining highly centralized in practice. Apply the evaluation framework from Module 4: check GitHub activity, verify actual decentralization of infrastructure, look for genuine protocol revenue, assess whether the token has real utility or is just governance over a system with no revenue.

Bittensor and Render have demonstrated the most genuine technical depth. Others are at earlier stages. The sector is real — but it contains the same spectrum of quality that exists everywhere in crypto.

Takeaway: Decentralized AI infrastructure addresses a genuine problem — the concentration of AI capability in a handful of corporations. Projects like Bittensor, Render, and the ASI Alliance are building real alternatives. The opportunity is significant, but the hype-to-utility gap is wide in this sector. Technical depth and genuine decentralization are the filters that matter.`
      },
      {
        title: 'AI Agents With Crypto Wallets — A New Kind of Economic Actor',
        content: `For the first time in history, non-human entities can have genuine economic agency — earning, spending, and managing money independently. This is not a science fiction scenario. It is happening on-chain in 2025–2026. Understanding it is essential for anyone who wants to understand where Web3 is going.

**What is an AI agent?**

An AI agent is an autonomous software program that can perceive its environment, make decisions based on that perception, and take actions — including financial actions — without requiring human authorization for each step.

This is different from a regular automated script or a chatbot. A chatbot responds to inputs. An AI agent pursues objectives. It monitors conditions, evaluates options, selects strategies, executes transactions, monitors outcomes, and adjusts — continuously, without a human in the loop.

**How account abstraction enables AI agent wallets**

Standard crypto wallets require a human to manually sign every transaction. This is incompatible with autonomous agents that need to execute dozens or hundreds of transactions per day in response to changing market conditions.

Account abstraction — covered briefly in Module 2 — makes wallets programmable. An AI agent wallet can be configured with: daily spending limits (the agent cannot spend more than $X per day regardless of its decisions), session keys (temporary permissions for specific actions without exposing the master key), multi-signature requirements for large transactions (a human must co-sign anything above a certain threshold), and whitelisted contracts (the agent can only interact with pre-approved protocols).

This gives humans meaningful control over AI agents without requiring human approval for every individual action — the right balance between autonomy and oversight.

**The full lifecycle of an AI agent managing DeFi**

Here is how a real AI agent portfolio manager operates in 2026:

The agent is initialized with a wallet containing $10,000 of USDC and a set of objectives: maximize yield while keeping risk below a defined threshold, never hold any single asset above 30% of portfolio, maintain 20% in liquid stablecoins at all times.

The agent continuously monitors: current yields across Aave, Compound, and Morpho on multiple chains; the health factor of any borrowed positions; price movements of collateral assets; gas costs on different networks; and risk signals including protocol TVL changes, audit reports, and governance activity.

When conditions change — a yield opportunity opens on a new protocol, a collateral asset price drops toward a liquidation threshold, gas prices fall making a rebalance affordable — the agent executes transactions automatically. It deposits, withdraws, swaps, and rebalances, all within its programmed parameters.

It can also hire other AI agents for specialized tasks — paying a research agent in micropayments to analyze a new protocol's risk profile before allocating capital to it.

**Real examples from 2025–2026**

AI trading agents managing DeFi yield strategies are active on multiple chains. AI research agents that charge micropayments per query — you pay a fraction of a cent in crypto, they return structured analysis. AI content agents that sell their outputs as NFTs. Autonomous AI-to-AI payments for computational services, where one agent pays another for data or processing without any human involvement in the transaction.

**What the AI agent economy means**

New business models: an individual can deploy a portfolio of specialized AI agents, each earning revenue from different tasks. The agent economy creates passive income streams that were not previously possible.

Pressure on human roles: AI agents performing tasks previously done by human traders, analysts, and fund managers will accelerate automation in financial services. This is not unique to crypto — but crypto's permissionless infrastructure makes it the first financial system where AI agents can operate without institutional gatekeepers.

New security challenges: AI agents managing significant capital are high-value targets. An agent can be manipulated through prompt injection — feeding malicious instructions into its data inputs to cause it to drain its own wallet. Securing agent wallets requires both technical safeguards and careful design of what information the agent is allowed to act on.

Regulatory uncertainty: who is legally responsible when an AI agent breaks financial regulations? This question is unresolved in virtually every jurisdiction. The answer will significantly shape how the AI agent economy develops over the next five years.

Takeaway: AI agents with crypto wallets represent a genuinely new category of economic actor. Account abstraction makes their wallets programmable and controllable. They are already managing DeFi positions, paying for services, and operating autonomously on-chain. The business model opportunities are real — and so are the security and regulatory challenges.`
      },
      {
        title: 'AI for Blockchain Security and Market Intelligence',
        content: `While the AI agent economy gets most of the attention, some of the most immediately practical AI x Crypto applications are less dramatic but more proven: using AI to make blockchain systems more secure and to give everyday users better market intelligence than was previously available only to institutional traders.

**AI-Powered Smart Contract Auditing**

Smart contract bugs have cost the industry billions of dollars. The Ronin Bridge hack ($625 million), the Euler Finance exploit ($197 million), and dozens of smaller incidents all involved vulnerabilities that human auditors missed or did not prioritize.

AI auditing tools are changing this equation. Certora uses formal verification — a mathematical approach to proving that a smart contract behaves correctly under all possible conditions — combined with AI-assisted analysis to identify edge cases human auditors miss. Slither is an open-source static analysis tool that scans Solidity code for known vulnerability patterns. MythX applies symbolic execution and AI to find exploitable paths through smart contract logic.

These tools do not replace human auditors — the best audits use both. But AI dramatically reduces the cost and time of initial vulnerability screening, making quality security analysis accessible to smaller projects that cannot afford a full manual audit.

For everyday users: before interacting with any unfamiliar protocol, you can run its contract address through AI-enhanced tools like the audit features now integrated into Etherscan, or get a quick risk assessment from Token Sniffer. Not foolproof — but meaningfully better than nothing.

**On-Chain Fraud Detection**

Blockchain's transparency is a double-edged property. Every transaction is public — which means both legitimate users and fraud analysts can see everything. AI models trained on blockchain transaction data are exceptionally good at identifying suspicious patterns that human analysts would miss.

Elliptic and Chainalysis — the two leading blockchain analytics firms — use machine learning extensively. Their models can: identify wallet clusters belonging to the same entity even when they use many different addresses; flag transactions consistent with money laundering patterns (layering, structuring, rapid chain-hopping); detect wash trading on NFT platforms; and identify wallets associated with known scam operations based on transaction graph analysis.

These tools are used by exchanges for regulatory compliance (flagging suspicious deposits and withdrawals), by law enforcement for tracing illicit funds, and increasingly by DeFi protocols themselves for risk management.

**AI Market Intelligence for Everyday Traders**

This is where AI x Crypto becomes immediately practical for individual participants. By 2026, AI-powered market analysis tools have moved from institutional-only to widely accessible.

Nansen AI: Nansen built its reputation on wallet labelling — identifying which wallets belong to VCs, exchanges, known whales, and protocol treasuries. Their AI layer now synthesizes this on-chain data into natural language market analysis. You can ask "what are smart money wallets doing with ETH right now?" and receive a structured, sourced answer in seconds.

Exchange-integrated AI: Binance, Bybit, and OKX have all integrated AI-powered features — trading signals that assess market conditions and suggest entry points, risk alerts that flag when your positions approach dangerous thresholds, and portfolio analysis that identifies concentration risks.

AI research assistants: Tools including Claude can analyze whitepapers, explain tokenomics in plain language, summarize audit reports, and provide structured analysis of new projects — dramatically accelerating the research process that Module 4 described. A task that took an experienced analyst hours can now be done in minutes. This does not replace judgment — but it removes the information bottleneck that previously favored large institutions over individual researchers.

AI scam detection: Emerging tools use AI to identify phishing websites in real time, flag suspicious contract interactions before you sign them, and recognize scam patterns in community messages. Scam Sniffer has integrated AI capabilities. Browser extensions that simulate transactions before you approve them are increasingly AI-enhanced.

**AI-Powered DeFi Protocol Management**

Beyond individual tools, AI is being integrated at the protocol level. Yearn Finance and similar yield aggregators use algorithmic strategies that incorporate AI-driven analysis to automatically route capital toward the best risk-adjusted yields. Gauntlet Network uses AI-powered simulations to recommend risk parameter adjustments for lending protocols like Aave — optimizing collateral ratios and liquidation thresholds based on real-time market conditions.

This makes DeFi protocols more resilient and efficient — and it happens invisibly in the background, benefiting all users of those protocols.

Takeaway: AI is already improving blockchain security through better auditing tools, making fraud harder to hide through on-chain analytics, and giving everyday crypto users access to market intelligence previously available only to institutions. These applications are proven, active, and practically useful right now — not future promises.`
      },
      {
        title: 'Verifiable AI, Proof of Personhood, and the Bot Problem',
        content: `As AI becomes more capable, two related problems are emerging that sit at the heart of the AI x Crypto intersection: how do you trust what an AI system produces, and how do you tell humans from AI in digital systems? Both questions have answers being built on blockchain — and both matter enormously for the future of Web3.

**The Black Box Problem**

Current AI systems are largely opaque. A model produces an output — a loan decision, a content recommendation, a trading signal — but the reasoning is hidden inside billions of parameters that even the model's creators cannot fully explain. You either trust the company that built the model, or you don't use it.

For high-stakes applications — financial decisions, identity verification, governance — this opacity is unacceptable. We need verifiable AI: systems where outputs can be trusted without trusting the operator.

Zero-knowledge proofs offer a solution. A ZK proof allows you to mathematically verify that a specific computation was performed correctly — that an AI model ran on specific inputs and produced a specific output — without revealing the model's weights or the input data. This creates verifiable AI: you can prove the AI did what it claims without exposing proprietary information.

Projects like Giza and Modulus Labs are building the infrastructure for ZK-provable AI computations. The practical applications are significant: a lending protocol could verify that its AI risk model ran correctly without revealing its proprietary algorithm. A DAO could verify that an AI governance recommendation was generated honestly. A user could verify that an AI trading agent made decisions according to its stated rules.

**Model Provenance on Blockchain**

Recording AI model versions, training data sources, and update history on an immutable blockchain creates an auditable trail for AI systems used in high-stakes applications. When a model is updated — changing its behavior — that change is recorded permanently. When training data is added or removed, that is recorded. This creates accountability for AI development that currently does not exist.

**Decentralized AI Governance**

DAOs can govern AI systems — voting on which models are deployed, what training data is used, how outputs are used, and how revenue is distributed. This distributes control over AI away from single corporations. Bittensor's subnet governance and the ASI Alliance's governance structure are early implementations of this principle.

**The Proof of Personhood Problem**

As AI agents proliferate, a fundamental challenge emerges: how do you distinguish humans from AI bots in digital systems? This has concrete and expensive consequences for crypto.

Airdrop farming by bots: protocols distribute tokens to reward genuine early users. But AI-powered bot farms can simulate human behaviour, interact with protocols at scale, and qualify for airdrops without contributing genuine value. The Uniswap, Arbitrum, and many other major airdrops were heavily farmed by bots — transferring value from genuine community members to automated systems.

Sybil attacks: a single attacker using hundreds or thousands of AI-controlled wallets to simulate many individual users. This undermines governance voting (one person controls many votes), airdrop distribution (one entity receives allocations meant for many), and community metrics (artificially inflated user counts).

**The Solutions Being Built**

Worldcoin (WLD): the most ambitious and controversial proof-of-personhood system. Uses specialized hardware called the Orb to scan users' irises, generating a unique biometric identifier that is converted into a privacy-preserving hash stored on-chain. Each human gets one World ID — proving they are a unique person without revealing their identity. The iris data itself is not stored. Worldcoin has enrolled tens of millions of users globally and is actively deploying Orbs in Africa.

The controversy: collecting biometric data from millions of people — many in developing countries — raises serious privacy concerns. The tradeoff between unique human verification and biometric data collection is genuinely contested. Worldcoin's approach represents one point on a spectrum of solutions.

Proof of Humanity: uses video verification and social vouching rather than biometrics. Users submit a video of themselves and are vouched for by existing verified members. More privacy-preserving than iris scanning but slower to scale.

Gitcoin Passport: aggregates identity signals — existing Web2 accounts (Twitter, GitHub), on-chain activity history, and other verifications — into a composite humanity score. No biometrics required. Each project can set a minimum passport score for participation, filtering out most bot activity without requiring any single verification method.

The arms race: as proof-of-personhood systems improve, AI-powered attempts to circumvent them also improve. This is an ongoing technical competition without a permanent winner — but each generation of solutions raises the cost and complexity of bot attacks.

Takeaway: Verifiable AI uses ZK proofs to make AI outputs trustworthy without trusting the operator. Proof of personhood systems — Worldcoin, Proof of Humanity, Gitcoin Passport — address the growing challenge of distinguishing humans from AI bots in Web3 systems. Both problems are active, consequential, and being solved with real technical ingenuity — though no solution is complete.`
      },
      {
        title: 'Risks, Opportunities, and Where Africa Fits in the AI x Crypto Future',
        content: `Every major technological convergence creates both genuine opportunities and genuine dangers. AI x Crypto is no exception. This final lesson applies the critical thinking tools from earlier modules to this new frontier — honestly assessing the risks, then identifying where African participants are specifically positioned to benefit.

**Applying the Tokenomics Framework to AI x Crypto Projects**

The Module 4 evaluation framework applies directly here — and is especially important because AI x Crypto is the sector most vulnerable to hype-driven token inflation.

The hype-to-utility gap: combining two buzzwords does not create value. Many projects claim AI capabilities that are far more modest in practice than their marketing suggests. A project with "AI" in its name and a slick whitepaper does not automatically have genuine AI capability. Always look for verifiable, working products — GitHub repositories with real code commits, protocols generating measurable revenue, active users interacting on-chain.

Token inflation masking weak fundamentals: some AI x Crypto projects sustain their ecosystems through aggressive token rewards that attract capital but generate no real economic activity. Apply the real yield test from Module 3: is this protocol generating revenue from genuine activity, or is it paying participants in newly minted tokens that have no underlying value driver?

FDV versus market cap: AI x Crypto tokens frequently launch with very high fully diluted valuations relative to circulating supply. Check TokenUnlocks.app before investing in any project — if significant team and investor allocations are unlocking in the near term, that sell pressure will affect price regardless of the project's genuine merit.

Centralization risk in "decentralized" AI: evaluate actual infrastructure distribution, not marketing claims. Who controls the validator set? Who can update the model? Who controls the treasury? Projects that are centralized in practice while claiming decentralization represent both a technical and an investment risk.

**AI Agent Security Risks**

AI agents managing significant capital introduce a new attack surface. Prompt injection attacks — feeding malicious instructions into an AI agent's data inputs to hijack its behaviour — are the AI equivalent of smart contract exploits. An agent that reads market data from an external source can potentially be manipulated through that source. An agent that processes text inputs can potentially be tricked by adversarial content designed to change its behaviour.

The defenses are still maturing. Responsible AI agent deployment requires: strict whitelisting of which contracts the agent can interact with, daily spending limits that constrain maximum loss, human co-signing requirements for large transactions, and monitoring systems that flag unusual patterns.

**Regulatory Risk**

The EU AI Act — in force from 2025 — classifies AI systems by risk level and imposes requirements on high-risk applications. AI systems used for financial decisions, credit scoring, and trading fall into regulated categories. Projects that use AI in these ways and operate in EU-regulated markets face compliance requirements that are still being interpreted and enforced.

US AI regulation is developing more slowly but moving in the same direction. Platforms that build AI x Crypto products need to monitor regulatory developments closely — particularly around autonomous agent systems that interact with financial markets.

**AI-Powered Scams — A Genuine Threat**

The same AI tools that help legitimate builders also empower sophisticated scammers. By 2025–2026, AI-generated whitepapers that appear technically credible are common. AI-fabricated team members with realistic LinkedIn profiles and GitHub histories have been used in fraudulent projects. AI-driven fake community engagement — bots that simulate active Discord and Telegram communities — makes dead projects appear alive.

The defense: verify teams through video calls and independent searches. Check GitHub commit histories for genuine development activity. Use on-chain analytics to verify actual user counts rather than relying on community metrics. Apply the red flag checklist from Module 4 rigorously — AI makes fraud more convincing but does not change the fundamental patterns.

**The African Opportunity — Five Specific Positions**

Africa is not a passive observer of the AI x Crypto convergence. There are five specific areas where African participants are positioned to benefit.

GPU contribution to DePIN AI networks: as GPU hardware becomes more accessible and internet infrastructure improves across Africa, contributing computing capacity to networks like Render and Gensyn becomes a genuine income stream. Communities and businesses with capable hardware can earn token rewards for AI training and inference work — earning from global AI demand without leaving home.

AI agent builders: developers who learn to build and deploy AI agents using frameworks like Fetch.ai's uAgents or Near's AI toolkit are entering one of the highest-demand skill categories of the next five years. The combination of blockchain development skills and AI agent development is rare globally — and African developers who build both are exceptionally well positioned.

African data monetization: African data is severely underrepresented in global AI training sets. Local language data — Pidgin, Yoruba, Hausa, Igbo, Swahili, Amharic, Zulu — agricultural data, health data, and market data are all scarce and valuable. Ocean Protocol and similar data marketplaces enable African data owners to monetize these datasets while maintaining control and privacy. This is both an income opportunity and a way to ensure that AI systems trained on global data reflect African realities.

AI-powered crypto education for African audiences: building AI-assisted educational tools that answer crypto questions in local languages — chatbots that explain DeFi in Pidgin, AI tutors that adapt to learner pace in Yoruba or Hausa — addresses a genuine and enormous market gap. The AfroLearn model combined with AI assistance represents an infrastructure-level educational opportunity.

Community intelligence systems: AI systems that monitor community channels for scam patterns, surface relevant warnings, and protect African crypto users from the specific scam tactics that target this market are high-value applications. Nigeria and other African markets are heavily targeted by crypto fraud. Community-owned AI safety systems — trained on local scam patterns and operating in local languages — could protect millions of users in ways that global platforms have failed to do.

**The Honest Summary**

AI x Crypto is real, active, and consequential. The infrastructure is being built now. The projects that survive will be those with genuine technical depth, real economic activity, and actual utility — not those with the most impressive marketing.

For African builders, educators, and community leaders: the intersection of AI and blockchain represents one of the most significant economic opportunities of the next decade. The skills to build, evaluate, and work with AI-powered blockchain systems will be among the most sought-after in the global digital economy. The window to develop those skills is now — before the sector matures and the entry barriers rise.

Takeaway: Apply the same rigorous evaluation framework to AI x Crypto that you apply to all crypto projects — the hype is louder here, which means the filtering needs to be more careful. The genuine opportunities are real: GPU contribution, AI agent development, data monetization, AI-powered education, and community safety systems all represent specific, actionable paths for African participants in the AI x Crypto future.`
      },
    ],
    flashcards: [
      {
        front: 'Why do AI and crypto naturally converge — what problem do they share?',
        back: 'Both face a fundamental trust problem in digital systems. Blockchain solves AI\'s trust problem — making AI outputs verifiable, transparent, and tamper-proof. AI solves crypto\'s complexity problem — processing vast data, detecting fraud, and managing DeFi autonomously. Blockchain verifies. AI optimizes. Together they make each other more trustworthy and capable.'
      },
      {
        front: 'What is Bittensor (TAO) and what makes it different from other AI projects?',
        back: 'A decentralized network where AI models compete across specialized subnets to produce the best outputs. Validators score quality and distribute TAO rewards to top performers — creating a marketplace for intelligence. Distinguished by genuine technical depth: real subnet architecture, active development, measurable competition between models. Not just a token claiming AI — actual decentralized AI infrastructure.'
      },
      {
        front: 'What is an AI agent and how does account abstraction enable it to operate on-chain?',
        back: 'An AI agent is autonomous software that perceives its environment, makes decisions, and takes actions — including financial transactions — without human approval for each step. Account abstraction makes its wallet programmable: daily spending limits, session keys, whitelisted contracts, and co-signing thresholds give humans control without requiring manual approval of every transaction.'
      },
      {
        front: 'What is a prompt injection attack on an AI agent — and how is it defended against?',
        back: 'Feeding malicious instructions into an AI agent\'s data inputs to hijack its behaviour — the AI equivalent of a smart contract exploit. An agent reading market data from an external source can be manipulated through that source. Defenses: strict contract whitelisting, daily spending limits, human co-signing for large transactions, and monitoring systems that flag unusual behaviour patterns.'
      },
      {
        front: 'What is proof of personhood — and why has it become critical as AI agents proliferate?',
        back: 'On-chain verification that a wallet is controlled by a unique human, not a bot or AI. Critical because AI bot farms can simulate human behaviour, farm airdrops, manipulate governance votes, and inflate community metrics — transferring value from genuine users to automated systems. Solutions: Worldcoin (iris biometrics), Proof of Humanity (video + social vouching), Gitcoin Passport (aggregated identity signals).'
      },
      {
        front: 'What is verifiable AI and how do zero-knowledge proofs enable it?',
        back: 'Verifiable AI allows you to prove that an AI model ran correctly on specific inputs and produced a specific output — without trusting the operator and without revealing the model\'s weights. ZK proofs mathematically verify that a computation was performed correctly. Applications: lending protocols verifying risk model integrity, DAOs verifying AI governance recommendations, users verifying agent behaviour matches stated rules.'
      },
      {
        front: 'What are the five African opportunities in the AI x Crypto convergence?',
        back: '1) GPU contribution to DePIN AI networks like Render for token income. 2) AI agent development using Fetch.ai or Near AI frameworks — high-demand global skills. 3) African data monetization via Ocean Protocol — local language and market data is scarce and valuable. 4) AI-powered crypto education in local languages — Pidgin, Yoruba, Hausa, Swahili. 5) Community intelligence systems — AI scam detection trained on African fraud patterns to protect local crypto users.'
      },
      {
        front: 'What is the key red flag when evaluating AI x Crypto token projects?',
        back: 'The hype-to-utility gap — combining "AI" and "crypto" in marketing does not create value. Look for: verifiable working products (active GitHub, on-chain activity), genuine protocol revenue not funded by token inflation, actual decentralization of infrastructure not just marketing claims, reasonable FDV vs market cap without near-term large unlocks, and a team whose AI capabilities can be independently verified.'
      },
    ],
    quiz: [
      {
        question: 'Why are AI and blockchain described as natural partners — what core problem do they solve for each other?',
        options: [
          'AI makes crypto transactions faster, and crypto makes AI models cheaper to run',
          'Blockchain makes AI outputs verifiable and tamper-proof; AI makes blockchain systems more secure and autonomous — they solve each other\'s trust and complexity problems',
          'Both technologies were invented by the same research community and share the same codebase',
          'AI generates the encryption keys that secure blockchain transactions'
        ],
        correct: 1
      },
      {
        question: 'Bittensor organizes its network into specialized "subnets." What is the purpose of this architecture?',
        options: [
          'Each subnet is a separate blockchain that processes transactions independently',
          'Subnets allow different geographic regions to participate in the network without cross-border data transfer',
          'Each subnet focuses on a specific AI task, with models competing and validators rewarding the best performers in TAO tokens — creating a marketplace for specialized intelligence',
          'Subnets are security compartments that prevent one compromised model from affecting others'
        ],
        correct: 2
      },
      {
        question: 'An AI agent is given $10,000 of USDC and objectives to maximize DeFi yield. It has a daily spending limit of $500 and can only interact with whitelisted contracts. What feature makes this programmable control possible?',
        options: [
          'Multi-signature wallets requiring 3-of-5 signers for every transaction',
          'Account abstraction — making wallets programmable with spending limits, session keys, and contract whitelists',
          'Cold storage hardware wallets that require physical confirmation',
          'CEX trading bots with API key restrictions'
        ],
        correct: 1
      },
      {
        question: 'Kofi in Accra is evaluating an AI x Crypto project. Its whitepaper mentions "revolutionary AI" but its GitHub has no commits in 6 months, it has no entry on Token Terminal, and its FDV is 40x its market cap. How should he assess it?',
        options: [
          'Positive — early stage projects have low GitHub activity and high FDV by design',
          'Neutral — wait for the AI features to launch before deciding',
          'Multiple serious red flags — no verifiable development, no revenue, and massive future sell pressure from locked tokens signal high risk regardless of AI marketing',
          'Positive — the high FDV means the market expects significant future growth'
        ],
        correct: 2
      },
      {
        question: 'What is a Sybil attack in the context of AI x Crypto — and which proof of personhood system uses iris biometrics to prevent it?',
        options: [
          'A smart contract exploit using recursive calls; defended by Certora formal verification',
          'One attacker using many AI-controlled wallets to simulate multiple users, manipulating governance and airdrops; Worldcoin uses iris scanning to verify each wallet belongs to a unique human',
          'An AI agent hijacking another agent\'s wallet via prompt injection; defended by spending limits',
          'A 51% attack on a blockchain network; defended by Proof of Stake slashing'
        ],
        correct: 1
      },
      {
        question: 'What does "verifiable AI" mean — and which cryptographic technology enables it?',
        options: [
          'AI that has been audited by a government regulator and certified as accurate',
          'AI whose training data has been published openly so anyone can verify what it learned',
          'AI whose outputs can be mathematically proven correct using zero-knowledge proofs — verifying computation without revealing model weights or input data',
          'AI that runs on a public blockchain where every inference transaction is recorded'
        ],
        correct: 2
      },
      {
        question: 'Lena in Berlin wants to monetize a unique dataset of local market pricing data that is underrepresented in global AI training sets. Which decentralized AI infrastructure project is most relevant?',
        options: [
          'Bittensor — she can run a subnet specialized in market data analysis',
          'Render Network — she can contribute GPU power to train models on her data',
          'Ocean Protocol — a decentralized data marketplace enabling data owners to monetize datasets while maintaining control and privacy',
          'Worldcoin — she can verify her identity and receive token rewards for contributing data'
        ],
        correct: 2
      },
      {
        question: 'An AI-powered community safety tool for Nigerian crypto users would be most valuable if it was trained specifically on local scam patterns and operated in local languages. Which of the following best describes why this matters?',
        options: [
          'Nigerian regulations require all AI tools to operate in local languages',
          'Global AI safety tools are not accessible in Nigeria due to internet restrictions',
          'Nigeria is heavily targeted by crypto fraud with locally specific tactics; a community-owned AI system trained on these patterns and communicating in Pidgin or local languages protects users in ways global platforms have consistently failed to do',
          'Local language operation reduces the computing cost of running AI safety tools'
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
  const guard = useBpmGuard(metrics.bpm, confidencePct, sessionSeconds, {
    warmupSeconds: 0,
  });

  const qualityHistoryRef = useRef<number[]>([]);
  if (qualityPct > 0) {
    qualityHistoryRef.current.push(qualityPct);
    if (qualityHistoryRef.current.length > 60) qualityHistoryRef.current.shift();
  }
  const avgQuality = qualityHistoryRef.current.length > 0
    ? Math.round(qualityHistoryRef.current.reduce((a, b) => a + b, 0) / qualityHistoryRef.current.length)
    : 0;

  const hasLoggedHighRef = useRef(false);
  useEffect(() => {
    if (!sessionActive && hasLoggedHighRef.current) {
      hasLoggedHighRef.current = false;
      return;
    }
    if (guard.suspicionLevel === 'high' && !hasLoggedHighRef.current) {
      hasLoggedHighRef.current = true;
      void logSuspiciousSession({
        username:      username ?? 'anonymous',
        country:       '',          // no country available mid-session - fixed to null in logSuspiciousSession.ts
        deviceType:    /Mobi/.test(navigator.userAgent) ? 'mobile' : 'desktop',
        sessionSeconds,
        moduleTitle:   activeModule?.title ?? 'unknown',
        quizScore:     activeModule ? Math.round((quizScore / activeModule.quiz.length) * 100) :0,
        guard,
        avgConfidence: confidencePct,
        avgQuality,
      });
    }
  }, [guard.suspicionLevel, sessionActive]); // eslint-disable-line react-hooks/exhaustive-deps

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
    if (guard.suspicionLevel !== 'none') {
      void logSuspiciousSession({
        username:      username ?? 'anonymous',
        country:       '',          // no country available - fixed to null in logSuspiciiousSession.ts
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
