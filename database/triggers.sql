BEGIN;

CREATE TRIGGER after_insert_problem_tag_votes AFTER INSERT ON problem_tag_votes FOR EACH ROW EXECUTE PROCEDURE update_tag_votes();
CREATE TRIGGER after_update_problem_tag_votes AFTER UPDATE ON problem_tag_votes FOR EACH ROW EXECUTE PROCEDURE update_tag_votes();
CREATE TRIGGER after_delete_problem_tag_votes AFTER DELETE ON problem_tag_votes FOR EACH ROW EXECUTE PROCEDURE update_tag_votes();

CREATE TRIGGER insert_users INSTEAD OF INSERT ON users FOR EACH ROW EXECUTE PROCEDURE insert_new_user();
CREATE TRIGGER update_users INSTEAD OF UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_existing_user();
CREATE TRIGGER insert_danmaku INSTEAD OF INSERT ON user_danmaku FOR EACH ROW EXECUTE PROCEDURE upsert_user_danmaku();


CREATE TRIGGER insert_solutions AFTER INSERT ON solutions FOR EACH ROW EXECUTE PROCEDURE update_problem_sol();
CREATE TRIGGER update_solutions AFTER UPDATE ON solutions FOR EACH ROW EXECUTE PROCEDURE update_problem_sol();

CREATE TRIGGER after_insert_post_vote AFTER INSERT ON post_vote FOR EACH ROW EXECUTE PROCEDURE update_post_vote();
CREATE TRIGGER after_update_post_vote AFTER UPDATE ON post_vote FOR EACH ROW EXECUTE PROCEDURE update_post_vote();
CREATE TRIGGER after_delete_post_vote AFTER DELETE ON post_vote FOR EACH ROW EXECUTE PROCEDURE update_post_vote();

CREATE TRIGGER after_insert_reply_vote AFTER INSERT ON reply_vote FOR EACH ROW EXECUTE PROCEDURE update_reply_vote();
CREATE TRIGGER after_delete_reply_vote AFTER DELETE ON reply_vote FOR EACH ROW EXECUTE PROCEDURE update_reply_vote();

CREATE TRIGGER after_insert_post AFTER INSERT ON post FOR EACH ROW EXECUTE PROCEDURE insert_update_post();
CREATE TRIGGER after_update_post AFTER UPDATE ON post FOR EACH ROW EXECUTE PROCEDURE insert_update_post();

COMMIT;
