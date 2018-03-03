BEGIN;

CREATE OR REPLACE FUNCTION update_existing_user()
  RETURNS trigger AS
$BODY$
DECLARE
v_email_prefix varchar(64);
v_email_suffix varchar(255);
v_record RECORD;
BEGIN
    IF NEW.nickname IS NOT NULL AND NEW.nickname IS DISTINCT FROM OLD.nickname THEN
        INSERT INTO user_nick(nickname, user_id) VALUES (NEW.nickname, OLD.user_id) ON CONFLICT DO NOTHING;
        SELECT nick_id, user_id FROM user_nick WHERE nickname = NEW.nickname INTO v_record;
        IF v_record.user_id <> OLD.user_id THEN
            RAISE EXCEPTION 'cannot take that name';
        ELSE
            UPDATE user_info SET nick_id = v_record.nick_id WHERE user_info.user_id = v_record.user_id;
        END IF;
    END IF;

    IF NEW.email IS NOT NULL AND NEW.email IS DISTINCT FROM OLD.email THEN
        v_email_prefix:= lower(split_part(NEW.email,'@',1));
        v_email_suffix:= lower(split_part(NEW.email,'@',2));
        IF v_email_prefix = '' OR v_email_suffix = '' THEN
            RAISE EXCEPTION 'cannot set that email';
        END IF;
        INSERT INTO email_suffix(email_suffix) VALUES (v_email_suffix) ON CONFLICT DO NOTHING;
        WITH t AS (
            SELECT suffix_id FROM email_suffix WHERE email_suffix = v_email_suffix
        ) UPDATE user_info SET email = v_email_prefix, email_suffix_id = t.suffix_id FROM t WHERE user_id = OLD.user_id;
    END IF;

    UPDATE user_info SET gender = COALESCE(NEW.gender, gender), qq = COALESCE(NEW.qq, qq), phone = COALESCE(NEW.phone, phone), real_name = COALESCE(NEW.real_name, real_name), school = COALESCE(NEW.school, school), role_id = COALESCE(NEW.role_id, role_id), current_badge = COALESCE(NEW.current_badge, current_badge), "password" = COALESCE(NEW.password, password) WHERE user_id = OLD.user_id;
    RETURN NEW;
END;
$BODY$
LANGUAGE plpgsql;

CREATE TRIGGER update_users INSTEAD OF UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_existing_user();

UPDATE users SET nickname = 'UNRISEfOX', email = 'A@PP.COM', gender = 3, phone = '15032312345' WHERE user_id = 1 RETURNING * ;

SELECT * FROM users;

SELECT * FROM user_info;

SELECT * FROM email_suffix;

SELECT * FROM user_nick;


ROLLBACK;
