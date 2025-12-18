# Contributing to BastionAuth

Thank you for your interest in contributing to BastionAuth! This document provides guidelines and instructions for contributing.

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 8+
- Docker & Docker Compose
- Git

### Setup Development Environment

```bash
# Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/bastionauth.git
cd bastionauth

# Install dependencies
pnpm install

# Start Docker services
pnpm docker:up

# Setup database
pnpm db:generate
pnpm db:migrate

# Start development
pnpm dev
```

## Development Workflow

### Branch Naming

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Adding or updating tests

Examples:
- `feature/passkey-support`
- `fix/session-expiry-bug`
- `docs/api-reference-update`

### Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Formatting (no code change)
- `refactor` - Code refactoring
- `test` - Adding tests
- `chore` - Maintenance

**Examples:**
```
feat(auth): add passkey authentication support

fix(server): handle expired refresh tokens correctly

docs(readme): update installation instructions
```

### Pull Requests

1. Create a new branch from `main`
2. Make your changes
3. Write/update tests
4. Update documentation if needed
5. Run linting and tests
6. Submit a pull request

**PR Title Format:**
```
[type]: Brief description
```

**PR Description Template:**
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
Describe testing done

## Checklist
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] Linting passes
- [ ] All tests pass
```

## Code Style

### TypeScript

- Use strict TypeScript
- Prefer interfaces over types for objects
- Use explicit return types for public functions
- Document public APIs with JSDoc

```typescript
/**
 * Hashes a password using Argon2id
 * @param password - The plain text password
 * @returns The hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  // Implementation
}
```

### File Organization

```
src/
├── index.ts          # Package exports
├── types/            # TypeScript types
├── utils/            # Utility functions
├── services/         # Business logic
├── middleware/       # Middleware functions
└── routes/           # API routes
```

### Naming Conventions

- **Files**: `kebab-case.ts`
- **Classes**: `PascalCase`
- **Functions/Variables**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Types/Interfaces**: `PascalCase`

## Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run tests in watch mode
pnpm test:watch

# Run E2E tests
pnpm test:e2e
```

### Writing Tests

- Test files should be in `tests/` or alongside source files with `.test.ts`
- Use descriptive test names
- Follow the AAA pattern (Arrange, Act, Assert)

```typescript
describe('hashPassword', () => {
  it('should hash a password using Argon2id', async () => {
    // Arrange
    const password = 'SecurePassword123!';
    
    // Act
    const hash = await hashPassword(password);
    
    // Assert
    expect(hash).toMatch(/^\$argon2/);
  });
});
```

### E2E Tests

E2E tests use Playwright and should cover critical user flows:

```typescript
test('should sign in with valid credentials', async ({ page }) => {
  await page.goto('/sign-in');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');
  
  await expect(page).toHaveURL('/dashboard');
});
```

## Documentation

### Code Documentation

- Document all public APIs
- Include examples in JSDoc
- Keep documentation up to date

### Documentation Files

- Update README for significant changes
- Add guides for new features
- Update API reference for endpoint changes

## Security

### Reporting Vulnerabilities

**DO NOT** open public issues for security vulnerabilities.

Email security concerns to: security@bastionauth.dev

### Security Guidelines

- Never commit secrets or keys
- Use parameterized queries
- Validate all inputs
- Follow the principle of least privilege
- Review security implications of changes

## Release Process

1. Update version numbers
2. Update CHANGELOG.md
3. Create release PR
4. After merge, tag release
5. CI/CD handles publishing

## Getting Help

- [GitHub Discussions](https://github.com/bastionauth/bastionauth/discussions) - General questions
- [GitHub Issues](https://github.com/bastionauth/bastionauth/issues) - Bug reports
- [Discord](https://discord.gg/bastionauth) - Community chat

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

