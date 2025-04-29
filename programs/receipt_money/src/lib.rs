use anchor_lang::prelude::*;

pub mod instructions;
pub mod state;
pub mod utils;
pub mod errors;

use instructions::*;
use instructions::initialize::TokenMetadataArgs;

declare_id!("RMcr2nvyrwCh89SvH47916S9TCvPkoGBPNR8E1d1LWa");

#[program]
pub mod receipt_money {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, name: String, symbol: String, uri: String) -> Result<()> {
        let args = TokenMetadataArgs {
            name,
            symbol,
            uri,
        };
        instructions::initialize::handle_initialize(ctx, args)
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        instructions::deposit::handle_deposit(ctx, amount)
    }
}
