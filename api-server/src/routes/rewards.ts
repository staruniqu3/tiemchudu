import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, rewardsTable, redemptionsTable, membersTable } from "@workspace/db";
import {
  ListRewardsResponse,
  CreateRewardBody,
  DeleteRewardParams,
  RedeemRewardBody,
  RedeemRewardResponse,
  ListRedemptionsQueryParams,
  ListRedemptionsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/rewards", async (_req, res): Promise<void> => {
  const rewards = await db.select().from(rewardsTable).orderBy(rewardsTable.createdAt);
  res.json(ListRewardsResponse.parse(rewards));
});

router.post("/rewards", async (req, res): Promise<void> => {
  const parsed = CreateRewardBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [reward] = await db.insert(rewardsTable).values(parsed.data).returning();
  res.status(201).json(reward);
});

router.delete("/rewards/:id", async (req, res): Promise<void> => {
  const params = DeleteRewardParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [reward] = await db.delete(rewardsTable).where(eq(rewardsTable.id, params.data.id)).returning();
  if (!reward) {
    res.status(404).json({ error: "Reward not found" });
    return;
  }

  res.sendStatus(204);
});

router.post("/rewards/redeem", async (req, res): Promise<void> => {
  const parsed = RedeemRewardBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [member] = await db.select().from(membersTable).where(eq(membersTable.id, parsed.data.memberId));
  if (!member) {
    res.status(404).json({ error: "Member not found" });
    return;
  }

  const [reward] = await db.select().from(rewardsTable).where(eq(rewardsTable.id, parsed.data.rewardId));
  if (!reward) {
    res.status(404).json({ error: "Reward not found" });
    return;
  }

  if (!reward.isAvailable || reward.stock <= 0) {
    res.status(400).json({ error: "Reward not available" });
    return;
  }

  if (member.points < reward.pointsCost) {
    res.status(400).json({ error: "Insufficient points" });
    return;
  }

  const newPoints = member.points - reward.pointsCost;
  const newTier =
    newPoints >= 5000 ? "platinum" :
    newPoints >= 2000 ? "gold" :
    newPoints >= 500 ? "silver" : "bronze";

  await db.update(membersTable).set({ points: newPoints, tier: newTier }).where(eq(membersTable.id, member.id));
  await db.update(rewardsTable).set({ stock: reward.stock - 1 }).where(eq(rewardsTable.id, reward.id));

  const [redemption] = await db
    .insert(redemptionsTable)
    .values({
      memberId: member.id,
      memberName: member.name,
      rewardId: reward.id,
      rewardName: reward.name,
      pointsUsed: reward.pointsCost,
    })
    .returning();

  res.json(
    RedeemRewardResponse.parse({
      success: true,
      remainingPoints: newPoints,
      redemptionId: redemption.id,
    })
  );
});

router.get("/redemptions", async (req, res): Promise<void> => {
  const query = ListRedemptionsQueryParams.safeParse(req.query);
  let redemptions = await db.select().from(redemptionsTable).orderBy(redemptionsTable.createdAt);

  if (query.success && query.data.memberId) {
    redemptions = redemptions.filter((r) => r.memberId === query.data.memberId);
  }

  res.json(ListRedemptionsResponse.parse(redemptions));
});

export default router;
