use anchor_lang::prelude::*;

pub mod instructions;
pub mod state;
pub mod utils;
pub mod errors;

use instructions::*;

declare_id!("ReMoLWd9XjJQTuSoT9tuKtfbjGy8FtVXX3dqgBHg1gy");

#[program]
pub mod receipt_money {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        instructions::initialize::handle_initialize(ctx)
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        instructions::deposit::handle_deposit(ctx, amount)
    }
}
