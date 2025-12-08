# TigerSpot

TigerSpot is an interactive geographical guessing web app. Users will be able to log in to their account, receive a daily photo of a place on campus, and place their guess of where they think it is on the map. After submitting a guess, the location will be revealed and their score will be determined based on how far their guess was to the correct location. Users can only play this mode once a day. However, users can also play the Versus mode where users can compete one on one with their friends with five rounds per game. This is a great way for students to learn about new places on campus and interact more with the Princeton community!

## Tech Stack

- **Frontend:** SvelteKit 5, Tailwind CSS v4, Leaflet.js
- **Backend:** Express.js, TypeScript, Prisma ORM
- **Database:** PostgreSQL 16
- **Monorepo:** pnpm workspaces

## Getting Started

### Prerequisites

- Node.js (LTS)
- pnpm
- Docker (for PostgreSQL)

### Setup

```bash
# Install dependencies
pnpm install

# Start PostgreSQL
pnpm docker:up

# Generate Prisma client & apply migrations
pnpm db:generate
pnpm db:migrate

# Start development servers
pnpm dev
```

The frontend runs on `http://localhost:5173` and the API on `http://localhost:4000`.

### Environment Variables

**Server** (`apps/server/.env`):

```env
PORT=4000
NODE_ENV=development
DATABASE_URL=postgresql://spot:spot_password@localhost:5433/spot_db
JWT_SECRET=your-secret-at-least-32-chars
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
FRONTEND_URL=http://localhost:5173
CAS_SERVICE_URL=http://localhost:4000/api/auth/callback
```

**Frontend** (`apps/frontend/.env`):

```env
VITE_API_URL=http://localhost:4000
```

## Scripts

| Command             | Description                     |
| ------------------- | ------------------------------- |
| `pnpm dev`          | Start both frontend and backend |
| `pnpm dev:server`   | Start backend only              |
| `pnpm dev:client`   | Start frontend only             |
| `pnpm build`        | Build frontend for production   |
| `pnpm check`        | Run TypeScript checks           |
| `pnpm format`       | Format code with Prettier       |
| `pnpm db:studio`    | Open Prisma Studio              |
| `pnpm docker:up`    | Start PostgreSQL container      |
| `pnpm docker:down`  | Stop PostgreSQL container       |
| `pnpm docker:reset` | Reset database                  |

## License

This project is licensed under the BSD-3-Clause License. See the [LICENSE](LICENSE) file for details.
