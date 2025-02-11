import { AnchorProvider, Program } from '@coral-xyz/anchor';
import NodeWallet from '@coral-xyz/anchor/dist/cjs/nodewallet';
import { Connection, PublicKey } from '@solana/web3.js';
import idl from "../../targets/idl/receipt_money.json";
import { ReceiptMoney } from "../../targets/types/receipt_money";
import * as dotenv from 'dotenv';
import { loadKeypairFromFile } from '../utils/loadKeypairFromFile';

dotenv.config();

if (!process.env.RPC) throw new Error('RPC is not defined');
if (!process.env.RPC_DEVNET) throw new Error('RPC_DEVNET is not defined');
if (!process.env.ADMIN_PATH) throw new Error('ADMIN_PATH is not defined');

//admin is also the payer for intializing accounts
export const admin = loadKeypairFromFile(process.env.ADMIN_PATH);
export const user = loadKeypairFromFile(process.env.USER_PATH);
export const wallet = new NodeWallet(admin)

// Use the RPC endpoint of your choice.
export const connection = new Connection(process.env.RPC, { commitment: "finalized" })
export const connectionDevnet = new Connection(process.env.RPC_DEVNET, { commitment: "finalized" })


export const provider = new AnchorProvider(connection, wallet, {});
export const providerDevnet = new AnchorProvider(connectionDevnet, wallet, {});

export const contractAddr = new PublicKey(idl.address)

export const program = new Program(idl as ReceiptMoney, provider );
export const programDevnet = new Program(idl as ReceiptMoney, providerDevnet );

export const TOKEN_METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");


export const SOL_DEVNET_MINT = new PublicKey("So11111111111111111111111111111111111111112");
export const USDC_DEVNET_MINT = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");
// export const ETH_DEVNET_MINT = new PublicKey("222222222222222222222222222222222222222222");
// export const BTC_DEVNET_MINT = new PublicKey("333333333333333333333333333333333333333333");

export const [receiptStateDevnetSol, receiptStateDevnetSolBump] = PublicKey.findProgramAddressSync(
    [
        Buffer.from("receipt_state"),
        SOL_DEVNET_MINT.toBuffer(),
    ],
    program.programId
);

export const [receiptStateDevnetUsdc, receiptStateDevnetUsdcBump] = PublicKey.findProgramAddressSync(
    [
        Buffer.from("receipt_state"),
        USDC_DEVNET_MINT.toBuffer(),
    ],
    program.programId
);

// export const [receiptStateDevnetEth, receiptStateDevnetEthBump] = PublicKey.findProgramAddressSync(
//     [
//         Buffer.from("receipt_state"),
//         ETH_DEVNET_MINT.toBuffer(),
//     ],
//     program.programId
// );

// export const [receiptStateDevnetBtc, receiptStateDevnetBtcBump] = PublicKey.findProgramAddressSync(
//     [
//         Buffer.from("receipt_state"),
//         BTC_DEVNET_MINT.toBuffer(),
//     ],
//     program.programId
// );