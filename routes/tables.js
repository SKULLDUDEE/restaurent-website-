const express = require("express");
const router = express.Router();
const Table = require("../models/Table");

// Initialize tables (create default tables if none exist)
router.post("/initialize", async (req, res) => {
  try {
    // Check if any tables exist
    const tableCount = await Table.countDocuments();

    if (tableCount === 0) {
      // Create 10 default tables with 4 chairs each
      const tables = Array.from({ length: 10 }, (_, i) => ({
        number: i + 1,
        chairs: 4,
        occupiedChairs: 0,
        status: "available",
      }));

      await Table.insertMany(tables);
      res.status(201).json({ message: "Tables initialized successfully" });
    } else {
      res.status(200).json({ message: "Tables already exist" });
    }
  } catch (error) {
    console.error("Error initializing tables:", error);
    res
      .status(500)
      .json({ message: "Failed to initialize tables", error: error.message });
  }
});

// Fix tables with null numbers
router.post("/fix-tables", async (req, res) => {
  try {
    // Find tables with null numbers
    const tablesWithNullNumbers = await Table.find({ number: null });
    
    if (tablesWithNullNumbers.length === 0) {
      return res.status(200).json({ message: "No tables with null numbers found" });
    }
    
    // Find the highest current table number
    const lastTable = await Table.findOne().sort({ number: -1 });
    let nextNumber = lastTable && lastTable.number ? lastTable.number + 1 : 1;
    
    // Fix tables with null numbers
    for (const table of tablesWithNullNumbers) {
      table.number = nextNumber++;
      await table.save();
    }
    
    res.status(200).json({ 
      message: `Fixed ${tablesWithNullNumbers.length} tables with null numbers`,
      fixedTables: tablesWithNullNumbers
    });
  } catch (error) {
    console.error("Error fixing tables:", error);
    res.status(500).json({ 
      message: "Failed to fix tables with null numbers", 
      error: error.message 
    });
  }
});

// Get all tables (with optional search/filter)
router.get("/", async (req, res) => {
  try {
    const { number, status } = req.query;
    let query = {};
    if (number) query.number = Number(number);
    if (status) query.status = status;
    const tables = await Table.find(query).sort({ number: 1 });
    res.json(tables);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get table by number
router.get("/number/:number", async (req, res) => {
  try {
    const table = await Table.findOne({ number: Number(req.params.number) });
    if (!table) return res.status(404).json({ error: "Table not found" });
    res.json(table);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get table by ID
router.get("/:id", async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);
    if (!table) return res.status(404).json({ error: "Table not found" });
    res.json(table);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create table
router.post("/", async (req, res) => {
  try {
    const { name, chairs } = req.body;

    // Find the highest current table number and assign the next sequential number
    // Check both number and tableNumber fields
    const lastTableByNumber = await Table.findOne().sort({ number: -1 });
    const lastTableByTableNumber = await Table.findOne().sort({ tableNumber: -1 });
    
    // Determine the highest number from both fields
    const highestNumber = Math.max(
      lastTableByNumber && lastTableByNumber.number ? lastTableByNumber.number : 0,
      lastTableByTableNumber && lastTableByTableNumber.tableNumber ? lastTableByTableNumber.tableNumber : 0
    );
    
    const nextNumber = highestNumber > 0 ? highestNumber + 1 : 1;

    // Ensure number is not null
    if (!nextNumber || isNaN(nextNumber)) {
      return res.status(400).json({ 
        error: "Invalid table number. Could not determine next table number." 
      });
    }

    console.log(`Creating new table with number: ${nextNumber}`);

    const table = new Table({
      number: nextNumber,
      tableNumber: nextNumber, // Set both fields to the same value
      name: name || "Table", // Default name to "Table"
      chairs: chairs || 4, // Default to 4 chairs if not specified
      status: "available", // New tables are initially available
      occupiedChairs: 0, // Initialize occupied chairs to 0
    });
    
    await table.save();
    res.status(201).json(table);
  } catch (err) {
    console.error("Error creating table:", err);
    res.status(400).json({ error: err.message });
  }
});

// Update table by number
router.put("/number/:number", async (req, res) => {
  try {
    const tableNumber = parseInt(req.params.number);
    const updateData = req.body;

    // Find the table by number
    const table = await Table.findOne({ number: tableNumber });
    if (!table) {
      return res.status(404).json({ error: `Table ${tableNumber} not found` });
    }

    // Update table fields
    if (updateData.status !== undefined) table.status = updateData.status;
    if (updateData.occupiedChairs !== undefined) {
      table.occupiedChairs = updateData.occupiedChairs;
    }

    await table.save();
    res.json(table);
  } catch (err) {
    console.error("Error updating table:", err);
    res.status(400).json({ error: err.message });
  }
});

// Update table by ID
router.put("/:id", async (req, res) => {
  try {
    const updateData = req.body;
    const table = await Table.findById(req.params.id);

    if (!table) return res.status(404).json({ error: "Table not found" });

    // Update table fields
    if (updateData.number !== undefined) table.number = updateData.number;
    if (updateData.name !== undefined) table.name = updateData.name;
    if (updateData.chairs !== undefined) table.chairs = updateData.chairs;
    if (updateData.status !== undefined) table.status = updateData.status;
    if (updateData.occupiedChairs !== undefined) {
      table.occupiedChairs = updateData.occupiedChairs;
    }

    await table.save();
    res.json(table);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete table
router.delete("/:id", async (req, res) => {
  try {
    const table = await Table.findByIdAndDelete(req.params.id);
    if (!table) return res.status(404).json({ error: "Table not found" });

    // Renumber remaining tables sequentially
    const remainingTables = await Table.find().sort({ number: 1 });
    for (let i = 0; i < remainingTables.length; i++) {
      remainingTables[i].number = i + 1;
      await remainingTables[i].save();
    }

    res.json({ message: "Table deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
