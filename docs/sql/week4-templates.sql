-- 4주차 4/4 (03.23~03.27) 운동 템플릿
-- MON 2026-03-23
INSERT INTO ddodun.workout_templates (date, day_of_week, section, workout_type, title, description, sort_order) VALUES
('2026-03-23', 'MON', 'A', 'weightlifting', NULL, E'Every 1:30 for 6 Sets\n3 Position Power Snatch @ 75%\n* Hang / Low Hang / Floor', 1),
('2026-03-23', 'MON', 'B', 'strength', 'Back Squat', E'4 x 6 @ 75%\nRest 2:00 b/w Sets', 2),
('2026-03-23', 'MON', 'C', 'strength', NULL, E'5 Sets\n3 Bench Press @ 85%\nRest 3:00 b/w sets', 3),
('2026-03-23', 'MON', 'D', 'accessory', NULL, E'3 Sets\n5 Glute Ham Raises\nRest 1:00\n10 Pendaly Row\nRest 2:00', 4),
('2026-03-23', 'MON', 'E', 'metcon', 'For time of :', E'30 Bar Muscle ups\n60 Cal Row\n* Whenever Break BMU, Perform 10 Burpee Over the Rower', 5),
('2026-03-23', 'MON', 'F', 'accessory', NULL, E'4 Sets\n10 Weighted Hanging Knee Raises\n20 Weighted Russian Twist\n0:30 GHD Ab Hold\n* Rest 1:30 b/w sets', 6),
('2026-03-23', 'MON', 'G', 'cardio', 'Row Interval', NULL, 7);

-- TUE 2026-03-24
INSERT INTO ddodun.workout_templates (date, day_of_week, section, workout_type, title, description, sort_order) VALUES
('2026-03-24', 'TUE', 'A', 'strength', NULL, E'4 Sets\n12 Bench Press, Climbing\nRest 0:45\n10 Banded Strict Pull ups\nRest 0:45\n14 V ups\nRest 2:00', 1),
('2026-03-24', 'TUE', 'B', 'metcon', 'AMRAP 12', E'10 GHD Sit ups\n10 Shoulder to Overhead 65lb\n5m x 2 Overhead Lunges 65lb', 2),
('2026-03-24', 'TUE', 'C', 'metcon', NULL, E'4 Sets\n30m D-Ball Bear Hug Carry @ 40kg\nRest 0:45\n60m KB(2) Farmers Carry @ 24kg\nRest 1:30', 3),
('2026-03-24', 'TUE', 'D', 'metcon', 'AMRAP 12', E'12 Cal Ski-erg\n12 Russian KBS 32kg', 4),
('2026-03-24', 'TUE', 'E', 'cardio', NULL, E'5 Sets\n0:30 Max Cal Assault Bike\nRest 1:30', 5);

-- WED 2026-03-25
INSERT INTO ddodun.workout_templates (date, day_of_week, section, workout_type, title, description, sort_order) VALUES
('2026-03-25', 'WED', 'A', 'weightlifting', 'EMOM 10', E'2 TnG Power Clean\n1 Hang Clean\n1 Jerk @ 60%', 1),
('2026-03-25', 'WED', 'B', 'strength', NULL, E'4 Sets\n12 Alter Back Rack Barbell Reverse Lunges\nRest 1:00\n12 Alter DB Front Rack Cossack Squats\nRest 2:00', 2),
('2026-03-25', 'WED', 'C', 'metcon', NULL, E'4 Sets\n40 Double Unders\n2 Wall Walks\n6 Toes to bar\n2 Bar Muscle ups\nRest 1:00 b/w sets', 3),
('2026-03-25', 'WED', 'C', 'metcon', NULL, E'Rest 3:00\n4 Sets\n10 Box Jump & Step Down 24inch\n3 Strict Handstand Push ups (AB)\n6 Kipping Handstand Push ups (AB)\n1 Rope Climb\nRest 1:00 b/w sets', 4),
('2026-03-25', 'WED', 'D', 'metcon', NULL, E'4 Sets\n75 Unbroken Double Unders\n2:00 Recovery Bike Erg\n* No Rest b/w sets', 5),
('2026-03-25', 'WED', 'E', 'accessory', NULL, E'3 Sets\n12 KB Seal Row\nRest 0:30\n0:30 Weighted Left Side Plank\nRest 0:15\n0:30 Weighted Right Side Plank\nRest 1:30', 6);

-- THU 2026-03-26
INSERT INTO ddodun.workout_templates (date, day_of_week, section, workout_type, title, description, sort_order) VALUES
('2026-03-26', 'THU', 'A', 'metcon', 'EMOM 40', NULL, 1),
('2026-03-26', 'THU', 'B', 'skill', 'Skill Practice', NULL, 2);

-- FRI 2026-03-27
INSERT INTO ddodun.workout_templates (date, day_of_week, section, workout_type, title, description, sort_order) VALUES
('2026-03-27', 'FRI', 'A', 'strength', NULL, E'4 Sets\n7 Seated Strict Press, Climbing\nRest 0:45\n5 Banded Strict Chest to bar\nRest 0:45\n9 (Banded) Strict Pull ups\nRest 1:30 b/w Sets', 1),
('2026-03-27', 'FRI', 'B', 'skill', NULL, E'3 Sets\n1 Wall Walk\n0:30 Stomach to Wall Handstand Hold\nRest 0:30\nPractice 1:00 Handstand Hold\nRest 2:00', 2),
('2026-03-27', 'FRI', 'C', 'metcon', 'E2MOM x 10', E'15 Line Facing Burpees + 12 DB Hang Snatch 35lb\n15 Cal Row + 12 Chest to bar', 3),
('2026-03-27', 'FRI', 'D', 'strength', 'Deadlift', E'5 x 3 @ 80%\n* Rest 2:00 b/w sets\n* Perform 5 Box Jumps 30 inch', 4),
('2026-03-27', 'FRI', 'E', 'metcon', NULL, E'3 rounds, each for time:\n1,600-meter run\nRest 5 minutes between efforts.', 5);
