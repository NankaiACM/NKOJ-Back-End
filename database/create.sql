CREATE TABLE email_suffix (
    suffix_id       serial          PRIMARY KEY,
    email_suffix    varchar(255)    UNIQUE NOT NULL -- store lower string only
);

CREATE UNIQUE INDEX ON email_suffix(email_suffix);

CREATE TABLE ipaddr (
    ipaddr_id       serial          PRIMARY KEY,    -- ip address will be handled by a middleware
    ipaddr          inet            UNIQUE NOT NULL,
    banned          boolean         NOT NULL DEFAULT 'f'::boolean
);

CREATE UNIQUE INDEX ON ipaddr(ipaddr);

CREATE TABLE user_nick (
    nick_id         serial          PRIMARY KEY,
    nickname        varchar(20)     UNIQUE NOT NULL, -- case insensitive
    user_id         integer,        -- create constraint after user table created !!NOTE: recursive reference
    since           timestamp       DEFAULT current_timestamp
);

CREATE UNIQUE INDEX lower_nickname_idx ON user_nick ((lower(nickname)));

CREATE TABLE user_role (
    role_id         serial          PRIMARY KEY,
    title           varchar(16)     UNIQUE NOT NULL,
    description     text,
    perm      bit(25)         NOT NULL,
    negative        boolean         NOT NULL
    -- basic:
    -- can_LOGIN(0), can_CHANGE_PROFILE(1), can_CHANGE_AVATAR(2)
    -- code:
    -- can_SUBMIT_CODE(3), can_GET_CODE_SELF(4), can_VIEW_OUTPUT_SELF(5)
    -- discuss:
    -- can_COMMENT(6), can_POST_NEW_POST(7), can_REPLY_POST(8), can_PUBLIC_EDIT(9)
    -- problem:
    -- can_ADD_PROBLEM & can_EDIT_PROBLEM_SELF & can_GET_CODE_OWNED & BYPASS_STATISTIC_OWNED(10), can_EDIT_PROBLEM_ALL(11)
    -- contest:
    -- can_ADD_CONTEST & can_EDIT_CONTEST_SELF(12), can_EDIT_CONTEST_ALL(13)
    -- judge:
    -- can_REJUDGE_CONTEST_SELF(14), can_REJUDGE_CONTEST_ALL(15), can_REJUDGE_ALL(16)
    -- admin:
    -- BYPASS_STATISTIC_ALL(17), can_GET_CODE_ALL(18), can_VIEW_OUTPUT_ALL(19), can_MANAGE_ROLE(20), can_SUPER_ADMIN(21)
);

ALTER SEQUENCE user_role_role_id_seq RESTART WITH 10;

INSERT INTO user_role (role_id, title, description, perm, negative) VALUES (1, 'Default Group', 'This is a default user group.', '1001100000000000000000000', 'f');

INSERT INTO user_role (role_id, title, description, perm, negative) VALUES (2, 'Muted', 'Muted from sociaty', '0110001111101000000000011', 't');

INSERT INTO user_role (role_id, title, description, perm, negative) VALUES (3, 'Banned', 'Read Only','0111111111111111111111111', 't');

INSERT INTO user_role (role_id, title, description, perm, negative) VALUES (4, 'Verified Users', 'Real-name Authentication Passed', '1111101111000000000000000', 'f');

INSERT INTO user_role (role_id, title, description, perm, negative) VALUES (9, 'Super Admin', 'Super Admin', '1111111111111111111111111', 'f');

CREATE TABLE user_info (
    user_id         serial          PRIMARY KEY,
    nick_id         integer         NOT NULL REFERENCES user_nick(nick_id),
    user_ip         integer         NOT NULL REFERENCES ipaddr(ipaddr_id),
    last_login      timestamp       DEFAULT current_timestamp,  -- store failed tries in redis
    password        varchar(50),
    gender          smallint        NOT NULL DEFAULT 0 CHECK (gender < 4), -- iso standard
    email           varchar(64)     NOT NULL,    -- lower case only
    email_suffix_id integer         NOT NULL REFERENCES email_suffix(suffix_id),
    qq              varchar(15),
    phone           varchar(15),
    real_name       varchar(20),
    school          varchar(80),
    words           varchar(100),
    credits         integer         DEFAULT 0,
    submit_ac       integer         DEFAULT 0,
    submit_all      integer         DEFAULT 0,
    user_role       integer ARRAY   DEFAULT '{1}'::integer ARRAY NOT NULL,
    current_badge   integer         DEFAULT 0,
    achievement     integer ARRAY,
    join_time       timestamp       DEFAULT current_timestamp,
    is_removed      boolean         DEFAULT 'f'::boolean,
    UNIQUE (email, email_suffix_id)
);
CREATE UNIQUE INDEX ON user_info(nick_id, "password");

CREATE UNIQUE INDEX ON user_info(email, email_suffix_id, "password");

ALTER TABLE user_nick ADD FOREIGN KEY (user_id) REFERENCES user_info(user_id) DEFERRABLE INITIALLY DEFERRED;

CREATE OR REPLACE FUNCTION cal_perm (who integer) RETURNS bit(25) AS $$
DECLARE
 "role" integer ARRAY;
 ret bit(25) ;
 r RECORD;
BEGIN
 SELECT user_role INTO "role" FROM user_info WHERE user_id = who AND is_removed = 'f'::boolean;
 ret := '0000000000000000000000000';
 FOR r IN SELECT perm, negative FROM user_role WHERE role_id = ANY("role") ORDER BY negative LOOP
    IF(r.negative = 'f') THEN ret := ret | r.perm;
    ELSE ret := ret & ~r.perm;
    END IF;
 END LOOP;
 RETURN ret;
END;
$$ LANGUAGE plpgsql STABLE RETURNS NULL ON NULL INPUT PARALLEL SAFE;

CREATE VIEW user_perm AS SELECT user_id, cal_perm(user_id) as perm FROM user_info;

CREATE TABLE user_apikey (
    user_id         integer         NOT NULL REFERENCES user_info(user_id),
    enabled         boolean         NOT NULL DEFAULT 'f'::boolean,
    app_key         varchar(50)     UNIQUE,
    app_secret      varchar(50)
);

CREATE UNIQUE INDEX ON user_apikey(app_key);

CREATE TABLE problem_restriction (
    restriction_id  serial          PRIMARY KEY,
    title           varchar(16)     NOT NULL,
    description     text,
    enabled         boolean         NOT NULL DEFAULT 'f'::boolean,
    during          tsrange,
    perm            BIT(6)          NOT NULL DEFAULT '10000',
    -- all_NO_VIEW_BEFORE_START(0)
    -- insider_NO_RESULT_BEFORE_END_SELF(1)
    -- insider_NO_RESULT_BEFORE_END_OTHERS(2)
    -- outsider_NO_VIEW_BEFORE_END(3)
    -- outsider_NO_RESULT_BEFORE_END_ALL(4)
    insiders        integer ARRAY
);

CREATE TABLE problems (
    problem_id      serial          PRIMARY KEY,
    title           varchar(255)    NOT NULL,               -- content stores in file (use svn)
    submit_ac       integer         NOT NULL DEFAULT 0,
    submit_all      integer         NOT NULL DEFAULT 0,
    restriction_id  integer         REFERENCES problem_restriction(restriction_id)
);


CREATE TABLE contests (
    contest_id      serial          PRIMARY KEY,
    title           varchar(255)    NOT NULL,
    restriction_id  integer         REFERENCES problem_restriction(restriction_id),
    problems        integer ARRAY
);

CREATE TABLE contest_problems (
    contest_id      integer         NOT NULL REFERENCES contests(contest_id),
    problem_id      integer         NOT NULL REFERENCES problems(problem_id),
    submit_ac       integer         NOT NULL DEFAULT 0,
    submit_all      integer         NOT NULL DEFAULT 0
);

CREATE TABLE contest_users (
    contest_id      integer         NOT NULL REFERENCES contests(contest_id),
    user_id         integer         NOT NULL REFERENCES user_info(user_id),
    status          jsonb           NOT NULL DEFAULT '{}'::jsonb,      -- {"pid" : {"a": 1, "b": 2} }
    PRIMARY KEY(contest_id, user_id)
);

CREATE TABLE messages (
    message_id      serial          PRIMARY KEY,
    a               integer         NOT NULL REFERENCES user_info(user_id),
    b               integer         NOT NULL REFERENCES user_info(user_id),
    "when"          timestamp       DEFAULT current_timestamp,
    deleted_a       boolean         NOT NULL DEFAULT 'f'::boolean,
    deleted_B       boolean         NOT NULL DEFAULT 'f'::boolean
);

CREATE UNIQUE INDEX ON messages(a, b);

CREATE TABLE solution_status (
    status_id       serial          PRIMARY KEY,
    msg_short       varchar(10)     NOT NULL,
    msg_cn          varchar(25)     NOT NULL,
    msg_en          varchar(40)     NOT NULL
);

CREATE TABLE solutions (
    solution_id     serial          PRIMARY KEY,
    user_id         integer         NOT NULL REFERENCES user_info(user_id),
    problem_id      integer         NOT NULL REFERENCES problems(problem_id),
    status_id       integer         REFERENCES solution_status,
    language        integer,
    code_size       integer,
    "time"          integer,
    "memory"        integer,
    "when"          timestamp       DEFAULT current_timestamp,
    ipaddr_id       integer         REFERENCES ipaddr(ipaddr_id)
);

CREATE TABLE discussions (
    post_id         serial          PRIMARY KEY,
    parent_post_id  integer         NOT NULL DEFAULT 0,
    title           text,
    content         text,
    "when"          timestamp       DEFAULT current_timestamp,
    updated         timestamp       DEFAULT current_timestamp,
    ipaddr_id       integer         REFERENCES ipaddr(ipaddr_id)
);

SET custom_settings.hash_prefix = 'not production';
ALTER SYSTEM SET custom_settings.hash_prefix = 'not production';
SELECT pg_reload_conf();

BEGIN;

CREATE OR REPLACE FUNCTION hash_password(pwd text)
RETURNS text LANGUAGE SQL AS $$
    SELECT md5(current_setting('custom_settings.hash_prefix') || pwd)::text;
$$;

ALTER SEQUENCE user_nick_nick_id_seq RESTART WITH 1;

INSERT INTO user_nick(nickname, user_id) VALUES ('SunriseFox', 1);

ALTER SEQUENCE ipaddr_ipaddr_id_seq RESTART WITH 1;

INSERT INTO ipaddr(ipaddr) VALUES ('127.0.0.1');

ALTER SEQUENCE email_suffix_suffix_id_seq RESTART WITH 1;

INSERT INTO email_suffix(email_suffix) VALUES ('qq.com');

ALTER SEQUENCE user_info_user_id_seq RESTART WITH 1;

INSERT INTO user_info(nick_id, user_ip, password, email, email_suffix_id, user_role) VALUES (1, 1, hash_password('123465'), 'sunrisefox', 1, '{1,9}'::integer ARRAY);

COMMIT;

BEGIN;

CREATE OR REPLACE VIEW users AS
    SELECT user_info.user_id, nickname, gender, concat(email, '@', email_suffix.email_suffix) as email, last_login, submit_ac, submit_all, ipaddr, user_info.user_role, words, qq, phone, real_name, school, current_badge, is_removed, user_info."password" as "password", credits, cal_perm(user_info.user_id) as perm, null as old_password FROM user_info
    INNER JOIN email_suffix ON email_suffix.suffix_id = user_info.email_suffix_id
    INNER JOIN ipaddr ON ipaddr.ipaddr_id = user_info.user_ip
    INNER JOIN user_nick ON user_nick.nick_id = user_info.nick_id;
--    INNER JOIN user_role ON user_role.role_id = user_info.role_id;

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
        INSERT INTO user_info(nick_id, email, email_suffix_id, user_ip, "password", gender, qq, phone, real_name, school, words) SELECT a.nick_id, v_email_prefix, b.suffix_id, c.ipaddr_id, hash_password(NEW."password"), COALESCE(NEW.gender, 0), NEW.qq, NEW.phone, NEW.real_name, NEW.school, NEW.words FROM a,b,c RETURNING user_id
    ) SELECT a.nick_id as nick_id, d.user_id as user_id FROM a,d INTO v_user;
--    RETURNING * INTO v_user_id
    UPDATE user_nick SET user_id = v_user.user_id WHERE user_nick.nick_id = v_user.nick_id;
    NEW.user_id := v_user.user_id;
    RETURN NEW;
END;
$BODY$
LANGUAGE plpgsql;

CREATE TRIGGER insert_users INSTEAD OF INSERT ON users FOR EACH ROW EXECUTE PROCEDURE insert_new_user();

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

    UPDATE user_info SET gender = COALESCE(NEW.gender, gender), qq = NEW.qq, phone = NEW.phone, real_name = NEW.real_name, school = NEW.school, user_role = COALESCE(NEW.user_role, user_role), current_badge = COALESCE(NEW.current_badge, current_badge), "password" = COALESCE(hash_password(NEW.password), password), words = NEW.words WHERE user_id = OLD.user_id;
    RETURN NEW;
END;
$BODY$
LANGUAGE plpgsql;

CREATE TRIGGER update_users INSTEAD OF UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_existing_user();

COMMIT;
