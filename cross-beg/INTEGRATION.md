# Cross-Beg: Base Pay + Smart Contract Integration

A modern payment request system built with React, Privy wallet authentication, and Base Pay integration.

## 🚀 Features

- **Universal Wallet Support** - Works with MetaMask, Coinbase Wallet, and any Base-compatible wallet
- **Base Pay Payments** - One-click USDC payments with sponsored gas fees
- **Smart Contract Integration** - On-chain payment requests on Base Sepolia
- **No Base Account Required** - Users can pay with USDC from any wallet on Base
- **Clean UI** - Modern React interface with TypeScript

## 🛠 Setup

### Prerequisites
- Node.js 18+ 
- Any wallet (MetaMask, Coinbase Wallet, etc.)
- USDC on Base Sepolia from [Circle Faucet](https://faucet.circle.com)

### Getting USDC on Base
1. **For Base Sepolia (Testnet):**
   - Visit [Circle Faucet](https://faucet.circle.com)
   - Select "Base Sepolia" network
   - Enter your wallet address
   - Get free test USDC

2. **For Base Mainnet:**
   - Bridge USDC from Ethereum using [Base Bridge](https://bridge.base.org)
   - Buy directly on Base using [Coinbase](https://coinbase.com)
   - Transfer from Coinbase to your wallet

### Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Environment setup:**
```bash
cp .env.example .env
# Edit .env with your Privy App ID if needed
```

3. **Start development server:**
```bash
npm run dev
```

4. **Visit:** `http://localhost:5173`

## 📝 Usage

### Creating Payment Requests
1. Go to `/request`
2. Connect wallet via Privy
3. Enter recipient address, amount (ETH), and description
4. Submit transaction to create on-chain request

### Paying Requests  
1. Go to `/requests`
2. View pending payment requests
3. Click "Pay Now" to initiate Base Pay
4. Complete payment in one click

## 🔧 Technical Stack

- **Frontend:** React + TypeScript + Vite
- **Wallet:** Privy authentication
- **Blockchain:** Viem + Base Sepolia
- **Payments:** Base Pay SDK
- **Styling:** Tailwind CSS + shadcn/ui

## 📄 Contract Details

- **Contract:** `0xE455605768F153839Cd269f3cd17E90B56b7B21A`
- **Network:** Base Sepolia (Chain ID: 84532)
- **Explorer:** [BaseScan](https://sepolia.basescan.org/address/0xE455605768F153839Cd269f3cd17E90B56b7B21A)

## 🎯 Key Files

```
src/
├── lib/
│   ├── contracts.ts      # Smart contract utilities
│   └── basePay.ts        # Base Pay integration
├── contexts/
│   └── WalletContext.tsx # Privy wallet context
├── pages/
│   ├── EnhancedNewRequest.tsx    # Create requests
│   └── EnhancedViewRequests.tsx  # View/pay requests
└── App.tsx              # Privy provider setup
```

## 🔄 Payment Flow

1. **Request Creation:**
   - User creates request → Smart contract stores on-chain
   - Request includes payer, amount (USD), description, due date

2. **Payment Processing:**
   - Payer sees request in dashboard
   - Click "Pay Now" → Base Pay handles payment
   - Works with any wallet that has USDC on Base
   - Gas fees automatically sponsored by Base Pay
   - Payment sent in USDC, displays as USD amount
   - Transaction confirmed on Base Sepolia

## 💰 Base Pay Integration

**How it works:**
- **Any Wallet:** MetaMask, Coinbase Wallet, Rainbow, etc.
- **USDC Required:** Users need USDC on Base network (not necessarily Base Account)
- **Gas Sponsorship:** Base Pay covers all gas fees automatically
- **Magic Spend:** Integrates with Coinbase balances when available
- **Instant Settlement:** Payments settle in ~2 seconds

## 🧪 Testing

1. **Get Test Funds:**
   - ETH: Base Sepolia faucet
   - USDC: [Circle Faucet](https://faucet.circle.com)

2. **Test Flow:**
   - Create request with friend's address
   - Have them pay via Base Pay
   - Verify on-chain via BaseScan

## 🚨 Notes

- Currently using Base Sepolia testnet
- Payments are in test USDC
- Mainnet deployment requires environment updates

## 📚 Resources

- [Base Pay Docs](https://docs.base.org/base-pay)
- [Privy Docs](https://docs.privy.io)
- [Viem Docs](https://viem.sh)
