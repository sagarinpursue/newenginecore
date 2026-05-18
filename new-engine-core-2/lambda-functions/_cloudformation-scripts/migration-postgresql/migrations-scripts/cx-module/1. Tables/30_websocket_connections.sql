CREATE TABLE
    public.websocket_connections (
        connection_id TEXT NOT NULL PRIMARY KEY,
        session_id uuid NOT NULL,
        created_at timestamptz DEFAULT now() NOT NULL,
        updated_at timestamptz DEFAULT now() NOT NULL,
        expires_at timestamptz NOT NULL
);

CREATE INDEX idx_websocket_connections_session_id ON public.websocket_connections (session_id);
CREATE INDEX idx_websocket_connections_expires_at ON public.websocket_connections (expires_at);

ALTER TABLE public.websocket_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY service ON public.websocket_connections FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TRIGGER "websocket_connections-set_updated_at"
    BEFORE UPDATE ON public.websocket_connections
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at ();
