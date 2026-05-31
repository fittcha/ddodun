-- 3주차 3/4 (03.16~03.20) 운동 템플릿
-- MON 2026-03-16
INSERT INTO ddodun.workout_templates (date, day_of_week, section, workout_type, title, description, sort_order) VALUES
('2026-03-16', 'MON', 'A', 'custom', 'Redo 26.3', NULL, 1),
('2026-03-16', 'MON', 'B', 'weightlifting', NULL, E'Every 2:00 for 6 Sets\n1 Clean + 1 Front Squat + 1 Jerk\n* Load : 70(2) / 80(2) / 90(2)', 2),
('2026-03-16', 'MON', 'C', 'weightlifting', NULL, E'Every 1:30 for 3 Sets\n1 Halting Clean Deadlift + 1 Clean Pull @ 10%', 3),
('2026-03-16', 'MON', 'D', 'strength', 'Back Squat', 'Build to Heavy 2 for the day', 4),
('2026-03-16', 'MON', 'E', 'metcon', 'AMRAP 9', E'3 Wall Walks\n3 Bar Muscle ups\n30 Double Unders', 5),
('2026-03-16', 'MON', 'F', 'accessory', NULL, E'3 Sets\n10 Banded Strict Chest to bar\n* Rest 2:00 b/w sets', 6),
('2026-03-16', 'MON', 'F', 'accessory', NULL, E'3 Sets\n12 KB Seal Row\n15 Rear Delt Fly\n* Rest 2:00 b/w sets', 7),
('2026-03-16', 'MON', 'G', 'cardio', 'Row Interval', NULL, 8);

-- TUE 2026-03-17
INSERT INTO ddodun.workout_templates (date, day_of_week, section, workout_type, title, description, sort_order) VALUES
('2026-03-17', 'TUE', 'A', 'warmup', NULL, E'3 Sets\n1:00 Ski-erg\n10 Standing Calf Raises holding DB in FC\n10 Scap Pull ups\n5 Medicine Ball Clean\n5 Push ups', 1),
('2026-03-17', 'TUE', 'B', 'metcon', NULL, E'4 Sets\n10 Cal Assault Bike\n5 Burpee Over DB\n5/5 DB(1) Hang Clean to Overhead 35lb\n15m BW Walking Lunges\n* Rest 2:00 b/w sets', 2),
('2026-03-17', 'TUE', 'C', 'strength', NULL, E'5 Sets\n2 Push Press, @ Heavier than Last Week\nRest 1:00\n2 Weighted Strict Pull ups\nRest 2:00', 3),
('2026-03-17', 'TUE', 'D', 'metcon', NULL, E'3 Sets\n5 Cal Sprint Assault Bike\n10 Handstand Push ups\n20 DB(1) Box Step Overs 20" / 35lb\n10 Handstand Push ups\n5 Cal Sprint Assault Bike\n* Rest 2:00 b/w sets', 4),
('2026-03-17', 'TUE', 'E', 'accessory', NULL, E'3 Sets\n10 DB Bench press\nRest 0:30\n10 Feet Elevated Ring Row\nRest 1:00\n10 Feet Elevated Push ups\nRest 0:30\n30 Banded Face Pulls\nRest 2:00', 5);

-- WED 2026-03-18
INSERT INTO ddodun.workout_templates (date, day_of_week, section, workout_type, title, description, sort_order) VALUES
('2026-03-18', 'WED', 'A', 'weightlifting', NULL, E'Every 0:30 for 20 sets\nPower Snatch + TnG Snatch @ 60%', 1),
('2026-03-18', 'WED', 'B', 'strength', 'Back Squat', E'3 x 2\n* 85% of Monday Heavy 2', 2),
('2026-03-18', 'WED', 'C', 'metcon', 'AMRAP 10', E'2 Right Arm DB Hang Clean & Jerk 50lb\n2 Left Arm DB Hang Clean & Jerk 50lb\n2 Right Arm DB Hang Clean & Jerk 50lb\n2 Left Arm DB Hang Clean & Jerk 50lb\n0:20 Recovery Assault Bike', 3),
('2026-03-18', 'WED', 'C', 'cardio', NULL, E'Rest 5:00\n4 Sets\n2:00 Assault Bike @ RPE 3\n2:00 Assault Bike @ RPE 5\n2:00 Assault Bike @ RPE 7\n1:00 Assault Bike @ RPE 9\n* No Rest b/w sets', 4),
('2026-03-18', 'WED', 'D', 'metcon', 'E4MOM x 5', E'300m Run\n60 Double Unders\n6 Bar Muscle ups', 5),
('2026-03-18', 'WED', 'E', 'accessory', NULL, E'3 Sets\n(0:40 On / 0:20 Off)\n- Pallof Press (Left)\n- Side Plank (Left)\n- Pallof Press (Right)\n- Side Plank (Right)\n- Hollow Hold\n- Rest', 6);

-- THU 2026-03-19
INSERT INTO ddodun.workout_templates (date, day_of_week, section, workout_type, title, description, sort_order) VALUES
('2026-03-19', 'THU', 'A', 'metcon', 'EMOM 40', NULL, 1),
('2026-03-19', 'THU', 'B', 'skill', 'Skill Practice', NULL, 2);

-- FRI 2026-03-20
INSERT INTO ddodun.workout_templates (date, day_of_week, section, workout_type, title, description, sort_order) VALUES
('2026-03-20', 'FRI', 'A', 'strength', 'Front Squat', E'5 x 3 @ 80%\n* Rest 2:00 b/w sets', 1),
('2026-03-20', 'FRI', 'B', 'metcon', 'For time of :', E'21-15-9\nToes to bar\nBox Jump Overs 20 inch\n- Rest 2:00\n3 rounds for time of :\n14 Cal Ski-erg\n12 Alter Single Leg Squats\n6 Bar Muscle ups\n- Rest 2:00\n4 rounds for time of :\n15 Cal Row\n10 Burpee Over the Rower', 2),
('2026-03-20', 'FRI', 'C', 'metcon', 'For time of :', E'400m Run\n35 DB Bench Press 35lb\n400m Run\n35 Ring Push ups\n400m Run\n35 Hand-release Push ups\n400m Run\n* Target Under 16:00', 3);
