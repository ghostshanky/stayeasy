ALTER TABLE public.properties ADD COLUMN images TEXT[] DEFAULT '{}';
ALTER TABLE public.properties ADD COLUMN rating FLOAT DEFAULT 0;
