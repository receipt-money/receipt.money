use anchor_lang::prelude::*;
use crate::ID;

#[account]
pub struct ReceiptState {
    pub authority: Pubkey,
    pub token_mint: Pubkey,
    pub token_mint_vault: Pubkey,
    pub crypto_receipt_mint: Pubkey,
    pub crypto_receipt_vault: Pubkey,
    pub bump: u8,
    pub vault_authority_bump: u8,
    pub token_mint_vault_bump: u8,
    pub receipt_mint_bump: u8,
    pub receipt_mint_vault_bump: u8,
}

impl ReceiptState {
    pub const LEN: usize = 8 + // discriminator
        32 + // authority
        32 + // token_mint
        32 + // token_mint_vault
        32 + // crypto_receipt_mint
        32 + // crypto_receipt_vault
        1 + // bump
        1 + // vault_authority_bump
        1 + // token_mint_vault_bump
        1 + // receipt_mint_bump
        1; // receipt_mint_vault_bump

    pub const STATE_SEED: &'static str = "receipt_state";
    pub const VAULT_AUTHORITY_SEED: &'static str = "receipt_vault_authority";
    pub const MINT_SEED: &'static str = "receipt_mint";
    pub const MINT_VAULT_SEED: &'static str = "receipt_mint_vault";

    pub fn find_mint_vault_authority(receipt_state: &Pubkey, token_mint: &Pubkey) -> (Pubkey, u8) {
        Pubkey::find_program_address(
            &[
                Self::MINT_VAULT_SEED.as_bytes(),
                receipt_state.as_ref(),
                token_mint.as_ref(),
            ],
            &ID,
        )
    }
} 
