const mongoose = require('mongoose');

const authenticationStateSchema = new mongoose.Schema(
  {
    principalId: { type: String, required: true, unique: true, index: true },
    lastTotpCounter: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AuthenticationState', authenticationStateSchema);
