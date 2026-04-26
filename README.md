# CS Calculator

React, TypeScript, and Vite starter for the Civil Service calculator alpha.

## Why this setup

- React gives us a flexible component model for turning spreadsheet steps into a guided interface.
- Vite keeps the frontend toolchain lightweight and fast for local iteration.
- TypeScript helps us move spreadsheet rules into explicit, testable logic.
- Yarn is still a reasonable choice. I configured the project to use Yarn's `node-modules` linker for a low-friction setup.

## Run it

On a standard Node installation with Yarn available:

```bash
yarn install
yarn dev
```

If your machine has Corepack rather than Yarn preinstalled:

```bash
corepack enable
corepack prepare yarn@stable --activate
yarn install
yarn dev
```

## Run tests

Use the Yarn scripts from the project root:

```bash
yarn test
yarn test:coverage
yarn test:watch
```

## Current limitation in this workspace

The Codex runtime available in this session exposes `node`, but not `npm`, `corepack`, or `yarn`, so I couldn't install dependencies or generate a lockfile from inside this environment.

## Suggested next step

Map the spreadsheet into:

1. input fields and decision points
2. calculation rules
3. a results summary
