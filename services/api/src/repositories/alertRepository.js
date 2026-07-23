const Alert = require('../models/Alert');

class AlertRepository {
  async findPaginated(filter, skip, limit) {
    return Alert.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limit).lean();
  }

  async count(filter) {
    return Alert.countDocuments(filter);
  }

  async updateById(id, data) {
    return Alert.findByIdAndUpdate(id, data, { new: true });
  }

  async create(data) {
    return Alert.create(data);
  }
}

module.exports = new AlertRepository();
