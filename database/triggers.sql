BEGIN;

CREATE TRIGGER after_insert_problem_tag_votes AFTER INSERT ON problem_tag_votes FOR EACH ROW EXECUTE PROCEDURE update_tag_votes();
CREATE TRIGGER after_update_problem_tag_votes AFTER UPDATE ON problem_tag_votes FOR EACH ROW EXECUTE PROCEDURE update_tag_votes();
CREATE TRIGGER after_delete_problem_tag_votes AFTER DELETE ON problem_tag_votes FOR EACH ROW EXECUTE PROCEDURE update_tag_votes();

CREATE TRIGGER insert_users INSTEAD OF INSERT ON users FOR EACH ROW EXECUTE PROCEDURE insert_new_user();
CREATE TRIGGER update_users INSTEAD OF UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_existing_user();
CREATE TRIGGER insert_danmaku INSTEAD OF INSERT ON user_danmaku FOR EACH ROW EXECUTE PROCEDURE upsert_user_danmaku();


CREATE TRIGGER insert_solutions AFTER INSERT ON solutions FOR EACH ROW EXECUTE PROCEDURE update_problem_sol();
CREATE TRIGGER update_solutions AFTER UPDATE ON solutions FOR EACH ROW EXECUTE PROCEDURE update_problem_sol();

-- TODO: delete this...
CREATE TRIGGER update_solutions BEFORE DELETE ON problems FOR EACH ROW EXECUTE PROCEDURE delete_problem();

COMMIT;
