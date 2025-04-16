import { checkVersionCompatibility } from "../../utils/debugTransaction";
import { Connection } from "@solana/web3.js";
import { execSync } from "child_process";
import * as fs from 'fs';
import * as path from 'path';

/**
 * Check for program/CLI compatibility and analyze the Custom: 51 error
 */
async function diagnoseCustom51Error() {
    console.log("\n======== SOLANA VERSION COMPATIBILITY CHECKER ========");
    
    // 1. Check Solana CLI version
    let solanaCLIVersion = "Unknown";
    try {
        solanaCLIVersion = execSync('solana --version').toString().trim();
        console.log(`Solana CLI Version: ${solanaCLIVersion}`);
        
        // Extract major.minor version
        const versionMatch = solanaCLIVersion.match(/(\d+\.\d+)\.\d+/);
        if (versionMatch) {
            const majorMinor = versionMatch[1];
            
            if (majorMinor === "1.16" || parseFloat(majorMinor) > 1.16) {
                console.log("\n⚠️ POTENTIAL ISSUE DETECTED ⚠️");
                console.log("You are using Solana 1.16.0 or newer, which has a changed memory layout for Vec types.");
                console.log("This can cause 'Invoked an instruction with data that is too large' errors");
                console.log("when running programs compiled with older Solana SDK versions.");
            }
        }
    } catch (error) {
        console.error("Error getting Solana CLI version:", error);
    }
    
    // 2. Try to find Cargo.toml in the program directory
    console.log("\n--- Looking for your program's Cargo.toml ---");
    
    // Check common program locations
    const potentialLocations = [
        '../../programs/receipt_money',
        '../../../programs/receipt_money',
        '../../programs',
        '../../../programs',
        '../../',
        '../../../',
    ];
    
    let programSolanaVersion = "Unknown";
    let cargoTomlPath = null;
    
    for (const loc of potentialLocations) {
        const fullPath = path.resolve(__dirname, loc, 'Cargo.toml');
        if (fs.existsSync(fullPath)) {
            cargoTomlPath = fullPath;
            console.log(`Found Cargo.toml at: ${fullPath}`);
            
            // Read and parse Cargo.toml to find solana-program version
            const cargoToml = fs.readFileSync(fullPath, 'utf8');
            const solanaMatch = cargoToml.match(/solana-program\s*=\s*"([^"]+)"/);
            if (solanaMatch) {
                programSolanaVersion = solanaMatch[1];
                console.log(`Program solana-program version: ${programSolanaVersion}`);
                
                // Check for potential version mismatch
                if (programSolanaVersion.startsWith("~1.14") || 
                    programSolanaVersion.startsWith("1.14") ||
                    programSolanaVersion.startsWith("~1.15") || 
                    programSolanaVersion.startsWith("1.15")) {
                    
                    console.log("\n⚠️ VERSION MISMATCH DETECTED ⚠️");
                    console.log(`Your program uses solana-program ${programSolanaVersion}`);
                    console.log(`But your Solana CLI is ${solanaCLIVersion}`);
                    console.log("\nThis is the likely cause of the 'Custom: 51' error!");
                }
            } else {
                console.log("Could not find solana-program dependency in Cargo.toml");
            }
            
            break;
        }
    }
    
    if (!cargoTomlPath) {
        console.log("Could not find Cargo.toml in expected locations.");
    }
    
    // 3. Check for other potential issues
    console.log("\n--- Checking for other potential issues ---");
    
    // Look for Anchor.toml
    const anchorTomlPath = path.resolve(__dirname, '../../../', 'Anchor.toml');
    if (fs.existsSync(anchorTomlPath)) {
        console.log("Found Anchor.toml");
        const anchorToml = fs.readFileSync(anchorTomlPath, 'utf8');
        
        // Check Anchor version
        const anchorVersionMatch = anchorToml.match(/anchor-version\s*=\s*"([^"]+)"/);
        if (anchorVersionMatch) {
            console.log(`Anchor version: ${anchorVersionMatch[1]}`);
        }
    }
    
    // 4. Provide solution recommendations
    console.log("\n=== DIAGNOSIS AND RECOMMENDATIONS ===");
    
    if (solanaCLIVersion.includes("1.16") || solanaCLIVersion.includes("1.17") || solanaCLIVersion.includes("1.18")) {
        console.log("Your error 'Custom: 51' is almost certainly due to a memory layout mismatch");
        console.log("between your program (built with an older Solana SDK) and the Solana 1.16.0+ runtime.");
        
        console.log("\nPossible solutions:");
        console.log("1. BEST: Rebuild your program with Solana SDK 1.16.0+ to match your CLI");
        console.log("   - Update solana-program version in Cargo.toml to \"~1.16.0\" or newer");
        console.log("   - Run 'cargo build-sbf' to rebuild your program");
        console.log("\n2. ALTERNATIVE: Downgrade your Solana CLI to match your program's SDK version");
        console.log("   - Run 'solana-install init 1.14.18' to downgrade the CLI");
        console.log("   (Use this option only if upgrading your program is not possible)");
    } else {
        console.log("Your error may be due to other factors. Please check your program logic");
        console.log("and account structure for potential issues.");
    }
    
    // Run full version compatibility check
    console.log("\n--- Full Version Compatibility Check ---");
    checkVersionCompatibility();
    
    console.log("\n==============================================");
}

diagnoseCustom51Error()
    .then(() => console.log("Diagnosis complete"))
    .catch(err => console.error("Error during diagnosis:", err)); 