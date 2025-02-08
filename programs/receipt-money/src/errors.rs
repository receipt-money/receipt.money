/// Errors that may be returned by the TokenSwap program.
use anchor_lang::prelude::*;

#[error_code]
pub enum ReceiptoErrorCode {
    /// The input token is invalid for swap.
    #[msg("InvalidInput")]
    InvalidInput,
}