-- Enable Realtime for inventory tables
ALTER PUBLICATION supabase_realtime ADD TABLE categories;
ALTER PUBLICATION supabase_realtime ADD TABLE materials;
ALTER PUBLICATION supabase_realtime ADD TABLE packaging;
ALTER PUBLICATION supabase_realtime ADD TABLE labels;

-- Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE packaging ENABLE ROW LEVEL SECURITY;
ALTER TABLE labels ENABLE ROW LEVEL SECURITY;

-- Create policies for all operations (allow all for now - can be restricted later)
CREATE POLICY "Enable all operations for categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all operations for materials" ON materials FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all operations for packaging" ON packaging FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all operations for labels" ON labels FOR ALL USING (true) WITH CHECK (true);