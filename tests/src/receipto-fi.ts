import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { ReceiptoFi } from "../target/types/receipto_fi";
import { TOKEN_PROGRAM_ID, createMint, createAccount } from "@solana/spl-token";
import { expect } from "chai";

describe("receipto-fi", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.ReceiptoFi as Program<ReceiptoFi>;

  it("Is initialized!", async () => {
    // Add your test here
    console.log("Your test goes here!");
  });
}); 