-- Add image field to rooms table

ALTER TABLE rooms ADD COLUMN image_url TEXT;

-- Add description field for admin to see more context
ALTER TABLE rooms ADD COLUMN description TEXT;




