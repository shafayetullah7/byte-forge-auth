CREATE TABLE "user_identities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auth_sub" uuid NOT NULL,
	"local_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_identities" ADD CONSTRAINT "user_identities_local_user_id_users_id_fk" FOREIGN KEY ("local_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_identities_auth_sub_unique" ON "user_identities" USING btree ("auth_sub");--> statement-breakpoint
CREATE UNIQUE INDEX "user_identities_local_user_id_unique" ON "user_identities" USING btree ("local_user_id");