# TigerSpot Rebuild Plan: SvelteKit + SST on AWS

## Overview

Rebuild the Princeton campus geolocation guessing game with modern stack, fixing security issues and adding tournament mode.

**Tech Stack**:

- Frontend/Backend: SvelteKit (SSR + API routes)
- Deployment: SST v3 on AWS (Lambda, S3, RDS PostgreSQL)
- Database: RDS PostgreSQL (via SST)
- Auth: Princeton CAS
- ORM: Drizzle ORM
- Maps: Mapbox GL JS
- Styling: Tailwind CSS

**Data Migration**: Full migration from legacy PostgreSQL (users, scores, streaks, match history)

Make sure to use `pnpm` for package management.

---

## Style

The app should have a colorful, Neobrutalist style design with bold colors and geometric shapes, similar to the legacy app but modernized. Use Tailwind CSS for rapid styling. Allow users to customize their theme color in settings.

There should be some cool animations, use animejs for really cool effects, and svelte transitions for things that are more simple. In general, the game should feel extremely fun and lively.

## 1. Project Structure

```
tigerspot/
├── sst.config.ts              # SST infrastructure definition
├── drizzle.config.ts          # Drizzle ORM config
├── src/
│   ├── app.html
│   ├── hooks.server.ts        # Auth guards, CSRF, security headers
│   ├── lib/
│   │   ├── server/
│   │   │   ├── db/
│   │   │   │   ├── index.ts       # DB connection
│   │   │   │   └── schema.ts      # Drizzle schema
│   │   │   ├── auth/
│   │   │   │   └── cas.ts         # CAS validation
│   │   │   └── services/
│   │   │       ├── daily.ts       # Daily game logic
│   │   │       ├── versus.ts      # Versus mode logic
│   │   │       ├── tournament.ts  # Tournament bracket logic
│   │   │       ├── scoring.ts     # Points calculation
│   │   │       └── images.ts      # S3 image handling
│   │   ├── components/
│   │   │   ├── Map.svelte         # Interactive map
│   │   │   ├── Bracket.svelte     # Tournament bracket view
│   │   │   └── Timer.svelte       # Countdown timer
│   │   └── utils/
│   │       └── distance.ts        # Haversine formula
│   └── routes/
│       ├── +layout.server.ts      # Load user session
│       ├── +page.svelte           # Landing/login
│       ├── menu/+page.svelte      # Main menu
│       ├── game/
│       │   ├── +page.server.ts    # Daily game loader
│       │   └── +page.svelte       # Daily game UI
│       ├── versus/
│       │   ├── +page.svelte       # Challenge lobby
│       │   ├── play/[id]/         # Versus game
│       │   └── results/[id]/      # Versus results
│       ├── tournament/
│       │   ├── +page.svelte       # Tournament list
│       │   ├── [id]/+page.svelte  # Tournament bracket view
│       │   └── play/[id]/         # Tournament game
│       ├── leaderboard/+page.svelte
│       ├── admin/
│       │   ├── +layout.server.ts  # Admin guard
│       │   ├── +page.svelte       # Admin dashboard
│       │   ├── images/            # Image management
│       │   └── tournaments/       # Tournament management
│       └── api/
│           ├── auth/
│           │   ├── login/+server.ts
│           │   ├── callback/+server.ts
│           │   └── logout/+server.ts
│           ├── game/submit/+server.ts
│           ├── versus/
│           ├── tournament/
│           └── admin/
```

---

## 2. Database Schema (Drizzle ORM)

```typescript
// Users table
users = pgTable("users", {
  username: varchar(255).primaryKey(), // Princeton NetID
  totalPoints: integer().default(0),
  isAdmin: boolean().default(false),
  createdAt: timestamp().defaultNow(),
});

// Daily stats (reset daily)
userDaily = pgTable("user_daily", {
  username: varchar(255)
    .primaryKey()
    .references(() => users.username),
  points: integer().default(0),
  distance: integer().default(0),
  played: boolean().default(false),
  lastPlayed: date(),
  currentStreak: integer().default(0),
});

// Pictures with difficulty
pictures = pgTable("pictures", {
  id: serial().primaryKey(),
  s3Key: varchar(512).notNull(), // S3 object key
  latitude: doublePrecision().notNull(),
  longitude: doublePrecision().notNull(),
  placeName: varchar(255).notNull(),
  difficulty: varchar(20).notNull(), // 'easy' | 'medium' | 'hard'
  createdAt: timestamp().defaultNow(),
});

// Versus challenges (same as legacy)
challenges = pgTable("challenges", {
  id: serial().primaryKey(),
  challengerId: varchar(255).references(() => users.username),
  challengeeId: varchar(255).references(() => users.username),
  status: varchar(20).default("pending"), // pending|accepted|declined|completed
  pictureIds: integer().array(), // 5 picture IDs
  challengerPoints: integer().default(0),
  challengeePoints: integer().default(0),
  challengerFinished: boolean().default(false),
  challengeeFinished: boolean().default(false),
  createdAt: timestamp().defaultNow(),
});

// Challenge rounds (normalized from legacy's arrays)
challengeRounds = pgTable("challenge_rounds", {
  id: serial().primaryKey(),
  challengeId: integer().references(() => challenges.id),
  roundNumber: integer().notNull(), // 1-5
  pictureId: integer().references(() => pictures.id),
  challengerSubmitted: boolean().default(false),
  challengeeSubmitted: boolean().default(false),
  challengerPoints: integer(),
  challengeePoints: integer(),
  challengerTime: integer(), // seconds
  challengeeTime: integer(),
});

// Tournaments
tournaments = pgTable("tournaments", {
  id: serial().primaryKey(),
  name: varchar(255).notNull(),
  status: varchar(20).default("open"), // open|in_progress|completed
  difficulty: varchar(20).notNull(), // easy|medium|hard|mixed
  timeLimit: integer().notNull(), // seconds per round
  roundsPerMatch: integer().default(5),
  createdBy: varchar(255).references(() => users.username),
  createdAt: timestamp().defaultNow(),
  startedAt: timestamp(),
});

// Tournament participants
tournamentParticipants = pgTable("tournament_participants", {
  id: serial().primaryKey(),
  tournamentId: integer().references(() => tournaments.id),
  username: varchar(255).references(() => users.username),
  eliminated: boolean().default(false),
  lossCount: integer().default(0), // For double elimination (0, 1, or 2)
  joinedAt: timestamp().defaultNow(),
});

// Tournament matches (bracket structure)
tournamentMatches = pgTable("tournament_matches", {
  id: serial().primaryKey(),
  tournamentId: integer().references(() => tournaments.id),
  bracketType: varchar(20).notNull(), // 'winners' | 'losers' | 'grand_final'
  roundNumber: integer().notNull(),
  matchNumber: integer().notNull(),
  player1Id: varchar(255).references(() => users.username),
  player2Id: varchar(255).references(() => users.username),
  winnerId: varchar(255).references(() => users.username),
  player1Score: integer(),
  player2Score: integer(),
  pictureIds: integer().array(), // Same pictures for both players
  status: varchar(20).default("pending"), // pending|in_progress|completed
  nextMatchId: integer(), // Winner advances to this match
  loserNextMatchId: integer(), // Loser goes here (losers bracket)
});

// Tournament match rounds
tournamentRounds = pgTable("tournament_rounds", {
  id: serial().primaryKey(),
  matchId: integer().references(() => tournamentMatches.id),
  roundNumber: integer().notNull(),
  pictureId: integer().references(() => pictures.id),
  player1Submitted: boolean().default(false),
  player2Submitted: boolean().default(false),
  player1Points: integer(),
  player2Points: integer(),
  player1Time: integer(),
  player2Time: integer(),
});
```

---

## 3. SST Infrastructure (sst.config.ts)

```typescript
export default $config({
  app(input) {
    return {
      name: "tigerspot",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "aws",
      providers: { aws: { region: "us-east-1" } },
    };
  },
  async run() {
    // S3 bucket for images
    const bucket = new sst.aws.Bucket("Images", {
      access: "public",
    });

    // RDS PostgreSQL
    const vpc = new sst.aws.Vpc("Vpc");
    const database = new sst.aws.Postgres("Database", {
      vpc,
      scaling: { min: "0.5 ACU", max: "2 ACU" },
    });

    // SvelteKit app
    const site = new sst.aws.SvelteKit("Site", {
      link: [bucket, database],
      environment: {
        CAS_URL: "https://fed.princeton.edu/cas",
        PUBLIC_BASE_URL: process.env.PUBLIC_BASE_URL,
      },
    });

    return { url: site.url };
  },
});
```

---

## 4. Authentication Flow (Princeton CAS)

```typescript
// src/lib/server/auth/cas.ts
const CAS_URL = "https://fed.princeton.edu/cas";

export async function validateTicket(
  ticket: string,
  serviceUrl: string
): Promise<string | null> {
  const validateUrl = `${CAS_URL}/serviceValidate?ticket=${ticket}&service=${encodeURIComponent(
    serviceUrl
  )}`;
  const response = await fetch(validateUrl);
  const xml = await response.text();

  // Parse XML for <cas:user>netid</cas:user>
  const match = xml.match(/<cas:user>([^<]+)<\/cas:user>/);
  return match ? match[1] : null;
}

export function getLoginUrl(serviceUrl: string): string {
  return `${CAS_URL}/login?service=${encodeURIComponent(serviceUrl)}`;
}

export function getLogoutUrl(serviceUrl: string): string {
  return `${CAS_URL}/logout?service=${encodeURIComponent(serviceUrl)}`;
}
```

**Auth Routes**:

- `GET /api/auth/login` - Redirect to CAS
- `GET /api/auth/callback?ticket=...` - Validate ticket, create session cookie
- `POST /api/auth/logout` - Clear session, redirect to CAS logout

**Session**: Use SvelteKit's `cookies` API with httpOnly secure cookie containing signed JWT or session ID.

---

## 5. Scoring Logic

```typescript
// src/lib/server/services/scoring.ts

// Daily mode: distance only
export function calculateDailyPoints(distanceMeters: number): number {
  if (distanceMeters < 3) return 1500;
  if (distanceMeters < 6) return 1250;
  if (distanceMeters < 10) return 1000;
  return Math.max(0, Math.floor((1 - distanceMeters / 110) * 1000));
}

// Versus/Tournament: distance + time
export function calculateVersusPoints(
  distanceMeters: number,
  timeSeconds: number
): number {
  if (distanceMeters < 10 && timeSeconds < 10) return 1000;
  const distancePoints = Math.max(0, 1 - distanceMeters / 110) * 900;
  const timePoints = Math.max(0, 1 - timeSeconds / 120) * 100;
  return Math.floor(distancePoints + timePoints);
}

// Haversine distance
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  // ... haversine formula returning meters
}
```

---

## 6. Tournament System (Double Elimination)

### Bracket Generation

```typescript
// src/lib/server/services/tournament.ts

export function generateDoubleEliminationBracket(
  playerIds: string[]
): BracketStructure {
  const n = playerIds.length;
  const paddedSize = nextPowerOf2(n); // Round up to power of 2

  // Shuffle players
  const shuffled = shuffle(playerIds);

  // Create winners bracket matches
  const winnersRounds = Math.log2(paddedSize);
  const winnersBracket: Match[][] = [];

  // First round: seed players (with byes for padded slots)
  const firstRound: Match[] = [];
  for (let i = 0; i < paddedSize / 2; i++) {
    firstRound.push({
      player1Id: shuffled[i * 2] || null, // null = bye
      player2Id: shuffled[i * 2 + 1] || null,
      bracketType: "winners",
      roundNumber: 1,
      matchNumber: i + 1,
    });
  }
  winnersBracket.push(firstRound);

  // Create losers bracket (roughly 2x rounds as winners bracket)
  const losersBracket: Match[][] = [];
  // ... losers bracket structure

  // Grand finals (winner of winners vs winner of losers)
  const grandFinal: Match = {
    bracketType: "grand_final",
    roundNumber: 1,
    matchNumber: 1,
  };

  return { winnersBracket, losersBracket, grandFinal };
}
```

### Match Advancement

```typescript
export async function advanceMatch(
  matchId: number,
  winnerId: string
): Promise<void> {
  const match = await getMatch(matchId);
  const loserId =
    match.player1Id === winnerId ? match.player2Id : match.player1Id;

  // Update match
  await updateMatch(matchId, { winnerId, status: "completed" });

  // Winner advances to next match in same bracket
  if (match.nextMatchId) {
    await addPlayerToMatch(match.nextMatchId, winnerId);
  }

  // Loser handling
  if (match.bracketType === "winners") {
    // Move to losers bracket
    await incrementLossCount(match.tournamentId, loserId);
    if (match.loserNextMatchId) {
      await addPlayerToMatch(match.loserNextMatchId, loserId);
    }
  } else if (match.bracketType === "losers") {
    // Eliminated (2nd loss)
    await eliminatePlayer(match.tournamentId, loserId);
  }

  // Check if tournament is complete
  await checkTournamentCompletion(match.tournamentId);
}
```

### Picture Selection Per Round

All players in the same tournament round get the same pictures:

```typescript
export async function generateMatchPictures(
  tournamentId: number,
  difficulty: string,
  count: number = 5
): Promise<number[]> {
  // Get pictures matching difficulty that haven't been used in this tournament
  const usedPictureIds = await getUsedPictureIds(tournamentId);

  const pictures = await db
    .select()
    .from(picturesTable)
    .where(
      and(
        eq(picturesTable.difficulty, difficulty),
        notInArray(picturesTable.id, usedPictureIds)
      )
    )
    .orderBy(sql`RANDOM()`)
    .limit(count);

  return pictures.map((p) => p.id);
}
```

---

## 7. Admin Dashboard

### Features

1. **Image Management**

   - Upload images to S3 with presigned URLs
   - Set coordinates via map click
   - Set place name and difficulty
   - View/edit/delete existing images

2. **Tournament Management**

   - Create tournament (name, difficulty, time limit)
   - View participants (who joined)
   - Start tournament (generates bracket)
   - View live bracket with scores
   - Manual match override (if needed)

3. **Live Tournament View**
   - Polling every 5 seconds for updates
   - Shows all matches, current scores
   - Highlights active matches

### Image Upload Flow

```typescript
// POST /api/admin/images/presign
export async function POST({ request, locals }) {
  if (!locals.user?.isAdmin) throw error(403);

  const { filename, contentType } = await request.json();
  const key = `images/${crypto.randomUUID()}-${filename}`;

  const command = new PutObjectCommand({
    Bucket: Resource.Images.name,
    Key: key,
    ContentType: contentType,
  });

  const presignedUrl = await getSignedUrl(s3Client, command, {
    expiresIn: 300,
  });

  return json({ presignedUrl, key });
}

// POST /api/admin/images
export async function POST({ request, locals }) {
  if (!locals.user?.isAdmin) throw error(403);

  const { s3Key, latitude, longitude, placeName, difficulty } =
    await request.json();

  // Validate inputs
  if (!["easy", "medium", "hard"].includes(difficulty)) {
    throw error(400, "Invalid difficulty");
  }

  await db.insert(pictures).values({
    s3Key,
    latitude,
    longitude,
    placeName,
    difficulty,
  });

  return json({ success: true });
}
```

---

## 8. Security Measures

### hooks.server.ts

```typescript
import { sequence } from "@sveltejs/kit/hooks";

// CSRF protection
const csrf: Handle = async ({ event, resolve }) => {
  if (event.request.method !== "GET") {
    const origin = event.request.headers.get("origin");
    const host = event.request.headers.get("host");
    if (!origin || new URL(origin).host !== host) {
      throw error(403, "CSRF check failed");
    }
  }
  return resolve(event);
};

// Security headers
const securityHeaders: Handle = async ({ event, resolve }) => {
  const response = await resolve(event);
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; img-src 'self' https://*.s3.amazonaws.com; ..."
  );
  return response;
};

// Auth middleware
const auth: Handle = async ({ event, resolve }) => {
  const session = event.cookies.get("session");
  if (session) {
    event.locals.user = await validateSession(session);
  }
  return resolve(event);
};

// Rate limiting (use in-memory or Redis)
const rateLimit: Handle = async ({ event, resolve }) => {
  // Implement rate limiting for API routes
  return resolve(event);
};

export const handle = sequence(csrf, securityHeaders, auth, rateLimit);
```

### Input Validation

```typescript
// Use zod for all API inputs
import { z } from "zod";

const submitGuessSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  pictureId: z.number().int().positive(),
  timeSeconds: z.number().int().min(0).max(300).optional(),
});

// In route handler
const body = submitGuessSchema.parse(await request.json());
```

### Authorization Checks

```typescript
// Always verify user is participant in challenge/match
async function verifyParticipant(challengeId: number, username: string) {
  const challenge = await getChallenge(challengeId);
  if (
    challenge.challengerId !== username &&
    challenge.challengeeId !== username
  ) {
    throw error(403, "Not a participant");
  }
  return challenge;
}
```

---

## 9. API Routes Summary

### Auth

- `GET /api/auth/login` - Redirect to CAS
- `GET /api/auth/callback` - CAS callback
- `POST /api/auth/logout` - Logout

### Daily Game

- `GET /api/game/today` - Get today's picture
- `POST /api/game/submit` - Submit guess

### Versus Mode

- `GET /api/versus/users` - List available opponents
- `GET /api/versus/challenges` - User's challenges
- `POST /api/versus/challenge` - Create challenge
- `POST /api/versus/accept` - Accept challenge
- `POST /api/versus/decline` - Decline challenge
- `POST /api/versus/submit` - Submit round guess
- `GET /api/versus/[id]` - Get challenge state

### Tournament

- `GET /api/tournament` - List tournaments
- `GET /api/tournament/[id]` - Get tournament + bracket
- `POST /api/tournament/[id]/join` - Join tournament
- `POST /api/tournament/[id]/submit` - Submit match guess
- `GET /api/tournament/[id]/poll` - Poll for updates (admin view)

### Admin

- `POST /api/admin/images/presign` - Get S3 presigned URL
- `POST /api/admin/images` - Create image record
- `PUT /api/admin/images/[id]` - Update image
- `DELETE /api/admin/images/[id]` - Delete image
- `POST /api/admin/tournament` - Create tournament
- `POST /api/admin/tournament/[id]/start` - Start tournament
- `POST /api/admin/tournament/[id]/advance` - Manual advance

### Leaderboard

- `GET /api/leaderboard/daily` - Today's top scores
- `GET /api/leaderboard/total` - All-time leaderboard

---

## 10. Mapbox Integration

```svelte
<!-- src/lib/components/Map.svelte -->
<script>
  import mapboxgl from 'mapbox-gl';
  import { onMount, createEventDispatcher } from 'svelte';
  import { PUBLIC_MAPBOX_TOKEN } from '$env/static/public';

  export let readonly = false;
  export let markerPosition = null;

  const dispatch = createEventDispatcher();
  let mapContainer;
  let map;
  let marker;

  // Princeton campus center
  const PRINCETON_CENTER = { lng: -74.6551, lat: 40.3431 };

  onMount(() => {
    mapboxgl.accessToken = PUBLIC_MAPBOX_TOKEN;

    map = new mapboxgl.Map({
      container: mapContainer,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [PRINCETON_CENTER.lng, PRINCETON_CENTER.lat],
      zoom: 16,
    });

    if (!readonly) {
      map.on('click', (e) => {
        const { lng, lat } = e.lngLat;
        setMarker(lng, lat);
        dispatch('select', { longitude: lng, latitude: lat });
      });
    }
  });

  function setMarker(lng, lat) {
    if (marker) marker.remove();
    marker = new mapboxgl.Marker({ color: '#FF0000' })
      .setLngLat([lng, lat])
      .addTo(map);
  }
</script>

<div bind:this={mapContainer} class="w-full h-96 rounded-lg" />
```

**Environment Variables**:

```
PUBLIC_MAPBOX_TOKEN=pk.xxx  # Mapbox public access token
```

---

## 11. Data Migration

### Migration Script

```typescript
// scripts/migrate-legacy.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/lib/server/db/schema";

const legacyDb = postgres(process.env.LEGACY_DATABASE_URL!);
const newDb = drizzle(postgres(process.env.DATABASE_URL!), { schema });

async function migrate() {
  console.log("Starting migration...");

  // 1. Migrate users
  const legacyUsers = await legacyDb`SELECT * FROM users`;
  for (const user of legacyUsers) {
    await newDb
      .insert(schema.users)
      .values({
        username: user.username,
        totalPoints: user.points,
        isAdmin: false, // Set admins manually after migration
      })
      .onConflictDoNothing();
  }
  console.log(`Migrated ${legacyUsers.length} users`);

  // 2. Migrate usersdaily
  const legacyDaily = await legacyDb`SELECT * FROM usersdaily`;
  for (const daily of legacyDaily) {
    await newDb
      .insert(schema.userDaily)
      .values({
        username: daily.username,
        points: daily.points,
        distance: daily.distance,
        played: daily.played,
        lastPlayed: daily.last_played,
        currentStreak: daily.current_streak,
      })
      .onConflictDoNothing();
  }
  console.log(`Migrated ${legacyDaily.length} daily records`);

  // 3. Migrate pictures (need to upload to S3 separately)
  const legacyPictures = await legacyDb`SELECT * FROM pictures`;
  for (const pic of legacyPictures) {
    // Note: Cloudinary URLs stored as s3Key temporarily
    // Run separate script to download from Cloudinary and upload to S3
    await newDb
      .insert(schema.pictures)
      .values({
        id: pic.pictureid,
        s3Key: pic.link, // Will be replaced with S3 key after image migration
        latitude: pic.coordinates[0],
        longitude: pic.coordinates[1],
        placeName: pic.place,
        difficulty: "medium", // Default, admin can recategorize
      })
      .onConflictDoNothing();
  }
  console.log(`Migrated ${legacyPictures.length} pictures`);

  // 4. Migrate completed matches (historical record)
  const legacyMatches = await legacyDb`SELECT * FROM matches`;
  // Store in a legacy_matches table or skip if not needed

  console.log("Migration complete!");
}

migrate().catch(console.error);
```

### Image Migration (Cloudinary to S3)

```typescript
// scripts/migrate-images.ts
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

async function migrateImages() {
  const pictures = await db.select().from(schema.pictures);

  for (const pic of pictures) {
    if (pic.s3Key.startsWith("http")) {
      // Download from Cloudinary
      const response = await fetch(pic.s3Key);
      const buffer = await response.arrayBuffer();

      // Upload to S3
      const key = `images/${pic.id}.jpg`;
      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.IMAGES_BUCKET,
          Key: key,
          Body: Buffer.from(buffer),
          ContentType: "image/jpeg",
        })
      );

      // Update database
      await db
        .update(schema.pictures)
        .set({ s3Key: key })
        .where(eq(schema.pictures.id, pic.id));

      console.log(`Migrated image ${pic.id}`);
    }
  }
}
```

### Post-Migration Steps

1. Run user migration script
2. Run image download/upload script
3. Set admin users: `UPDATE users SET is_admin = true WHERE username IN ('your_netid')`
4. Verify data integrity
5. Update DNS to point to new app

---

## 12. Implementation Phases

### Phase 1: Foundation

1. Initialize SvelteKit project with SST
2. Set up database schema with Drizzle
3. Implement CAS authentication
4. Create basic layout and navigation

### Phase 2: Daily Game (MVP)

1. Image display from S3
2. Interactive map component (Mapbox or Leaflet)
3. Submit guess endpoint
4. Results page with distance/points
5. Daily leaderboard

### Phase 3: Versus Mode

1. User listing and challenge creation
2. Challenge accept/decline flow
3. Versus game play (5 rounds)
4. Results and match history

### Phase 4: Admin Dashboard

1. Admin auth guard
2. Image upload with S3 presigned URLs
3. Image metadata editing (coordinates, difficulty)
4. Image listing and management

### Phase 5: Tournament Mode

1. Tournament creation (admin)
2. Join tournament flow
3. Double elimination bracket generation
4. Tournament match play
5. Live bracket view with polling
6. Winner determination

### Phase 6: Polish

1. Responsive design
2. Error handling and loading states
3. Rate limiting
4. Comprehensive testing
5. Production deployment

---

## Key Files to Reference from Legacy

When implementing, reference these legacy files for business logic:

- `legacy/src/points.py` - Scoring formulas
- `legacy/src/distance_func.py` - Haversine implementation
- `legacy/src/CAS/auth.py` - CAS validation flow
- `legacy/src/Databases/versus_database.py` - Versus scoring with time
- `legacy/src/Databases/challenges_database.py` - Challenge state machine
