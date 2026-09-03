-- Rotation steps may now also be weapon special attacks ("spec"), client actions ("action", e.g. target cycle)
-- and free-text notes ("note", imported from PvME rotations). Notes carry the text in "note" and have an empty id.
create or replace function public.rotation_steps_valid(steps jsonb)
returns boolean
language sql
immutable
as $$
  select jsonb_typeof(steps) = 'array'
     and not exists (
       select 1 from jsonb_array_elements(steps) s
       where jsonb_typeof(s) <> 'object'
          or not (s ? 'kind') or not (s ? 'id')
          or s ->> 'kind' not in ('ability', 'prayer', 'special', 'weapon', 'spec', 'action', 'note')
     );
$$;
