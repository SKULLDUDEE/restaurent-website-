const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true,
  },
  items: [
    {
      _id: { type: String, required: true },
      name: { type: String, required: true },
      price: { type: Number, required: true },
      qty: { type: Number, required: true },
      time: { type: String }, 
      img: { type: String }, 
    },
  ],
  orderType: {
    type: String,
    required: true,
    enum: ["Dine In", "Take Away"], 
  },
  tableNumber: {
    type: Number,
    required: function () {
      return this.orderType === "Dine In";
    },
  },
  numberOfGuests: {
    type: Number,
    required: function () {
      return this.orderType === "Dine In";
    },
  },
  userDetails: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String }, 
  },
  cookingInstructions: { type: String }, 
  itemTotal: { type: Number, required: true },
  deliveryCharge: { type: Number }, 
  taxes: { type: Number, required: true },
  grandTotal: { type: Number, required: true },
  assignedChef: { type: String, default: "Unassigned" }, 
  status: {
    type: String,
    default: "Pending",
    enum: ["Pending", "Preparing", "Served", "Completed", "Canceled"], 
  },
  orderTime: { type: Date, default: Date.now }, 
});

const Order = mongoose.model("Order", OrderSchema);

module.exports = Order;
