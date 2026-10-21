// Grants dashboard access to an existing Supabase Auth user.
// Usage: npm run operator:add -- someone@example.com
// Create the user first (Supabase dashboard → Authentication → Add user).
import postgres from "postgres";

const email = process.argv[2]?.trim().toLowerCase();
if (!email || !/^[^@\s]+@[^@\s]+$/.test(email)) {
  console.error("Usage: npm run operator:add -- <email>");
  process.exit(1);
}
const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const sql = postgres(url, { max: 1, prepare: false, ssl: /localhost|127\.0\.0\.1/.test(url) ? false : "require" });
try {
  const rows = await sql`
    insert into public.operators (user_id)
    select id from auth.users where lower(email) = ${email}
    on conflict do nothing
    returning user_id`;
  const [exists] = await sql`select 1 from auth.users where lower(email) = ${email}`;
  if (!exists) {
    console.error(`No Supabase Auth user with email ${email}. Create the user first.`);
    process.exitCode = 1;
  } else {
    console.log(rows.length ? `${email} is now an operator.` : `${email} was already an operator.`);
  }
} finally {
  await sql.end();
}
