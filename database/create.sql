CREATE TABLE email_suffix (
    suffix_id       serial          PRIMARY KEY,
    email_suffix    varchar(255)    UNIQUE NOT NULL -- store lower string only
);

CREATE UNIQUE INDEX ON email_suffix(email_suffix);

CREATE TABLE ipaddr (
    ipaddr_id       serial          PRIMARY KEY,    -- ip address will be handled by a middleware
    ipaddr          inet            UNIQUE NOT NULL
);

CREATE UNIQUE INDEX ON ipaddr(ipaddr);

CREATE TABLE user_nick (
    nick_id         serial          PRIMARY KEY,
    nickname        varchar(20)     UNIQUE NOT NULL, -- case insensitive
    user_id         integer         -- create constraint after user table created !!NOTE: recursive reference
);

CREATE UNIQUE INDEX lower_nickname_idx ON user_nick ((lower(nickname)));

CREATE TABLE user_role (
    role_id         serial          PRIMARY KEY,
    title           varchar(16)     UNIQUE NOT NULL,
    description     text,
    permission      bit(20)         NOT NULL
    -- can_login, can_change_profile, can_submit, can_view_self_code, can_view_self_output, can_view_others_code
    -- , can_view_other_output, can_view_test_input, can_view_test_output, can_bypass_contest_limit, can_bypass_all_limit
    -- , can_add_problem, can_add_contest, can_edit_problem, can_edit_contest, can_rejudge_problem
    -- , can_rejudge_contest, can_change_permission, can_do_anything
);

ALTER SEQUENCE user_role_role_id_seq RESTART WITH 100;

INSERT INTO user_role (role_id, title, description, permission) VALUES (1, 'Default Group', 'This is a default user group.', '11110000000000000000');
INSERT INTO user_role (role_id, title, description, permission) VALUES (9, 'Super Admin', 'Super Admin', '11111111111111111111');

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
    submit_ac       integer         DEFAULT 0,
    submit_all      integer         DEFAULT 0,
    role_id         integer         DEFAULT 1 NOT NULL REFERENCES user_role(role_id) ,
    current_badge   integer         DEFAULT 0,
    achievement     integer ARRAY,
    join_time       timestamp       DEFAULT current_timestamp,
    is_removed      boolean         DEFAULT 'f'::boolean,
    UNIQUE (email, email_suffix_id)
);
CREATE UNIQUE INDEX ON user_info(nick_id, "password");

CREATE UNIQUE INDEX ON user_info(email, email_suffix_id, "password");

ALTER TABLE user_nick ADD FOREIGN KEY (user_id) REFERENCES user_info(user_id) DEFERRABLE INITIALLY DEFERRED;

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
    perm            BIT(6)          NOT NULL DEFAULT '10000',        -- no_view_before_start, no_all_result_before_end, no_other_result_before_end, no_view_before_end, no_all_result_before_end
    insiders        integer ARRAY                                    -- array
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

CREATE TABLE status_code (
    status_id       serial          PRIMARY KEY,
    msg_short       varchar(10)     NOT NULL,
    msg_cn          varchar(25)     NOT NULL,
    msg_en          varchar(40)     NOT NULL
);

CREATE TABLE solutions (
    solution_id     serial          PRIMARY KEY,
    user_id         integer         NOT NULL REFERENCES user_info(user_id),
    problem_id      integer         NOT NULL REFERENCES problems(problem_id),
    status_id       integer         REFERENCES status_code,
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

INSERT INTO user_info(nick_id, user_ip, password, email, email_suffix_id, role_id) VALUES (1, 1, hash_password('123465'), 'sunrisefox', 1, 9);

COMMIT;

BEGIN;

CREATE OR REPLACE VIEW users AS
    SELECT user_info.user_id, nickname, gender, concat(email, '@', email_suffix.email_suffix) as email, last_login, submit_ac, submit_all, ipaddr, user_info.role_id, title as role_type, description, "permission", qq, phone, real_name, school, current_badge, is_removed, user_info."password" as "password" FROM user_info
    INNER JOIN email_suffix ON email_suffix.suffix_id = user_info.email_suffix_id
    INNER JOIN ipaddr ON ipaddr.ipaddr_id = user_info.user_ip
    INNER JOIN user_nick ON user_nick.nick_id = user_info.nick_id
    INNER JOIN user_role ON user_role.role_id = user_info.role_id;

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
        INSERT INTO user_info(nick_id, email, email_suffix_id, user_ip, "password", gender, qq, phone, real_name, school) SELECT a.nick_id, v_email_prefix, b.suffix_id, c.ipaddr_id, hash_password(NEW."password"), COALESCE(NEW.gender, 0), NEW.qq, NEW.phone, NEW.real_name, NEW.school  FROM a,b,c RETURNING user_id
    ) SELECT a.nick_id as nick_id, d.user_id as user_id FROM a,d INTO v_user;
--    RETURNING * INTO v_user_id
    UPDATE user_nick SET user_id = v_user.user_id WHERE user_nick.nick_id = v_user.nick_id;
    NEW.user_id := v_user.user_id;
    RETURN NEW;
END;
$BODY$
LANGUAGE plpgsql;

CREATE TRIGGER insert_users INSTEAD OF INSERT ON users FOR EACH ROW EXECUTE PROCEDURE insert_new_user();

COMMIT;
