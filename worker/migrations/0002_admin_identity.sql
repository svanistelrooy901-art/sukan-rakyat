CREATE TABLE IF NOT EXISTS user_identities (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  email TEXT NOT NULL
);
