import { Router, type IRouter } from "express";
import {
  getMemberOrdersByPhone,
  getMemberProfile,
  getMemberShipping,
  getAllShippingTracking,
  getAllMembers,
  invalidateToken,
} from "../lib/google-sheets";

async function withTokenRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err: any) {
    const msg = err?.message ?? "";
    if (msg.includes("invalid authentication") || msg.includes("401") || msg.includes("not connected")) {
      invalidateToken();
      return await fn();
    }
    throw err;
  }
}

const router: IRouter = Router();

router.get("/sheets/member-orders", async (req, res): Promise<void> => {
  const phone = req.query.phone as string;
  if (!phone) { res.status(400).json({ error: "phone required" }); return; }
  try {
    const orders = await withTokenRetry(() => getMemberOrdersByPhone(phone));
    res.json(orders);
  } catch (err: any) {
    res.status(503).json({ error: err.message ?? "Google Sheets unavailable" });
  }
});

router.get("/sheets/member-profile", async (req, res): Promise<void> => {
  const phone = req.query.phone as string;
  if (!phone) { res.status(400).json({ error: "phone required" }); return; }
  try {
    const profile = await withTokenRetry(() => getMemberProfile(phone));
    if (!profile) { res.status(404).json({ error: "Member not found" }); return; }
    res.json(profile);
  } catch (err: any) {
    res.status(503).json({ error: err.message ?? "Google Sheets unavailable" });
  }
});

router.get("/sheets/member-shipping", async (req, res): Promise<void> => {
  const code = req.query.code as string;
  if (!code) { res.status(400).json({ error: "code required" }); return; }
  try {
    const shipping = await withTokenRetry(() => getMemberShipping(code));
    res.json(shipping);
  } catch (err: any) {
    res.status(503).json({ error: err.message ?? "Google Sheets unavailable" });
  }
});

router.get("/sheets/all-shipping", async (_req, res): Promise<void> => {
  try {
    const rows = await withTokenRetry(() => getAllShippingTracking());
    res.json(rows);
  } catch (err: any) {
    res.status(503).json({ error: err.message ?? "Google Sheets unavailable" });
  }
});

router.get("/sheets/all-members", async (_req, res): Promise<void> => {
  try {
    const members = await withTokenRetry(() => getAllMembers());
    res.json(members);
  } catch (err: any) {
    res.status(503).json({ error: err.message ?? "Google Sheets unavailable" });
  }
});

export default router;
