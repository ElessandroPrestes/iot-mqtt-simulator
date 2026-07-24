const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    tokenHash: { type: String, required: true, unique: true, index: true },
    familyId: { type: String, required: true, index: true },
    principalId: { type: String, required: true, index: true },
    role: { type: String, enum: ['viewer', 'operator'], required: true },
    expiresAt: { type: Date, required: true },
    lastActivityAt: { type: Date, required: true, default: Date.now },
    usedAt: { type: Date, default: null },
    revokedAt: { type: Date, default: null },
    replacedByHash: { type: String, default: null },
  },
  { timestamps: true }
);

sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
sessionSchema.index({ principalId: 1, familyId: 1, revokedAt: 1 });

module.exports = mongoose.model('Session', sessionSchema);
