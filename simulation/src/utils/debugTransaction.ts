import { Connection, TransactionSignature, VersionedTransaction } from "@solana/web3.js";

/**
 * Get detailed logs and debug info for a transaction signature
 */
export async function getTransactionLogs(
  connection: Connection,
  signature: TransactionSignature
): Promise<void> {
  try {
    console.log("========== TRANSACTION DEBUG ==========");
    console.log(`Signature: ${signature}`);
    console.log(`Explorer URL: https://explorer.solana.com/tx/${signature}?cluster=devnet`);
    
    // Get transaction details
    const tx = await connection.getTransaction(signature, {
      maxSupportedTransactionVersion: 0,
    });
    
    if (!tx) {
      console.log("Transaction not found. It may have failed or not been confirmed yet.");
      return;
    }
    
    console.log("Status:", tx.meta?.err ? "Failed" : "Success");
    
    if (tx.meta?.err) {
      console.log("Error:", JSON.stringify(tx.meta.err, null, 2));
      analyzeCustomError(tx.meta.err);
    }
    
    // Log compute units
    const computeUnits = tx.meta?.computeUnitsConsumed || 0;
    console.log(`Compute Units: ${computeUnits.toLocaleString()} / ${1_400_000}`);
    
    // Show logs
    if (tx.meta?.logMessages && tx.meta.logMessages.length > 0) {
      console.log("\n--- Transaction Logs ---");
      tx.meta.logMessages.forEach((log, i) => {
        console.log(`${i}: ${log}`);
      });
    } else {
      console.log("No logs available");
    }
    
    // Inner instructions info if available
    if (tx.meta?.innerInstructions && tx.meta.innerInstructions.length > 0) {
      console.log("\n--- Inner Instructions ---");
      tx.meta.innerInstructions.forEach((inner, i) => {
        console.log(`Instruction ${inner.index} has ${inner.instructions.length} inner instructions`);
      });
    }
    
    console.log("======================================");
  } catch (error) {
    console.error("Error fetching transaction:", error);
  }
}

/**
 * Analyze a Custom error from a Solana transaction
 */
export function analyzeCustomError(error: any): void {
  if (typeof error !== 'object') return;
  
  // Try to identify Custom error codes
  const errorStr = JSON.stringify(error);
  const customMatch = errorStr.match(/Custom:\s*(\d+)/);
  
  if (customMatch) {
    const customCode = parseInt(customMatch[1]);
    console.log(`\n--- Custom Error Analysis ---`);
    console.log(`Custom Error Code: ${customCode}`);
    
    // Provide insights based on common error codes
    switch (customCode) {
      case 0:
        console.log("Likely issue: Lamport balance below rent-exempt threshold");
        break;
      case 1:
        console.log("Likely issue: Account already initialized");
        break;
      case 51:
        console.log("Likely issue: Instruction data too large / memory layout mismatch");
        console.log("This usually happens with Solana 1.16.0+ when the program was built with an incompatible version");
        console.log("Recommended actions:");
        console.log("1. Check Solana CLI version: solana --version");
        console.log("2. Compare with program's Solana dependencies in Cargo.toml");
        console.log("3. Rebuild program with matching Solana version or downgrade CLI to match program version");
        break;
      default:
        console.log("Unknown custom error code, check program-specific error definitions");
    }
  }
  
  // Look for instruction errors related to sizes
  if (errorStr.includes("too large")) {
    console.log("\n--- Size-related Error Detected ---");
    console.log("This is likely a memory layout mismatch between the program and runtime");
    console.log("Known issue with Solana 1.16.0+ due to Rust Vec memory layout changes");
    console.log("Solution: Ensure program is built with same Solana version as your CLI");
  }
}

/**
 * Analyze transaction simulation result
 */
export function analyzeSimulationResult(simulationResult: any): void {
  console.log("========== SIMULATION ANALYSIS ==========");
  
  if (simulationResult.value.err) {
    console.log("Simulation Error:", JSON.stringify(simulationResult.value.err, null, 2));
    analyzeCustomError(simulationResult.value.err);
  } else {
    console.log("Simulation successful");
    
    // Display compute units
    if (simulationResult.value.unitsConsumed) {
      console.log(`Compute Units: ${simulationResult.value.unitsConsumed.toLocaleString()} / ${1_400_000}`);
    }
  }
  
  // Display logs
  if (simulationResult.value.logs && simulationResult.value.logs.length > 0) {
    console.log("\n--- Simulation Logs ---");
    simulationResult.value.logs.forEach((log: string, i: number) => {
      console.log(`${i}: ${log}`);
      
      // Highlight potential errors in logs
      if (log.includes("Error") || log.includes("error") || log.includes("failed") || log.includes("Failed")) {
        console.log(`^-- POTENTIAL ERROR DETECTED`);
      }
    });
  }
  
  // Check for accounts that were not found
  if (simulationResult.value.accounts) {
    const missingAccounts = simulationResult.value.accounts.filter((a: any) => a === null);
    if (missingAccounts.length > 0) {
      console.log(`\nWARNING: ${missingAccounts.length} accounts were not found during simulation`);
    }
  }
  
  console.log("=========================================");
}

/**
 * Check the version compatibility between Solana CLI and program
 */
export function checkVersionCompatibility(): void {
  try {
    // Print Solana CLI version
    const { execSync } = require('child_process');
    const solanaCLIVersion = execSync('solana --version').toString().trim();
    
    console.log("========== VERSION COMPATIBILITY CHECK ==========");
    console.log(`Solana CLI: ${solanaCLIVersion}`);
    
    // Extract version number
    const versionMatch = solanaCLIVersion.match(/(\d+\.\d+\.\d+)/);
    if (versionMatch) {
      const version = versionMatch[1];
      const majorMinor = version.split('.').slice(0, 2).join('.');
      
      if (majorMinor === '1.16' || parseFloat(majorMinor) > 1.16) {
        console.log("\nWARNING: You are using Solana 1.16.0 or newer");
        console.log("This version introduced breaking changes in memory layout for Vec types");
        console.log("Programs built with older Solana versions may fail with 'data too large' errors");
        console.log("\nRecommendations:");
        console.log("1. Rebuild your program with Solana SDK 1.16.0+");
        console.log("2. Or downgrade Solana CLI to match your program's SDK version");
      } 
      
      if (majorMinor === '1.14' || (parseFloat(majorMinor) > 1.14 && parseFloat(majorMinor) < 1.16)) {
        console.log("\nNOTE: You're using Solana 1.14.x-1.15.x");
        console.log("This version is compatible with programs built against same version");
        console.log("However, you may face MSRV (Minimum Supported Rust Version) issues");
        console.log("when building programs due to dependency requirements");
      }
    }
    
    console.log("==================================================");
  } catch (error) {
    console.error("Error checking Solana version:", error);
  }
}

/**
 * Debug a transaction error comprehensively
 */
export function debugTransactionError(error: any): void {
  console.log("========== ERROR ANALYSIS ==========");
  console.log("Error type:", error.constructor.name);
  console.log("Error message:", error.message);
  
  // Extract and analyze error details
  if (error.message && error.message.includes("InstructionError")) {
    console.log("\n--- Instruction Error Detected ---");
    
    // Extract instruction index
    const indexMatch = error.message.match(/\[\s*(\d+)\s*,/);
    if (indexMatch) {
      console.log(`Failed at instruction index: ${indexMatch[1]}`);
    }
    
    // Look for custom errors
    const customMatch = error.message.match(/Custom:\s*(\d+)/);
    if (customMatch) {
      const customCode = parseInt(customMatch[1]);
      console.log(`Custom Error Code: ${customCode}`);
      
      // Provide insights based on common error codes
      switch (customCode) {
        case 51:
          console.log("\nDIAGNOSIS: Memory Layout / Vec serialization error");
          console.log("This is most likely due to an incompatibility between your program build");
          console.log("and the Solana CLI version you're using to interact with it.");
          console.log("\nThe key issue is that Rust 1.66 changed the memory layout of Vec,");
          console.log("which affects how instruction data is serialized/deserialized.");
          console.log("\nSolution options:");
          console.log("1. Rebuild your program with a compatible Solana SDK version (1.16.0+)");
          console.log("2. Or downgrade your Solana CLI to match your program's SDK version");
          break;
        default:
          console.log(`Refer to your program's custom error definitions for code ${customCode}`);
      }
    }
  }
  
  // Check for transaction logs
  if (error.logs && error.logs.length > 0) {
    console.log("\n--- Transaction Logs ---");
    error.logs.forEach((log: string, i: number) => {
      console.log(`${i}: ${log}`);
      
      // Highlight specific errors in logs
      if (log.includes("Invoked an instruction with data that is too large")) {
        console.log("^-- MEMORY LAYOUT ISSUE DETECTED: Instruction data size mismatch");
      }
    });
  }
  
  console.log("===================================");
} 