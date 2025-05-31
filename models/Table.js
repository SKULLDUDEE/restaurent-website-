const mongoose = require("mongoose");

const TableSchema = new mongoose.Schema({
  number: { type: Number, required: true, unique: true },
  // Add tableNumber field for backward compatibility
  tableNumber: { type: Number, sparse: true },
  name: { type: String },
  chairs: { type: Number, default: 4 },
  occupiedChairs: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ["reserved", "available", "unavailable"],
    default: "available",
  },
  createdAt: { type: Date, default: Date.now },
});

// Pre-save hook to ensure number is set
TableSchema.pre('save', function(next) {
  // If number is not set but tableNumber is, use tableNumber
  if (this.number === null || this.number === undefined) {
    if (this.tableNumber !== null && this.tableNumber !== undefined) {
      this.number = this.tableNumber;
    }
  }
  
  // If tableNumber is not set but number is, use number
  if (this.tableNumber === null || this.tableNumber === undefined) {
    if (this.number !== null && this.number !== undefined) {
      this.tableNumber = this.number;
    }
  }
  
  next();
});

module.exports = mongoose.model("Table", TableSchema);
