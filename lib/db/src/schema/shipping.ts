import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const shippingUpdatesTable = pgTable("shipping_updates", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("preparing"),
  estimatedDate: text("estimated_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertShippingUpdateSchema = createInsertSchema(shippingUpdatesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertShippingUpdate = z.infer<typeof insertShippingUpdateSchema>;
export type ShippingUpdate = typeof shippingUpdatesTable.$inferSelect;
