CREATE TABLE "clubs" (
	"code" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"abbreviated_name" text,
	"editorial_name" text,
	"tv_code" text,
	"crest_url" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "games" (
	"season_code" text NOT NULL,
	"game_code" integer NOT NULL,
	"round" smallint NOT NULL,
	"phase" text NOT NULL,
	"utc_date" timestamp with time zone NOT NULL,
	"home_club_code" text NOT NULL,
	"away_club_code" text NOT NULL,
	"home_score" smallint NOT NULL,
	"away_score" smallint NOT NULL,
	"home_partials" integer[],
	"away_partials" integer[],
	"played" boolean NOT NULL,
	"venue_name" text,
	"audience" integer,
	"box_score_synced_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "games_season_code_game_code_pk" PRIMARY KEY("season_code","game_code")
);
--> statement-breakpoint
CREATE TABLE "people" (
	"code" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"jersey_name" text,
	"country_code" text,
	"country_name" text,
	"height_cm" smallint,
	"weight_kg" smallint,
	"birth_date" date,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "player_game_stats" (
	"season_code" text NOT NULL,
	"game_code" integer NOT NULL,
	"person_code" text NOT NULL,
	"club_code" text NOT NULL,
	"is_home" boolean NOT NULL,
	"started" boolean NOT NULL,
	"dorsal" smallint,
	"seconds" integer NOT NULL,
	"points" smallint NOT NULL,
	"fg2_made" smallint NOT NULL,
	"fg2_att" smallint NOT NULL,
	"fg3_made" smallint NOT NULL,
	"fg3_att" smallint NOT NULL,
	"ft_made" smallint NOT NULL,
	"ft_att" smallint NOT NULL,
	"oreb" smallint NOT NULL,
	"dreb" smallint NOT NULL,
	"reb" smallint NOT NULL,
	"ast" smallint NOT NULL,
	"stl" smallint NOT NULL,
	"tov" smallint NOT NULL,
	"blk" smallint NOT NULL,
	"blk_against" smallint NOT NULL,
	"fouls_committed" smallint NOT NULL,
	"fouls_drawn" smallint NOT NULL,
	"plus_minus" smallint NOT NULL,
	"pir" smallint NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "player_game_stats_season_code_game_code_person_code_pk" PRIMARY KEY("season_code","game_code","person_code")
);
--> statement-breakpoint
CREATE TABLE "roster_stints" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "roster_stints_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"season_code" text NOT NULL,
	"club_code" text NOT NULL,
	"person_code" text NOT NULL,
	"role" text NOT NULL,
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"active" boolean NOT NULL,
	"dorsal" text,
	"position" smallint,
	"image_url" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "roster_stints_contract_key" UNIQUE NULLS NOT DISTINCT("season_code","club_code","person_code","role","start_date")
);
--> statement-breakpoint
CREATE TABLE "sync_runs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "sync_runs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"status" text NOT NULL,
	"games_synced" integer DEFAULT 0 NOT NULL,
	"box_scores_failed" integer DEFAULT 0 NOT NULL,
	"error" text
);
--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_home_club_code_clubs_code_fk" FOREIGN KEY ("home_club_code") REFERENCES "public"."clubs"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_away_club_code_clubs_code_fk" FOREIGN KEY ("away_club_code") REFERENCES "public"."clubs"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_game_stats" ADD CONSTRAINT "player_game_stats_person_code_people_code_fk" FOREIGN KEY ("person_code") REFERENCES "public"."people"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_game_stats" ADD CONSTRAINT "player_game_stats_club_code_clubs_code_fk" FOREIGN KEY ("club_code") REFERENCES "public"."clubs"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_game_stats" ADD CONSTRAINT "player_game_stats_game_fk" FOREIGN KEY ("season_code","game_code") REFERENCES "public"."games"("season_code","game_code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roster_stints" ADD CONSTRAINT "roster_stints_club_code_clubs_code_fk" FOREIGN KEY ("club_code") REFERENCES "public"."clubs"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roster_stints" ADD CONSTRAINT "roster_stints_person_code_people_code_fk" FOREIGN KEY ("person_code") REFERENCES "public"."people"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "games_season_date_idx" ON "games" USING btree ("season_code","utc_date");--> statement-breakpoint
CREATE INDEX "games_home_club_idx" ON "games" USING btree ("home_club_code");--> statement-breakpoint
CREATE INDEX "games_away_club_idx" ON "games" USING btree ("away_club_code");--> statement-breakpoint
CREATE INDEX "player_game_stats_person_idx" ON "player_game_stats" USING btree ("person_code","season_code");--> statement-breakpoint
CREATE INDEX "player_game_stats_club_idx" ON "player_game_stats" USING btree ("club_code","season_code");--> statement-breakpoint
CREATE INDEX "roster_stints_person_idx" ON "roster_stints" USING btree ("person_code","start_date");--> statement-breakpoint
CREATE INDEX "roster_stints_club_season_idx" ON "roster_stints" USING btree ("club_code","season_code");