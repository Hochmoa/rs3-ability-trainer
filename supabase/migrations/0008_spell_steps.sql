-- Rotation steps may now also be combat spells ({"kind":"spell","id":"vengeance"} – public/data/spells.json ids).
-- The CHECK constraint rotations_steps_shape calls this function, so replacing it is enough.
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
          or s ->> 'kind' not in ('ability', 'prayer', 'special', 'weapon', 'spec', 'action', 'spell', 'note')
     );
$$;
