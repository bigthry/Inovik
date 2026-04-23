import express from "express";
import {
  createQuotation,
  getAllQuotations,
  getQuotationByName,
  updateQuotation,
  deleteQuotation,
  getSearchedQuotationsByName,
  getQuotationById,
  createRevision,
} from "../controllers/quotationController.js";

const router = express.Router();

// Routes
router.post("/", createQuotation);
router.get("/", getAllQuotations);
router.get("/search", getSearchedQuotationsByName);
router.get("/name/:name", getQuotationByName);
router.post("/:id/revise", createRevision);
router.put("/:id", updateQuotation);
router.delete("/:id", deleteQuotation);
router.get("/:id", getQuotationById);

export default router;
