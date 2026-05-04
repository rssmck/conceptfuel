-- ============================================================
-- Make athlete_id nullable in planning tables
-- Run AFTER provisional-athletes.sql
-- ============================================================
-- Provisional athlete records use provisional_athlete_id instead
-- of athlete_id. These columns must be nullable to allow that.
-- The check constraint ensures at least one reference is always set.
-- ============================================================

alter table season_phases    alter column athlete_id drop not null;
alter table competitions     alter column athlete_id drop not null;
alter table training_sessions alter column athlete_id drop not null;
alter table personal_bests   alter column athlete_id drop not null;
alter table results          alter column athlete_id drop not null;

alter table season_phases add constraint season_phases_athlete_check
  check (athlete_id is not null or provisional_athlete_id is not null);

alter table competitions add constraint competitions_athlete_check
  check (athlete_id is not null or provisional_athlete_id is not null);
