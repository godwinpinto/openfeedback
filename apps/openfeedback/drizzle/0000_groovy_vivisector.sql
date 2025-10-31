CREATE TABLE "feedback_form" (
	"form_id" uuid PRIMARY KEY NOT NULL,
	"report_id" uuid NOT NULL,
	"questionnaire_form_data" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_ip" text,
	CONSTRAINT "feedback_form_report_id_unique" UNIQUE("report_id")
);
--> statement-breakpoint
CREATE TABLE "feedback_submission" (
	"submission_id" uuid PRIMARY KEY NOT NULL,
	"form_id" uuid NOT NULL,
	"feedback_response_data" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_ip" text
);
