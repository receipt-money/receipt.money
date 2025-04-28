import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import {
  NATIVE_MINT,
  createAssociatedTokenAccountInstruction,
  createSyncNativeInstruction,
  getAssociatedTokenAddress,
} from '@solana/spl-token';

export async function prepareWrapSOL(
  connection: Connection,
  publicKey: PublicKey,
  amountInLamports: number
): Promise<{
  transaction: Transaction;
  associatedTokenAccount: PublicKey;
}> {
  // Get the associated token account for wSOL
  const associatedTokenAccount = await getAssociatedTokenAddress(
    NATIVE_MINT,
    publicKey
  );

  const transaction = new Transaction();

  // Check if the associated token account exists
  const accountInfo = await connection.getAccountInfo(associatedTokenAccount);
  if (!accountInfo) {
    // Create the associated token account if it doesn't exist
    transaction.add(
      createAssociatedTokenAccountInstruction(
        publicKey,
        associatedTokenAccount,
        publicKey,
        NATIVE_MINT
      )
    );
  }

  // Transfer SOL to the associated token account
  transaction.add(
    SystemProgram.transfer({
      fromPubkey: publicKey,
      toPubkey: associatedTokenAccount,
      lamports: amountInLamports,
    })
  );

  // Sync the native account to update its balance
  transaction.add(createSyncNativeInstruction(associatedTokenAccount));

  return {
    transaction,
    associatedTokenAccount,
  };
}