import { deposit } from "../../instructions/02_deposit";
import { 
    admin,
    connectionDevnet as connection,
    programDevnet as program,
} from "../../config";
import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { getTokenMintAddress } from "../../utils/loadMintAddresses";

const depositReceiptMoney = async () => {
    // Load mint address from data.json
    const mintAddressStr = getTokenMintAddress();
    
    if (!mintAddressStr) {
        console.error("Token mint address not found in data.json. Please run initialize script first.");
        process.exit(1);
    }
    
    // Create a PublicKey from the string
    const tokenMint = new PublicKey(mintAddressStr);
    console.log("Using token mint from data.json:", tokenMint.toString());
    
    // Proceed with deposit
    await deposit(connection, program, admin, tokenMint, new BN(10000000), true);
};

depositReceiptMoney().then(() => {
    console.log("Deposit receipt money success");
}).catch((error) => {
    console.error("Deposit receipt money failed", error);
    process.exit(1);
});