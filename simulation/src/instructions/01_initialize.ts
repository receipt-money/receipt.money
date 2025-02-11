import { 
    Connection, 
    PublicKey, 
    sendAndConfirmTransaction, 
    SystemProgram, 
    Signer, 
    SYSVAR_RENT_PUBKEY 
} from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { Program } from "@coral-xyz/anchor";
import { ReceiptMoney } from "../../targets/types/receipt_money";
import { getAllPDAs } from "../pda";

export const initialize = async (
    connection: Connection,
    program: Program<ReceiptMoney>,
    admin: Signer,
    tokenMint: PublicKey,
) => {
    let { receiptState, vaultAuthority, tokenMintVault, cryptoReceiptMint, cryptoReceiptMintVault } = getAllPDAs(tokenMint, program.programId);
        
    const tx = await program.methods
    .initialize()
    .accountsStrict({
        authority: admin.publicKey,
        receiptState: receiptState,
        tokenMint: tokenMint,
        vaultAuthority: vaultAuthority,
        tokenMintVault: tokenMintVault,
        cryptoReceiptMint: cryptoReceiptMint,
        cryptoReceiptMintVault: cryptoReceiptMintVault,
        systemProgram: SystemProgram.programId,
        tokenMintProgram: TOKEN_PROGRAM_ID,
        cryptoReceiptMintProgram: TOKEN_2022_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
    })
    .transaction();

    tx.feePayer = admin.publicKey;
    console.log("Fee Payer:", admin.publicKey.toBase58());
    
    try { 
        // const simulationResult = await connection.simulateTransaction(tx);
        // console.log("Initialize: Simulation Result:", simulationResult);
        
        // Get fresh blockhash right before sending
        tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        // Re-sign with fresh blockhash
        tx.sign(admin);
        
        const sig = await sendAndConfirmTransaction(connection, tx, [admin], {skipPreflight: true});
        console.log("Initialize: Transaction Signature:", sig);
        const receiptStateAccount = await program.account.receiptState.fetch(receiptState);
        console.log("Receipt State after Initialize:", receiptState);
    } catch (error) {
        console.log("Error in executing initialize ix:", error);
        const receiptStateAccount = await program.account.receiptState.fetch(receiptState);
        console.log("Receipt State after Initialize:", receiptStateAccount);
    }
}