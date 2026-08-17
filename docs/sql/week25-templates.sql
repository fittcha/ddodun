-- 8월 3주차 3/5 (08.17~08.21) 운동 템플릿
-- MON 2026-08-17
INSERT INTO ddodun.workout_templates (date, day_of_week, section, workout_type, title, description, sort_order) VALUES
('2026-08-17', 'MON', 'A', 'metcon', 'Test Modified 17.3', E'For reps\nPrior to 8 minutes, 3 rounds of\n6 Chest to bar\n6 Squat Snatch 65lb\nthen 3 rounds of\n7 Chest to bar\n5 Squat Snatch 95lb\nPrior to 12 minutes, 3 rounds of\n8 Chest to bar\n4 Squat Snatches 115lb\nPrior to 16 minutes, 3 rounds of\n9 Chest to bar\n3 Squat Snatch 125lb\nPrior to 20 minutes, 3 rounds of\n10 Chest to bar\n2 Squat Snatch 130lb', 1),
('2026-08-17', 'MON', 'B', 'strength', NULL, E'3 Sets\n12 Alter Front Rack Box Step ups\nRest 1:00\n8 Hip Thrusts back on bench\nRest 2:00', 2),
('2026-08-17', 'MON', 'C', 'accessory', NULL, E'4 Sets\n10 Z Press @ Moderate\nRest 30 seconds\n15 Hollow Rocks\nRest 30 seconds\n15 Bent Over Lateral DB Fly\nRest 30 seconds\n15 DB(2) Romanian Deadlift @ Same Weight (Z Press)\nRest 3:00', 3);

-- TUE 2026-08-18
INSERT INTO ddodun.workout_templates (date, day_of_week, section, workout_type, title, description, sort_order) VALUES
('2026-08-18', 'TUE', 'A', 'strength', 'Front Squat', E'5 x 3, Climbing\n* Try to Find Heavy 3\n* Rest 3:00 b/w sets', 1),
('2026-08-18', 'TUE', 'B', 'metcon', 'For time of :', E'12 Wallball 14lb\n6 DB(2) Burpee Box Step Overs 35lb / 20inch\n6 Cal Row\n24 Wallball 14lb\n12 DB(2) Burpee Box Step Overs 35lb / 20inch\n12 Cal Row\n36 Wallball 14lb\n18 DB(2) Burpee Box Step Overs 35lb / 20inch\n18 Cal Row\n48 Wallball 14lb\n24 DB(2) Burpee Box Step Overs 35lb / 20inch\n24 Cal Row\n* Time Cap 18:00', 2),
('2026-08-18', 'TUE', 'C', 'accessory', NULL, E'3 Sets\n10 Bench Press @ RPE 9\n15 Seated DB Lateral Raises @ RPE 7\n20 Rolling DB Skull Crusher @ Failure', 3);

-- WED 2026-08-19
INSERT INTO ddodun.workout_templates (date, day_of_week, section, workout_type, title, description, sort_order) VALUES
('2026-08-19', 'WED', 'A', 'metcon', NULL, E'For time of :\n3 rounds :\n10 Handstand Push ups\n20 Toes to bar\n2 rounds :\n10 Strict Handstand Push ups (AB)\n5 Rope Climbs\n1 round :\n10 Chest to wall Strict Handstand Push ups\n30 Bar Muscle ups\n* Time Cap 16:00', 1),
('2026-08-19', 'WED', 'B', 'strength', NULL, E'3 Sets\n12 Alter Back Rack Walking Lunges @ RPE 9\nRest 1:00\n15 Goblet Squat @ Heavy\nRest 2:00', 2),
('2026-08-19', 'WED', 'C', 'accessory', 'Weighted Back Extension', E'4 x 12 @ RPE 8\n* Rest no more than 2:00 b/w sets', 3),
('2026-08-19', 'WED', 'D', 'accessory', 'Side Plank Hip Touch', E'3 x 10/10\nRest 1:00 b/w sets', 4);

-- THU 2026-08-20
INSERT INTO ddodun.workout_templates (date, day_of_week, section, workout_type, title, description, sort_order) VALUES
('2026-08-20', 'THU', 'A', 'metcon', 'EMOM 40', NULL, 1),
('2026-08-20', 'THU', 'B', 'strength', 'Deficit Deadlift', E'Build to a tough 5 @ RPE 8', 2),
('2026-08-20', 'THU', 'B', 'strength', NULL, E'— into —\nEMOM 5\n3 Deficit Deadlift @ 80% of Today tough 5', 3),
('2026-08-20', 'THU', 'C', 'accessory', NULL, E'3 Sets\n6~9 Glute Ham Raises\nRest 1:00\n1:00 Husafell Bear Hug Hold @ 150lb\nRest 2:00', 4),
('2026-08-20', 'THU', 'D', 'metcon', NULL, E'For time of :\n21-15-9-15-21\nDB Lateral Burpees\nDB(2) Deadlift 50lb\n* 100ft Farmers Carry b/w Sets', 5);

-- FRI 2026-08-21
INSERT INTO ddodun.workout_templates (date, day_of_week, section, workout_type, title, description, sort_order) VALUES
('2026-08-21', 'FRI', 'A', 'accessory', NULL, E'3 Sets\n12 DB Curls\n+ Right into Max DB Skull Crusher @ Same Weight\n* Rest 2:00 b/w sets', 1),
('2026-08-21', 'FRI', 'B', 'accessory', NULL, E'3 Sets\n12 Cable Tricep Pushdown\n+ Right into Max DB Hammer Curls @ Heavy\n* Rest 2:00 b/w sets', 2),
('2026-08-21', 'FRI', 'C', 'accessory', NULL, E'3 Sets\n12 Rear Delt Fly\n+ Right into Max Lateral Raise @ Same Weight\n* Rest 2:00 b/w sets', 3),
('2026-08-21', 'FRI', 'D', 'metcon', NULL, E'5 rounds for time of :\n10 Cal Row\n15 Shoulder Press 35lb\n20 Bent Over Plate Row 45lb', 4);
