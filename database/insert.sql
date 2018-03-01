

-- BEGIN (ON ERROR ROLL BACK)

INSERT INTO user_nick(nickname) VALUES ('SunrisFox') RETURNING nick_id;

INSERT INTO email_suffix (email_suffix) VALUES (lower('qq.com')) ON CONFLICT DO NOTHING RETURNING suffix_id ;

-- if (res.rows.length === 0 || res.rows[0].suffix_id === undefined)

SELECT suffix_id FROM email_suffix WHERE email_suffix = lower('qq.com');

INSERT INTO ipaddr(ipaddr) VALUES ('127.0.0.1') ON CONFLICT DO NOTHING RETURNING ipaddr_id;

-- if (res.rows.length === 0 || res.rows[0].ipaddr_id === undefined)

SELECT * FROM ipaddr WHERE ipaddr = '127.0.0.1';

INSERT INTO users(nick_id, user_ip, password, gender, email, email_suffix_id, qq, phone, real_name, school) VALUES ('nick_id', 'ipaddr_id', 'md5_hashed_password', 0, 'sunrisefox', 'suffix_id', null, null, null, 'NKU') RETURNING user_id;

UPDATE user_nick SET user_id = 'user_id' WHERE nick_id = 'nick_id';

-- COMMIT

-- BEGIN

SELECT * FROM user_nick WHERE lower(user_nick) = lower('SunriseFox');

-- if (res.rows.length === 0) {

INSERT INTO user_nick(nickname, user_id) VALUES ('SunriseFox', 'user_id') RETURNING nick_id;

UPDATE users SET nick_id = 'nick_id' WHERE user_id = 'user_id';

-- } else if ( res.rows[0].user_id === user_id ) {

UPDATE users SET nick_id = 'nick_id' WHERE user_id = 'user_id';

-- }

-- COMMIT

-- BEGIN

INSERT INTO solutions()

-- COMMIT

-- 插入触发器 过程 查询视图 ~~
