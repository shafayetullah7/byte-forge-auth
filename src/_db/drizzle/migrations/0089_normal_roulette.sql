CREATE TABLE "admin_registration_pending" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"user_name" varchar(50) NOT NULL,
	"first_name" varchar(50) NOT NULL,
	"last_name" varchar(50) NOT NULL,
	"hashed_password" varchar(255) NOT NULL,
	"hashed_otp" varchar(255) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_registration_pending_email_unique" UNIQUE("email"),
	CONSTRAINT "admin_registration_pending_user_name_unique" UNIQUE("user_name")
);
--> statement-breakpoint
CREATE TABLE "admin_registration_rate_limit" (
	"id" varchar(32) PRIMARY KEY NOT NULL,
	"last_otp_sent_at" timestamp with time zone NOT NULL
);
