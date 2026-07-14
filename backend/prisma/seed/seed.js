'use strict';
/**
 * Production seed — runs with plain `node`, no TypeScript toolchain needed.
 * Dependencies: pg + bcryptjs (both in package.json "dependencies").
 * Usage:  node prisma/seed/seed.js
 * Called by: npx prisma db seed  (via package.json "prisma.seed" field)
 *
 * Emission contract (parsed by colossus seed_creds.parse_seed_credentials):
 *   SEED_CREDS_JSON=[{"role":"admin","email":"...","password":"..."}, ...]
 * Keep this line — without it the deployment surfaces no demo credentials.
 *
 * Idempotent: users are upserted by email; demo recipes by a deterministic id
 * derived from (email + title), so re-running yields the same rows.
 */
const { Pool } = require('pg');
const { createHash } = require('crypto');
const bcrypt = require('bcryptjs');

// Deterministic per-email password so re-seeding yields the same working credential.
function derivePassword(email) {
  return createHash('sha256')
    .update(email + (process.env.SEED_SECRET || 'colossus-seed'))
    .digest('hex')
    .slice(0, 16);
}

// Stable UUID-shaped id from a seed string so recipe/user upserts are idempotent.
function deterministicId(seed) {
  const h = createHash('sha256').update(seed).digest('hex');
  return [
    h.slice(0, 8),
    h.slice(8, 12),
    h.slice(12, 16),
    h.slice(16, 20),
    h.slice(20, 32),
  ].join('-');
}

const SEED_USERS = [
  { name: 'Admin Name', email: 'admin@example.com', role: 'admin' },
  { name: 'User Name',  email: 'user@example.com',  role: 'user'  },
];

// Demo recipes attached to the demo user so the admin overview shows counts.
const DEMO_RECIPES = [
  {
    title: 'Banitsa',
    ingredients:
      '500g filo pastry\n400g Bulgarian sirene (white brine cheese)\n4 eggs\n200ml plain yogurt\n120g butter, melted\n1 tsp baking soda',
    steps:
      '1. Whisk eggs, crumbled sirene and yogurt with the baking soda.\n2. Brush each filo sheet with butter, spread the filling and roll loosely.\n3. Coil the rolls into a buttered round pan.\n4. Bake at 180C for 40 minutes until deep golden.\n5. Rest 10 minutes before slicing.',
  },
  {
    title: 'Shopska Salad',
    ingredients:
      '3 ripe tomatoes\n2 cucumbers\n1 roasted red pepper\n1 small onion\n150g sirene, grated\nParsley, red wine vinegar, sunflower oil',
    steps:
      '1. Dice tomatoes, cucumbers, pepper and onion.\n2. Toss with vinegar, oil and salt.\n3. Blanket generously with grated sirene.\n4. Finish with chopped parsley.',
  },
];

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL not set');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const emitted = [];
  const userIdByEmail = {};

  try {
    for (const u of SEED_USERS) {
      const plain = derivePassword(u.email);
      const hashed = bcrypt.hashSync(plain, 10);
      const id = deterministicId(`user:${u.email}`);
      const res = await pool.query(
        `INSERT INTO "User" (id, name, email, password, role, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5::"Role", now(), now())
         ON CONFLICT (email) DO UPDATE
           SET name        = EXCLUDED.name,
               password    = EXCLUDED.password,
               role        = EXCLUDED.role,
               "updatedAt" = now()
         RETURNING id`,
        [id, u.name, u.email, hashed, u.role],
      );
      userIdByEmail[u.email] = res.rows[0].id;
      emitted.push({ role: u.role, email: u.email, password: plain });
    }

    // Attach demo recipes to the regular demo user.
    const demoUserId = userIdByEmail['user@example.com'];
    if (demoUserId) {
      for (const r of DEMO_RECIPES) {
        const rid = deterministicId(`recipe:${demoUserId}:${r.title}`);
        await pool.query(
          `INSERT INTO "Recipe" (id, title, ingredients, steps, "userId", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, now(), now())
           ON CONFLICT (id) DO UPDATE
             SET title        = EXCLUDED.title,
                 ingredients  = EXCLUDED.ingredients,
                 steps        = EXCLUDED.steps,
                 "updatedAt"  = now()`,
          [rid, r.title, r.ingredients, r.steps, demoUserId],
        );
      }
    }

    // Structured form (preferred). Colossus parses this line to surface demo logins.
    console.log(`SEED_CREDS_JSON=${JSON.stringify(emitted)}`);
  } finally {
    await pool.end();
  }
}

main().catch(e => { console.error('Seed failed:', e.message); process.exit(1); });
