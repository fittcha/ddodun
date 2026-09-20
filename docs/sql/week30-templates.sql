-- 9월 3주차 3/5 (09.21~09.25) 운동 템플릿
-- THU(09-24)·FRI(09-25)는 이미지에 "추석 Rest"로만 표기되어 운동이 없다. 행을 넣지 않는다.
-- MON 2026-09-21
INSERT INTO ddodun.workout_templates (date, day_of_week, section, workout_type, title, description, sort_order) VALUES
('2026-09-21', 'MON', 'A', 'strength', 'Back Squat', E'Build to a 10RM', 1),
('2026-09-21', 'MON', 'B', 'weightlifting', NULL, E'3 Sets\nPower Clean + Squat Clean From Below Knee\n+ Split Jerk 2''s Pause in Receiving @ ~ 50%\n* Rest 1:00 b/w sets', 2),
('2026-09-21', 'MON', 'B', 'weightlifting', NULL, E'2 Sets\nSquat Clean + Split Jerk + Squat Clean + Split Jerk @ 70%\n* Rest 1:30 b/w sets', 3),
('2026-09-21', 'MON', 'B', 'weightlifting', NULL, E'2 Sets\nSquat Clean + Split Jerk @ 75/80%\n* Rest 1:30 b/w sets', 4),
('2026-09-21', 'MON', 'C', 'metcon', NULL, E'5 Sets\n12 Cal Row\n9 Power Clean\n6 Thruster @ 85lb\n* Rest 1:00 b/w sets', 5),
('2026-09-21', 'MON', 'D', 'accessory', NULL, E'3 Sets\n5 Zercher Good morning @ 3111 Tempo\nRest 1:00\n0:45 Tall Kneeling KB(2) Front Rack Hold\nRest 2:00', 6),
('2026-09-21', 'MON', 'E', 'cardio', NULL, E'3 Sets\n(AMRAP 6)\nAssault Bike\n0:15 @ Sprint\n0:45 @ Recovery\n* Rest 3:00 b/w Sets', 7),
('2026-09-21', 'MON', 'F', 'accessory', NULL, E'20-15-10-5\nSide Plank Knee Touch (Per Side)\nGHD Back Extensions\n* For Quality', 8);

-- TUE 2026-09-22
INSERT INTO ddodun.workout_templates (date, day_of_week, section, workout_type, title, description, sort_order) VALUES
('2026-09-22', 'TUE', 'A', 'strength', NULL, E'4 Sets\n6 DB Bench Press 35lb\n6 DB Deadlift 35lb\n6 DB Bench Press 35lb\n6 DB Power Clean 35lb\nRest 1:00 b/w sets', 1),
('2026-09-22', 'TUE', 'B', 'skill', NULL, E'3 Sets (Quality)\n1:00 Assault Bike (Only Arm)\n10~15 Unbroken Deficit Push ups\n1:00 Assault Bike (Only Arm)\n10~15 Unbroken Feet Elevated Ring Row\n* Rest as needed b/w sets', 2),
('2026-09-22', 'TUE', 'C', 'accessory', NULL, E'3 Sets\n10 Chest Supported DB Row\nRest 0:30\nMax reps Reverse Grip Barbell Row (Cap @ 20 reps)\nRest 2:00', 3),
('2026-09-22', 'TUE', 'D', 'skill', NULL, E'Accumulate 50m (For Quality)\nHandstand Walk', 4),
('2026-09-22', 'TUE', 'D', 'skill', NULL, E'* and then,\n3 Sets\n1:00 Ring Plank Hold\n* Every 15''s, 2 Ring Push up w/ a Pause at bottom', 5),
('2026-09-22', 'TUE', 'E', 'metcon', NULL, E'AMRAP 20\n("Test")\nMax Unbroken Pull ups\n800m Row\nMax Unbroken Toes to bar\n1,600m Bike-erg', 6),
('2026-09-22', 'TUE', 'F', 'accessory', NULL, E'3 Sets\n25 Band Pull Apart (Palms up)\n25 Band Pull Apart (Palms Down)\n25 Banded Tricep Extension\n25 Banded Bicep Curls\n* Rest as needed b/w sets', 7),
('2026-09-22', 'TUE', 'G', 'accessory', NULL, E'2 Sets (Quality)\n12 Wide Stance Band Rotations @ 20X2 Tempo (Left)\n12 Wide Stance Band Rotations @ 20X2 Tempo (Right)\nRest 0:30\n12 Band Resisted Side Plank Row @ 20X2 Tempo (Left)\n12 Band Resisted Side Plank Row @ 20X2 Tempo (Right)\nRest 1:00', 8);

-- WED 2026-09-23
INSERT INTO ddodun.workout_templates (date, day_of_week, section, workout_type, title, description, sort_order) VALUES
('2026-09-23', 'WED', 'A', 'metcon', 'EMOM 40', NULL, 1),
('2026-09-23', 'WED', 'B', 'strength', 'Back Squat', E'2 x 3 @ 65%\n* Rest 2:00 b/w sets', 2),
('2026-09-23', 'WED', 'B', 'strength', NULL, E'* and then,\nTempo Front Squat\n2 x 3 @ 60%\n* Rest 2:00 b/w sets', 3),
('2026-09-23', 'WED', 'C', 'weightlifting', 'E3MOM x 5', E'6 Overhead Squat\n* w/ 2''s Pause in the bottom\n* Climbing', 4),
('2026-09-23', 'WED', 'D', 'weightlifting', NULL, E'3 Sets\nSnatch Deadlift + Snatch Pull\n+ Power Snatch + Snatch Balance @ ~ 60%\n* Rest 1:00 b/w sets', 5),
('2026-09-23', 'WED', 'D', 'weightlifting', NULL, E'* and then,\nSquat Snatch\n3 x 2 @ 70%\n2 x 1 @ 75%\n* Rest 1:30 b/w sets', 6),
('2026-09-23', 'WED', 'E', 'accessory', NULL, E'2 Sets\n10 Moving Bent Knee Copenhagen Plank (Per Side) @ 2112 Tempo\n* Rest 0:30 b/w sides\n* Rest 2:00 b/w Movement\n15 Banded Clam Shell (Per Side) @ 21120 Tempo\n* Rest 0:30 b/w sides\n* Rest 2:00 b/w Movement', 7),
('2026-09-23', 'WED', 'F', 'accessory', NULL, E'3 Sets\n10 Glute Ham Raises\n20 Tib Raises\n20 Calf Raises\n1:00 Wall Sit Hold\n* Rest as needed b/w sets', 8),
('2026-09-23', 'WED', 'G', 'accessory', 'E2MOM x 4', E'0:45 Hollow Rock Hold', 9);
