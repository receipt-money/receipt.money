import * as fs from 'fs';
import * as path from 'path';
import * as child_process from 'child_process';

/**
 * Analyzes a program's Cargo.toml dependencies
 * to identify potential version compatibility issues
 */
async function analyzeDependencies() {
    console.log("========== DEPENDENCY ANALYZER ==========");
    
    // Find the Cargo.toml file
    let cargoTomlPath = findCargoToml();
    
    if (!cargoTomlPath) {
        console.error("Could not find Cargo.toml file. Please run this script from within the project directory.");
        return;
    }
    
    console.log(`Found Cargo.toml at: ${cargoTomlPath}`);
    
    // Read the Cargo.toml file
    const cargoToml = fs.readFileSync(cargoTomlPath, 'utf8');
    
    // Extract program version
    const programVersionMatch = cargoToml.match(/version\s*=\s*"([^"]+)"/);
    const programVersion = programVersionMatch ? programVersionMatch[1] : "Unknown";
    console.log(`Program version: ${programVersion}`);
    
    // Extract key dependencies
    const dependencies = {
        "solana-program": extractDependencyVersion(cargoToml, "solana-program"),
        "anchor-lang": extractDependencyVersion(cargoToml, "anchor-lang"),
        "borsh": extractDependencyVersion(cargoToml, "borsh"),
        "spl-token": extractDependencyVersion(cargoToml, "spl-token"),
        "spl-associated-token-account": extractDependencyVersion(cargoToml, "spl-associated-token-account"),
        "spl-token-metadata-interface": extractDependencyVersion(cargoToml, "spl-token-metadata-interface")
    };
    
    // Get current Solana CLI version
    let solanaCLIVersion = "Unknown";
    try {
        solanaCLIVersion = child_process.execSync('solana --version').toString().trim();
        const versionMatch = solanaCLIVersion.match(/\d+\.\d+\.\d+/);
        if (versionMatch) {
            solanaCLIVersion = versionMatch[0];
        }
    } catch (error) {
        console.error("Error getting Solana CLI version:", error);
    }
    
    console.log("\n--- Key Dependencies ---");
    console.log(`Solana CLI version: ${solanaCLIVersion}`);
    
    // Print all dependencies
    for (const [dep, version] of Object.entries(dependencies)) {
        console.log(`${dep}: ${version || "Not found"}`);
    }
    
    // Check for version compatibility issues
    console.log("\n--- Compatibility Analysis ---");
    
    // Check solana-program version against CLI version
    if (dependencies["solana-program"]) {
        const programVersionNum = extractVersionNumber(dependencies["solana-program"]);
        const cliVersionNum = extractVersionNumber(solanaCLIVersion);
        
        if (programVersionNum && cliVersionNum) {
            // Check for major version compatibility
            const programMajorMinor = programVersionNum.split('.').slice(0, 2).join('.');
            const cliMajorMinor = cliVersionNum.split('.').slice(0, 2).join('.');
            
            if (programMajorMinor !== cliMajorMinor) {
                console.log("⚠️ VERSION MISMATCH DETECTED");
                console.log(`Your program uses solana-program ${programVersionNum}`);
                console.log(`But your Solana CLI is ${cliVersionNum}`);
                
                if (programMajorMinor === "1.14" && (cliMajorMinor === "1.16" || cliMajorMinor === "1.17" || cliMajorMinor === "1.18")) {
                    console.log("\n🔍 DIAGNOSIS: Memory Layout Mismatch");
                    console.log("This is the likely cause of your 'Custom: 51' error!");
                    console.log("Solana 1.16.0+ uses a different memory layout for Vec types than 1.14.x");
                    console.log("When you call instructions, the serialization format doesn't match what the program expects.");
                }
            } else {
                console.log("✅ Solana program version matches CLI version");
            }
        }
    }
    
    // Check borsh version for compatibility issues
    if (dependencies["borsh"]) {
        const borshVersion = extractVersionNumber(dependencies["borsh"]);
        if (borshVersion && borshVersion.startsWith("0.9")) {
            if (solanaCLIVersion.startsWith("1.16") || solanaCLIVersion.startsWith("1.17") || solanaCLIVersion.startsWith("1.18")) {
                console.log("\n⚠️ BORSH VERSION COMPATIBILITY ISSUE");
                console.log("You're using borsh 0.9.x but Solana 1.16.0+ expects borsh 0.10.x");
                console.log("This can cause serialization issues for some types.");
            }
        }
    }
    
    // Check for cargo-build-sbf/bpf compatibility
    console.log("\n--- Build Tools Analysis ---");
    
    try {
        // Check if cargo-build-sbf is available
        const sbfOutput = child_process.execSync('which cargo-build-sbf 2>/dev/null || echo "Not found"').toString().trim();
        const bpfOutput = child_process.execSync('which cargo-build-bpf 2>/dev/null || echo "Not found"').toString().trim();
        
        console.log(`cargo-build-sbf: ${sbfOutput === "Not found" ? "Not installed" : "Installed"}`);
        console.log(`cargo-build-bpf: ${bpfOutput === "Not found" ? "Not installed" : "Installed"}`);
        
        // For older Solana versions, cargo-build-bpf is used
        if (solanaCLIVersion.startsWith("1.14") && sbfOutput === "Not found" && bpfOutput !== "Not found") {
            console.log("Using cargo-build-bpf (deprecated but compatible with 1.14.x)");
        }
        
        // For 1.16+, cargo-build-sbf should be used
        if ((solanaCLIVersion.startsWith("1.16") || solanaCLIVersion.startsWith("1.17") || solanaCLIVersion.startsWith("1.18")) 
            && sbfOutput === "Not found") {
            console.log("⚠️ cargo-build-sbf not found but required for Solana 1.16.0+");
        }
    } catch (error) {
        console.error("Error checking build tools:", error);
    }
    
    // Provide solution recommendations
    console.log("\n=== RECOMMENDATIONS ===");
    
    if (dependencies["solana-program"] && 
        (dependencies["solana-program"].includes("1.14") || dependencies["solana-program"].includes("1.15")) &&
        (solanaCLIVersion.startsWith("1.16") || solanaCLIVersion.startsWith("1.17") || solanaCLIVersion.startsWith("1.18"))) {
        
        console.log("To fix the 'Custom: 51' error, you have two options:");
        
        console.log("\n1. RECOMMENDED: Update your program dependencies and rebuild");
        console.log("   Edit Cargo.toml and update these dependencies:");
        console.log(`   solana-program = "~${solanaCLIVersion.split('.').slice(0, 2).join('.')}.0"`);
        if (dependencies["borsh"] && dependencies["borsh"].includes("0.9")) {
            console.log(`   borsh = "~0.10.3"`);
        }
        console.log("\n   Then rebuild your program with:");
        console.log("   cargo build-sbf");
        
        console.log("\n2. ALTERNATIVE: Downgrade your Solana CLI to match program version");
        if (dependencies["solana-program"] && dependencies["solana-program"].includes("1.14")) {
            console.log("   solana-install init 1.14.18");
        } else if (dependencies["solana-program"] && dependencies["solana-program"].includes("1.15")) {
            console.log("   solana-install init 1.15.2");
        }
    }
    
    console.log("\n======================================");
}

/**
 * Find Cargo.toml file in the project directory
 */
function findCargoToml(): string | null {
    // Try to find the program directory
    const potentialLocations = [
        path.resolve(__dirname, "../../../../programs/receipt_money"),
        path.resolve(__dirname, "../../../programs/receipt_money"),
        path.resolve(__dirname, "../../../programs"),
        path.resolve(__dirname, "../../../../programs"),
        path.resolve(__dirname, "../../.."),
        path.resolve(__dirname, "../../../.."),
    ];
    
    for (const loc of potentialLocations) {
        const cargoPath = path.join(loc, "Cargo.toml");
        if (fs.existsSync(cargoPath)) {
            return cargoPath;
        }
    }
    
    return null;
}

/**
 * Extract a dependency version from Cargo.toml
 */
function extractDependencyVersion(cargoToml: string, dependency: string): string | null {
    // Try standard format: dependency = "version"
    let match = new RegExp(`${dependency}\\s*=\\s*"([^"]+)"`).exec(cargoToml);
    if (match) return match[1];
    
    // Try table format: [dependencies.dependency]
    const tablePattern = new RegExp(`\\[dependencies\\.${dependency}\\]([^\\[]*)`, 's');
    const tableMatch = tablePattern.exec(cargoToml);
    if (tableMatch) {
        const versionMatch = /version\s*=\s*"([^"]+)"/.exec(tableMatch[1]);
        if (versionMatch) return versionMatch[1];
    }
    
    // Try inline table format: dependency = { version = "..." }
    const inlinePattern = new RegExp(`${dependency}\\s*=\\s*\\{([^\\}]*)\\}`, 's');
    const inlineMatch = inlinePattern.exec(cargoToml);
    if (inlineMatch) {
        const versionMatch = /version\s*=\s*"([^"]+)"/.exec(inlineMatch[1]);
        if (versionMatch) return versionMatch[1];
    }
    
    return null;
}

/**
 * Extract version number from version string
 */
function extractVersionNumber(versionStr: string): string | null {
    // Extract version number from strings like "~1.14.0", "^1.14", "=1.14.0", "1.14.0"
    const match = versionStr.match(/[~^=]?(\d+\.\d+\.\d+)/);
    if (match) return match[1];
    
    // Try with just major.minor
    const minorMatch = versionStr.match(/[~^=]?(\d+\.\d+)/);
    if (minorMatch) return minorMatch[1];
    
    return null;
}

analyzeDependencies()
    .then(() => console.log("Analysis complete"))
    .catch(err => console.error("Error during analysis:", err)); 