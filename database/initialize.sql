BEGIN;

ALTER SEQUENCE user_role_role_id_seq RESTART WITH 10;

INSERT INTO user_role (role_id, title, description, perm, negative) VALUES (1, 'default', 'default user group.', ('1','1','0','0','0','0','0','0','0','0','0','0','0','0','0','0','0','0','0','0','0','0'), 'f');

INSERT INTO user_role (role_id, title, description, perm, negative) VALUES (2, 'emailVerified', 'email verified users', ('0','1','1','1','1','0','1','1','1','0','0','0','0','0','0','0','0','0','0','0','0','0'), 'f');

INSERT INTO user_role (role_id, title, description, perm, negative) VALUES (3, 'muted', 'Muted from society', ('0','1','1','0','0','0','1','1','1','1','1','0','1','0','0','0','0','0','0','0','0','0'), 't');

INSERT INTO user_role (role_id, title, description, perm, negative) VALUES (4, 'banned', 'Read Only',('0','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1'), 't');

INSERT INTO user_role (role_id, title, description, perm, negative) VALUES (5, 'identityVerified', 'Real-name Authentication Passed', ('1','1','1','1','1','0','1','1','1','1','0','0','0','0','0','0','0','0','0','0','0','0'), 'f');

INSERT INTO user_role (role_id, title, description, perm, negative) VALUES (9, 'superAdmin', 'Super Admin', ('1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1'), 'f');

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

INSERT INTO solution_status (status_id, msg_short, msg_cn, msg_en) VALUES
('100', 'RU', '运行中', 'Running'),
('101', 'CE', '编译错误', 'Compile Error'),
('120', 'CI', '正在编译', 'Compiling'),
('102', 'WA', '答案错误', 'Wrong Answer'),
('103', 'RE', '运行错误', 'Runtime Error'),
('104', 'MLE', '内存超限', 'Memory Limit Exceed'),
('105', 'TLE', '时间超限', 'Time Limit Exceed'),
('106', 'OLE', '输出超限', 'Output Limit Exceed'),
('107', 'AC', '答案正确', 'Accepted'),
('108', 'PE', '格式错误', 'Presentation Error'),
('109', 'FL', '函数调用不合法', 'Function Limit Exceed'),
('118', 'SE', '未知错误', 'System Error');

COMMIT;

SET custom_settings.hash_prefix = 'not production';

ALTER SYSTEM SET custom_settings.hash_prefix = 'not production';

SELECT pg_reload_conf();
