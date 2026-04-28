-- ============================================================
-- Grand Line Chronicles — Seed Data
-- Run AFTER 001_schema.sql
-- ============================================================
 
-- ============================================================
-- CHARACTERS
-- ============================================================
insert into public.characters (name, role, class_bonus, bonus_type, bonus_pct, unlock_arc, avatar_emoji, sort_order) values
  ('Luffy',  'Captain',       '+15% Power from Training tasks',   'training',   15, 1,  '🍖', 1),
  ('Zoro',   'Swordsman',     '+20% Power from Study tasks',      'study',      20, 1,  '⚔️', 2),
  ('Nami',   'Navigator',     '+15% Bounty from Review tasks',    'review',     15, 1,  '🗺️', 3),
  ('Usopp', 'Sniper',        '+15% Bounty from Creation tasks',  'creation',   15, 3,  '🎯', 4),
  ('Sanji',  'Cook',          '+20% Bounty from Immersion tasks', 'immersion',  20, 4,  '🍳', 5),
  ('Chopper','Doctor',        '+10% to all stats',                'all',        10, 7,  '🦌', 6),
  ('Robin',  'Archaeologist', '+15% Power from Study tasks',      'study',      15, 8,  '📚', 7),
  ('Franky', 'Shipwright',    '+20% Power from Creation tasks',   'creation',   20, 10, '🤖', 8),
  ('Brook',  'Musician',      '+20% Bounty from Immersion tasks', 'immersion',  20, 11, '💀', 9),
  ('Jinbe',  'Helmsman',      '+10% to all stats',                'all',        10, 17, '🐋', 10);
 
-- ============================================================
-- ARCS
-- xp_required = total party XP needed to fill arc progress bar
-- Scaled so ~2 players at full weekly budget (600 XP/week) complete each arc
-- in its target duration
-- ============================================================
insert into public.arcs (arc_number, arc_order, name, location, boss_name, boss_hp_base, duration_weeks, xp_required, power_required, bounty_required, hidden, flavor_text) values
 
-- === EAST BLUE ===
(1,  1,  'Romance Dawn',    'Foosha Village → Shells Town',  'Captain Morgan',    300, 2,  800,   50,  30,  false,
 'A boy with a straw hat sets out to sea. The journey of a lifetime begins with a single step off the shore.'),
 
(2,  2,  'Orange Town',     'Orange Town',                    'Buggy the Clown',   300, 2,  900,   80,  60,  false,
 'A clown pirate terrorizes a coastal town. The crew grows — and so does the trouble.'),
 
(3,  3,  'Syrup Village',   'Syrup Village',                  'Captain Kuro',      300, 2,  900,   110, 90,  false,
 'A long-nosed dreamer joins the crew. His lies might just save everyone.'),
 
(4,  4,  'Baratie',         'Baratie Restaurant',             'Don Krieg',         400, 2,  1000,  150, 120, false,
 'A sea restaurant, a cook who kicks, and the ghost of a legend. The crew finds its heart.'),
 
(5,  5,  'Arlong Park',     'Cocoyasi Village',               'Arlong',            400, 3,  1400,  200, 180, false,
 'A navigator''s painful past is finally put to rest. Nothing can hold back the tide.'),
 
(6,  6,  'Loguetown',       'Loguetown → Reverse Mountain',   null,                0,   2,  800,   230, 210, false,
 'The town where a legend was born and died. The Grand Line lies just beyond the mist.'),
 
-- === GRAND LINE PART 1 (PARADISE) ===
(7,  7,  'Little Garden & Drum Island', 'Whisky Peak → Little Garden → Drum Island', 'Wapol', 500, 3, 1500, 280, 260, false,
 'Giants, dinosaurs, and a reindeer doctor. The Grand Line wastes no time proving it is unlike anything before.'),
 
(8,  8,  'Alabasta',        'Alabasta Kingdom',               'Crocodile',         500, 4,  2200,  370, 350, false,
 'A kingdom on the brink of civil war. A princess fights for her people. A Warlord lurks in the sand.'),
 
(9,  9,  'Skypiea',         'Jaya → Skypiea',                 'Enel',              500, 4,  2200,  460, 460, false,
 'An island in the sky, a god with lightning, and a bell that echoes across history.'),
 
(10, 10, 'Water 7 & Enies Lobby', 'Water 7 → Enies Lobby',   'Rob Lucci',         600, 5,  3000,  600, 580, false,
 'Betrayal, a ship''s farewell, and a declaration of war against the World Government. We are not letting Robin go.'),
 
(11, 11, 'Thriller Bark',   'Thriller Bark',                  'Gecko Moria',       600, 3,  1800,  680, 650, false,
 'A skeleton, a massive ghost ship, and shadows stolen in the night. A musician finally finds his crew.'),
 
(12, 12, 'Sabaody & Impel Down', 'Sabaody Archipelago → Amazon Lily → Impel Down', null, 0, 3, 1800, 740, 710, false,
 'The gates of the New World. A shattering defeat. A prison break. Everything changes.'),
 
(13, 13, 'Marineford',      'Marineford',                     'Admiral Akainu',    700, 3,  2000,  820, 790, false,
 'The war that shook the world. The cost of reaching for what matters most.'),
 
(14, 14, 'Fish-Man Island', 'Fish-Man Island',                'Hody Jones',        600, 2,  1200,  870, 850, false,
 'Beneath the waves lies a kingdom of dreams and old hatred. Luffy punches an entire ocean.'),
 
-- === NEW WORLD ===
(15, 15, 'Punk Hazard & Dressrosa', 'Punk Hazard → Dressrosa', 'Donquixote Doflamingo', 700, 5, 3500, 1050, 1020, false,
 'A burning island, a frozen island, a birdcage, and a toy soldier''s long wait. The Warlord falls.'),
 
(16, 16, 'Whole Cake Island', 'Zou → Whole Cake Island',      'Big Mom',           800, 4,  3000,  1200, 1180, false,
 'A wedding cake soaked in chaos. The cook who always came back makes the hardest choice of his life.'),
 
(17, 17, 'Wano Country',   'Wano Country',                   'Kaido',             900, 5,  4000,  1400, 1380, false,
 'The land of samurai, sealed from the world. The greatest battle the crew has ever faced awaits.'),
 
-- === FINAL ARC — HIDDEN ===
(18, 18, '???',             '??? — The Final Island',         null,                0,   3,  2500,  1500, 1500, true,
 'The answer to everything. The end of the road. Unlock after completing Wano.');