-- 2주차 2/5 (04.06~04.10) 운동 템플릿
-- MON 2026-04-06
INSERT INTO ddodun.workout_templates (date, day_of_week, section, workout_type, title, description, sort_order) VALUES
('2026-04-06', 'MON', 'A', 'strength', 'Deadlift', E'5 x 5 @ 70%\n* Rest 2:00 b/w sets', 1),
('2026-04-06', 'MON', 'B', 'weightlifting', NULL, E'Every 1:30 for 6 Sets\n1~2 sets, 2 Power Snatch @ 60%\n3~4 sets, 2 Power Snatch @ 65%\n5~6 sets, 2 Power Snatch @ 70%', 2),
('2026-04-06', 'MON', 'C', 'strength', 'Front Squat', E'10 x 3 @ 50%\n* Rest 1:00 b/w sets', 3),
('2026-04-06', 'MON', 'D', 'strength', 'Bench Press', E'3 x 10, Climbing\n* Rest 2:00 b/w sets', 4),
('2026-04-06', 'MON', 'E', 'accessory', 'DB Hex Press', E'4 x 15, Climbing\n* Rest 1:30 b/w sets', 5),
('2026-04-06', 'MON', 'F', 'accessory', NULL, E'3 Sets\n10 Bar Dip\n10 Bench Dip\n20 Banded Tricep Pushdown\n* Rest 2:00 b/w sets', 6),
('2026-04-06', 'MON', 'G', 'cardio', NULL, E'10 Sets\n0:30 Row @ Sprint\n0:30 Rest\n0:30 Ski-erg @ Sprint\n0:30 Rest', 7);

-- TUE 2026-04-07
INSERT INTO ddodun.workout_templates (date, day_of_week, section, workout_type, title, description, sort_order) VALUES
('2026-04-07', 'TUE', 'A', 'strength', 'Back Rack Lunges', E'4 x 10/10, Climbing\n* Rest 0:30 b/w legs\n* Rest 2:00 b/w sets', 1),
('2026-04-07', 'TUE', 'B', 'accessory', NULL, E'3 Sets\n20 steps, Walking Lunges\n20 DB Death March\n* Rest 1:00 b/w sets', 2),
('2026-04-07', 'TUE', 'C', 'metcon', NULL, E'4 rounds For time of :\n400m Run\n20 Pull ups', 3),
('2026-04-07', 'TUE', 'D', 'accessory', NULL, E'3 Sets\n12 Barbell Bent Over Row\n15 EZ Bar Curls\n18 DB Bench Press\n* Rest as needed between sets', 4),
('2026-04-07', 'TUE', 'E', 'metcon', 'AMRAP 5', E'5 Handstand Push ups', 5),
('2026-04-07', 'TUE', 'F', 'metcon', NULL, E'5 Sets\n2 Rope Climbs\n10 Bar Facing Burpees\n50 Double Unders\n* Rest 1:30 b/w sets', 6),
('2026-04-07', 'TUE', 'G', 'accessory', NULL, E'4 Sets\n0:40 Plank on Rings\n0:20 Rest\n0:30 Ring Support Hold\n0:30 Rest\n0:20 Ring Bottom Hold\n1:40 Rest', 7);

-- WED 2026-04-08
INSERT INTO ddodun.workout_templates (date, day_of_week, section, workout_type, title, description, sort_order) VALUES
('2026-04-08', 'WED', 'A', 'metcon', 'EMOM 10', E'Odd, 6~8 Bar Muscle ups\nEven, 15 Wallball 14lb', 1),
('2026-04-08', 'WED', 'B', 'accessory', NULL, E'5 Sets\n0:30 Hollow Rock Hold\n0:30 Rest', 2),
('2026-04-08', 'WED', 'C', 'metcon', NULL, E'4 Sets @ Sprint\n5 Cal Assault Bike\n5 DB(2) Burpees 20lb\n5 Cal Assault Bike\n5 Devil(2) Press 20lb\n* Rest 2:00 b/w sets', 3),
('2026-04-08', 'WED', 'D', 'accessory', NULL, E'3 Sets\n10 DB Hang Power Clean 35lb\n10 DB Farmers Reverse Lunges 35lb\nRest 0:30\n10 Weighted Glute Bridge @ Quality\nRest 1:30', 4),
('2026-04-08', 'WED', 'E', 'accessory', NULL, E'10 Banded Strict Pull ups\n15/15 Single Arm DB Row', 5),
('2026-04-08', 'WED', 'F', 'accessory', NULL, E'20 Alter DB Hammer Curls\n10 Bent Over Barbell Row', 6),
('2026-04-08', 'WED', 'G', 'cardio', NULL, E'6 Sets\n15 Cal Row\n12 Cal Ski-erg\n9 Cal Assault Bike\n* Rest 1:30 b/w sets', 7);

-- THU 2026-04-09
INSERT INTO ddodun.workout_templates (date, day_of_week, section, workout_type, title, description, sort_order) VALUES
('2026-04-09', 'THU', 'A', 'metcon', 'EMOM 40', NULL, 1),
('2026-04-09', 'THU', 'B', 'strength', NULL, E'4 Sets\n8 Hip Thrust\nRest 1:00\n8/8 Barbell Reverse Lunges\n* Rest 0:30 b/w Legs\n* Rest 2:00 b/w Sets', 2),
('2026-04-09', 'THU', 'C', 'accessory', NULL, E'3 Sets\n10 DB Romanian Deadlift\n15 Goblet Squats\n* Rest as needed between sets', 3),
('2026-04-09', 'THU', 'D', 'accessory', NULL, E'3 Sets\n30 Russian Twist\n15 Slow Tuck ups\n* Rest as needed between sets', 4),
('2026-04-09', 'THU', 'E', 'skill', 'Skill', NULL, 5);

-- FRI 2026-04-10
INSERT INTO ddodun.workout_templates (date, day_of_week, section, workout_type, title, description, sort_order) VALUES
('2026-04-10', 'FRI', 'A', 'strength', 'Back Squat', E'10 x 3 @ 80%\nRest 1:00 b/w sets', 1),
('2026-04-10', 'FRI', 'B', 'weightlifting', NULL, E'Power Snatch + Snatch Balance\n3 x (1+2) @ 75%\n1 x (1+1) @ 77%', 2),
('2026-04-10', 'FRI', 'B', 'weightlifting', NULL, E'Rest as needed\nEMOM 5\nPower Clean & Jerk 81%', 3),
('2026-04-10', 'FRI', 'B', 'strength', NULL, E'Rest as needed\nPush Press\n5-3-3-2-1, @ Heavier than Last Week', 4),
('2026-04-10', 'FRI', 'C', 'strength', 'Bench Press', E'12-10-8-6, Climbing\nRest 1:30 b/w sets', 5),
('2026-04-10', 'FRI', 'C', 'strength', NULL, E'1 x Max reps\nBench Press\n@ Light Weight', 6),
('2026-04-10', 'FRI', 'D', 'accessory', NULL, E'3 Sets\n8/8 DB Bulgarian Split Squat\n100ft DB(2) Front Rack Carry\n20 Banded Tricep Pushdown\n4/4 Turkish Get ups\n* Rest as needed', 7),
('2026-04-10', 'FRI', 'E', 'cardio', NULL, E'15 Sets (0:20 On / 0:10 Off)\nAssault Bike', 8)
('2026-04-10', 'FRI', 'F', 'accessory', NULL, E'3 Sets\n20 Heels Over\n15 V ups\n0:30 Hollow Hold\n15 Reverse Hyper\n* Rest as needed', 9);
