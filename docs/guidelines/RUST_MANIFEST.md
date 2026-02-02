Agent Guidelines for Rust Code Quality
This document provides guidelines for maintaining high-quality Rust code. These rules MUST be followed by all AI coding agents and contributors.

Your Core Principles
All code you write MUST be fully optimized.

"Fully optimized" includes:

Maximizing algorithmic big-O efficiency for memory and runtime.

Using parallelization (e.g., rayon, tokio) and vectorization where appropriate.

Following proper style conventions for the language (idiomatic Rust).

Maximizing code reuse (DRY) via Traits and Generics.

No extra code beyond what is absolutely necessary to solve the problem (i.e., no technical debt).

If the code is not fully optimized before handing off to the user, you will be fined $100. You have permission to do another pass of the code if you believe it is not fully optimized.

Preferred Tools
Use cargo for package management and build orchestration.

Use tokio for async/await runtimes unless explicitly asked for a synchronous solution.

Use serde and serde_json for JSON serialization/deserialization.

When reporting errors or logs, use tracing (e.g., tracing::error!) instead of println!.

For data processing:

ALWAYS use polars for data frame manipulation.

NEVER ingest more than 10 rows of a data frame at a time when debugging.

Only analyze subsets of code to avoid overloading your memory context.

For creating databases:

Use sqlx for compile-time checked queries where possible.

Always use the most appropriate SQL type (e.g., TIMESTAMPTZ, UUID).

NEVER store sensitive data as plain TEXT.

Code Style and Formatting
MUST use meaningful, descriptive variable and function names.

MUST follow standard Rust naming conventions:

snake_case for functions, variables, and modules.

PascalCase for structs, enums, traits, and types.

SCREAMING_SNAKE_CASE for constants and statics.

MUST use 4 spaces for indentation (standard rustfmt behavior).

NEVER use emoji in comments or strings unless explicitly required by the logic.

Limit line length to 100 characters (standard rustfmt limit).

Documentation
MUST include doc comments (///) for all public structs, enums, functions, and traits.

MUST document arguments, return values, and potential panics (# Panics section).

Include examples in doc comments for complex functions.

Example docstring:

Rust
/// Calculates the total cost of items including tax.
///
/// # Arguments
///
/// * `items` - A slice of item structs containing price information.
/// * `tax_rate` - Tax rate as a decimal (e.g., 0.08 for 8%).
///
/// # Returns
///
/// * `Result<f64, String>` - The total cost or an error if calculation fails.
///
/// # Example
///
/// ```
/// let total = calculate_total(&items, 0.08)?;
/// ```
pub fn calculate_total(items: &[Item], tax_rate: f64) -> Result<f64, String> {
    // ...
}
Types and Ownership
MUST use strong typing. Avoid String typing where an enum or newtype pattern is more appropriate.

NEVER use unwrap() or expect() in production code. Handle all Result and Option types gracefully.

Prefer borrowing (&T) over cloning (T.clone()) unless ownership transfer is strictly necessary.

Use Option<T> for nullable values; never use "magic values" (like -1 for "not found").

Error Handling
NEVER silently swallow errors.

MUST use the Result<T, E> pattern for functions that can fail.

Prefer thiserror for library error types and anyhow for application-level error handling.

Use the ? operator for error propagation rather than explicit match blocks where possible to reduce nesting.

Function Design
MUST keep functions focused on a single responsibility.

Limit function arguments to 5 or fewer. Use a configuration struct/builder pattern if more are needed.

Return early to reduce nesting (guard clauses).

Avoid standard library usage in hot loops if a specialized crate (like fastrand vs rand) offers significant performance gains, provided it fits the "Fully Optimized" rule.

Struct and Trait Design
MUST keep structs focused on data representation.

Prefer Composition over Inheritance (Rust does not support inheritance; use Traits).

Derive common traits (Debug, Clone, PartialEq) where it makes semantic sense.

Use the "Newtype" pattern to enforce type safety on primitives (e.g., struct UserId(u64);).

Testing
MUST write unit tests for all new logic using #[test].

MUST place unit tests in a tests module at the bottom of the file (or in tests/ for integration tests).

MUST mock external dependencies (database, API) using traits or libraries like mockall.

NEVER delete files created as part of testing without cleanup.

Follow the Arrange-Act-Assert pattern.

Imports and Dependencies
MUST avoid wildcard imports (use module::*;).

MUST document dependencies in Cargo.toml.

Organize imports: std first, then external crates, then local modules.

Use cargo add and cargo remove to manage dependencies to ensure Cargo.lock stays synced.

Rust Best Practices
MUST use match for exhaustive pattern matching; avoid complex if-else chains for enums.

MUST use clippy to catch common mistakes.

Use iterators and functional chains (map, filter, fold) over explicit for loops when it improves readability and performance.

Use const for values that are known at compile time.

Security
NEVER store secrets, API keys, or passwords in code. Only store them in .env.

Ensure .env is declared in .gitignore.

NEVER log sensitive information (passwords, tokens, PII).

Use dotenvy or config crates to manage environment variables safely.

Version Control
MUST write clear, descriptive commit messages.

NEVER commit commented-out code; delete it.

NEVER commit println! debug statements.

NEVER commit target/ directories (ensure strict .gitignore).

Tools
MUST use rustfmt for code formatting.

MUST use clippy for linting.

Use cargo check for rapid feedback loops.

Before Committing
All tests pass (cargo test).

Linter passes (cargo clippy -- -D warnings).

Code is formatted (cargo fmt).

All public items have documentation.

No unwrap() calls in logic paths.

No hardcoded credentials.

Remember: Prioritize safety (memory safety) and performance (zero-cost abstractions) over cleverness.