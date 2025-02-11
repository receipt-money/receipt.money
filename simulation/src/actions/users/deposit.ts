import { deposit } from "../../instructions/02_deposit";
import { 
    admin,
    connectionDevnet as connection,
    programDevnet as program,
    SOL_DEVNET_MINT as SOL_MINT,
} from "../../config";
import { BN } from "@coral-xyz/anchor";

const depositReceiptMoney = async () => {
    await deposit(connection, program, admin, SOL_MINT, new BN(10000000), true);
};

depositReceiptMoney().then(() => {
    console.log("Deposit receipt money success");
}).catch((error) => {
    console.error("Deposit receipt money failed", error);
});