-- 10월 2주차 (10.12~10.16) 운동 템플릿
-- 이번 주부터 코치 시트가 하루 두 세션(Session 1 / Session 2)으로 나뉜다.
-- 세션 경계는 workout_type='note' + title 인 구분선 행(section 'S1','S2')으로 넣는다.
-- 그 행의 description 은 그날 세션의 성격 라벨("REST DAY · Mobility", "Skill — ...").
-- Session 1 의 섹션은 A,B,C…, Session 2 는 1,2,3… 으로 센다.
-- MON 2026-10-12
INSERT INTO ddodun.workout_templates (date, day_of_week, section, workout_type, title, description, sort_order) VALUES
('2026-10-12', 'MON', 'S1', 'note', 'Session 1', NULL, 1),
('2026-10-12', 'MON', 'A', 'weightlifting', NULL, E'6 Sets\n1.1.1 Squat Snatch\n* Set 1/4 - 74/78/82%\n* Set 2/5 - 76/80/84%\n* Set 3/6 - 78/82/86%\n* Rest 3:00 b/w sets\n* Rest / add load for 20''s b/w each reps', 2),
('2026-10-12', 'MON', 'B', 'strength', 'Back Squat', E'10 x 3 reps @ 77~81%\n* Rest 90''s b/w sets', 3),
('2026-10-12', 'MON', 'C', 'skill', NULL, E'E2MOM x 10\n(1:30 On / 0:30 off)\n5m Handstand Walk\n10m SA DB OH Walking Lunges 35lb\n* (5m x 2 / Right > Left)\nMax Strict (AB)HSPU until 90''s Mark', 4),
('2026-10-12', 'MON', 'S2', 'note', 'Session 2', E'Skill — Ring Muscle up', 5),
('2026-10-12', 'MON', '1', 'skill', NULL, E'3 Sets\n2 Small Ring Swings\n1 Big Ring Swings w/ Open hip\n* Rest as needed', 6),
('2026-10-12', 'MON', '2', 'skill', NULL, E'3 Sets\n1 Big Ring Swings w/ Open hip & Pull\n* Rest as needed', 7),
('2026-10-12', 'MON', '3', 'skill', NULL, E'3 Sets\n1 Jumping Muscle up (Transition)\n1 Jumping Muscle up (Full) & 15''s Ring Support Hold\n* Rest as needed', 8),
('2026-10-12', 'MON', '4', 'skill', NULL, E'3 Sets\n20''s Ribcage Hold\n10''s Ring Bottom Hold\n* Rest as needed', 9),
('2026-10-12', 'MON', '5', 'skill', NULL, E'5 Sets\n10 Bar Facing Burpees @ Easy\nRest 20''s\nAMRAP 2, Max Ring Muscle up (2~4)\nRest 2:00 b/w sets', 10);

-- TUE 2026-10-13
INSERT INTO ddodun.workout_templates (date, day_of_week, section, workout_type, title, description, sort_order) VALUES
('2026-10-13', 'TUE', 'S1', 'note', 'Session 1', NULL, 1),
('2026-10-13', 'TUE', 'A', 'skill', 'E2MOM x 5', E'1 Legless Rope Climb\n2 Rope Climb', 2),
('2026-10-13', 'TUE', 'B', 'accessory', NULL, E'3 Sets\n16 Alter Single Leg Toes to bar\nRest 30''s\n16 Alter Toe Touches\nRest 30''s\n10 Bent Over Straight Arm Banded PVC Pulldowns\n* with Heavy Band resistance\nRest 90''s', 3),
('2026-10-13', 'TUE', 'C', 'cardio', NULL, E'2 Sets\n1:30 Assault Bike @ Moderate\n1:00 Assault Bike @ Recovery\n1:00 Assault Bike @ Hard\n1:00 Assault Bike @ Recovery\nRest 1:00\n1:30 Row @ Moderate\n1:00 Row @ Recovery\n1:00 Row @ Hard\n1:00 Row @ Recovery\nRest 1:00\n1:30 Ski-erg @ Moderate\n1:00 Ski-erg @ Recovery\n1:00 Ski-erg @ Hard\n1:00 Ski-erg @ Recovery\nRest 4:00', 4),
('2026-10-13', 'TUE', 'S2', 'note', 'Session 2', E'Skill — Handstand Walk', 5),
('2026-10-13', 'TUE', '1', 'skill', NULL, E'3 Sets\n10''s/10''s Sideways Handstand Hold on wall\n* Rest as needed', 6),
('2026-10-13', 'TUE', '2', 'skill', NULL, E'3 Sets\n10 Alter Shoulder taps on Wall\n* "Shift - Lift - Tap"\n* Rest as needed', 7),
('2026-10-13', 'TUE', '3', 'skill', NULL, E'5 Sets\n50 Unbroken Double Unders\nRest 20''s\nAMRAP 1, Max Handstand Walk (7.5~10m)\nRest 2:00 b/w sets', 8),
('2026-10-13', 'TUE', '4', 'accessory', NULL, E'3 Sets\n12/12 Landmine Meadows Row\nRest 45''s\n16 Alter Archer Ring Row\nRest 60''s\n12 Seated Banded Face Pull to Press\nRest 90''s', 9);

-- WED 2026-10-14
INSERT INTO ddodun.workout_templates (date, day_of_week, section, workout_type, title, description, sort_order) VALUES
('2026-10-14', 'WED', 'S1', 'note', 'Session 1', NULL, 1),
('2026-10-14', 'WED', 'A', 'weightlifting', NULL, E'2 Sets\n3 Squat Clean @ 86%\nRest 30''s\n12 Squat Clean @ 50%\nRest 5:00', 2),
('2026-10-14', 'WED', 'B', 'strength', NULL, E'4 Sets\n12 DB Romanian Deadlift @ 31X1 Tempo\nRest 1:00\n12 Barbell Cyclist Squat @ 31X1 Tempo\nRest 1:00', 3),
('2026-10-14', 'WED', 'C', 'metcon', NULL, E'10 Rounds for time of :\n7 Power Snatch 55lb\n3 Bar Muscle ups', 4),
('2026-10-14', 'WED', 'D', 'metcon', NULL, E'Rest 10:00\n5 Sets\nRun 200m\n10 Burpee Chest to bar\n50 Double Unders\n15 GHD Sit ups\n* Rest 1:1 b/w sets', 5),
('2026-10-14', 'WED', 'S2', 'note', 'Session 2', E'REST DAY · Mobility', 6),
('2026-10-14', 'WED', '1', 'accessory', NULL, E'2 Sets\n30''s Bent Arm KB Lat Stretch\n* Rest 60''s', 7),
('2026-10-14', 'WED', '2', 'accessory', NULL, E'2 Sets\n10/10 Banded Arm Spirals\n* Light Tension on the band\n* Rest 60''s', 8),
('2026-10-14', 'WED', '3', 'accessory', NULL, E'2 Sets\n5/5 Quadruped Scap Push up @ 2020\n* Rest 60''s', 9),
('2026-10-14', 'WED', '4', 'accessory', NULL, E'2 Sets\n20''s Each Side Lying Shoulder IR Hold\nRest 30''s\n8/8 DB Horizontal External Rotation off bench\nRest 90''s', 10),
('2026-10-14', 'WED', '5', 'accessory', NULL, E'2 Sets\n30''s Shoulder Extension Stretch\n* Rest 60''s', 11);

-- THU 2026-10-15
INSERT INTO ddodun.workout_templates (date, day_of_week, section, workout_type, title, description, sort_order) VALUES
('2026-10-15', 'THU', 'S1', 'note', 'Session 1', NULL, 1),
('2026-10-15', 'THU', 'A', 'metcon', 'EMOM 40', NULL, 2),
('2026-10-15', 'THU', 'B', 'weightlifting', 'E2MOM x 5', E'2 Paused Jerk Dip Squat\n1 Split Jerk (Pause in catch)\n* Load : 65~75%', 3),
('2026-10-15', 'THU', 'C', 'strength', NULL, E'5 Sets\n3 Bench Press @ 85%\nRest 90''s\n6 Front Squat @ 60%\nRest 90''s', 4),
('2026-10-15', 'THU', 'D', 'accessory', NULL, E'3 Sets\n10 Band Pull Aparts w/ Palms Down\nRest as needed\n10 Band Pull Aparts w/ Palms Up\nRest as needed\n10 Diagonal Banded Pull Aparts\n* w/ Left Hand down & Right Hand up\nRest as needed\n10 Diagonal Banded Pull Aparts\n* w/ Right Hand down & Left Hand up\nRest as needed', 5),
('2026-10-15', 'THU', 'S2', 'note', 'Session 2', NULL, 6),
('2026-10-15', 'THU', '1', 'metcon', NULL, E'2 Sets\n15-10-5 DB(2) Thruster 35lb\n2-4-6 Rope Climbs\nand then, Max Cal Bike-erg Until 10:00\n* Rest 5:00 b/w sets', 7),
('2026-10-15', 'THU', '2', 'accessory', NULL, E'3 Sets\n10 DB Skull Crusher\nRest 45''s\n10 DB Arnold Press\nRest 45''s\n10 Bench Dips\nRest 45''s\n5 Sets "6 Way DB Delt Raises"\nRest 2:00', 8),
('2026-10-15', 'THU', '3', 'accessory', NULL, E'* Mobility\n2 Sets\n5/5 Lunges to Hamstring Stretch w/ 5''s Hold\nRest 60''s\n40''s Extended Leg Couch Stretch (Per Side)\nRest 60''s\n8 Tempo Deficit RDL @ 30X1\nRest 60''s\n30''s Straddle Sit Stretch (Per Side)\nRest 60''s', 9);

-- FRI 2026-10-16
INSERT INTO ddodun.workout_templates (date, day_of_week, section, workout_type, title, description, sort_order) VALUES
('2026-10-16', 'FRI', 'S1', 'note', 'Session 1', NULL, 1),
('2026-10-16', 'FRI', 'A', 'strength', NULL, E'3 Sets\n3 Hand-release Deadlift @ 80~84%\n* Rest 3:00 b/w sets', 2),
('2026-10-16', 'FRI', 'B', 'strength', NULL, E'4 Sets\n12 TnG Deadlift @ 135~155lb\n* Rest No More than 2:00', 3),
('2026-10-16', 'FRI', 'C', 'accessory', NULL, E'3 Sets\n14 Bent Over Barbell Row\nRest 1:00\n12 Barbell Bicep Curls\nRest 2:00', 4),
('2026-10-16', 'FRI', 'D', 'accessory', NULL, E'3 Sets\n7.5m x 2 SA Barbell Farmers Carry @ 35lb\n* Rest 20''s b/w arms\n* Rest 2:00 b/w sets', 5),
('2026-10-16', 'FRI', 'E', 'cardio', NULL, E'5 Continuous Sets (30:00)\n3:00 Run @ RPE 5~6\n2:00 Run @ RPE 6~7\n1:00 Run @ RPE 7~8', 6),
('2026-10-16', 'FRI', 'S2', 'note', 'Session 2', E'Skill — Strict HSPU', 7),
('2026-10-16', 'FRI', '1', 'skill', NULL, E'EMOM 10\n6~12''s Negative HSPU', 8),
('2026-10-16', 'FRI', '2', 'accessory', NULL, E'3 Sets\n8 DB(2) Z Press\n20''s DB(2) Overhead Hold in Z press\n* Legs extended and in front of you\n* as heavy as you can', 9),
('2026-10-16', 'FRI', '3', 'skill', NULL, E'3 Sets\nMax Unbroken Pike Push ups\n* w/ feet on ground / No more than 20 reps,\n* Rest 3:00 b/w sets', 10),
('2026-10-16', 'FRI', '4', 'skill', NULL, E'AMRAP 2\nMax Strict (AB) HSPU\nRest 1:00\n60''s Handstand Hold on wall\nRest 1:00\nAMRAP 2, Max Kipping Handstand Push ups', 11);
