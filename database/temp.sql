BEGIN;

CREATE OR REPLACE VIEW users AS
    SELECT user_info.user_id, CASE WHEN removed THEN '<removed>'::character varying(20) ELSE nickname END as nickname, gender, concat(CASE WHEN removed THEN '<removed>' ELSE email END, '@', email_suffix.email_suffix) as email, last_login, submit_ac, submit_all, ipaddr, user_info.user_role as role, words, qq, phone, real_name, school, current_badge, removed, user_info."password" as "password", credits, cal_perm(user_info.user_id) as perm, null as old_password FROM user_info
    INNER JOIN email_suffix ON email_suffix.suffix_id = user_info.email_suffix_id
    INNER JOIN ipaddr ON ipaddr.ipaddr_id = user_info.user_ip
    INNER JOIN user_nick ON user_nick.nick_id = user_info.nick_id;

COMMIT;

BEGIN;

UPDATE users SET removed = 't'::boolean;

CREATE OR REPLACE VIEW users AS
    SELECT user_info.user_id, CASE WHEN removed THEN '<removed>'::character varying(20) ELSE nickname END as nickname, gender, concat(CASE WHEN removed THEN '<removed>' ELSE email END, '@', email_suffix.email_suffix) as email, last_login, submit_ac, submit_all, ipaddr, user_info.user_role as role, words, qq, phone, real_name, school, current_badge, removed, user_info."password" as "password", credits, cal_perm(user_info.user_id) as perm, null as old_password FROM user_info
    INNER JOIN email_suffix ON email_suffix.suffix_id = user_info.email_suffix_id
    INNER JOIN ipaddr ON ipaddr.ipaddr_id = user_info.user_ip
    INNER JOIN user_nick ON user_nick.nick_id = user_info.nick_id;

SELECT * FROM users;

ROLLBACK;

