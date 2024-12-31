const mongoose = require("mongoose");

const alephInstanceSchema = new mongoose.Schema({
  instanceId: String,
  sshKeyName: String,
  vcpus: Number,
  memory: Number,
  status: { type: String, default: "running" },
  createdAt: { type: Date, default: Date.now },
  IP: String,
});

module.exports = mongoose.model("AlephInstance", alephInstanceSchema);
