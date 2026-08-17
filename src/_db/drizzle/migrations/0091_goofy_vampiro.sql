ALTER TABLE "users" ADD COLUMN "email" varchar(255);--> statement-breakpoint

UPDATE users u
SET email = lower(ula.email)
FROM user_local_auth ula
WHERE ula.user_id = u.id
  AND u.email IS NULL;--> statement-breakpoint

ALTER TABLE "users" ADD CONSTRAINT "users_email_unique" UNIQUE("email");--> statement-breakpoint

ALTER TABLE "user_sessions" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "user_sessions" CASCADE;--> statement-breakpoint
ALTER TABLE "user_local_auth" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "user_local_auth" CASCADE;