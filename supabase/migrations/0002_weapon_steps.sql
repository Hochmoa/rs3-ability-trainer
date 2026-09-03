-- Rotations may contain weapon-switch steps ({"kind":"weapon","id":"magic"}).
alter table public.rotations drop constraint rotations_steps_shape;

alter table public.rotations add constraint rotations_steps_shape check (
  not exists (
    select 1 from jsonb_array_elements(steps) s
    where jsonb_typeof(s) <> 'object'
       or not (s ? 'kind') or not (s ? 'id')
       or s ->> 'kind' not in ('ability', 'prayer', 'special', 'weapon')
  )
);
