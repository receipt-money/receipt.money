import {
  Connection,
  PublicKey,
  Transaction,
  ComputeBudgetProgram,
  SendOptions,
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
} from '@solana/spl-token';

// Token 2022 Program ID
const TOKEN_2022_PROGRAM_ID = new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb');
import { Program, BN } from '@coral-xyz/anchor';
import { getAllPDAs } from './pda';
import { prepareWrapSOL } from './wrapUnwrapSol';

// Define token mint addresses
export const SOL_MINT = new PublicKey('So11111111111111111111111111111111111111112');
export const USDC_MINT = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');
export const MSOL_MINT = new PublicKey('mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So');
export const JITOSOL_MINT = new PublicKey('jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL');

// Program ID from the IDL
export const PROGRAM_ID = new PublicKey('RMcr2nvyrwCh89SvH47916S9TCvPkoGBPNR8E1d1LWa');

interface DepositParams {
  connection: Connection;
  wallet: PublicKey;
  program: Program;
  tokenMint: PublicKey;
  amount: number;
  decimals: number;
  priorityFee?: boolean;
}

export async function prepareDepositTransaction({
  connection,
  wallet,
  program,
  tokenMint,
  amount,
  decimals,
  priorityFee = true,
}: DepositParams): Promise<Transaction> {
  // Convert amount to lamports/smallest decimal unit
  const amountBN = new BN(amount * Math.pow(10, decimals));
  
  // Get all PDAs
  const { receiptState, vaultAuthority, tokenMintVault, cryptoReceiptMint, cryptoReceiptMintVault } = getAllPDAs(
    tokenMint,
    program.programId
  );

  let transaction = new Transaction();
  let userMintTokenAccount: PublicKey;

  // Handle SOL special case
  if (tokenMint.equals(SOL_MINT)) {
    const wrapResult = await prepareWrapSOL(
      connection,
      wallet,
      amountBN.toNumber()
    );
    transaction.add(...wrapResult.transaction.instructions);
    userMintTokenAccount = wrapResult.associatedTokenAccount;
  } else {
    // For other tokens, just get the ATA
    userMintTokenAccount = await getAssociatedTokenAddress(
      tokenMint,
      wallet,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
  }

  // Get user's crypto receipt token account
  const userCryptoReceiptTokenAccount = await getAssociatedTokenAddress(
    cryptoReceiptMint,
    wallet,
    false,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  // Add compute budget instructions for priority fees
  const setComputeUnitLimitIx = ComputeBudgetProgram.setComputeUnitLimit({
    units: priorityFee ? 100_000 : 100_000,
  });
  const setComputeUnitPriceIx = ComputeBudgetProgram.setComputeUnitPrice({
    microLamports: priorityFee ? 30 : 30,
  });

  transaction.add(setComputeUnitLimitIx, setComputeUnitPriceIx);

  // Check if user's ATA for token exists
  const userMintTokenAccountInfo = await connection.getAccountInfo(userMintTokenAccount);
  if (!userMintTokenAccountInfo && !tokenMint.equals(SOL_MINT)) {
    transaction.add(
      createAssociatedTokenAccountInstruction(
        wallet,
        userMintTokenAccount,
        wallet,
        tokenMint,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      )
    );
  }

  // Check if user's ATA for crypto receipt exists
  const userCryptoReceiptTokenAccountInfo = await connection.getAccountInfo(userCryptoReceiptTokenAccount);
  if (!userCryptoReceiptTokenAccountInfo) {
    transaction.add(
      createAssociatedTokenAccountInstruction(
        wallet,
        userCryptoReceiptTokenAccount,
        wallet,
        cryptoReceiptMint,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      )
    );
  }

  // Add deposit instruction
  const depositIx = await program.methods
    .deposit(amountBN)
    .accountsStrict({
      user: wallet,
      userMintTokenAccount: userMintTokenAccount,
      userCryptoReceiptTokenAccount: userCryptoReceiptTokenAccount,
      receiptState: receiptState,
      tokenMint: tokenMint,
      vaultAuthority: vaultAuthority,
      tokenMintVault: tokenMintVault,
      cryptoReceiptMint: cryptoReceiptMint,
      cryptoReceiptMintVault: cryptoReceiptMintVault,
      tokenMintProgram: TOKEN_PROGRAM_ID,
      cryptoReceiptMintProgram: TOKEN_2022_PROGRAM_ID,
    })
    .instruction();

  transaction.add(depositIx);
  
  return transaction;
}