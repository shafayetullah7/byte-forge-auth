
ALTER TABLE "user_local_auth_session" DROP CONSTRAINT "user_local_auth_session_session_id_user_sessions_id_fk";
--> statement-breakpoint
ALTER TABLE "admin_local_auth_session" DROP CONSTRAINT "admin_local_auth_session_session_id_admin_sessions_id_fk";
--> statement-breakpoint
ALTER TABLE "user_sessions" ADD COLUMN "session_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "admin_sessions" ADD COLUMN "session_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_local_auth_session" ADD CONSTRAINT "user_local_auth_session_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_sessions" ADD CONSTRAINT "admin_sessions_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_local_auth_session" ADD CONSTRAINT "admin_local_auth_session_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_sessions" DROP COLUMN "device_info";--> statement-breakpoint
ALTER TABLE "user_sessions" DROP COLUMN "ip";--> statement-breakpoint
ALTER TABLE "user_sessions" DROP COLUMN "revoked";--> statement-breakpoint
ALTER TABLE "user_sessions" DROP COLUMN "logout_at";--> statement-breakpoint
ALTER TABLE "user_sessions" DROP COLUMN "expires_at";--> statement-breakpoint
ALTER TABLE "admin_sessions" DROP COLUMN "device_info";--> statement-breakpoint
ALTER TABLE "admin_sessions" DROP COLUMN "ip";--> statement-breakpoint
ALTER TABLE "admin_sessions" DROP COLUMN "revoked";--> statement-breakpoint
ALTER TABLE "admin_sessions" DROP COLUMN "logout_at";--> statement-breakpoint
ALTER TABLE "admin_sessions" DROP COLUMN "expires_at";