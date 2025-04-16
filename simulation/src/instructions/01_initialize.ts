import { 
    Connection, 
    PublicKey, 
    sendAndConfirmTransaction, 
    SystemProgram, 
    Signer, 
    SYSVAR_RENT_PUBKEY,
    TransactionMessage,
    VersionedTransaction,
    ComputeBudgetProgram
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
    name: string,
    symbol: string,
    uri: string,
) => {
    console.log("========== INITIALIZE FUNCTION START ==========");
    console.log("ProgramID:", program.programId.toString());
    console.log("Token Mint:", tokenMint.toString());
    console.log("Name:", name, "Symbol:", symbol);
    
    // Get all PDAs
    let { 
        receiptState, receiptStateBump,
        vaultAuthority, vaultAuthorityBump,
        tokenMintVault, tokenMintVaultBump,
        cryptoReceiptMint, cryptoReceiptMintBump,
        cryptoReceiptMintVault, cryptoReceiptMintVaultBump 
    } = getAllPDAs(tokenMint, program.programId);
    
    console.log("Generated PDAs:");
    console.log("Receipt State:", receiptState.toString(), "Bump:", receiptStateBump);
    console.log("Vault Authority:", vaultAuthority.toString(), "Bump:", vaultAuthorityBump);
    console.log("Token Mint Vault:", tokenMintVault.toString(), "Bump:", tokenMintVaultBump);
    console.log("Crypto Receipt Mint:", cryptoReceiptMint.toString(), "Bump:", cryptoReceiptMintBump);
    console.log("Crypto Receipt Mint Vault:", cryptoReceiptMintVault.toString(), "Bump:", cryptoReceiptMintVaultBump);

    // Add compute budget instruction to increase compute units if needed
    const computeBudgetIx = ComputeBudgetProgram.setComputeUnitLimit({
        units: 300000,
    });
    
    // Build the transaction
    console.log("Building transaction...");
    const tx = await program.methods
    .initialize(
        name,
        symbol,
        uri
    )
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

    // Add the compute budget instruction at the beginning
    tx.instructions = [computeBudgetIx, ...tx.instructions];
    
    tx.feePayer = admin.publicKey;
    console.log("Fee Payer:", admin.publicKey.toBase58());
    
    try {
        // First simulate the transaction to get detailed logs
        console.log("Simulating transaction...");
        const { blockhash } = await connection.getLatestBlockhash();
        tx.recentBlockhash = blockhash;
        tx.sign(admin);
        
        const simulationResult = await connection.simulateTransaction(tx);
        console.log("Simulation Result:", JSON.stringify(simulationResult, null, 2));
        
        if (simulationResult.value.err) {
            console.error("Simulation failed:", simulationResult.value.err);
            
            // Try to decode the error
            if (simulationResult.value.logs) {
                console.log("Simulation Logs:");
                simulationResult.value.logs.forEach((log, i) => console.log(`${i}: ${log}`));
            }
            
            throw new Error(`Transaction simulation failed: ${JSON.stringify(simulationResult.value.err)}`);
        }
        
        console.log("Simulation successful, sending transaction...");
        
        // Try versioned transaction as a fallback if needed
        try {
            // Get fresh blockhash and sign again before sending
            const { blockhash: newBlockhash } = await connection.getLatestBlockhash();
            tx.recentBlockhash = newBlockhash;
            tx.sign(admin);
            
            const sig = await sendAndConfirmTransaction(connection, tx, [admin], {
                skipPreflight: true,  // Skip preflight to get more detailed error messages
                commitment: 'confirmed',
                maxRetries: 5
            });
            console.log("Transaction sent successfully!");
            console.log("Initialize: Transaction Signature:", sig);
            console.log("Solana Explorer URL:", `https://explorer.solana.com/tx/${sig}?cluster=devnet`);
            
            // Try to fetch the receipt state account after transaction
            try {
                const receiptStateAccount = await program.account.receiptState.fetch(receiptState);
                console.log("Receipt State after Initialize:", receiptStateAccount);
            } catch (fetchError) {
                console.log("Error fetching receipt state:", fetchError.message);
            }
            
            return sig;
        } catch (txError) {
            console.error("Error sending transaction:", txError);
            
            // Try to get transaction logs if available
            if (txError.logs) {
                console.log("Transaction Logs:");
                txError.logs.forEach((log, i) => console.log(`${i}: ${log}`));
            }
            
            // Try versioned transaction as a fallback
            console.log("Trying versioned transaction as fallback...");
            try {
                const latestBlockhash = await connection.getLatestBlockhash();
                const messageV0 = new TransactionMessage({
                    payerKey: admin.publicKey,
                    recentBlockhash: latestBlockhash.blockhash,
                    instructions: tx.instructions,
                }).compileToV0Message();
                
                const versionedTx = new VersionedTransaction(messageV0);
                versionedTx.sign([admin]);
                
                const versionedSig = await connection.sendTransaction(versionedTx, {
                    skipPreflight: true,
                    maxRetries: 5
                });
                
                console.log("Versioned transaction sent successfully!");
                console.log("Versioned TX Signature:", versionedSig);
                
                return versionedSig;
            } catch (versionedError) {
                console.error("Even versioned transaction failed:", versionedError);
                throw versionedError;
            }
        }
    } catch (error) {
        console.error("Error in executing initialize instruction:", error);
        
        // Print specific error information for InstructionError
        if (error.message && error.message.includes("InstructionError")) {
            console.log("====== INSTRUCTION ERROR DETAILS ======");
            console.log("Full error message:", error.message);
            
            // Try to extract the custom error code
            const customMatch = error.message.match(/Custom: (\d+)/);
            if (customMatch) {
                const customCode = customMatch[1];
                console.log(`Custom Error Code: ${customCode}`);
                console.log("Possible reasons for Custom: 51 error:");
                console.log("1. Incompatibility between program binary and runtime (Solana 1.16.0+ issue)");
                console.log("2. Memory layout mismatch between Vec types (changed in Rust 1.66+)");
                console.log("3. Using older Solana program version with newer CLI");
            }
        }
        
        throw error;
    } finally {
        console.log("========== INITIALIZE FUNCTION END ==========");
    }
};