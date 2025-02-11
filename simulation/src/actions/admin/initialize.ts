import { initialize } from "../../instructions/01_initialize";
import { 
    admin,
    connectionDevnet as connection,
    programDevnet as program,
    SOL_DEVNET_MINT as SOL_MINT,
} from "../../config";

const initializeReceiptMoney = async () => {
    await initialize(connection, program, admin, SOL_MINT);
};

initializeReceiptMoney().then(() => {
    console.log("Initialize receipt money success");
}).catch((error) => {
    console.error("Initialize receipt money failed", error);
});