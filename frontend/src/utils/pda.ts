import { PublicKey } from "@solana/web3.js";

/**
 * Returns the PDA for the receipt state account.
 *
 * @param tokenMint - The PublicKey of the token mint.
 * @param programId - The program's public key.
 * @returns A tuple with the PDA and its bump.
 */
export function getReceiptStatePDA(
  tokenMint: PublicKey,
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("receipt_state"), tokenMint.toBuffer()],
    programId
  );
}

/**
 * Returns the PDA for the vault authority.
 *
 * @param receiptState - The PublicKey of the receipt state account.
 * @param programId - The program's public key.
 * @returns A tuple with the PDA and its bump.
 */
export function getVaultAuthorityPDA(
  receiptState: PublicKey,
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("receipt_vault_authority"), receiptState.toBuffer()],
    programId
  );
}

/**
 * Returns the PDA for the crypto receipt mint.
 *
 * @param receiptState - The PublicKey of the receipt state account.
 * @param programId - The program's public key.
 * @returns A tuple with the PDA and its bump.
 */
export function getCryptoReceiptMintPDA(
  receiptState: PublicKey,
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("receipt_mint"), receiptState.toBuffer()],
    programId
  );
}

/**
 * Returns the PDA for token mint vault and crypto receipt mint vault.
 *
 * @param receiptState - The PublicKey of the receipt state account.
 * @param mint - The PublicKey of the mint.
 * @param programId - The program's public key.
 * @returns A tuple with the PDA and its bump.
 */
export function getMintVaultPDA(
  receiptState: PublicKey,
  mint: PublicKey,
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("receipt_mint_vault"), receiptState.toBuffer(), mint.toBuffer()],
    programId
  );
}

/**
 * An interface representing all the PDAs in the receipt-money program.
 */
export interface PDAs {
  receiptState: PublicKey;
  vaultAuthority: PublicKey;
  tokenMintVault: PublicKey;
  cryptoReceiptMint: PublicKey;
  cryptoReceiptMintVault: PublicKey;
}

/**
 * Returns all PDAs for the receipt-money program given a token mint.
 *
 * @param tokenMint - The token mint for which the PDAs are generated.
 * @param programId - The program's public key.
 * @returns An object containing all the PDAs.
 */
export function getAllPDAs(
  tokenMint: PublicKey,
  programId: PublicKey
): PDAs {
  const [receiptState] = getReceiptStatePDA(tokenMint, programId);
  const [vaultAuthority] = getVaultAuthorityPDA(receiptState, programId);
  const [tokenMintVault] = getMintVaultPDA(receiptState, tokenMint, programId);
  const [cryptoReceiptMint] = getCryptoReceiptMintPDA(receiptState, programId);
  const [cryptoReceiptMintVault] = getMintVaultPDA(
    receiptState,
    cryptoReceiptMint,
    programId
  );

  return {
    receiptState,
    vaultAuthority,
    tokenMintVault,
    cryptoReceiptMint,
    cryptoReceiptMintVault,
  };
}