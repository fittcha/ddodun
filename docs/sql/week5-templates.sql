-- 1주차 1/5 (03.30~04.03) 운동 템플릿
-- MON 2026-03-30
INSERT INTO ddodun.workout_templates (date, day_of_week, section, workout_type, title, description, sort_order) VALUES
('2026-03-30', 'MON', 'A', 'weightlifting', NULL, E'Every 1:30 for 6 Sets\n1 Power Snatch + 1 Hang Power Snatch\n3 Sets @70-80% of max power snatch\n3 Sets @80-90% of max power snatch', 1),
('2026-03-30', 'MON', 'B', 'strength', 'Back Squat', E'4 x 2 @ 85-90% of max Back Squat\nRest 2:00 b/w sets', 2),
('2026-03-30', 'MON', 'C', 'accessory', NULL, E'3 Sets\n10 Glute Ham Raises\nRest 1:00\n12 DB Bent Over Rows\nRest 2:00', 3),
('2026-03-30', 'MON', 'D', 'metcon', 'For time of :', E'15-12-9-6\nDeadlift 155lb\nBurpee Box Jump Overs 24inch\nBar Muscle ups', 4),
('2026-03-30', 'MON', 'E', 'strength', NULL, E'5 Sets\n10 DB Bench Press\nRest 1:00\n0:30 Max Deficit Push ups\nRest 2:00', 5),
('2026-03-30', 'MON', 'F', 'accessory', NULL, E'3 Sets\n15 Seated DB Lateral Raises\n15 Seated DB Strict Press\n15 Standing DB Front Raises\n15/15 Banded Tricep Kickback\nRest 3:00 b/w sets', 6),
('2026-03-30', 'MON', 'G', 'metcon', 'For time of :', E'40 Cal Row\n* Time Cap 3:00', 7);

-- TUE 2026-03-31
INSERT INTO ddodun.workout_templates (date, day_of_week, section, workout_type, title, description, sort_order) VALUES
('2026-03-31', 'TUE', 'A', 'strength', NULL, E'4 Sets\n15 DB Bench Press\nRest 0:45\n10 Banded Strict Pull ups\nRest 0:45\n30 Hollow Rock\nRest 2:00', 1),
('2026-03-31', 'TUE', 'B', 'metcon', 'AMRAP 15', E'5m Handstand Walk\n15 GHD Sit ups\n5m Handstand Walk\n15 GHD Sit ups\n5 Clean & Jerk 125lb', 2),
('2026-03-31', 'TUE', 'C', 'strength', NULL, E'Accumulate 60 reps in as few sets as possible\nShoulder Press 55lb\n* Rest no more than 0:45 between sets', 3),
('2026-03-31', 'TUE', 'D', 'strength', 'Back Squat', E'3 x 20 @ Light Weight\nRest 2:00 b/w sets', 4),
('2026-03-31', 'TUE', 'E', 'accessory', NULL, E'3 Sets\n12 Back Rack Walking Lunges\n12 DB Death March\nRest 2:00 b/w sets', 5),
('2026-03-31', 'TUE', 'F', 'accessory', NULL, E'3 Sets\n10/10 Seated SA DB Press\n10/10 Side Plank Rotations\n20 Russian Twist\n10 Slow Tuck Up\n* Rest as needed', 6),
('2026-03-31', 'TUE', 'G', 'cardio', NULL, E'3 Sets\n1:00 Assault Bike @ Sprint\nRest 4:00 b/w sets', 7);

-- WED 2026-04-01
INSERT INTO ddodun.workout_templates (date, day_of_week, section, workout_type, title, description, sort_order) VALUES
('2026-04-01', 'WED', 'A', 'weightlifting', 'EMOM 10', E'1 Deadlift\n1 Hang Power Clean\n1 TnG Power Clean\n1 Jerk @ 50-60% of max CNJ', 1),
('2026-04-01', 'WED', 'B', 'strength', NULL, E'3 Sets\n4/4 Barbell Back Rack Reverse Lunges\nRest 1:00\n6/6 KB(2) Front Rack Cossack Squats\nRest 2:00', 2),
('2026-04-01', 'WED', 'C', 'metcon', NULL, E'4 Sets @ High Effort\n25 Double Unders\n5 Wall Walks\n25 Double Unders\n5 Bar Muscle ups\nRest 1:00 b/w sets', 3),
('2026-04-01', 'WED', 'C', 'metcon', NULL, E'Rest 3:00\n4 Sets @ High Effort\n2 Rope Climbs\n6 Single Leg Squats (Left)\n30 Crossover Single Unders\n6 Single Leg Squats (Right)\n2 Rope Climbs\nRest 1:00 b/w sets', 4),
('2026-04-01', 'WED', 'D', 'accessory', NULL, E'5 Sets\n10 Chest Supported Row\nRest 1:00\n15 Cable Lat Pulldown\nRest 2:00', 5),
('2026-04-01', 'WED', 'E', 'accessory', NULL, E'3 Sets\n16 Seated Alter DB Curls\nRest 1:00\n0:30 Max Reps Empty Bar Curls\nRest 2:00', 6),
('2026-04-01', 'WED', 'F', 'metcon', NULL, E'5 Rounds\n(3 Min On / 2 Min Off)\n400m Run\nMax Cal Ski-erg', 7);

-- THU 2026-04-02
INSERT INTO ddodun.workout_templates (date, day_of_week, section, workout_type, title, description, sort_order) VALUES
('2026-04-02', 'THU', 'A', 'metcon', 'EMOM 40', NULL, 1),
('2026-04-02', 'THU', 'B', 'strength', NULL, E'4 Sets\n10 Hip Thrust\nRest 1:00\n10/10 Single Leg DB RDL\n* Rest 0:30 b/w Legs\n* Rest 2:00 b/w Sets', 2),
('2026-04-02', 'THU', 'C', 'metcon', NULL, E'3 Sets\n8/8 DB Bulgarian Split Squat\n100ft KB(2) Front Rack Carry\n20 Banded Tricep Pushdown\n4/4 Turkish Get up', 3),
('2026-04-02', 'THU', 'D', 'metcon', 'EMOM 9', E'0:30 V ups\n0:30 Hollow Rock Hold\n0:30 Elbow Plank Hold', 4),
('2026-04-02', 'THU', 'E', 'skill', 'Skill', NULL, 5);

-- FRI 2026-04-03
INSERT INTO ddodun.workout_templates (date, day_of_week, section, workout_type, title, description, sort_order) VALUES
('2026-04-03', 'FRI', 'A', 'strength', 'Back Squat', E'10 x 3 @ 77%\nRest 1:00 b/w sets', 1),
('2026-04-03', 'FRI', 'B', 'weightlifting', NULL, E'Power Snatch + Snatch Balance\n3 x (1+2) @ 73%\n1 x (1+1) @ 75%', 2),
('2026-04-03', 'FRI', 'B', 'weightlifting', NULL, E'Rest as needed\nEMOM 5\nPower Clean & Jerk 78%', 3),
('2026-04-03', 'FRI', 'B', 'strength', NULL, E'Rest as needed\nPush Press\n5-3-3-2-1, Climbing', 4),
('2026-04-03', 'FRI', 'C', 'accessory', NULL, E'3 Sets\n8/8 DB(2) Farmers Feet Elevated Lunges\n12 Barbell Bent Over Row\n10 EZ Bar Curl\n15 DB Floor Press\n* Rest as needed', 5),
('2026-04-03', 'FRI', 'D', 'accessory', NULL, E'3 Sets\n3~5 Strict Pull ups\n10/10 Crossbody DB Hammer Curls\n15 GHD Back Extension\n10/10 Pallof Press\n* Rest as needed', 6),
('2026-04-03', 'FRI', 'E', 'accessory', NULL, E'3 Sets\n20 Heels Over\n15 V ups\n0:30 Hollow Hold\n15 Reverse Hyper\n* Rest as needed', 7);
