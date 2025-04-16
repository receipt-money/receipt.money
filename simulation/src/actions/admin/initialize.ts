import { initialize } from "../../instructions/01_initialize";
import { 
    admin,
    connectionDevnet as connection,
    programDevnet as program,
    SOL_DEVNET_MINT as SOL_MINT,
    USDC_DEVNET_MINT as USDC_MINT,
} from "../../config";
import { Keypair } from "@solana/web3.js";
import { createAssociatedTokenAccount, createAssociatedTokenAccountInstruction, createMint, getAssociatedTokenAddressSync, mintTo, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { debugTransactionError, analyzeSimulationResult } from "../../utils/debugTransaction";
import { updateData } from "../../utils/dataManager";
import { getAllPDAs } from "../../pda";

const initializeReceiptMoney = async () => {
    console.log("Starting initialize receipt money");
    console.log("Admin pubkey:", admin.publicKey.toString());
    
    // create anew keypair for mint and initialize the mint account
    const mint = Keypair.generate();
    console.log("Generated mint address:", mint.publicKey.toString());
    
    try {
        console.log("Creating mint...");
        await createMint(
            connection,
            admin,
            admin.publicKey,
            admin.publicKey,
            9,
            mint,
            undefined,
            TOKEN_PROGRAM_ID,
        );
        console.log("Mint created successfully");

        // mint few tokens to the authority associated token account
        const authorityAssociatedTokenAccount = await createAssociatedTokenAccount(
            connection,
            admin,
            mint.publicKey,
            admin.publicKey,
            undefined,
            TOKEN_PROGRAM_ID,
        );

        await mintTo(
            connection,
            admin,
            mint.publicKey,
            authorityAssociatedTokenAccount,
            admin.publicKey,
            1000000000000
        );
        
        
        console.log("Initializing receipt money...");
        try {
            // Try to simulate the transaction first
            console.log("Simulating transaction to detect potential issues...");
            const tx = await program.methods
                .initialize(
                    "USDC Crypto Receipt", 
                    "crUSDC", 
                    "https://harlequin-occasional-canidae-902.mypinata.cloud/ipfs/bafkreif6tq6wodz3mxz3nkbamntzcv53cv3gfdnalptyw7r6v6y3lq5xwm"
                )
                .accounts({
                    authority: admin.publicKey,
                    // Other accounts will be populated by the initialize function
                })
                .simulate();
                
            analyzeSimulationResult(tx);
        } catch (simError) {
            console.log("Simulation failed, but continuing with actual transaction:", simError.message);
        }
        
        // Proceed with the actual transaction
        const sig = await initialize(
            connection, 
            program, 
            admin, 
            mint.publicKey, 
            "USDC Crypto Receipt", 
            "crUSDC", 
            "https://harlequin-occasional-canidae-902.mypinata.cloud/ipfs/bafkreif6tq6wodz3mxz3nkbamntzcv53cv3gfdnalptyw7r6v6y3lq5xwm"
        );
        
        console.log("Transaction successful!");
        console.log("Signature:", sig);
        console.log("Explorer URL:", `https://explorer.solana.com/tx/${sig}?cluster=devnet`);
        
        // Get the cryptoReceiptMint PDA from the mint
        const { cryptoReceiptMint } = getAllPDAs(mint.publicKey, program.programId);
        
        // Save mint addresses to data.json
        updateData("tokenMintAddress", mint.publicKey.toString());
        updateData("cryptoReceiptMintAddress", cryptoReceiptMint.toString());
        console.log("Saved mint addresses to data.json");
        console.log("  Token Mint Address:", mint.publicKey.toString());
        console.log("  Crypto Receipt Mint Address:", cryptoReceiptMint.toString());
        
        return { mint: mint.publicKey, cryptoReceiptMint, sig };
    } catch (error) {
        console.error("Error in initializeReceiptMoney:", error);
        
        // Use our comprehensive error diagnostic tool
        debugTransactionError(error);
        
        if (error.message && error.message.includes("Custom: 51")) {
            console.log("\n=== CUSTOM: 51 ERROR DETECTED ===");
            console.log("This error is typically caused by a version mismatch between your");
            console.log("Solana CLI (1.16.0+) and your program's SDK version (pre-1.16.0).");
            console.log("\nRecommended Solutions:");
            console.log("1. Update program dependencies in Cargo.toml to 1.16.0+ and rebuild");
            console.log("2. Or downgrade your Solana CLI: 'solana-install init 1.14.18'");
            
            // Run the dedicated diagnosis script
            console.log("\nTo get a complete diagnosis, run:");
            console.log("ts-node simulation/src/actions/debug/checkVersion.ts");
        }
        
        throw error;
    }
};

initializeReceiptMoney().then((result) => {
    console.log("Initialize receipt money success");
    if (result) {
        console.log("Mint:", result.mint.toString());
        console.log("Crypto Receipt Mint:", result.cryptoReceiptMint.toString());
    }
}).catch((error) => {
    console.error("Initialize receipt money failed", error);
    process.exit(1);
});