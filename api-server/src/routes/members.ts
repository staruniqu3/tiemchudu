import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, membersTable } from "@workspace/db";
import {
  ListMembersResponse,
  CreateMemberBody,
  GetMemberParams,
  GetMemberResponse,
  UpdateMemberParams,
  UpdateMemberBody,
  UpdateMemberResponse,
  LookupMemberQueryParams,
  LookupMemberResponse,
  AddPointsParams,
  AddPointsBody,
  AddPointsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function computeTier(points: number): string {
  if (points >= 5000) return "platinum";
  if (points >= 2000) return "gold";
  if (points >= 500) return "silver";
  return "bronze";
}

router.get("/members", async (_req, res): Promise<void> => {
  const members = await db.select().from(membersTable).orderBy(membersTable.joinedAt);
  res.json(ListMembersResponse.parse(members));
});

router.post("/members", async (req, res): Promise<void> => {
  const parsed = CreateMemberBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [member] = await db
    .insert(membersTable)
    .values({ ...parsed.data, points: 0, tier: "bronze" })
    .returning();

  res.status(201).json(GetMemberResponse.parse(member));
});

router.get("/members/lookup", async (req, res): Promise<void> => {
  const query = LookupMemberQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const [member] = await db.select().from(membersTable).where(eq(membersTable.phone, query.data.phone));
  if (!member) {
    res.status(404).json({ error: "Member not found" });
    return;
  }

  res.json(LookupMemberResponse.parse(member));
});

router.get("/members/:id", async (req, res): Promise<void> => {
  const params = GetMemberParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [member] = await db.select().from(membersTable).where(eq(membersTable.id, params.data.id));
  if (!member) {
    res.status(404).json({ error: "Member not found" });
    return;
  }

  res.json(GetMemberResponse.parse(member));
});

router.patch("/members/:id", async (req, res): Promise<void> => {
  const params = UpdateMemberParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateMemberBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [member] = await db
    .update(membersTable)
    .set(parsed.data as Partial<typeof membersTable.$inferInsert>)
    .where(eq(membersTable.id, params.data.id))
    .returning();

  if (!member) {
    res.status(404).json({ error: "Member not found" });
    return;
  }

  res.json(UpdateMemberResponse.parse(member));
});

router.post("/members/:id/add-points", async (req, res): Promise<void> => {
  const params = AddPointsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = AddPointsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db.select().from(membersTable).where(eq(membersTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Member not found" });
    return;
  }

  const newPoints = existing.points + parsed.data.points;
  const newTier = computeTier(newPoints);

  const [member] = await db
    .update(membersTable)
    .set({ points: newPoints, tier: newTier })
    .where(eq(membersTable.id, params.data.id))
    .returning();

  res.json(AddPointsResponse.parse(member));
});

export default router;
