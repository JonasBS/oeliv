-- Create room_images table for multiple images per room

CREATE TABLE IF NOT EXISTS room_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_primary INTEGER DEFAULT 0,
  caption TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_room_images_room_id ON room_images(room_id);
CREATE INDEX IF NOT EXISTS idx_room_images_primary ON room_images(room_id, is_primary);

-- Migrate existing image_url to room_images table
INSERT INTO room_images (room_id, image_url, display_order, is_primary)
SELECT id, image_url, 0, 1
FROM rooms
WHERE image_url IS NOT NULL AND image_url != '';




