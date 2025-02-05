use anchor_lang::{
    accounts::interface_account::InterfaceAccount,
    prelude::*,
};
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};
use crate::{
    state::ReceiptoState, 
    utils::{token_mint_to, transfer_from_user_to_token_vault},
};

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        associated_token::mint = token_mint,
        associated_token::authority = user,
        token::token_program = token_mint_program,
    )]
    pub user_mint_token_account: Box<InterfaceAccount<'info, TokenAccount>>,
    
    #[account(
        mut,
        associated_token::mint = crypto_receipt_mint,
        associated_token::authority = user,
        token::token_program = crypto_receipt_mint_program,
    )]
    pub user_crypto_receipt_token_account: Box<InterfaceAccount<'info, TokenAccount>>,
    
    #[account(
        mut,
        has_one = token_mint,
        has_one = token_mint_vault,
        has_one = crypto_receipt_mint,
        seeds = [
            ReceiptoState::STATE_SEED, 
            receipto_state.token_mint.as_ref(),
        ],
        bump = receipto_state.bump,
    )]
    pub receipto_state: Account<'info, ReceiptoState>,
    
    pub token_mint: Box<InterfaceAccount<'info, Mint>>,

    #[account(
        seeds = [
            ReceiptoState::VAULT_AUTHORITY_SEED, 
            receipto_state.key().as_ref()
        ],
        bump = receipto_state.vault_authority_bump,
    )]
    /// CHECK: This is both vault authority and mint authority of crToken
    pub vault_authority: UncheckedAccount<'info>,
    
    #[account(
        mut,
        seeds = [   
            ReceiptoState::TOKEN_MINT_VAULT_SEED, 
            receipto_state.key().as_ref(),
        ],
        bump = receipto_state.token_mint_vault_bump,
    )]
    pub token_mint_vault: Box<InterfaceAccount<'info, TokenAccount>>,
    
    #[account(
        seeds = [
            ReceiptoState::RECEIPT_MINT_SEED, 
            receipto_state.key().as_ref(),
        ],
        bump = receipto_state.receipt_mint_bump,
    )]
    pub crypto_receipt_mint: Box<InterfaceAccount<'info, Mint>>,

    #[account(
        mut,
        seeds = [
            ReceiptoState::RECEIPT_MINT_VAULT_SEED,
            receipto_state.key().as_ref(),
        ],
        bump = receipto_state.receipt_mint_vault_bump,
    )]
    pub crypto_receipt_mint_vault: Box<InterfaceAccount<'info, TokenAccount>>,
    /// Spl token program or token program 2022
    pub token_mint_program: Interface<'info, TokenInterface>,
    /// Spl token program or token program 2022
    pub crypto_receipt_mint_program: Interface<'info, TokenInterface>,
} 

pub fn handle_deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
    let receipto_state = &mut ctx.accounts.receipto_state;
    let receipto_state_pubkey = receipto_state.key();
    // Transfer tokens from user to vault
    transfer_from_user_to_token_vault(
        ctx.accounts.user.to_account_info(),
        ctx.accounts.user_mint_token_account.to_account_info(),
        ctx.accounts.token_mint_vault.to_account_info(),
        ctx.accounts.token_mint.to_account_info(),
        ctx.accounts.token_mint_program.to_account_info(),
        amount,
        ctx.accounts.token_mint.decimals,
    )?;

    // Mint receipt tokens
    let seeds = &[
        ReceiptoState::VAULT_AUTHORITY_SEED,
        receipto_state_pubkey.as_ref(),
        &[receipto_state.vault_authority_bump],
    ];
    let signer = &[&seeds[..]];

    token_mint_to(
        ctx.accounts.vault_authority.to_account_info(),
        ctx.accounts.crypto_receipt_mint_program.to_account_info(),
        ctx.accounts.crypto_receipt_mint.to_account_info(),
        ctx.accounts.user_crypto_receipt_token_account.to_account_info(),
        amount,
        signer,
    )?;
    Ok(())
} 