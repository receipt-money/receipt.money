import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';

// Token 2022 Program ID
const TOKEN_2022_PROGRAM_ID = new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb');

// Utility function to get SOL balance
export async function getSolBalance(connection: Connection, walletAddress: PublicKey): Promise<number> {
  try {
    const balance = await connection.getBalance(walletAddress);
    return balance / LAMPORTS_PER_SOL;
  } catch (error) {
    console.error("Error getting SOL balance:", error);
    return 0;
  }
}

// Utility function to determine if a token mint is a Token-2022 token
async function isToken2022(connection: Connection, tokenMint: PublicKey): Promise<boolean> {
  try {
    const mintInfo = await connection.getAccountInfo(tokenMint);
    return mintInfo?.owner.equals(TOKEN_2022_PROGRAM_ID) || false;
  } catch (e) {
    console.error("Error checking token program:", e);
    return false;
  }
}

// Utility function to get SPL token balance
export async function getTokenBalance(
  connection: Connection, 
  walletAddress: PublicKey, 
  tokenMint: PublicKey,
  decimals: number
): Promise<number> {
  try {
    // Check if token is Token-2022
    const isToken2022Mint = await isToken2022(connection, tokenMint);
    const tokenProgramId = isToken2022Mint ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;
    
    console.log(`Token ${tokenMint.toString()} is using ${isToken2022Mint ? 'Token-2022' : 'Standard Token'} program`);
    
    // Find associated token account
    const tokenAccount = await getAssociatedTokenAddress(
      tokenMint,
      walletAddress,
      false,
      tokenProgramId
    );

    try {
      // Get token account info
      const tokenAccountInfo = await connection.getTokenAccountBalance(tokenAccount);
      
      // If token account exists, return the balance
      if (tokenAccountInfo?.value) {
        return parseFloat(tokenAccountInfo.value.amount) / Math.pow(10, decimals);
      }
      
      return 0;
    } catch (e) {
      console.log(`Token account ${tokenAccount.toString()} not found or has no balance`);
      // Token account probably doesn't exist yet
      return 0;
    }
  } catch (error) {
    console.error("Error getting token balance:", error);
    return 0;
  }
}

// Get balance for any token (SOL or SPL)
export async function getBalance(
  connection: Connection,
  walletAddress: PublicKey,
  tokenMint: PublicKey | null,
  decimals: number
): Promise<number> {
  try {
    // Special handling for SOL
    if (!tokenMint || tokenMint.toString() === 'So11111111111111111111111111111111111111112') {
      return await getSolBalance(connection, walletAddress);
    }
    
    // Handle SPL tokens
    return await getTokenBalance(connection, walletAddress, tokenMint, decimals);
  } catch (error) {
    console.error("Error getting balance:", error);
    return 0;
  }
}