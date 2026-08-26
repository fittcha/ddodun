-- 8월 4주차 4/5 (08.24~08.28) 운동 템플릿
--
-- [2026-08-26 운영 변경] 선수가 목요일 EMOM 을 수요일에 당겨서 수행하여,
-- DB 에서 WED(08-26) 과 THU(08-27) 의 템플릿을 서로 맞바꿨다 (이번 주 한정).
-- 아래 SQL 은 코치 이미지를 그대로 옮긴 원본이므로 수정하지 않는다.
-- 다시 실행하면 이미지 기준 순서로 돌아간다는 점에 유의할 것.
-- 교체는 date/day_of_week 만 변경했고 행 id 는 유지했다 (당시 로그·요약 0건).
-- MON 2026-08-24
INSERT INTO ddodun.workout_templates (date, day_of_week, section, workout_type, title, description, sort_order) VALUES
('2026-08-24', 'MON', 'A', 'weightlifting', NULL, E'Every 2:30 x 4\n3 Front Squat @ 70%\n* w/ 4''s lowering / eccentric every rep', 1),
('2026-08-24', 'MON', 'B', 'weightlifting', NULL, E'AMRAP 5\nMax Squat Clean to Overhead @ 105lb', 2),
('2026-08-24', 'MON', 'C', 'strength', 'Deficit Romanian Deadlift', E'@ 3111 Tempo\n2 x 10 @ RPE 8\n* Rest 2:00 b/w sets', 3),
('2026-08-24', 'MON', 'D', 'metcon', NULL, E'4 Sets\n(AMRAP 4)\n500m Row', 4),
('2026-08-24', 'MON', 'D', 'cardio', NULL, E'Remaining Time\nMax Cal Assault Bike\n* Rest 3:00 b/w sets', 5),
('2026-08-24', 'MON', 'E', 'accessory', NULL, E'3 Sets\n7 Glute Ham Raises\n* Rest 1:00 b/w sets', 6),
('2026-08-24', 'MON', 'F', 'accessory', NULL, E'3 Sets\n10 Jefferson Curls @ Empty Bar\n20 Seated Hamstring Curl @ Moderate Band\n* Rest 1:30 b/w sets', 7);

-- TUE 2026-08-25
INSERT INTO ddodun.workout_templates (date, day_of_week, section, workout_type, title, description, sort_order) VALUES
('2026-08-25', 'TUE', 'A', 'weightlifting', 'Shoulder Press', E'3 x 5 @ 60%\n2 x 10 @ 45%\n* Rest 2:00 b/w sets', 1),
('2026-08-25', 'TUE', 'B', 'metcon', NULL, E'AMRAP 10\n12 DB Bench Press\n6 DB(2) Hang Power Clean & Jerk\n12 Chest to bar\n6 DB(2) Hang Power Clean & Jerk\n* Load : 25~35lb', 2),
('2026-08-25', 'TUE', 'C', 'accessory', NULL, E'3 Sets\n12 DB(2) Z press\nRest 45 seconds\n24 Alter Gorilla Row\nRest 90 seconds', 3),
('2026-08-25', 'TUE', 'D', 'accessory', NULL, E'5 Sets\n12/12 SA Banded Rear Delt Fly\n24 Cable Tricep Pushdown @ Moderate\n* Rest 2:00 b/w sets', 4),
('2026-08-25', 'TUE', 'E', 'metcon', NULL, E'AMRAP 20\n8 Cal Assault Bike\n8 Burpee Box Jump Overs 20inch\n16m Husafell Bearhug Carry 100lb', 5),
('2026-08-25', 'TUE', 'F', 'accessory', NULL, E'3 Sets\n0:30 GHD Hollow Body Hold\nRest 45 seconds\n15 GHD Back Extensions\nRest 45 seconds\n0:30 Weighted Side Plank (Per Side)\nRest 2:00', 6);

-- WED 2026-08-26
INSERT INTO ddodun.workout_templates (date, day_of_week, section, workout_type, title, description, sort_order) VALUES
('2026-08-26', 'WED', 'A', 'weightlifting', 'E2MOM x 5', E'2 Snatch Grip Push Press\n1 Snatch Balance\n1 Overhead Squat\n@ 60~65% of Max Snatch', 1),
('2026-08-26', 'WED', 'B', 'weightlifting', NULL, E'EMOM 6\n1 Squat Snatch @ 70%', 2),
('2026-08-26', 'WED', 'B', 'weightlifting', NULL, E'— right into —\nE2MOM x 6\n2 Riser(2") Snatch Pull @ 80%', 3),
('2026-08-26', 'WED', 'C', 'metcon', NULL, E'AMRAP 15\n15 Wallball 14lb\n3 Wall Walks\n12 Cal Row', 4),
('2026-08-26', 'WED', 'D', 'accessory', NULL, E'3 Sets\n0:45 KB(2) Front Rack Wall Sit Hold\nRest 45 seconds\n0:45 Weighted Glute Bridge Hold\nRest 90 seconds', 5),
('2026-08-26', 'WED', 'E', 'accessory', NULL, E'3 Sets\n30 Russian Twist\n0:45 Side Plank (Per Side)\n0:45 Bird Dog Knees to Elbow\n* Rest as needed b/w sets', 6);

-- THU 2026-08-27
INSERT INTO ddodun.workout_templates (date, day_of_week, section, workout_type, title, description, sort_order) VALUES
('2026-08-27', 'THU', 'A', 'metcon', 'EMOM 40', NULL, 1),
('2026-08-27', 'THU', 'B', 'weightlifting', 'E2MOM x 5', E'2 TnG Power Snatch\n2 TnG Squat Snatch\n* Load 50~60%', 2),
('2026-08-27', 'THU', 'C', 'strength', 'E3MOM x 3', E'8 Back Squat @ 65~70%', 3),
('2026-08-27', 'THU', 'D', 'strength', NULL, E'3 Sets\n5 Zercher Good Mornings\n5 Zercher Squat\n10 Alter Zercher Reverse Lunges\n* Rest as needed\n* Unbroken Complex (5+5+10)', 4),
('2026-08-27', 'THU', 'E', 'accessory', NULL, E'3 Sets\n15 Banded Strict Pull ups\nRest 1:00\n10~15 Feet Elevated Ring Row\nRest 1:00', 5);

-- FRI 2026-08-28
INSERT INTO ddodun.workout_templates (date, day_of_week, section, workout_type, title, description, sort_order) VALUES
('2026-08-28', 'FRI', 'A', 'strength', NULL, E'4 Sets\n3 Shoulder Press + 5 Push Press @ RPE 8\nRest 1:00\n10~15 Ring Face Pull @ 21X0 Tempo\nRest 2:00', 1),
('2026-08-28', 'FRI', 'B', 'strength', NULL, E'4 Sets\n2 Bench Press @ 65%\n10 Deficit Push up @ 2"\n* Rest 2:00 b/w sets', 2),
('2026-08-28', 'FRI', 'C', 'skill', NULL, E'4 Sets\n200m Ski-erg\n6~8 Unbroken Strict Bar Dips\n200m Ski-erg\n6~8 Unbroken Strict Pull ups\n5 Wall Walks @ Fast\n* Rest 2:00 b/w sets', 3),
('2026-08-28', 'FRI', 'D', 'weightlifting', NULL, E'Every 0:45 x 10\n2 Speed Deadlift @ 50%', 4),
('2026-08-28', 'FRI', 'E', 'accessory', NULL, E'3 Sets\n10 DB Raise Complex\n* 1 DB RC = 1 Front + 1 Lateral\n10 DB Hammer Curls\n10 DB Deadstop Tricep Extensions\n* Rest as needed', 5),
('2026-08-28', 'FRI', 'F', 'accessory', NULL, E'Accumulate 5:00\nHusafell Bearhug Hold @ 150lb\n* Whenever Break, 30m Slow DB(2) Overhead Carry 20lb', 6);
