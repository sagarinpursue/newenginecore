CREATE OR REPLACE FUNCTION auth.insert_user_refs_record()
RETURNS TRIGGER AS $$
BEGIN
  BEGIN
    INSERT INTO public.user_refs (user_id, user_account_id, user_name)
    VALUES (NEW.id, '00000000-0000-0000-0000-000000000000', NEW.email);
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Error when inserting record: %', SQLERRM;
  END;
 	RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER insert_user_refs_trigger
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION auth.insert_user_refs_record();