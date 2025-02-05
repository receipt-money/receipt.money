use anchor_lang::{
    accounts::interface_account::InterfaceAccount,
    prelude::*,
};
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};
use crate::state::ReceiptoState;

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        init,
        seeds = [ 
            ReceiptoState::STATE_SEED, 
            token_mint.key().as_ref(),
        ],
        bump,
        payer = authority,
        space = ReceiptoState::LEN,
    )]
    pub receipto_state: Account<'info, ReceiptoState>,

    pub token_mint: Box<InterfaceAccount<'info, Mint>>,
    
    #[account(
        seeds = [
            ReceiptoState::VAULT_AUTHORITY_SEED, 
            receipto_state.key().as_ref()
        ],
        bump,
    )]
    /// CHECK: This is both vault authority and mint authority of crToken
    pub vault_authority: UncheckedAccount<'info>,
    
    #[account(
        init,
        seeds = [
            ReceiptoState::TOKEN_MINT_VAULT_SEED,
            receipto_state.key().as_ref(),
        ],
        bump,
        payer = authority,
        token::mint = token_mint,
        token::authority = vault_authority,
        token::token_program = token_mint_program,   
    )]
    pub token_mint_vault: Box<InterfaceAccount<'info, TokenAccount>>,
    // pub token_mint_vault: UncheckedAccount<'info>,
    
    #[account(
        init,
        seeds = [
            ReceiptoState::RECEIPT_MINT_SEED,
            receipto_state.key().as_ref(),
        ],
        bump,
        payer = authority,
        mint::decimals = token_mint.decimals,
        mint::authority = vault_authority,
        mint::token_program = crypto_receipt_mint_program,
    )]
    pub crypto_receipt_mint: Box<InterfaceAccount<'info, Mint>>,

    #[account(
        init,
        seeds = [
            ReceiptoState::RECEIPT_MINT_VAULT_SEED, 
            receipto_state.key().as_ref(),
        ],
        bump,
        payer = authority,
        token::mint = crypto_receipt_mint,
        token::authority = vault_authority,
        token::token_program = crypto_receipt_mint_program,
    )]
    pub crypto_receipt_mint_vault: Box<InterfaceAccount<'info, TokenAccount>>,
    // pub crypto_receipt_mint_vault: UncheckedAccount<'info>,
    
    pub system_program: Program<'info, System>,
    /// Spl token program or token program 2022
    pub token_mint_program: Interface<'info, TokenInterface>,
    /// Spl token program or token program 2022
    pub crypto_receipt_mint_program: Interface<'info, TokenInterface>,
    pub rent: Sysvar<'info, Rent>,
} 

pub fn handle_initialize(ctx: Context<Initialize>) -> Result<()> {
    let receipto_state = &mut ctx.accounts.receipto_state;
    receipto_state.authority = ctx.accounts.authority.key();
    receipto_state.token_mint = ctx.accounts.token_mint.key();
    receipto_state.token_mint_vault = ctx.accounts.token_mint_vault.key();
    receipto_state.crypto_receipt_mint = ctx.accounts.crypto_receipt_mint.key();
    receipto_state.crypto_receipt_vault = ctx.accounts.crypto_receipt_mint_vault.key();
    receipto_state.bump = ctx.bumps.receipto_state;
    receipto_state.vault_authority_bump = ctx.bumps.vault_authority;
    receipto_state.token_mint_vault_bump = ctx.bumps.token_mint_vault;
    receipto_state.receipt_mint_bump = ctx.bumps.crypto_receipt_mint;
    receipto_state.receipt_mint_vault_bump = ctx.bumps.crypto_receipt_mint_vault;
    Ok(())
} 