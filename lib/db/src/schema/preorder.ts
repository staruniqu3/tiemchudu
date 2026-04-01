import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const preorderScheduleTable = pgTable("preorder_schedule", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  startDate: text("start_date"),
  deadline: text("deadline"),
  pickupDate: text("pickup_date"),
  imageUrl: text("image_url"),
  artist: text("artist"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPreorderScheduleSchema = createInsertSchema(preorderScheduleTable).omit({ id: true, createdAt: true });
export type InsertPreorderSchedule = z.infer<typeof insertPreorderScheduleSchema>;
export type PreorderSchedule = typeof preorderScheduleTable.$inferSelect;
