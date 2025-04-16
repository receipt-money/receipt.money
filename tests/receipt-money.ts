import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ReceiptMoney } from "../target/types/receipt_money";

describe("receipt_money", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.ReceiptMoney as Program<ReceiptMoney>;

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods
      .initialize("Crypto Receipt Token", "CRT", "https://example.com/token")
      .rpc();
    console.log("Your transaction signature", tx);
  });
});
