# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Test Commands
- Frontend: `cd frontend && npm run dev` (development), `npm run build` (production), `npm run lint`
- Anchor: `anchor test` (run all tests), `anchor test tests/receipt-money.ts` (single test)
- Simulation: `cd simulation && npm run initialize`, `npm run deposit`
- Solana program: `anchor build` (build program), `anchor deploy` (deploy program)

## Code Style
- Rust: snake_case for functions/variables, CamelCase for types, UPPER_SNAKE_CASE for constants
- TypeScript/JavaScript: camelCase for variables/functions, PascalCase for components/classes
- React: Functional components with hooks preferred over class components
- Error handling: Use custom error types in Rust, proper try/catch in JavaScript
- Modular architecture for Solana programs with instruction handlers in separate files
- Follow Anchor framework conventions for account validation and PDA derivation
- Store bump seeds in state for consistent PDA access
- Document all smart contract functions with comprehensive docstrings
- Validate all input data, especially in smart contracts
- Follow React hooks patterns for state management