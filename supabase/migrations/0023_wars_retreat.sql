-- "In War's Retreat": the player's answer on a rotation (src/app/core/models.ts Rotation.warsRetreat). Null means
-- "by the name" (Wars, War's Retreat, Pre-build), true / false is what the player set on the Rotations page. The
-- Train page shows the adrenaline crystal button for rotations played in War's Retreat.

alter table public.rotations add column wars_retreat boolean;
