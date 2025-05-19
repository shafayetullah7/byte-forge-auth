-- CREATE TABLE "user_local_auth_session" (
-- 	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
-- 	"session_id" uuid NOT NULL,
-- 	"local_auth_id" uuid NOT NULL,
-- 	"created_at" timestamp DEFAULT now() NOT NULL,
-- 	"updated_at" timestamp DEFAULT now() NOT NULL
-- );
-- --> statement-breakpoint
-- ALTER TABLE "user_local_auth_session" ADD CONSTRAINT "user_local_auth_session_session_id_user_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."user_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
-- ALTER TABLE "user_local_auth_session" ADD CONSTRAINT "user_local_auth_session_local_auth_id_user_local_auth_user_id_fk" FOREIGN KEY ("local_auth_id") REFERENCES "public"."user_local_auth"("user_id") ON DELETE no action ON UPDATE no action;


ALTER TABLE "user_sessions" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "user_sessions" ALTER COLUMN "id" SET NOT NULL;