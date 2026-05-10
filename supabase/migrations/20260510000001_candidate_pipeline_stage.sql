-- Add pipeline_stage to sourcing_candidates for kanban pipeline view
alter table public.sourcing_candidates
  add column if not exists pipeline_stage text not null default 'applied'
  check (pipeline_stage in ('applied', 'screening', 'interview', 'offer', 'hired', 'rejected'));

comment on column public.sourcing_candidates.pipeline_stage is
  'Recruiting pipeline stage for kanban view';
