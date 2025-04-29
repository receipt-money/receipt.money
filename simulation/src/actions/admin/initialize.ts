import { initialize } from "../../instructions/01_initialize";
import { 
    admin,
    connectionDevnet as connection,
    programDevnet as program,
    SOL_DEVNET_MINT as SOL_MINT,
    USDC_DEVNET_MINT as USDC_MINT,
    MSOL_DEVNET_MINT as MSOL_MINT,
} from "../../config";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { createAssociatedTokenAccount, getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { debugTransactionError, analyzeSimulationResult } from "../../utils/debugTransaction";
import { updateData } from "../../utils/dataManager";
import { getAllPDAs } from "../../pda";

/**
 * Helper function to create a token account if it doesn't exist
 */
const ensureTokenAccount = async (mint: PublicKey, tokenName: string) => {
    console.log(`Checking for admin's ${tokenName} token account...`);
    try {
        // Get the token account address first to check if it exists
        const tokenAccountAddress = await getAssociatedTokenAddress(
            mint,
            admin.publicKey,
            false,
            TOKEN_PROGRAM_ID
        );
        
        try {
            // Try to fetch the account to see if it exists
            const accountInfo = await connection.getAccountInfo(tokenAccountAddress);
            if (accountInfo) {
                console.log(`Admin already has a ${tokenName} token account:`, tokenAccountAddress.toString());
                return tokenAccountAddress;
            } else {
                throw new Error("Token account doesn't exist yet");
            }
        } catch {
            // Create the account if it doesn't exist
            console.log(`Creating ${tokenName} token account for admin...`);
            const tokenAccount = await createAssociatedTokenAccount(
                connection,
                admin,
                mint,
                admin.publicKey,
                undefined,
                TOKEN_PROGRAM_ID
            );
            console.log(`Created ${tokenName} token account:`, tokenAccount.toString());
            return tokenAccount;
        }
    } catch (error) {
        console.error(`Error with ${tokenName} token account:`, error);
        throw error;
    }
};

/**
 * Helper function to initialize a single crypto receipt token
 */
const initializeCryptoReceipt = async (mint: PublicKey, tokenName: string, symbol: string, imageUri: string) => {
    console.log(`\n=== Initializing ${tokenName} Crypto Receipt ===`);
    console.log(`${tokenName} mint address:`, mint.toBase58());
    
    // Ensure admin has a token account for this mint
    await ensureTokenAccount(mint, tokenName);
    
    try {
        // Try to simulate the transaction first
        console.log(`Simulating ${tokenName} transaction to detect potential issues...`);
        try {
            const tx = await program.methods
                .initialize(
                    `${tokenName} Crypto Receipt`, 
                    `cr${symbol}`, 
                    imageUri
                )
                .accounts({
                    authority: admin.publicKey,
                    // Other accounts will be populated by the initialize function
                })
                .simulate();
                
            analyzeSimulationResult(tx);
        } catch (simError) {
            console.log(`Simulation for ${tokenName} failed, but continuing with actual transaction:`, simError.message);
        }
        
        // Proceed with the actual transaction
        const sig = await initialize(
            connection, 
            program, 
            admin, 
            mint, 
            `${tokenName} Crypto Receipt`, 
            `cr${symbol}`, 
            imageUri
        );
        
        console.log(`${tokenName} Transaction successful!`);
        console.log("Signature:", sig);
        console.log("Explorer URL:", `https://explorer.solana.com/tx/${sig}?cluster=devnet`);
        
        // Get the cryptoReceiptMint PDA from the mint
        const { cryptoReceiptMint } = getAllPDAs(mint, program.programId);
        
        // Save mint addresses to data.json with mint-specific keys
        const mintKey = tokenName.toLowerCase();
        updateData(`${mintKey}MintAddress`, mint.toBase58());
        updateData(`${mintKey}CryptoReceiptMintAddress`, cryptoReceiptMint.toString());
        console.log(`Saved ${tokenName} mint addresses to data.json`);
        console.log(`  ${tokenName} Mint Address:`, mint.toBase58());
        console.log(`  ${tokenName} Crypto Receipt Mint Address:`, cryptoReceiptMint.toString());
        
        return { mint, cryptoReceiptMint, sig };
    } catch (error) {
        console.error(`Error in initializing ${tokenName} crypto receipt:`, error);
        debugTransactionError(error);
        throw error;
    }
};

/**
 * Main function to initialize all crypto receipt tokens
 */
const initializeReceiptMoney = async () => {
    console.log("Starting initialize all crypto receipts");
    console.log("Admin pubkey:", admin.publicKey.toString());
    console.log("Program ID:", program.programId.toString());
    
    // Define token configurations
    const tokenConfigs = [
        {
            mint: SOL_MINT,
            name: "SOL",
            symbol: "SOL",
            imageUri: "https://harlequin-occasional-canidae-902.mypinata.cloud/ipfs/bafkreif6tq6wodz3mxz3nkbamntzcv53cv3gfdnalptyw7r6v6y3lq5xwm"
        },
        {
            mint: USDC_MINT,
            name: "USDC",
            symbol: "USDC",
            imageUri: "https://harlequin-occasional-canidae-902.mypinata.cloud/ipfs/bafkreif6tq6wodz3mxz3nkbamntzcv53cv3gfdnalptyw7r6v6y3lq5xwm"
        },
        {
            mint: MSOL_MINT,
            name: "mSOL",
            symbol: "mSOL",
            imageUri: "https://harlequin-occasional-canidae-902.mypinata.cloud/ipfs/bafkreif6tq6wodz3mxz3nkbamntzcv53cv3gfdnalptyw7r6v6y3lq5xwm"
        }
    ];
    
    const results = [];
    
    try {
        // Initialize each token sequentially
        for (const config of tokenConfigs) {
            try {
                const result = await initializeCryptoReceipt(
                    config.mint,
                    config.name,
                    config.symbol,
                    config.imageUri
                );
                results.push({
                    tokenName: config.name,
                    ...result
                });
            } catch (error) {
                console.error(`Failed to initialize ${config.name}:`, error);
                // Continue with other tokens even if one fails
            }
        }
        
        return results;
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

initializeReceiptMoney().then((results) => {
    console.log("\n=== Initialize all crypto receipts succeeded ===");
    if (results && results.length > 0) {
        console.log("\nSummary of initialized crypto receipts:");
        results.forEach((result, index) => {
            console.log(`\n${index + 1}. ${result.tokenName}:`);
            console.log(`   Mint: ${result.mint.toString()}`);
            console.log(`   Crypto Receipt Mint: ${result.cryptoReceiptMint.toString()}`);
            console.log(`   Transaction: ${result.sig}`);
        });
    } else {
        console.log("No crypto receipts were successfully initialized");
    }
}).catch((error) => {
    console.error("Initialize crypto receipts failed", error);
    process.exit(1);
});