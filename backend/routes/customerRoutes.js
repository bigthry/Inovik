import express from "express";
import { getCustomers, addCustomer, updateCustomer } from "../controllers/customerController.js";

const router = express.Router();

router.get("/", getCustomers);
router.post("/", addCustomer);
router.put("/:id", updateCustomer);

export default router;
