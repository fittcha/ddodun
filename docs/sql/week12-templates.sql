-- 3주차 3/4 (05.18~05.22) 운동 템플릿
-- MON 2026-05-18
INSERT INTO ddodun.workout_templates (date, day_of_week, section, workout_type, title, description, sort_order) VALUES
('2026-05-18', 'MON', 'A', 'weightlifting', NULL, E'3 Sets\nSnatch Pull to Hold\nFloating (3''s Descent) Snatch\nSnatch w/ Pause in Catch\n* Load : ~ 55%\n* Rest 2:00 b/w sets', 1),
('2026-05-18', 'MON', 'A', 'weightlifting', NULL, E'— into —\nSnatch\n* Find Heavy Single', 2),
('2026-05-18', 'MON', 'B', 'weightlifting', NULL, E'Clean & Jerk\n* Find Heavy', 3),
('2026-05-18', 'MON', 'B', 'weightlifting', NULL, E'— into —\nClean Deadlift\n5 x 2 @ 103~113%\n* Rest 2:00 b/w sets', 4),
('2026-05-18', 'MON', 'C', 'strength', 'Back Squat', E'1 x 3 @ 82.5%\n1 x 3 @ 85%\n1 x 2 @ 87.5%\n1 x 3 @ 85%\n1 x 2 @ 88%\n1 x 1 @ 90%\nRest 3:00 b/w sets', 5),
('2026-05-18', 'MON', 'D', 'accessory', NULL, E'3 Sets\n16 Alter DB(2) Box Step Ups\n@ Heavier than Last Week\nRest 1:00\n8 Barbell Hip Thrust\n@ Heavier than Last Week\nRest 2:00', 6),
('2026-05-18', 'MON', 'E', 'metcon', 'EMOM 15', E'10/10 Seated SA DB Press\n10~15 Skull Crusher\n10~15 DB Front Raises\n15~20 Weighted Hollow Rock\n10/10 Single Leg DB RDL', 7),
('2026-05-18', 'MON', 'F', 'metcon', NULL, E'2-2-2-3 Minutes On\n10 Cal Assault Bike\n60 Double Unders\nMax Devil Press 25lb', 8),
('2026-05-18', 'MON', 'G', 'accessory', NULL, E'3 Sets\n0:30 Hollow Rock Hold\n15/15 Side Plank Hip Touch\nRest 1:00 b/w sets', 9);

-- TUE 2026-05-19
INSERT INTO ddodun.workout_templates (date, day_of_week, section, workout_type, title, description, sort_order) VALUES
('2026-05-19', 'TUE', 'A', 'strength', 'EMOM 5', E'Single Back Squat @ 90%', 1),
('2026-05-19', 'TUE', 'B', 'weightlifting', NULL, E'3 Position Snatch w/ Pause in Catch\n4 x (1+1+1) @ 60~65%\n* Hip / Hang / Ground\n* Rest 2:00 b/w sets', 2),
('2026-05-19', 'TUE', 'C', 'weightlifting', NULL, E'Clean Pull to Hold\nFloating Clean\nHip Clean\n4 x (1+1+2) @ 60~65%\n* Rest 2:00 b/w sets', 3),
('2026-05-19', 'TUE', 'D', 'weightlifting', 'Jerk From Behind the Neck', E'5 x 3 @ 65~75%\n* Rest 2:00 b/w sets\n* Pause in the Split on rep "One"', 4),
('2026-05-19', 'TUE', 'E', 'strength', 'Bench Press', E'1 x 5 @ 65%\n1 x 3 @ 75%\n2 x 1 @ 78/80%\n3 x 3 @ 85%\n* Rest 2:00 b/w sets', 5),
('2026-05-19', 'TUE', 'F', 'metcon', NULL, E'6 rounds for time of :\n15 Cal Ski-erg\n10 DB Bench Press 35lb\n5 Bar Muscle ups\n* Rest 1:00 b/w rounds', 6),
('2026-05-19', 'TUE', 'G', 'accessory', NULL, E'3 Sets\n8 DB Tricep Extension\n16 Standing Alter DB Strict Press\n8 DB Curls\n* Rest 2:00 b/w sets\n* Heavier than Last Week', 7),
('2026-05-19', 'TUE', 'H', 'accessory', NULL, E'3 Sets\n10 KB Seal Row\n15 Glute Bridge Floor Press\n10/10 Weighted Suitcase RNT Split Squat\n8/8 Half Kneeling KB Chop to Lift', 8),
('2026-05-19', 'TUE', 'I', 'accessory', NULL, E'3 Sets\nTabata Assault Bike\n8 x 0:20 On / 0:10 Off\n* Rest 3:00 b/w sets', 9);

-- WED 2026-05-20 (원본 THU)
INSERT INTO ddodun.workout_templates (date, day_of_week, section, workout_type, title, description, sort_order) VALUES
('2026-05-20', 'WED', 'A', 'metcon', 'EMOM 40', NULL, 1),
('2026-05-20', 'WED', 'B', 'strength', 'Bench Press', E'1 x 5 @ 65%\n1 x 3 @ 70%\n4 x 1 @ 75/80/90(2)%\n3 x 3 @ 85%\n* Rest 2:00 b/w sets', 2),
('2026-05-20', 'WED', 'C', 'accessory', NULL, E'3 Sets\n6/6 Bulgarian Split Squat\n@ Heavier than Last Week\nRest 1:00\n10/10 SA DB Row\n@ Heavier than Last Week\nRest 2:00', 3),
('2026-05-20', 'WED', 'D', 'accessory', NULL, E'3 Sets\n10/10 Pallof Press\n30 Russian Twists\nRest 1:00 b/w sets', 4),
('2026-05-20', 'WED', 'E', 'metcon', NULL, E'5 Rounds for time of :\n30m Unbroken Farmer''s Carry @ 24kg\n3-6-9-12-15 Burpee Pull ups\n* Time Cap 18:00', 5);

-- THU 2026-05-21 (원본 WED)
INSERT INTO ddodun.workout_templates (date, day_of_week, section, workout_type, title, description, sort_order) VALUES
('2026-05-21', 'THU', 'A', 'metcon', 'EMOM x 6', E'1. 12 DB(2) Front Squat 35lb\n2. 10 Cal Row\n3. 3 Power Clean + 2 Jerks\n4. Rest\n* Start 60% of Max C&J, and add 5~10lb each round', 1),
('2026-05-21', 'THU', 'B', 'strength', NULL, E'4 Sets\n4 Pause Deadlift (2''s at the Knee)\n5 Deadlift @ 60~65%\n* Rest 3:00 b/w sets', 2),
('2026-05-21', 'THU', 'C', 'metcon', NULL, E'4 rounds for time of :\n15 Cal Bike-erg\n12 DB Thruster 35lb\n9 Burpee Box Jump Overs 20inch\n9-7-5-3 Deficit (4") Handstand Push ups', 3),
('2026-05-21', 'THU', 'D', 'skill', NULL, E'Practice Ring Muscle ups', 4),
('2026-05-21', 'THU', 'E', 'strength', NULL, E'4 Sets\n6 Behind the Neck Push Press @ Tough Weight\nRest 0:30\n6~8 Strict Pull ups @ 21x0 Tempo\nRest as needed', 5),
('2026-05-21', 'THU', 'E', 'accessory', NULL, E'— into —\n4 Sets\n10-12 Lying DB Tricep Extensions\nRest 0:30\nAMRAP 0:30 Max Strict Push ups\nRest as needed', 6),
('2026-05-21', 'THU', 'F', 'accessory', NULL, E'3 Sets\n1:00 Chinese Plank Hold\nRest 0:30\n30 GHD Sit ups\nRest 0:30\n1 Rope Climb from Seated on the floor\nRest as needed', 7);

-- FRI 2026-05-22
INSERT INTO ddodun.workout_templates (date, day_of_week, section, workout_type, title, description, sort_order) VALUES
('2026-05-22', 'FRI', 'A', 'weightlifting', NULL, E'Block Snatch Pull to Hold\nHip Snatch\nBlock Snatch\n3 x (1+3+1) @ 55%\n* Rest 2:00 b/w sets', 1),
('2026-05-22', 'FRI', 'B', 'weightlifting', 'EMOM 3', E'Single Block Snatch @ 72%', 2),
('2026-05-22', 'FRI', 'C', 'weightlifting', 'Snatch Pull', E'3 x 2 @ +20lbs from Last Snatch\n* Rest 2:00 b/w sets', 3),
('2026-05-22', 'FRI', 'D', 'strength', NULL, E'Snatch Grip Push Press\nOverhead Squat w/ 3''s Descent\n2 x (2+1) @ 72%\n* Rest as needed b/w sets', 4),
('2026-05-22', 'FRI', 'E', 'strength', 'Back Squat', E'4 x 3 @ 72%\n* Rest No More than 1:30 b/w sets', 5),
('2026-05-22', 'FRI', 'F', 'accessory', NULL, E'3 Sets\n16 Top Down Gorilla Row\n10/10 DB Bulgarian Split Squat\n10/10 Filly Z-Press\n15/15 Side Hip Touch\n* Rest as needed b/w sets', 6),
('2026-05-22', 'FRI', 'G', 'cardio', NULL, E'5 Sets\n(AMRAP 3:00)\n500m Row\nMax Cal Bike-erg\nRest 1:30 b/w sets', 7),
('2026-05-22', 'FRI', 'H', 'accessory', 'EMOM 16', E'1. 0:40 Chinese Plank\n2. 8~10 Weighted Knee Raises\n* Dip Bar Support Hold\n3. 0:25 Copenhagen Plank (Left)\n4. 0:25 Copenhagen Plank (Right)', 8);
