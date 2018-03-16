BEGIN;
--CREATE TYPE perm AS (
--    a bit,
--    b bit,
--    c bit,
--    d bit
--);
--CREATE TABLE t_role (
--    role_id serial,
--    perm perm DEFAULT ('0','0','0','0'),
--    negative boolean
--);
--CREATE TABLE t_user (
--    user_id serial,
--    role integer ARRAY
--);
--INSERT INTO t_role (perm, negative) VALUES (('0', '0', '1', '1'), 'f');
--INSERT INTO t_role (perm, negative) VALUES (('0', '1', '1', '0'), 't');
--INSERT INTO t_user (role) VALUES ('{1,2}');
--CREATE OR REPLACE FUNCTION t_cal_perm(who integer) RETURNS json AS $$
--DECLARE
--    v_temp jsonb;
--    v_perms RECORD;
--    v_p RECORD;
--    V_user RECORD;
--BEGIN
--    v_temp := '{}'::jsonb;
--    SELECT * INTO v_user FROM t_user WHERE user_id = who;
--    FOR v_perms IN (SELECT row_to_json(perm) as perm, negative FROM (SELECT * FROM t_role WHERE role_id = ANY(v_user.role)) AS t) LOOP
--        FOR v_p IN SELECT * FROM json_each_text(v_perms.perm) LOOP
--            IF (v_perms.negative = 'f') THEN
--                SELECT v_temp
--                    || jsonb_build_object( v_p.key, COALESCE((v_temp->>v_p.key)::bit, v_p.value::bit)::bit | v_p.value::bit )
--                INTO v_temp;
--            ELSE
--                SELECT v_temp
--                    || jsonb_build_object( v_p.key, COALESCE((v_temp->>v_p.key)::bit, v_p.value::bit)::bit & ~v_p.value::bit )
--                INTO v_temp;
--            END IF;
--        END LOOP;
--    END LOOP;
--    RETURN v_temp;
--END;
--$$ LANGUAGE plpgsql;
--SELECT t_cal_perm(1);

--SELECT json_each_text('{"test": "a"}'::json);

UPDATE user_info SET user_role = '{1,2,9}';
SELECT * FROM user_perm;

ROLLBACK;
