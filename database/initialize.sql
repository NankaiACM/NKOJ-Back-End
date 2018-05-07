BEGIN;

ALTER SEQUENCE user_role_role_id_seq RESTART WITH 10;

INSERT INTO user_role (role_id, title, description, perm, negative) VALUES (1, 'Default Group', 'This is a default user group.', ('1','0','0','1','1','0','0','0','0','0','0','0','0','0','0','0','0','0','0','0','0','0'), 'f');

INSERT INTO user_role (role_id, title, description, perm, negative) VALUES (2, 'Muted', 'Muted from sociaty', ('0','1','1','0','0','0','1','1','1','1','1','0','1','0','0','0','0','0','0','0','0','0'), 't');

INSERT INTO user_role (role_id, title, description, perm, negative) VALUES (3, 'Banned', 'Read Only',('0','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1'), 't');

INSERT INTO user_role (role_id, title, description, perm, negative) VALUES (4, 'Verified Users', 'Real-name Authentication Passed', ('1','1','1','1','1','0','1','1','1','1','0','0','0','0','0','0','0','0','0','0','0','0'), 'f');

INSERT INTO user_role (role_id, title, description, perm, negative) VALUES (9, 'Super Admin', 'Super Admin', ('1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1'), 'f');

ALTER SEQUENCE problems_problem_id_seq RESTART WITH 1001;

ALTER SEQUENCE contests_contest_id_seq RESTART WITH 1001;

ALTER SEQUENCE user_nick_nick_id_seq RESTART WITH 1;

INSERT INTO user_nick(nickname, user_id) VALUES ('SunriseFox', 1);

ALTER SEQUENCE ipaddr_ipaddr_id_seq RESTART WITH 1;

INSERT INTO ipaddr(ipaddr) VALUES ('::ffff:127.0.0.1');

ALTER SEQUENCE email_suffix_suffix_id_seq RESTART WITH 1;

INSERT INTO email_suffix(email_suffix) VALUES ('qq.com');

ALTER SEQUENCE user_info_user_id_seq RESTART WITH 1;

INSERT INTO user_info(nick_id, user_ip, password, email, email_suffix_id, user_role) VALUES (1, 1, hash_password('123465'), 'sunrisefox', 1, '{1,9}'::integer ARRAY);

CREATE SEQUENCE users_defaultname_seq OWNED BY user_info.user_id;

ALTER SEQUENCE IF EXISTS _danmaku_danmaku_id_seq MAXVALUE 1000 CYCLE;

COMMIT;

SET custom_settings.hash_prefix = 'not production';

ALTER SYSTEM SET custom_settings.hash_prefix = 'not production';

SELECT pg_reload_conf();