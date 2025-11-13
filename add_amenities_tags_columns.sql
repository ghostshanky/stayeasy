ALTER TABLE public.properties ADD COLUMN amenities TEXT[] DEFAULT '{}';
ALTER TABLE public.properties ADD COLUMN tags TEXT[] DEFAULT '{}';
