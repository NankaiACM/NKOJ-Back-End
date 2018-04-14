BEGIN;

CREATE OR REPLACE FUNCTION cal_perm (who integer) RETURNS jsonb AS $$
DECLARE
    v_return jsonb;
    v_user RECORD;
    v_groups RECORD;
    v_perms RECORD;
BEGIN
    v_return := '{}'::jsonb;
    SELECT user_role INTO v_user FROM user_info WHERE user_id = who;
    FOR v_groups IN (SELECT row_to_json(perm) as perm, negative FROM (SELECT * FROM user_role WHERE role_id = ANY(v_user.user_role)) AS t) ORDER BY negative LOOP
        FOR v_perms IN SELECT * FROM json_each_text(v_groups.perm) LOOP
            IF (v_groups.negative = 'f') THEN
                SELECT v_return
                    || jsonb_build_object( v_perms.key, COALESCE((v_return->>v_perms.key)::bit, v_perms.value::bit)::bit | v_perms.value::bit )
                INTO v_return;
            ELSE
                SELECT v_return
                    || jsonb_build_object( v_perms.key, COALESCE((v_return->>v_perms.key)::bit, v_perms.value::bit)::bit & ~v_perms.value::bit )
                INTO v_return;
            END IF;
        END LOOP;
    END LOOP;
    RETURN v_return;
END;
$$ LANGUAGE plpgsql STABLE RETURNS NULL ON NULL INPUT PARALLEL SAFE;


CREATE OR REPLACE FUNCTION update_tag_votes()
  RETURNS trigger AS
$BODY$
BEGIN
    IF TG_OP='DELETE' THEN
        IF OLD.attitude THEN
            UPDATE problem_tag_assoc SET positive = positive - 1 WHERE tag_id = OLD.tag_id AND problem_id = OLD.problem_id;
        ELSE
            UPDATE problem_tag_assoc SET negative = negative - 1 WHERE tag_id = OLD.tag_id AND problem_id = OLD.problem_id;
        END IF;
    ELSEIF TG_OP='INSERT' THEN
        IF NEW.attitude THEN
            UPDATE problem_tag_assoc SET positive = positive + 1 WHERE tag_id = NEW.tag_id AND problem_id = NEW.problem_id;
        ELSE
            UPDATE problem_tag_assoc SET negative = negative + 1 WHERE tag_id = NEW.tag_id AND problem_id = NEW.problem_id;
        END IF;
    ELSEIF NEW.attitude IS DISTINCT FROM OLD.attitude THEN
        IF NEW.attitude THEN
            UPDATE problem_tag_assoc SET positive = positive + 1 WHERE tag_id = NEW.tag_id AND problem_id = NEW.problem_id;
            UPDATE problem_tag_assoc SET negative = negative - 1 WHERE tag_id = NEW.tag_id AND problem_id = NEW.problem_id;
        ELSE
            UPDATE problem_tag_assoc SET positive = positive - 1 WHERE tag_id = NEW.tag_id AND problem_id = NEW.problem_id;
            UPDATE problem_tag_assoc SET negative = negative + 1 WHERE tag_id = NEW.tag_id AND problem_id = NEW.problem_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$BODY$
LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION insert_new_user()
  RETURNS trigger AS
$BODY$
DECLARE
v_email_prefix varchar(64);
v_email_suffix varchar(255);
v_user RECORD;
BEGIN
    v_email_prefix:= lower(split_part(NEW.email,'@',1));
    v_email_suffix:= lower(split_part(NEW.email,'@',2));
    INSERT INTO email_suffix(email_suffix) VALUES (v_email_suffix) ON CONFLICT DO NOTHING;
    INSERT INTO ipaddr(ipaddr) VALUES (NEW.ipaddr) ON CONFLICT DO NOTHING;
    WITH a AS (
        INSERT INTO user_nick(nickname) VALUES (NEW.nickname) RETURNING nick_id
    ), b AS (
        SELECT suffix_id FROM email_suffix WHERE email_suffix = v_email_suffix LIMIT 1
    ), c AS (
        SELECT ipaddr_id FROM ipaddr WHERE ipaddr = NEW.ipaddr LIMIT 1
    ), d AS (
        INSERT INTO user_info(nick_id, email, email_suffix_id, user_ip, "password", gender, qq, phone, real_name, school, words)
         SELECT a.nick_id, v_email_prefix, b.suffix_id, c.ipaddr_id, hash_password(NEW."password"), COALESCE(NEW.gender, 0), NEW.qq, NEW.phone, NEW.real_name, NEW.school, NEW.words FROM a,b,c RETURNING user_id
    ) SELECT a.nick_id as nick_id, d.user_id as user_id FROM a,d INTO v_user;
--    RETURNING * INTO v_user_id
    UPDATE user_nick SET user_id = v_user.user_id WHERE user_nick.nick_id = v_user.nick_id;
    NEW.user_id := v_user.user_id;
    IF NEW.role IS NOT NULL THEN
        UPDATE user_info SET user_role = NEW.role WHERE user_id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$BODY$
LANGUAGE plpgsql;

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
    ELSE
        NEW.nickname := null;
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
    ELSE
        NEW.email := null;
    END IF;

    UPDATE user_info SET gender = COALESCE(NEW.gender, gender), qq = COALESCE(NEW.qq, qq), phone = COALESCE(NEW.phone, phone), real_name = COALESCE(NEW.real_name, real_name), school = COALESCE(NEW.school, school), user_role = COALESCE(NEW.role, user_role), current_badge = COALESCE(NEW.current_badge, current_badge), "password" = COALESCE(hash_password(NEW.password), password), words = COALESCE(NEW.words, words), removed = COALESCE(NEW.removed, removed) WHERE user_id = OLD.user_id;
    RETURN NEW;
END;
$BODY$
LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION upsert_user_danmaku() RETURNS TRIGGER AS
$$
DECLARE
v_ipaddr_id integer;
BEGIN
    INSERT INTO ipaddr(ipaddr) VALUES (NEW.ipaddr) ON CONFLICT DO NOTHING;
    SELECT ipaddr_id FROM ipaddr WHERE ipaddr = NEW.ipaddr LIMIT 1 into v_ipaddr_id;
    INSERT INTO _danmaku(user_id, ipaddr_id, message) VALUES (NEW.user_id, v_ipaddr_id, NEW.message)
        ON conflict(danmaku_id) DO UPDATE SET user_id = NEW.user_id, ipaddr_id = v_ipaddr_id, message = NEW.message, "when" = DEFAULT;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMIT;
