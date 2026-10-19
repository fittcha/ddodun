-- 10월 3주차 (10.19~10.23) 운동 템플릿
-- 하루 두 세션(Session 1 / Session 2). 세션 경계는 workout_type='note' + title 인 구분선 행(section 'S1','S2').
-- Session 1 의 섹션은 A,B,C…, Session 2 는 1,2,3… 으로 센다.
-- 세션 중간 소제목("Ring Accessories", "Upper Strength")은 해당 섹션 첫 줄 * 노트로 넣는다.
-- MON 2026-10-19
INSERT INTO ddodun.workout_templates (date, day_of_week, section, workout_type, title, description, sort_order) VALUES
('2026-10-19', 'MON', 'S1', 'note', 'Session 1', NULL, 1),
('2026-10-19', 'MON', 'A', 'weightlifting', NULL, E'6 Sets\n1.1 Squat Snatch\n* Load : 84(2) / 86(2) / 88(2)%\n* Rest 2:00 b/w sets\n* Rest 10''s b/w each reps', 2),
('2026-10-19', 'MON', 'B', 'strength', 'Back Squat', E'5 x 2 reps @ 81~84%\n* Rest 2:00 b/w sets', 3),
('2026-10-19', 'MON', 'C', 'skill', NULL, E'3 Sets\n4 Strict Handstand Push ups\n* Rest 45''s b/w sets', 4),
('2026-10-19', 'MON', 'D', 'metcon', NULL, E'For time of :\n20 Strict Toes to bar\nRun 400m\n20 Tempo Kipping Pull ups\nRun 400m\n80m Bear Hug Sandbag Carry 100lb\nRun 400m\n* Tempo : Fast up / 3''s Hold / 2''s Down', 5),
('2026-10-19', 'MON', 'S2', 'note', 'Session 2', E'Skill — Kipping Handstand Push ups', 6),
('2026-10-19', 'MON', '1', 'skill', NULL, E'5 Sets\nNegative (5''s) Top to bottom Handstand\n+ 20''s Bottom Hold\n* Rest as needed', 7),
('2026-10-19', 'MON', '2', 'metcon', NULL, E'AMRAP 6\n50 DB(1) Box Step Overs 20inch / 35lb\nMax Kipping Handstand Push ups', 8),
('2026-10-19', 'MON', '3', 'skill', NULL, E'* Ring Accessories\n3 Sets\n1 Jumping Muscle up (Transition)\n1 Jumping Muscle up (Full) & 15''s Ring Support Hold\n* Rest as needed', 9),
('2026-10-19', 'MON', '4', 'skill', NULL, E'3 Sets\n20''s Ribcage Hold\n10''s Ring Bottom Hold\n* Rest as needed', 10);

-- TUE 2026-10-20
INSERT INTO ddodun.workout_templates (date, day_of_week, section, workout_type, title, description, sort_order) VALUES
('2026-10-20', 'TUE', 'S1', 'note', 'Session 1', NULL, 1),
('2026-10-20', 'TUE', 'A', 'skill', NULL, E'Every 1:30 for 10 Sets\n1 Muscle up\n2 Ring Dips', 2),
('2026-10-20', 'TUE', 'B', 'cardio', NULL, E'E2MOM x 8\n(1:30 On / 0:30 off)\nOdd, 5~7m Handstand Walk + Max Cal Ski-erg\nEven, 3~5 Wall Walks + Max Meter Run', 3),
('2026-10-20', 'TUE', 'C', 'accessory', NULL, E'3 Sets\n24 Banded Face Pull\n12 Revers Grip Barbell Bicep Curls\n18 GHD Hip Extensions\n* Rest as needed', 4),
('2026-10-20', 'TUE', 'D', 'cardio', NULL, E'E2MOM x 10\nOdd - 90''s Assault Bike\nEven - 90''s Row', 5),
('2026-10-20', 'TUE', 'S2', 'note', 'Session 2', E'Skill — Bar Muscle up', 6),
('2026-10-20', 'TUE', '1', 'skill', NULL, E'E2MOM x 5\n(1:30 On / 0:30 Off)\n12 Bar Facing Burpees\nMax Unbroken Bar Muscle ups', 7),
('2026-10-20', 'TUE', '2', 'accessory', NULL, E'* Upper Strength\n3 Sets (Super Sets)\n3~4 Parallette Push ups w/ Feet Elevated\n4~5 Parallette Push ups w/ feet on Floor\n5~6 Hand-Release Push ups\n6~7 Wave Push ups\n* Rest 2:00 b/w sets', 8),
('2026-10-20', 'TUE', '3', 'accessory', NULL, E'3 Sets\n10 DB Bent Over Reverse Fly\n* Rest 1:00 b/w sets', 9);

-- WED 2026-10-21
INSERT INTO ddodun.workout_templates (date, day_of_week, section, workout_type, title, description, sort_order) VALUES
('2026-10-21', 'WED', 'S1', 'note', 'Session 1', NULL, 1),
('2026-10-21', 'WED', 'A', 'weightlifting', NULL, E'3 Sets\n10 Squat Clean @ 95/105/115lb\n* Rest 3:00 b/w sets', 2),
('2026-10-21', 'WED', 'B', 'metcon', NULL, E'2 Sets for time of :\n15m DB(2) Walking Lunges 50lb\n15m DB(2) Walking Lunges 35lb\n15m BW Walking Lunges\n* Rest 3:00 b/w sets', 3),
('2026-10-21', 'WED', 'C', 'metcon', NULL, E'3 Sets\n(AMRAP 2)\nRope Climbs (1-2-3-4-5 … reps)\nTarget Burpees (3-6-9-12-15 … reps)\n* Rest 2:00 b/w sets\n* Pick up where you left off', 4),
('2026-10-21', 'WED', 'D', 'accessory', NULL, E'5 Sets\n30''s Wall Sit hold w/ 35lb Plate\nRest 30''s\n10 Box Jump & Step Down 24inch\nRest 60''s\n6/6 Single Leg Hamstring Curl on Rower\nRest 90''s', 5),
('2026-10-21', 'WED', 'S2', 'note', 'Session 2', E'REST DAY · Mobility', 6),
('2026-10-21', 'WED', '1', 'accessory', NULL, E'2 Sets\n30''s Bent Arm KB Lat Stretch\n* Rest 60''s', 7),
('2026-10-21', 'WED', '2', 'accessory', NULL, E'2 Sets\n10/10 Banded Arm Spirals\n* Light Tension on the band\n* Rest 60''s', 8),
('2026-10-21', 'WED', '3', 'accessory', NULL, E'2 Sets\n5/5 Quadruped Scap Push up @ 2020\n* Rest 60''s', 9),
('2026-10-21', 'WED', '4', 'accessory', NULL, E'2 Sets\n20''s Each Side Lying Shoulder IR Hold\nRest 30''s\n8/8 DB Horizontal External Rotation off bench\nRest 90''s', 10),
('2026-10-21', 'WED', '5', 'accessory', NULL, E'2 Sets\n30''s Shoulder Extension Stretch\n* Rest 60''s', 11);

-- THU 2026-10-22
INSERT INTO ddodun.workout_templates (date, day_of_week, section, workout_type, title, description, sort_order) VALUES
('2026-10-22', 'THU', 'S1', 'note', 'Session 1', NULL, 1),
('2026-10-22', 'THU', 'A', 'metcon', 'EMOM 40', NULL, 2),
('2026-10-22', 'THU', 'B', 'weightlifting', NULL, E'4 Sets\n5 Overhead Squat @ 23X2\n* Rest 3:00 b/w sets\n* Load : Climbing', 3),
('2026-10-22', 'THU', 'C', 'strength', NULL, E'3 Sets\n3 Bench Press @ 87.5%\nRest 90''s\n6 Front Squat @ 60%\nRest 90''s', 4),
('2026-10-22', 'THU', 'D', 'accessory', NULL, E'3 Sets\n10 Band Pull Aparts w/ Palms Down\nRest as needed\n10 Band Pull Aparts w/ Palms Up\nRest as needed\n10 Diagonal Banded Pull Aparts\n* w/ Left Hand down & Right Hand up\nRest as needed\n10 Diagonal Banded Pull Aparts\n* w/ Right Hand down & Left Hand up\nRest as needed', 5),
('2026-10-22', 'THU', 'S2', 'note', 'Session 2', NULL, 6),
('2026-10-22', 'THU', '1', 'metcon', NULL, E'4 Sets\n12 Cal Assault Bike\n30''s KB(2) Front Rack Hold 12~16kg\n12 Cal Assault Bike\n10 KB(2) Push Jerk 12~16kg\n12 Cal Assault Bike\n10 KB(2) Snatch 12~16kg\n* Rest 3:00 b/w sets', 7),
('2026-10-22', 'THU', '2', 'accessory', NULL, E'3 Sets\n10 DB Skull Crusher\nRest 45''s\n10 DB Arnold Press\nRest 45''s\n10 Bench Dips\nRest 45''s\n5 Sets "6 Way DB Delt Raises"\nRest 2:00', 8),
('2026-10-22', 'THU', '3', 'accessory', NULL, E'* Mobility\n2 Sets\n5/5 Lunges to Hamstring Stretch w/ 5''s Hold\nRest 60''s\n40''s Extended Leg Couch Stretch (Per Side)\nRest 60''s\n8 Tempo Deficit RDL @ 30X1\nRest 60''s\n30''s Straddle Sit Stretch (Per Side)\nRest 60''s', 9);

-- FRI 2026-10-23
INSERT INTO ddodun.workout_templates (date, day_of_week, section, workout_type, title, description, sort_order) VALUES
('2026-10-23', 'FRI', 'S1', 'note', 'Session 1', NULL, 1),
('2026-10-23', 'FRI', 'A', 'weightlifting', 'Clean & Jerk', E'1 x 2 @ 75%\n2 x 2 @ 80%\n2 x 2 @ 85%\n* Rest 2:00 b/w sets', 2),
('2026-10-23', 'FRI', 'B', 'strength', NULL, E'4 Sets\n1~3 Shoulder Press\n3~5 Push Press\n* Load : 80~90% of SP 1RM\n* Rest No More than 2:00', 3),
('2026-10-23', 'FRI', 'C', 'strength', NULL, E'6 Sets\n5 Banded Deadlift @ Climbing\n15 Band Pull Through\n30''s Banded Standing Horizontal Row\n* Rest 2:00 b/w sets', 4),
('2026-10-23', 'FRI', 'D', 'cardio', NULL, E'2 Continuous Sets (36:00)\n4:00 Run @ RPE 5~6\n4:00 Jog @ RPE 3\n3:00 Run @ RPE 6~7\n3:00 Jog @ RPE 3\n2:00 Run @ RPE 7~8\n2:00 Jog @ RPE 3', 5),
('2026-10-23', 'FRI', 'S2', 'note', 'Session 2', E'Skill — Gymnastic', 6),
('2026-10-23', 'FRI', '1', 'skill', 'EMOM x 40', E'1. 1~2 Ring Muscle ups\n2. 3~5 Strict HSPU\n3. 5~7 Bar Muscle ups\n4. 5~7m Handstand Walk\n5. 12 GHD Sit ups\n6. 4~6 Deficit HSPU\n7. 12 Toes to bar\n8. 3 Wall Walks', 7),
('2026-10-23', 'FRI', '2', 'accessory', NULL, E'4 Sets\n6 Close Grip Bench Press\nRest 45''s\n12 Barbell upright row\nRest 90''s', 8),
('2026-10-23', 'FRI', '3', 'accessory', NULL, E'3 Sets\n3 Left Arm 1/2 Turkish Get up\n3 Right Arm 1/2 Turkish Get up\n15 Left Side Plank Band Rows\n15 Right Side Plank Band Rows\n* Rest as needed', 9);
