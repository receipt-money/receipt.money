// Next, React
import { FC, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

// Wallet
import { useWallet, useConnection } from '@solana/wallet-adapter-react';

// Package info
import pkg from '../../../package.json';

// Store
import useUserSOLBalanceStore from '../../stores/useUserSOLBalanceStore';

export const HomeView: FC = ({ }) => {
  const wallet = useWallet();
  const { connection } = useConnection();

  const balance = useUserSOLBalanceStore((s) => s.balance)
  const { getUserSOLBalance } = useUserSOLBalanceStore()

  useEffect(() => {
    if (wallet.publicKey) {
      console.log(wallet.publicKey.toBase58())
      getUserSOLBalance(wallet.publicKey, connection)
    }
  }, [wallet.publicKey, connection, getUserSOLBalance])

  return (
    <div className="md:hero mx-auto p-4">
      <div className="md:hero-content flex flex-col">
        <div className="mt-6 text-center">
          <div className="flex justify-center mb-6">
            <Image src="/receiptLogo.jpeg" alt="receipt.money Logo" width={180} height={120} className="mb-4" />
          </div>
          <h1 className="text-center text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-green-400 to-purple-500 mb-4">
            receipt.money
          </h1>
          <h2 className="text-center text-3xl font-semibold text-white mb-6">
            Digital Receipts on Solana
          </h2>
          
          <div className="flex justify-center mt-4 mb-6">
            <Link href="/deposit" className="btn btn-lg bg-gradient-to-r from-green-400 to-purple-500 text-white font-bold py-4 px-16 rounded-lg shadow-lg hover:shadow-purple-500/30 transition-all duration-300 text-xl">
              Deposit
            </Link>
          </div>
        </div>

        <div className="md:w-full text-xl md:text-2xl text-center text-slate-300 mt-4 mb-8 max-w-3xl mx-auto">
          <p className="mb-4">The future of retail receipts - secured on the blockchain.</p>
          <p className="text-slate-400 leading-relaxed mb-6">
            receipt.money creates immutable, verifiable digital receipts for your purchases,
            stored safely on the Solana blockchain.  
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 my-12 max-w-5xl mx-auto text-center">
          <div className="p-6 bg-slate-800 rounded-xl shadow-lg hover:shadow-purple-500/20 transition-all duration-300">
            <h3 className="text-xl font-bold text-white mb-3">Eco-Friendly</h3>
            <p className="text-slate-300">No more paper receipts. Reduce waste and help the environment with our digital solution.</p>
          </div>
          <div className="p-6 bg-slate-800 rounded-xl shadow-lg hover:shadow-purple-500/20 transition-all duration-300">
            <h3 className="text-xl font-bold text-white mb-3">Secure & Verified</h3>
            <p className="text-slate-300">All receipts are cryptographically secured on Solana, with tamper-proof verification.</p>
          </div>
          <div className="p-6 bg-slate-800 rounded-xl shadow-lg hover:shadow-purple-500/20 transition-all duration-300">
            <h3 className="text-xl font-bold text-white mb-3">Easy Access</h3>
            <p className="text-slate-300">Access all your shopping history in one place, forever stored on the blockchain.</p>
          </div>
        </div>

        {wallet.publicKey && (
          <div className="flex flex-col items-center mt-6 mb-8">
            <div className="flex flex-col items-center gap-4">
              <div className="flex flex-row justify-center mt-2">
                <div className="text-xl text-slate-300">
                  {(balance || 0).toLocaleString()}
                </div>
                <div className='text-slate-500 ml-2 text-xl'>
                  SOL
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="text-center text-sm text-slate-500 mt-8">
          <p>v{pkg.version} | Powered by Solana</p>
        </div>
      </div>
    </div>
  );
};