import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, shippingUpdatesTable } from "@workspace/db";
import {
  ListShippingUpdatesResponse,
  CreateShippingUpdateBody,
  UpdateShippingUpdateParams,
  UpdateShippingUpdateBody,
  UpdateShippingUpdateResponse,
  DeleteShippingUpdateParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/shipping", async (_req, res): Promise<void> => {
  const updates = await db.select().from(shippingUpdatesTable).orderBy(shippingUpdatesTable.createdAt);
  res.json(ListShippingUpdatesResponse.parse(updates));
});

router.post("/shipping", async (req, res): Promise<void> => {
  const parsed = CreateShippingUpdateBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [update] = await db.insert(shippingUpdatesTable).values(parsed.data).returning();
  res.status(201).json(update);
});

router.patch("/shipping/:id", async (req, res): Promise<void> => {
  const params = UpdateShippingUpdateParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateShippingUpdateBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [update] = await db
    .update(shippingUpdatesTable)
    .set(parsed.data as Partial<typeof shippingUpdatesTable.$inferInsert>)
    .where(eq(shippingUpdatesTable.id, params.data.id))
    .returning();

  if (!update) {
    res.status(404).json({ error: "Shipping update not found" });
    return;
  }

  res.json(UpdateShippingUpdateResponse.parse(update));
});

router.delete("/shipping/:id", async (req, res): Promise<void> => {
  const params = DeleteShippingUpdateParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [update] = await db.delete(shippingUpdatesTable).where(eq(shippingUpdatesTable.id, params.data.id)).returning();
  if (!update) {
    res.status(404).json({ error: "Shipping update not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
