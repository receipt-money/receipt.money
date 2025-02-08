use anchor_lang::prelude::*;

pub mod instructions;
pub mod state;
pub mod utils;
pub mod errors;

use instructions::*;

declare_id!("35thGDc1684qSaXPYYmPgPTgtBfsY2B979g2wvrnndsE");

#[program]
pub mod receipto_fi {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        instructions::initialize::handle_initialize(ctx)
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        instructions::deposit::handle_deposit(ctx, amount)
    }
}
