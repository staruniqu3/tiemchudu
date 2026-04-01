import { Router, type IRouter } from "express";
import healthRouter from "./health";
import productsRouter from "./products";
import membersRouter from "./members";
import ordersRouter from "./orders";
import shippingRouter from "./shipping";
import rewardsRouter from "./rewards";
import preorderRouter from "./preorder";
import sheetsRouter from "./sheets";

const router: IRouter = Router();

router.use(healthRouter);
router.use(productsRouter);
router.use(membersRouter);
router.use(ordersRouter);
router.use(shippingRouter);
router.use(rewardsRouter);
router.use(preorderRouter);
router.use(sheetsRouter);

export default router;
