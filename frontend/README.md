# Receipt Money Frontend

Receipt.money is a DeFi platform on Solana for creating Crypto Receipts (CRs) to tokenize staked assets.

## Features

- Lock various tokens (SOL, USDC, mSOL, jitoSOL) and mint Crypto Receipt (CR) tokens
- Seamless wallet connection with Solana wallet adapter
- Modern responsive UI with Tailwind CSS and DaisyUI
- Integrated with Solana smart contracts for secure transactions

## Getting Started

This is a [Next.js](https://nextjs.org/) project that integrates with Solana blockchain.

## Installation

```bash
npm install
# or
yarn install
```

## Build and Run

Next, run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
├── public : publicly hosted files including assets and IDL
├── src : primary code folders and files 
│   ├── components : reusable UI components
│   ├── contexts : React context providers for wallet and network
│   ├── hooks : utility hooks for React state management
│   ├── models : data structure types
│   ├── pages : Next.js pages
│   ├── stores : state management stores
│   ├── styles : global styles with Tailwind CSS
│   ├── utils : utility functions for blockchain interactions
│   └── views : main view components for pages
```

## Technologies Used

- Next.js 
- Solana Web3.js
- Anchor Framework
- Tailwind CSS
- DaisyUI
- TypeScript

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.