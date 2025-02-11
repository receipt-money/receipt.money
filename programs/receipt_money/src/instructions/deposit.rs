use anchor_lang::{
    accounts::interface_account::InterfaceAccount,
    prelude::*,
};
use anchor_spl::token_interface::{self, Mint, TokenAccount, TokenInterface};
use crate::{
    state::ReceiptState, 
    utils::transfer_from_user_to_token_vault,
};

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        associated_token::mint = token_mint,
        associated_token::authority = user,
        associated_token::token_program = token_mint_program,
    )]
    pub user_mint_token_account: Box<InterfaceAccount<'info, TokenAccount>>,
    
    #[account(
        mut,
        associated_token::mint = crypto_receipt_mint,
        associated_token::authority = user,
        associated_token::token_program = crypto_receipt_mint_program,
    )]
    pub user_crypto_receipt_token_account: Box<InterfaceAccount<'info, TokenAccount>>,
    
    #[account(
        mut,
        has_one = token_mint,
        has_one = token_mint_vault,
        has_one = crypto_receipt_mint,
        seeds = [
            ReceiptState::STATE_SEED.as_bytes(), 
            receipt_state.token_mint.as_ref(),
        ],
        bump = receipt_state.bump,
    )]
    pub receipt_state: Account<'info, ReceiptState>,
    
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
    
    #[account(
        mut,
        seeds = [   
            ReceiptState::MINT_VAULT_SEED.as_bytes(), 
            receipt_state.key().as_ref(),
            token_mint.key().as_ref(),
        ],
        bump = receipt_state.token_mint_vault_bump,
    )]
    pub token_mint_vault: Box<InterfaceAccount<'info, TokenAccount>>,
    
    #[account(
        mut,
        seeds = [
            ReceiptState::MINT_SEED.as_bytes(), 
            receipt_state.key().as_ref(),
        ],
        bump = receipt_state.receipt_mint_bump,
    )]
    pub crypto_receipt_mint: Box<InterfaceAccount<'info, Mint>>,

    #[account(
        mut,
        seeds = [
            ReceiptState::MINT_VAULT_SEED.as_bytes(),
            receipt_state.key().as_ref(),
            crypto_receipt_mint.key().as_ref(),
        ],
        bump = receipt_state.receipt_mint_vault_bump,
    )]
    pub crypto_receipt_mint_vault: Box<InterfaceAccount<'info, TokenAccount>>,
    /// Spl token program or token program 2022
    pub token_mint_program: Interface<'info, TokenInterface>,
    /// Spl token program or token program 2022
    pub crypto_receipt_mint_program: Interface<'info, TokenInterface>,
} 

pub fn handle_deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
    let receipt_state = &mut ctx.accounts.receipt_state;
    let receipt_state_pubkey = receipt_state.key();
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
    msg!("Transferring tokens from user to vault done");
    // Mint receipt tokens
    let signer_seeds: &[&[&[u8]]] = &[&[
        ReceiptState::VAULT_AUTHORITY_SEED.as_bytes(), 
        receipt_state_pubkey.as_ref(),
        &[ctx.bumps.vault_authority],
    ]];
    msg!("Minting receipt tokens");
    let cpi_accounts = token_interface::MintTo {
        mint: ctx.accounts.crypto_receipt_mint.to_account_info(),
        to: ctx.accounts.user_crypto_receipt_token_account.to_account_info(),
        authority: ctx.accounts.vault_authority.to_account_info(),
    };
    let cpi_program = ctx.accounts.crypto_receipt_mint_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts).with_signer(signer_seeds);
    token_interface::mint_to(cpi_ctx, amount)?;
    Ok(())
} 