# Repository Guidelines

菜包 (CaiBao) is a desktop AI chat client built with **Electron 34 + Rspack + React 18 + TypeScript**, compatible with the OpenAI API format. State is managed with Zustand; chat rendering uses react-markdown.

## Project Structure & Module Organization

```
src/
├── main/        # Electron main process — IPC handlers, storage/settings services
├── preload/     # Preload scripts bridging main ↔ renderer
├── renderer/    # React UI — components, pages, stores, services, styles
└── shared/      # Types, configs, and IPC contracts shared across processes
```

- **Build output** → `dist/`; **packaged installers** → `release/`.
- **Scripts** (`scripts/`) handle macOS ad-hoc signing and Gatekeeper fixes.
- Path aliases: `@/*` resolves to `src/*`, `@shared/*` to `src/shared/*`.

## Build, Test, and Development Commands

| Command | Description |
|---|---|
| `npm run dev` | Launches renderer dev server (port 5173), main/preload watchers, and Electron |
| `npm run build` | Production build for main, preload, and renderer |
| `npm run dist:mac` | Build + package macOS `.dmg` (arm64) with ad-hoc signing |
| `npm run lint` | ESLint on all `src/**/*.{ts,tsx}` |
| `npm run format` | Prettier format on `src/**/*.{ts,tsx,css}` |

## Coding Style & Naming Conventions

- **Formatter**: Prettier — single quotes, trailing commas, 100-char width, semicolons.
- **Linter**: ESLint with `@typescript-eslint`, `react`, and `react-hooks` plugins.
- **TypeScript**: strict mode, `ES2022` target, `bundler` module resolution.
- **File naming**: kebab-case (e.g., `chat-store.ts`, `provider-service.ts`).
- **Components**: PascalCase (e.g., `MessageBubble.tsx`, `Composer.tsx`).
- Unused parameters: prefix with `_` to satisfy `@typescript-eslint/no-unused-vars`.

## Testing Guidelines

There is no automated test suite. Validation relies on the **manual E2E checklist** in `TESTING.md`, covering provider setup, conversation management, streaming output, and UI interactions. Run through the checklist before shipping releases.

## Commit & Pull Request Guidelines

- Write imperative, lowercase commit messages (e.g., `add model select component`).
- Keep commits focused — one logical change per commit.
- PRs should describe the change, reference any related issue, and include screenshots for UI changes.

## Configuration & Security

- API keys and provider settings are stored locally in `userData/caibao/` — never commit secrets.
- `.env` files are gitignored; use them for local development overrides only.
- macOS distribution requires ad-hoc signing (`npm run dist:mac`); formal release needs Apple Developer ID + notarization.
