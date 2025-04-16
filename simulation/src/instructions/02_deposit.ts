import { 
    ComputeBudgetProgram,
    Connection, 
    PublicKey, 
    sendAndConfirmTransaction, 
    Signer,
    Transaction, 
} from "@solana/web3.js";
import { 
    TOKEN_PROGRAM_ID, 
    TOKEN_2022_PROGRAM_ID, 
    ASSOCIATED_TOKEN_PROGRAM_ID, 
    getAssociatedTokenAddressSync, 
    createAssociatedTokenAccountInstruction
} from "@solana/spl-token";
import { BN, Program } from "@coral-xyz/anchor";
import { ReceiptMoney } from "../../targets/types/receipt_money";
import { getAllPDAs } from "../pda";
import { wrapSOL } from "../utils/wrapUnwrapSol";
import { SOL_DEVNET_MINT, MSOL_DEVNET_MINT, JITO_SOL_DEVNET_MINT } from "../config";

export const deposit = async (
    connection: Connection,
    program: Program<ReceiptMoney>,
    user: Signer,
    tokenMint: PublicKey,
    amount: BN,
    priorityFee: boolean,
) => {
    let { receiptState, vaultAuthority, tokenMintVault, cryptoReceiptMint, cryptoReceiptMintVault } = getAllPDAs(tokenMint, program.programId);
    
    let userMintTokenAccount = getAssociatedTokenAddressSync(
        tokenMint,
        user.publicKey,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
    );
    console.log("User's mint token account : ", userMintTokenAccount.toBase58());
    let userCryptoReceiptTokenAccount = getAssociatedTokenAddressSync(
        cryptoReceiptMint,
        user.publicKey,
        false,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
    );
    console.log("User's crypto receipt token account : ", userCryptoReceiptTokenAccount.toBase58());
    let userSolAta: PublicKey;
    if (tokenMint.toBase58() === SOL_DEVNET_MINT.toBase58()) {
        userSolAta = await wrapSOL(connection, user, amount.toNumber());
    }

    const transaction = new Transaction();
    // set priority fees
    const setComputeUnitLimitIx = ComputeBudgetProgram.setComputeUnitLimit({
      units: priorityFee ? 100_000 : 100_000,
    });
    const setComputeUnitPriceIx = ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: priorityFee ? 30 : 30, // example priority fee: 2 micro-lamports per CU
    });

    transaction.add(setComputeUnitLimitIx, setComputeUnitPriceIx);
    // Check if the user's ATA exists
    const userMintTokenAccounttExists = await connection.getAccountInfo(userMintTokenAccount);
    console.log("User's mint token account exists : ", userMintTokenAccounttExists);
    
    if (!userMintTokenAccounttExists) {
      transaction.add(
        createAssociatedTokenAccountInstruction(
          user.publicKey,
          userMintTokenAccount,
          user.publicKey,
          tokenMint,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        )
      );
    }

    const userCryptoReceiptTokenAccountExists = await connection.getAccountInfo(userCryptoReceiptTokenAccount);
    console.log("User's crypto receipt token account exists : ", userCryptoReceiptTokenAccountExists);

    if (!userCryptoReceiptTokenAccountExists) {
      transaction.add(
        createAssociatedTokenAccountInstruction(
          user.publicKey,
          userCryptoReceiptTokenAccount,
          user.publicKey,
          cryptoReceiptMint,
          TOKEN_2022_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        )
      );
    }

    const depositIx = await program.methods
        .deposit(
            amount
        )
        .accountsStrict({
        user: user.publicKey,
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
    transaction.feePayer = user.publicKey;
    console.log("Fee Payer:", user.publicKey.toBase58());
    
    try { 
        // const simulationResult = await connection.simulateTransaction(tx);
        // console.log("Initialize: Simulation Result:", simulationResult);

        // Get fresh blockhash right before sending
        transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        // Re-sign with fresh blockhash
        transaction.sign(user);
        
        const sig = await sendAndConfirmTransaction(connection, transaction, [user], {skipPreflight: true});
        console.log("Deposit: Transaction Signature:", sig);

        // const receiptStateAccount = await program.account.receiptState.fetch(receiptState);
        // console.log("Receipt State after Deposit:", receiptStateAccount);
    } catch (error) {
        console.log("Error in executing deposit ix:", error);
        // const receiptStateAccount = await program.account.receiptState.fetch(receiptState);
        // console.log("Receipt State after Deposit:", receiptStateAccount);
    }
}