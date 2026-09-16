# Monorepo Starter

A full-stack monorepo starter using **pnpm, Turborepo, Next.js, Node.js, and TypeScript**.

## Stack

- Next.js — frontend
- Node.js + TypeScript — API
- pnpm — package manager
- Turborepo — monorepo task runner
- Shared packages — reusable code

## Project Structure

```text
monorepo/
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # Node.js API
│
├── packages/
│   └── utils/        # Shared utilities
│
├── .gitignore
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
````

## 1. Clone

```bash
git clone git@github.com:rajesh-kayal-dev/orderly.git <project-name>
cd <project-name>
```

If you are using this repository as a template, you can skip the clone command.

## 2. Install

Make sure you have **Node.js** and **pnpm** installed.

Then run:

```bash
pnpm install
```

## 3. Rename the Project

Change the project name in these files:

```text
package.json
apps/web/package.json
apps/api/package.json
packages/utils/package.json
```

Example:

```json
"name": "my-project"
```

For scoped packages, update:

```text
@orderly/utils
@orderly/gateway
```

to your project name if needed.

## 4. Environment Variables

Create environment files only where your project needs them.

```text
apps/
├── web/
│   └── .env.local
│
└── api/
    └── .env
```

Do not commit real `.env` files.

## 5. Start Development

From the **root folder**:

```bash
pnpm dev
```

This starts:

```text
Web → http://localhost:3000
API → http://localhost:5000
```

The shared `utils` package also runs in watch mode.

## 6. Build

Build everything:

```bash
pnpm build
```

Turborepo will build the packages and apps in the correct order.

## Useful Commands

Start everything:

```bash
pnpm dev
```

Build everything:

```bash
pnpm build
```

Run only the web app:

```bash
pnpm --filter web dev
```

Run only the API:

```bash
pnpm --filter @orderly/gateway dev
```

Add a package to the web app:

```bash
pnpm --filter web add <package>
```

Add a package to the API:

```bash
pnpm --filter @orderly/gateway add <package>
```

Add a development package:

```bash
pnpm --filter web add -D <package>
```

## Where to Write Code

### Frontend

```text
apps/web/
```

Use this for your Next.js application.

### Backend

```text
apps/api/
```

Use this for your Node.js API.

### Shared Code

```text
packages/utils/
```

Use this for code that needs to be shared between apps.

## Start a New Project

After cloning this starter:

```text
1. Clone the repository
2. Rename package names
3. Remove the old project code
4. Add your environment variables
5. Run pnpm install
6. Run pnpm dev
7. Start building
```

That's it.