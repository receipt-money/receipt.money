use anchor_lang::prelude::*;
use crate::ID;

#[account]
pub struct ReceiptoState {
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

impl ReceiptoState {
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

    pub const STATE_SEED: &'static [u8] = b"receipto_state";
    pub const VAULT_AUTHORITY_SEED: &'static [u8] = b"receipto_vault_authority";
    pub const TOKEN_MINT_VAULT_SEED: &'static [u8] = b"receipto_token_mint_vault";
    pub const RECEIPT_MINT_VAULT_SEED: &'static [u8] = b"receipto_receipt_mint_vault";
    pub const RECEIPT_MINT_SEED: &'static [u8] = b"receipto_receipt_mint";

    pub fn find_token_mint_vault_authority() -> (Pubkey, u8) {
        Pubkey::find_program_address(
            &[Self::TOKEN_MINT_VAULT_SEED],
            &ID,
        )
    }

    pub fn find_receipt_mint_vault_authority() -> (Pubkey, u8) {
        Pubkey::find_program_address(
            &[Self::RECEIPT_MINT_VAULT_SEED],
            &ID,
        )
    }
} 
