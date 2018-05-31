BEGIN;

CREATE SCHEMA IF NOT EXISTS public; 

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

CREATE TYPE type_user_perm AS (
    "LOGIN"                 bit,
    "CHANGE_PROFILE"        bit,
    "CHANGE_AVATAR"         bit,
    "SUBMIT_CODE"           bit,
    "GET_CODE_SELF"         bit,
    "VIEW_OUTPUT_SELF"      bit,
    "COMMENT"               bit,
    "POST_NEW_POST"         bit,
    "REPLY_POST"            bit,
    "PUBLIC_EDIT"           bit,
    "ADD_PROBLEM"           bit,
    "EDIT_PROBLEM_ALL"      bit,
    "ADD_CONTEST"           bit,
    "EDIT_CONTEST_ALL"      bit,
    "REJUDGE_CONTEST_SELF"  bit,
    "REJUDGE_CONTEST_ALL"   bit,
    "REJUDGE_ALL"           bit,
    "BYPASS_STATISTIC_ALL"  bit,
    "GET_CODE_ALL"          bit,
    "VIEW_OUTPUT_ALL"       bit,
    "MANAGE_ROLE"           bit,
    "SUPER_ADMIN"           bit
);

CREATE TABLE user_role (
    role_id                 serial          PRIMARY KEY,
    title                   varchar(16)     UNIQUE NOT NULL,
    description             text,
    perm                    type_user_perm  NOT NULL,
    negative                boolean         NOT NULL
);

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
    removed         boolean         DEFAULT 'f'::boolean,
    UNIQUE (email, email_suffix_id)
);
CREATE UNIQUE INDEX ON user_info(nick_id, "password");

CREATE UNIQUE INDEX ON user_info(email, email_suffix_id, "password");

ALTER TABLE user_nick ADD FOREIGN KEY (user_id) REFERENCES user_info(user_id) DEFERRABLE INITIALLY DEFERRED;

CREATE TABLE user_api (
    user_id         integer         NOT NULL REFERENCES user_info(user_id),
    enabled         boolean         NOT NULL DEFAULT 't'::boolean,
    api_name        varchar(36),
    api_key         varchar(32)     NOT NULL CHECK(length(api_key)=32),
    -- TODO: find a better way or logic
    api_hashed      varchar(64)     NOT NULL CHECK(length(api_hashed)=64),
    since           timestamp       DEFAULT current_timestamp
);

CREATE UNIQUE INDEX ON user_api (api_key);

CREATE TYPE type_problem_restriction AS (
    "NO_VIEW_BEFORE_START"          bit,
    "NO_RESULT_BEFORE_END_SELF"     bit,
    "NO_RESULT_BEFORE_END_OTHERS"   bit,
    "NO_VIEW_BEFORE_END"            bit,
    "NO_RESULT_BEFORE_END_ALL"      bit
);

CREATE TABLE problem_restriction (
    restriction_id  serial          PRIMARY KEY,
    title           varchar(16)     NOT NULL,
    description     text,
    enabled         boolean         NOT NULL DEFAULT 't'::boolean,
    during          tsrange         NOT NULL,
    perm            type_problem_restriction NOT NULL,
    insiders        integer ARRAY   NOT NULL DEFAULT '{}'
);

CREATE TABLE problem_tags (
    tag_id          serial      PRIMARY KEY,
    tag_name        text        UNIQUE NOT NULL CHECK(length(tag_name) > 1)
);

CREATE UNIQUE INDEX ON problem_tags(tag_name);

CREATE TABLE problems (
    problem_id      serial          PRIMARY KEY,
    title           varchar(255)    NOT NULL,               -- content stores in file (use svn)
    "ac"            integer         NOT NULL DEFAULT 0,
    "all"           integer         NOT NULL DEFAULT 0,
    restriction_id  integer         REFERENCES problem_restriction(restriction_id),
    special_judge   boolean         NOT NULL DEFAULT 'f'::boolean,
    detail_judge    boolean         NOT NULL DEFAULT 't'::boolean,
    cases           integer         NOT NULL DEFAULT 1,
    time_limit      integer         NOT NULL DEFAULT 1000,
    memory_limit    integer         NOT NULL DEFAULT 10000,
    "level"         integer
);

CREATE TABLE problem_tag_assoc (
    tag_id      integer references problem_tags(tag_id),
    problem_id  integer references problems(problem_id),
    official    boolean not null default 'f'::boolean,
    positive    integer not null default 0,
    negative    integer not null default 0,
    primary key (tag_id, problem_id)
);

CREATE TABLE problem_tag_votes (
    user_id     integer references user_info(user_id),
    tag_id      integer references problem_tags(tag_id),
    problem_id  integer references problems(problem_id),
    attitude    boolean not null,
    primary key (user_id, tag_id, problem_id)
);

CREATE TABLE contests (
    contest_id      serial          PRIMARY KEY,
    title           varchar(255)    NOT NULL,
    during          tsrange         NOT NULL,
    description     text,
    extra           boolean         NOT NULL DEFAULT 'f'::boolean,
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
    since           timestamp       DEFAULT current_timestamp,
    deleted_a       boolean         NOT NULL DEFAULT 'f'::boolean,
    deleted_b       boolean         NOT NULL DEFAULT 'f'::boolean
);

CREATE INDEX ON messages(a, b);

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
    status_id       integer         NOT NULL REFERENCES solution_status,
    language        integer,
    code_size       integer,
    shared          boolean         NOT NULL DEFAULT 'f'::boolean,
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
    since           timestamp       DEFAULT current_timestamp,
    updated         timestamp       DEFAULT current_timestamp,
    ipaddr_id       integer         REFERENCES ipaddr(ipaddr_id)
);

CREATE UNLOGGED TABLE _danmaku (
    danmaku_id serial primary key,
    user_id integer,
    ipaddr_id integer,
    message text,
    "when" timestamp default current_timestamp
);

COMMIT;
