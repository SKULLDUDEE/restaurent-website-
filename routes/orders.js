const express = require("express");
const router = express.Router();
const {
  createOrder,
  getOrders,
  updateOrderStatus,
  getCompletedOrders,
  getRevenueData
} = require("../controllers/orderController"); 

router.get("/", getOrders);

router.get("/completed", getCompletedOrders);

router.get("/revenue", getRevenueData);

router.post("/", createOrder); 

router.patch("/:id", updateOrderStatus);

module.exports = router;
