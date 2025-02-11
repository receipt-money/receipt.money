use anchor_lang::{
    accounts::interface_account::InterfaceAccount,
    prelude::*,
};
use anchor_spl::token_interface::{Mint, TokenInterface};
use crate::state::ReceiptState;
use crate::utils::token::create_token_account;

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        init,
        seeds = [ 
            ReceiptState::STATE_SEED.as_bytes(), 
            token_mint.key().as_ref(),
        ],
        bump,
        payer = authority,
        space = ReceiptState::LEN,
    )]
    pub receipt_state: Box<Account<'info, ReceiptState>>,

    pub token_mint: Box<InterfaceAccount<'info, Mint>>,
    
    #[account(
        seeds = [
            ReceiptState::VAULT_AUTHORITY_SEED.as_bytes(), 
            receipt_state.key().as_ref()
        ],
        bump,
    )]
    /// CHECK: This is both vault authority and mint authority of crToken
    pub vault_authority: UncheckedAccount<'info>,
    
    // #[account(
    //     init,
    //     seeds = [
    //         ReceiptState::TOKEN_MINT_VAULT_SEED,
    //         receipt_state.key().as_ref(),
    //     ],
    //     bump,
    //     payer = authority,
    //     token::mint = token_mint,
    //     token::authority = vault_authority,
    //     token::token_program = token_mint_program,   
    // )]
    // pub token_mint_vault: Box<InterfaceAccount<'info, TokenAccount>>,
    /// CHECK: This is the token mint vault
    #[account(
        mut,
        seeds = [
            ReceiptState::MINT_VAULT_SEED.as_bytes(),
            receipt_state.key().as_ref(),
            token_mint.key().as_ref(),
        ],
        bump,
    )]
    pub token_mint_vault: UncheckedAccount<'info>,
    
    #[account(
        init,
        seeds = [
            ReceiptState::MINT_SEED.as_bytes(),
            receipt_state.key().as_ref(),
        ],
        bump,
        payer = authority,
        mint::decimals = token_mint.decimals,
        mint::authority = vault_authority,
        mint::freeze_authority = vault_authority,
        mint::token_program = crypto_receipt_mint_program,
    )]
    pub crypto_receipt_mint: Box<InterfaceAccount<'info, Mint>>,

    // #[account(
    //     init,
    //     seeds = [
    //         ReceiptState::MINT_VAULT_SEED, 
    //         receipt_state.key().as_ref(),
    //     ],
    //     bump,
    //     payer = authority,
    //     token::mint = crypto_receipt_mint,
    //     token::authority = vault_authority,
    //     token::token_program = crypto_receipt_mint_program,
    // )]
    // pub crypto_receipt_mint_vault: Box<InterfaceAccount<'info, TokenAccount>>,
    /// CHECK: This is the crypto receipt mint vault
    #[account(
        mut,
        seeds = [
            ReceiptState::MINT_VAULT_SEED.as_bytes(),
            receipt_state.key().as_ref(),
            crypto_receipt_mint.key().as_ref(),
        ],
        bump,
    )]
    pub crypto_receipt_mint_vault: UncheckedAccount<'info>,
    
    pub system_program: Program<'info, System>,
    /// Spl token program or token program 2022
    pub token_mint_program: Interface<'info, TokenInterface>,
    /// Spl token program or token program 2022
    pub crypto_receipt_mint_program: Interface<'info, TokenInterface>,
    pub rent: Sysvar<'info, Rent>,
} 

pub fn handle_initialize(ctx: Context<Initialize>) -> Result<()> {

    // due to stack/heap limitations, we have to create redundant new token vault accounts ourselves
    create_token_account(
        &ctx.accounts.vault_authority.to_account_info(),
        &ctx.accounts.authority.to_account_info(),
        &ctx.accounts.token_mint_vault.to_account_info(),
        &ctx.accounts.token_mint.to_account_info(),
        &ctx.accounts.system_program.to_account_info(),
        &ctx.accounts.token_mint_program.to_account_info(),
        &[
            ReceiptState::MINT_VAULT_SEED.as_bytes(),
            ctx.accounts.receipt_state.key().as_ref(),
            ctx.accounts.token_mint.key().as_ref(),
            &[ctx.bumps.token_mint_vault][..],
        ][..],
    )?;

    create_token_account(
        &ctx.accounts.vault_authority.to_account_info(),
        &ctx.accounts.authority.to_account_info(),
        &ctx.accounts.crypto_receipt_mint_vault.to_account_info(),
        &ctx.accounts.crypto_receipt_mint.to_account_info(),
        &ctx.accounts.system_program.to_account_info(),
        &ctx.accounts.crypto_receipt_mint_program.to_account_info(),
        &[
            ReceiptState::MINT_VAULT_SEED.as_bytes(),
            ctx.accounts.receipt_state.key().as_ref(),
            ctx.accounts.crypto_receipt_mint.key().as_ref(),
            &[ctx.bumps.crypto_receipt_mint_vault][..],
        ][..],
    )?;
    let receipt_state = &mut ctx.accounts.receipt_state;
    receipt_state.authority = ctx.accounts.authority.key();
    receipt_state.token_mint = ctx.accounts.token_mint.key();
    receipt_state.token_mint_vault = ctx.accounts.token_mint_vault.key();
    receipt_state.crypto_receipt_mint = ctx.accounts.crypto_receipt_mint.key();
    receipt_state.crypto_receipt_vault = ctx.accounts.crypto_receipt_mint_vault.key();
    receipt_state.bump = ctx.bumps.receipt_state;
    receipt_state.vault_authority_bump = ctx.bumps.vault_authority;
    receipt_state.token_mint_vault_bump = ctx.bumps.token_mint_vault;
    receipt_state.receipt_mint_bump = ctx.bumps.crypto_receipt_mint;
    receipt_state.receipt_mint_vault_bump = ctx.bumps.crypto_receipt_mint_vault;
    Ok(())
} 