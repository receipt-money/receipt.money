use anchor_lang::{
    accounts::interface_account::InterfaceAccount,
    prelude::*,
    solana_program::rent::{DEFAULT_EXEMPTION_THRESHOLD, DEFAULT_LAMPORTS_PER_BYTE_YEAR},
    system_program::{transfer, Transfer},
};
use anchor_spl::token_interface::{
    Mint, TokenInterface, token_metadata_initialize, TokenMetadataInitialize,
};
use spl_token_metadata_interface::state::TokenMetadata;
use crate::state::ReceiptState;
use crate::utils::token::create_token_account;
use spl_type_length_value::variable_len_pack::VariableLenPack;

#[derive(AnchorDeserialize, AnchorSerialize)]
pub struct TokenMetadataArgs {
    pub name: String,
    pub symbol: String,
    pub uri: String,
}

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
        extensions::metadata_pointer::authority = vault_authority,
        extensions::metadata_pointer::metadata_address = crypto_receipt_mint,
    )]
    pub crypto_receipt_mint: Box<InterfaceAccount<'info, Mint>>,

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

pub fn handle_initialize(
    ctx: Context<Initialize>, 
    args: TokenMetadataArgs,
) -> Result<()> {
    let TokenMetadataArgs { name, symbol, uri } = args;

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

     // Define token metadata
     let token_metadata = TokenMetadata {
        name: name.clone(),
        symbol: symbol.clone(),
        uri: uri.clone(),
        ..Default::default()
    };
     // Add 4 extra bytes for size of MetadataExtension (2 bytes for type, 2 bytes for length)
     let data_len = 4 + token_metadata.get_packed_len()?;

     // Calculate lamports required for the additional metadata
     let lamports =
         data_len as u64 * DEFAULT_LAMPORTS_PER_BYTE_YEAR * DEFAULT_EXEMPTION_THRESHOLD as u64;
    // Transfer additional lamports to mint account for metadata
    transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            Transfer {
                from: ctx.accounts.authority.to_account_info(),
                to: ctx.accounts.crypto_receipt_mint.to_account_info(),
            },
        ),
        lamports,
    )?;
    let receipt_state_key = ctx.accounts.receipt_state.key();
    let auth_seeds = &[
        ReceiptState::VAULT_AUTHORITY_SEED.as_bytes(), 
        receipt_state_key.as_ref(), 
        &[ctx.bumps.vault_authority]
    ];
    let signer = &[&auth_seeds[..]];
    // Initialize token metadata
    token_metadata_initialize(
        CpiContext::new_with_signer(
            ctx.accounts.crypto_receipt_mint_program.to_account_info(),
            TokenMetadataInitialize {
                token_program_id: ctx.accounts.crypto_receipt_mint_program.to_account_info(),
                mint: ctx.accounts.crypto_receipt_mint.to_account_info(),
                metadata: ctx.accounts.crypto_receipt_mint.to_account_info(),
                mint_authority: ctx.accounts.vault_authority.to_account_info(),
                update_authority: ctx.accounts.vault_authority.to_account_info(),
            },
            signer,
        ),
        name,
        symbol,
        uri,
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