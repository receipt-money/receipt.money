import { FC, useState, useEffect, ChangeEvent, useCallback } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Transaction, PublicKey } from '@solana/web3.js';
import { Program } from '@coral-xyz/anchor';
import { BN } from 'bn.js';
import Image from 'next/image';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { prepareDepositTransaction, SOL_MINT, USDC_MINT, MSOL_MINT, JITOSOL_MINT, PROGRAM_ID } from '../../utils/deposit';
import { getBalance } from '../../utils/balances';
import idl from '../../../public/receipt_money.json';

export const DepositView: FC = () => {
  const { publicKey, sendTransaction, signTransaction } = useWallet();
  const { connection } = useConnection();
  
  const [lockAmount, setLockAmount] = useState<string>('');
  const [mintAmount, setMintAmount] = useState<string>('');
  const [selectedLockToken, setSelectedLockToken] = useState<string>('SOL');
  const [selectedMintToken, setSelectedMintToken] = useState<string>('crSOL');
  const [showLockDropdown, setShowLockDropdown] = useState<boolean>(false);
  const [cycleIndex, setCycleIndex] = useState<number>(0);
  const [displayText, setDisplayText] = useState<string>('Lock your SOL to get crSOL');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState<boolean>(false);
  
  // Token configurations with decimal precision and mint address
  const tokens = [
    { id: 'SOL', name: 'SOL', icon: '/solanaLogo.png', decimals: 9, mint: SOL_MINT },
    { id: 'USDC', name: 'USDC', icon: '/assets/solana.svg', decimals: 6, mint: USDC_MINT },
    { id: 'mSOL', name: 'mSOL', icon: '/assets/solana.svg', decimals: 9, mint: MSOL_MINT },
    { id: 'jitoSOL', name: 'jitoSOL', icon: '/assets/solana.svg', decimals: 9, mint: JITOSOL_MINT }
  ];

  const cycleTokens = ['SOL', 'USDC', 'mSOL', 'jitoSOL'];
  
  // Format number with appropriate decimals
  const formatAmount = useCallback((value: string, decimals: number): string => {
    // Remove non-numeric characters except for the decimal point
    let cleaned = value.replace(/[^\d.]/g, '');
    
    // Ensure only one decimal point
    const decimalPoints = cleaned.match(/\./g) || [];
    if (decimalPoints.length > 1) {
      cleaned = cleaned.slice(0, cleaned.lastIndexOf('.'));
    }
    
    // Limit decimal places
    if (cleaned.includes('.')) {
      const parts = cleaned.split('.');
      cleaned = `${parts[0]}.${parts[1].slice(0, decimals)}`;
    }
    
    return cleaned;
  }, []);

  // State for crToken balance
  const [crTokenBalance, setCrTokenBalance] = useState<number>(0);
  const [isCrBalanceLoading, setIsCrBalanceLoading] = useState<boolean>(false);
  
  // Fetch wallet balance for the selected token
  const fetchWalletBalance = useCallback(async () => {
    if (!publicKey) return;
    
    const selectedToken = tokens.find(t => t.id === selectedLockToken);
    if (!selectedToken) return;
    
    setIsLoadingBalance(true);
    try {
      const balance = await getBalance(
        connection,
        publicKey,
        selectedToken.mint,
        selectedToken.decimals
      );
      
      setWalletBalance(balance);
    } catch (error) {
      console.error('Error fetching balance:', error);
      setWalletBalance(0);
    } finally {
      setIsLoadingBalance(false);
    }
    
    // Also fetch the crToken balance
    setIsCrBalanceLoading(true);
    try {
      // Get receipt state PDA
      const [receiptState] = PublicKey.findProgramAddressSync(
        [Buffer.from("receipt_state"), selectedToken.mint.toBuffer()],
        PROGRAM_ID
      );
      
      // Get crypto receipt mint PDA
      const [cryptoReceiptMint] = PublicKey.findProgramAddressSync(
        [Buffer.from("receipt_mint"), receiptState.toBuffer()],
        PROGRAM_ID
      );
      
      // Get the balance of the crypto receipt token
      console.log("Fetching balance for CR Token:", cryptoReceiptMint.toString());
      const crBalance = await getBalance(
        connection,
        publicKey,
        cryptoReceiptMint,
        selectedToken.decimals
      );
      
      console.log("CR Token:", cryptoReceiptMint.toString(), "Balance:", crBalance);
      setCrTokenBalance(crBalance);
    } catch (error) {
      console.error('Error fetching crToken balance:', error);
      setCrTokenBalance(0);
    } finally {
      setIsCrBalanceLoading(false);
    }
  }, [publicKey, connection, selectedLockToken]);

  // Handle amount input change
  const handleAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedToken = tokens.find(t => t.id === selectedLockToken);
    const decimals = selectedToken?.decimals || 9;
    
    const formattedValue = formatAmount(e.target.value, decimals);
    setLockAmount(formattedValue);
    setMintAmount(formattedValue); // Mirror the same amount for cr tokens
  };

  // Handle max button click
  const handleMaxClick = () => {
    if (walletBalance) {
      const selectedToken = tokens.find(t => t.id === selectedLockToken);
      if (selectedToken) {
        // Format balance to appropriate decimal places
        const formattedBalance = walletBalance.toFixed(selectedToken.decimals);
        setLockAmount(formattedBalance);
        setMintAmount(formattedBalance);
      }
    }
  };

  useEffect(() => {
    // Create cycling text for "Lock your X to get crX"
    const interval = setInterval(() => {
      const nextIndex = (cycleIndex + 1) % cycleTokens.length;
      setCycleIndex(nextIndex);
      const token = cycleTokens[nextIndex];
      setDisplayText(`Lock your ${token} to get cr${token}`);
    }, 2000);
    
    return () => clearInterval(interval);
  }, [cycleIndex]);

  // Fetch wallet balance when wallet is connected or token changes
  useEffect(() => {
    if (publicKey) {
      fetchWalletBalance();
    }
  }, [publicKey, fetchWalletBalance]);

  const handleLockTokenSelect = (tokenId: string) => {
    setSelectedLockToken(tokenId);
    setSelectedMintToken(`cr${tokenId}`);
    setShowLockDropdown(false);
    
    // Reset amount fields when changing tokens to avoid decimal precision issues
    setLockAmount('');
    setMintAmount('');
  };

  const handleMint = async () => {
    if (!publicKey) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    if (!lockAmount || parseFloat(lockAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      setIsLoading(true);
      const selectedToken = tokens.find(t => t.id === selectedLockToken);
      
      if (!selectedToken) {
        toast.error("Invalid token selected");
        setIsLoading(false);
        return;
      }

      // Check if amount is greater than wallet balance
      if (parseFloat(lockAmount) > walletBalance) {
        toast.error(`Insufficient balance. You have ${walletBalance.toFixed(4)} ${selectedToken.name}`);
        setIsLoading(false);
        return;
      }

      // Create program instance
      const program = new Program(idl as any, PROGRAM_ID);
      
      // Amount with correct decimals
      const amount = parseFloat(lockAmount);
      
      // Prepare transaction
      const transaction = await prepareDepositTransaction({
        connection,
        wallet: publicKey,
        program,
        tokenMint: selectedToken.mint,
        amount,
        decimals: selectedToken.decimals,
        priorityFee: true,
      });
      
      // Get recent blockhash for transaction
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;
      
      // Send transaction
      const signature = await sendTransaction(transaction, connection);
      
      // Wait for confirmation
      const confirmation = await connection.confirmTransaction(signature, 'confirmed');
      
      if (confirmation.value.err) {
        toast.error(`Transaction failed: ${confirmation.value.err.toString()}`);
      } else {
        toast.success(`Transaction confirmed! Signature: ${signature}`);
        setLockAmount('');
        setMintAmount('');
        
        // Fetch updated balances
        fetchWalletBalance();
      }
    } catch (error) {
      console.error('Error depositing tokens:', error);
      toast.error(`Transaction failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedLockTokenObj = tokens.find(t => t.id === selectedLockToken);

  return (
    <div className="md:hero mx-auto p-4">
      <div className="md:hero-content flex flex-col">
        <h1 className="text-center text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-indigo-300 to-purple-500 mt-6 mb-4">
          Lock & Mint
        </h1>
        
        <p className="text-center text-xl text-slate-300 mb-8 animate-pulse">
          {displayText}
        </p>
        
        <div className="w-full max-w-lg bg-slate-900 rounded-xl p-8 shadow-lg mx-auto">
          {/* Lock Section */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-semibold text-white">Lock</h2>
              <div className="flex items-center gap-2">
                {publicKey && !isLoadingBalance && (
                  <span className="text-sm text-indigo-400">
                    {walletBalance.toFixed(4)}
                  </span>
                )}
                {publicKey && (
                  <button 
                    className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors bg-slate-800 px-2 py-1 rounded"
                    onClick={handleMaxClick}
                    disabled={!walletBalance || isLoadingBalance}
                  >
                    Max
                  </button>
                )}
              </div>
            </div>
            <div className="p-4 bg-slate-800 rounded-lg flex items-center">
              <div className="relative">
                <button 
                  className="flex items-center space-x-1 bg-slate-700 rounded-lg px-4 py-2 text-white"
                  onClick={() => setShowLockDropdown(!showLockDropdown)}
                >
                  {selectedLockTokenObj && (
                    <>
                      <Image src={selectedLockTokenObj.icon} alt={selectedLockTokenObj.name} width={24} height={24} />
                      <span>{selectedLockTokenObj.name}</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </>
                  )}
                </button>

                {showLockDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-full bg-slate-700 rounded-lg shadow-lg z-10">
                    {tokens.map(token => (
                      <button
                        key={token.id}
                        className="flex items-center space-x-2 w-full px-4 py-2 hover:bg-slate-600 text-white text-left"
                        onClick={() => handleLockTokenSelect(token.id)}
                      >
                        <Image src={token.icon} alt={token.name} width={24} height={24} />
                        <span>{token.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <input
                type="text"
                inputMode="decimal"
                className="flex-grow bg-transparent text-white text-right text-2xl focus:outline-none"
                value={lockAmount}
                onChange={handleAmountChange}
                placeholder="0.00"
                autoComplete="off"
                onFocus={(e) => e.target.select()}
              />
            </div>
          </div>

          {/* Divider with arrow */}
          <div className="relative flex items-center justify-center my-6">
            <div className="w-full border-t border-slate-700"></div>
            <div className="absolute bg-slate-700 rounded-full p-2">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </div>

          {/* Mint Section */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-semibold text-white">Mint</h2>
              {publicKey && (
                <span className="text-sm text-indigo-400">
                  {isCrBalanceLoading ? '...' : crTokenBalance.toFixed(4)}
                </span>
              )}
            </div>
            <div className="p-4 bg-slate-800 rounded-lg flex items-center">
              <div className="px-4 py-2 bg-slate-700 rounded-lg text-white flex items-center space-x-1">
                <Image src={selectedLockTokenObj?.icon || '/solanaLogo.png'} alt={selectedMintToken} width={24} height={24} />
                <span>{selectedMintToken}</span>
              </div>
              
              <div className="flex-grow text-white text-right text-2xl">
                {mintAmount || '0.00'}
              </div>
            </div>
          </div>

          {/* Mint Button */}
          <button
            onClick={handleMint}
            disabled={!publicKey || isLoading}
            className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-lg text-xl shadow-lg hover:shadow-purple-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Processing...' : 'Mint'}
          </button>
        </div>
      </div>
      <ToastContainer position="bottom-right" theme="dark" />
    </div>
  );
};