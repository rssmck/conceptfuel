-- Add preferred_days to training_plans and loosen days_per_week constraint for 6-7 days

alter table training_plans
  add column if not exists preferred_days text[] default '{}';

-- Widen days_per_week constraint to allow 2-7
alter table training_plans
  drop constraint if exists training_plans_days_per_week_check;

alter table training_plans
  add constraint training_plans_days_per_week_check
  check (days_per_week between 2 and 7);
