import { pgTable, serial, text, integer, timestamp } from 'drizzle-orm/pg-core';

export const conversions = pgTable('conversions', {
  id: serial('id').primaryKey(),
  videoUrl: text('video_url').notNull(),
  videoTitle: text('video_title').notNull(),
  channelName: text('channel_name'),
  duration: text('duration'),
  quality: integer('quality').notNull().default(192),
  fileSizeBytes: integer('file_size_bytes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
