BEGIN;

CREATE OR REPLACE VIEW user_perm AS SELECT user_id, cal_perm(user_id) as perm FROM user_info;

CREATE OR REPLACE VIEW users AS
    SELECT user_info.user_id, CASE WHEN removed THEN '<removed>'::character varying(20) ELSE nickname END as nickname, gender, concat(CASE WHEN removed THEN '<removed>' ELSE email END, '@', email_suffix.email_suffix) as email, last_login, submit_ac, submit_all, ipaddr, user_info.user_role as role, words, qq, phone, real_name, school, current_badge, removed, user_info."password" as "password", credits, cal_perm(user_info.user_id) as perm, null as old_password FROM user_info
    INNER JOIN email_suffix ON email_suffix.suffix_id = user_info.email_suffix_id
    INNER JOIN ipaddr ON ipaddr.ipaddr_id = user_info.user_ip
    INNER JOIN user_nick ON user_nick.nick_id = user_info.nick_id;

CREATE OR REPLACE VIEW user_danmaku AS
    SELECT message, _danmaku.user_id, CASE WHEN _danmaku.user_id IS NOT NULL THEN nickname ELSE host(ipaddr.ipaddr) END AS nickname, ipaddr.ipaddr, "when" FROM _danmaku
    LEFT OUTER JOIN users ON _danmaku.user_id = users.user_id
    INNER JOIN ipaddr ON _danmaku.ipaddr_id = ipaddr.ipaddr_id;

CREATE OR REPLACE VIEW user_solutions AS
    SELECT solutions.*, solution_status.msg_short, solution_status.msg_en, solution_status.msg_cn, users.nickname
    FROM solutions
    INNER JOIN solution_status ON solutions.status_id = solution_status.status_id
    INNER JOIN users ON solutions.user_id = users.user_id;

-- TODO: add new table to map language_id with language?

CREATE OR REPLACE VIEW user_contests AS
    SELECT contests.contest_id, contests.title, contests.description, contests.during, contests.perm, contests.private,
    COALESCE(a.problems, '{}'::json ARRAY) AS problems
    FROM contests
    LEFT OUTER JOIN (
        SELECT contest_id, array_agg(
            json_build_object('pid', problem_id, 'ac', submit_ac, 'all', submit_all)
        )
        as problems FROM contest_problems GROUP BY contest_problems.contest_id
    ) a ON a.contest_id = contests.contest_id;

COMMIT;
