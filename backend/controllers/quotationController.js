import Quotation from "../models/Quotation.js";
import Counter from "../models/Counter.js";

/**
 * 🔢 Get next auto-increment quotation number
 */
const getNextQuotationNumber = async () => {
  const counter = await Counter.findOneAndUpdate(
    { name: "quotationNumber" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
};

/**
 * 💾 Create a new quotation
 */
// export const createQuotation = async (req, res) => {
//   try {
//     // 1️⃣ Generate next quotation number
//     const quotationNumber = await getNextQuotationNumber();

//     // 2️⃣ Create and save quotation
//     const quotation = new Quotation({
//       ...req.body,
//       quotationNumber,
//     });

//     await quotation.save();

//     res.status(201).json({
//       success: true,
//       message: "Quotation saved successfully",
//       quotation,
//     });
//   } catch (error) {
//     console.error("❌ Error creating quotation:", error);
//     res.status(500).json({ success: false, error: error.message });
//   }
// };


export const createQuotation = async (req, res) => {
  try {
    console.log("=== BACKEND CREATE QUOTATION ===");
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    
    const quotationNumber = await getNextQuotationNumber();

    // Map frontend payload to correct schema fields
    const {
      date,
      status,
      businessUnit,
      category,
      product,
      quotationType,
      reference,
      designer,
      manager,
      customer,
      shippingAddress,
      remarks,
      blocks,
    } = req.body;

    console.log("📝 Creating quotation with data:", {
      quotationNumber,
      customer,
      product,
      blocks: blocks?.length || 0,
    });

    const quotation = new Quotation({
      quotationNumber,
      date,
      status,
      businessUnit,
      product: product || "",
      quotationType: quotationType || "",
      reference: reference || "",
      designer: designer || "",
      manager: manager || "",
      category: category || "",
      customer: customer || null,
      shippingAddress: shippingAddress || {},
      remarks: remarks || "",
      blocks: blocks || [],
      specialDiscount: req.body.specialDiscount || 0,
      finalProjectValue: req.body.finalProjectValue || 0,
    });

    console.log("Quotation object before save:", quotation);
    await quotation.save();
    console.log("Quotation saved successfully:", quotation._id);

    res.status(201).json({
      success: true,
      message: "Quotation saved successfully",
      quotation,
    });
  } catch (error) {
    console.error("❌ Error creating quotation:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * 📋 Get all quotations
 */
export const getAllQuotations = async (req, res) => {
  try {
    const quotations = await Quotation.find()
      .populate("customer") // optional — include customer details
      .sort({ createdAt: -1 }); // newest first
    res.status(200).json({ success: true, quotations });
  } catch (error) {
    console.error("❌ Error fetching quotations:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getQuotationById = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id).populate("customer");
    if (!quotation) {
      return res.status(404).json({ success: false, message: "Quotation not found" });
    }
    res.status(200).json({ success: true, quotation });
  } catch (error) {
    console.error("❌ Error fetching quotation:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getSearchedQuotationsByName = async (req, res) => {
  try {
    const { query } = req.query;

    const quotations = await Quotation.aggregate([
      {
        // Convert quotationNumber (Number) to string so regex works on it
        $addFields: {
          quotationNumberStr: { $toString: "$quotationNumber" },
        },
      },
      {
        $lookup: {
          from: "customers",
          localField: "customer",
          foreignField: "_id",
          as: "customer",
        },
      },
      { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },
      {
        $match: {
          $or: [
            { quotationNumberStr: { $regex: query, $options: "i" } },
            { "customer.name": { $regex: query, $options: "i" } },
          ],
        },
      },
      { $sort: { createdAt: -1 } },
    ]);

    res.status(200).json({ success: true, quotations });
  } catch (error) {
    console.error("❌ Error fetching quotations:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * 🔍 Get quotations by customer name
 */
export const getQuotationByName = async (req, res) => {
  try {
    const { name } = req.params;

    const quotations = await Quotation.aggregate([
      {
        $lookup: {
          from: "customers",
          localField: "customer",
          foreignField: "_id",
          as: "customer",
        },
      },
      { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },
      {
        $match: {
          "customer.name": { $regex: name, $options: "i" },
        },
      },
    ]);

    if (!quotations.length) {
      return res.status(404).json({ success: false, message: "No quotations found for this customer name" });
    }

    res.status(200).json({ success: true, quotations });
  } catch (error) {
    console.error("❌ Error fetching quotation by name:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * ✏️ Update a quotation
 */
export const updateQuotation = async (req, res) => {
  try {
    console.log("✏️ Updating quotation:", req.params.id);
    console.log("✏️ Update data:", req.body);
    
    const updatedQuotation = await Quotation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedQuotation) {
      return res.status(404).json({ success: false, message: "Quotation not found" });
    }
    
    console.log("✅ Quotation updated:", updatedQuotation.customer);
    
    res.status(200).json({ success: true, message: "Quotation updated", quotation: updatedQuotation });
  } catch (error) {
    console.error("❌ Error updating quotation:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * 🗑️ Delete a quotation
 */
export const deleteQuotation = async (req, res) => {
  try {
    const deletedQuotation = await Quotation.findByIdAndDelete(req.params.id);
    if (!deletedQuotation) {
      return res.status(404).json({ success: false, message: "Quotation not found" });
    }
    res.status(200).json({ success: true, message: "Quotation deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting quotation:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
