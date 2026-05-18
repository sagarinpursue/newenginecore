CREATE TRIGGER insert_user_refs_trigger
AFTER INSERT ON auth.users FOR EACH ROW
EXECUTE FUNCTION auth.insert_user_refs_record ();