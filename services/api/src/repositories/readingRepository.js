const Reading = require('../models/Reading');

class ReadingRepository {
  async findPaginated(filter, skip, limit) {
    return Reading.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limit).lean();
  }

  async count(filter) {
    return Reading.countDocuments(filter);
  }

  async aggregate(pipeline) {
    return Reading.aggregate(pipeline);
  }

  async create(data) {
    return Reading.create(data);
  }
}

module.exports = new ReadingRepository();
