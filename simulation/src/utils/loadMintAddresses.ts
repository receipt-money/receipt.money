import { loadData } from './dataManager';

/**
 * Load the crypto receipt mint address from data.json
 * @returns The crypto receipt mint address as string, or null if not found
 */
export function getCryptoReceiptMintAddress(): string | null {
  const data = loadData();
  return data.cryptoReceiptMintAddress || null;
}

/**
 * Load the token mint address from data.json
 * @returns The token mint address as string, or null if not found
 */
export function getTokenMintAddress(): string | null {
  const data = loadData();
  return data.tokenMintAddress || null;
}

/**
 * Load both mint addresses from data.json
 * @returns Object containing both mint addresses, or null values if not found
 */
export function getMintAddresses(): { tokenMint: string | null, cryptoReceiptMint: string | null } {
  const data = loadData();
  return {
    tokenMint: data.tokenMintAddress || null,
    cryptoReceiptMint: data.cryptoReceiptMintAddress || null
  };
} 