import {
    Connection,
    Keypair,
    LAMPORTS_PER_SOL,
    PublicKey,
    Signer,
    SystemProgram,
    Transaction,
    sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
    NATIVE_MINT,
    createAssociatedTokenAccountInstruction,
    createSyncNativeInstruction,
    getAssociatedTokenAddress,
    createCloseAccountInstruction,
} from '@solana/spl-token';
  
export async function wrapSOL(
    connection: Connection,
    payer: Signer,
    amountInLamports: number
): Promise<PublicKey> {
    // const lamports = amountInLamports * LAMPORTS_PER_SOL;

    // Get the associated token account for wSOL
    const associatedTokenAccount = await getAssociatedTokenAddress(
        NATIVE_MINT,
        payer.publicKey
    );

    const transaction = new Transaction();

    // Check if the associated token account exists
    const accountInfo = await connection.getAccountInfo(associatedTokenAccount);
    if (!accountInfo) {
        // Create the associated token account if it doesn't exist
        transaction.add(
        createAssociatedTokenAccountInstruction(
            payer.publicKey,
            associatedTokenAccount,
            payer.publicKey,
            NATIVE_MINT
        )
        );
    }

    // Transfer SOL to the associated token account
    transaction.add(
        SystemProgram.transfer({
        fromPubkey: payer.publicKey,
        toPubkey: associatedTokenAccount,
        lamports: amountInLamports,
        })
    );

    // Sync the native account to update its balance
    transaction.add(createSyncNativeInstruction(associatedTokenAccount));

    // Sign and send the transaction
    await sendAndConfirmTransaction(connection, transaction, [payer]);

    return associatedTokenAccount;
}
  
async function unwrapSOL(
    connection: Connection,
    payer: Keypair,
    associatedTokenAccount: PublicKey
): Promise<void> {
    const transaction = new Transaction().add(
        createCloseAccountInstruction(
        associatedTokenAccount,
        payer.publicKey,
        payer.publicKey
        )
    );

    // Sign and send the transaction
    await sendAndConfirmTransaction(connection, transaction, [payer]);
}
  