import { mysqlTable, int, varchar, timestamp } from "drizzle-orm/mysql-core";
import { users } from "./users";

export const auth = mysqlTable("auth", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id")
    .references(() => users.id, { onDelete: "cascade" }),
  provider: varchar("provider", { length: 50 }).notNull(),
  providerId: varchar("provider_id", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").onUpdateNow(),
});
