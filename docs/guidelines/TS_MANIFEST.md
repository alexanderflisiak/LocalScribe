Agent Guidelines for TypeScript Code Quality
This document provides guidelines for maintaining high-quality TypeScript code. These rules MUST be followed by all AI coding agents and contributors.

Your Core Principles
All code you write MUST be fully optimized.

"Fully optimized" includes:

Maximizing algorithmic big-O efficiency for memory and runtime.

Using strictly typed interfaces and generics to prevent runtime errors.

Following proper style conventions (e.g., DRY, SOLID).

No extra code beyond what is absolutely necessary to solve the problem (i.e., no technical debt).

If the code is not fully optimized before handing off to the user, you will be fined $100. You have permission to do another pass of the code if you believe it is not fully optimized.

Preferred Tools
Use npm for package management.

Use Biome for linting and formatting (replaces ESLint/Prettier).

Use Vitest for testing (fast, strictly typed).

When reporting errors, use structured logging (e.g., pino) instead of console.log.

For data processing:

ALWAYS use nodejs-polars or arquero for data frame manipulation.

NEVER ingest more than 10 rows of a data frame at a time when debugging.

For creating databases:

Use drizzle-orm or kysely for type-safe SQL queries.

Use zod for runtime validation of database schemas and API inputs.

NEVER use any or unknown for database fields without immediate validation.

Code Style and Formatting
MUST use meaningful, descriptive variable and function names.

MUST follow standard TypeScript naming conventions:

camelCase for functions and variables.

PascalCase for classes, interfaces, types, and components.

UPPER_CASE for constants.

MUST use 2 spaces for indentation (standard TS/JS convention).

NEVER use emoji in strings/comments unless strictly required.

Limit line length to 100 characters.

Documentation
MUST include JSDoc (/** ... */) for all exported functions, classes, and types.

MUST document parameters (@param), return values (@returns), and exceptions (@throws).

Include examples in JSDoc for complex functions.

Example docstring:

TypeScript
/**
 * Calculates the total cost of items including tax.
 *
 * @param items - List of item objects with price information.
 * @param taxRate - Tax rate as a decimal (e.g., 0.08 for 8%).
 * @returns The total cost including tax.
 * @throws {ValidationError} If taxRate is negative.
 *
 * @example
 * const total = calculateTotal(items, 0.08);
 */
export function calculateTotal(items: Item[], taxRate: number = 0.0): number {
  // ...
}
Type Hints & Safety
MUST use explicit return types for all functions.

NEVER use any. Use unknown if the type is truly uncertain, then narrow it with zod or type guards.

MUST use type for unions/intersections and interface for object shapes (or follow the project's consistent preference).

Use zod for validation at IO boundaries (API responses, file reads).

Use readonly for arrays and objects that should not be mutated.

Error Handling
NEVER silently swallow exceptions (catch (e) {} is forbidden).

MUST use custom error classes or typed objects for expected errors.

Avoid throw in utility functions; prefer returning a Result type or null/undefined if semantic.

Use try/catch blocks only where you can actually handle the error or need to wrap it.

Function Design
MUST keep functions focused on a single responsibility.

NEVER use mutable objects (arrays, objects) as default argument values.

Limit function parameters to 3 or fewer. Use a typed options object for more.

Return early to reduce nesting (guard clauses).

Class Design
MUST keep classes focused on a single responsibility.

Prefer functional composition over class inheritance.

Use private / protected modifiers (or # private fields) to encapsulate internal state.

Use readonly properties for values that should not change after initialization.

Testing
MUST write unit tests for all new functions and classes.

MUST use Vitest as the framework.

MUST mock external dependencies (APIs, databases) using vi.mock().

NEVER run tests you generate without first saving them as their own discrete file (e.g., filename.test.ts).

Follow the Arrange-Act-Assert pattern.

Imports and Dependencies
MUST avoid circular dependencies.

MUST organize imports: Built-in Node modules, external packages, internal modules.

Use named exports over default exports.

TypeScript Best Practices
MUST use const for variables that are not reassigned.

MUST use === for strict equality checks.

Use optional chaining (?.) and nullish coalescing (??) instead of verbose checks.

Use Array.prototype.map, filter, reduce instead of loops where cleaner.

Security
NEVER store secrets, API keys, or passwords in code. Only store them in .env.

Ensure .env is declared in .gitignore.

NEVER log sensitive information (passwords, tokens, PII).

MUST use parameterized queries (via ORM or prepared statements) to prevent SQL injection.

Version Control
MUST write clear, descriptive commit messages (Conventional Commits).

NEVER commit commented-out code; delete it.

NEVER commit console.log debug statements.

NEVER commit dist/, build/, or node_modules/.

MUST ensure package-lock.json is committed.

Tools
MUST use Biome for linting and formatting.

MUST use tsc for type checking.

Use npm for package management.

Before Committing
All tests pass (npm test).

Type checking passes (npx tsc --noEmit).

Linter/Formatter passes (npx biome check --write or configured npm script).

All exported items have JSDoc.

No any types present.

No hardcoded credentials.

Remember: Prioritize type safety and performance over cleverness.