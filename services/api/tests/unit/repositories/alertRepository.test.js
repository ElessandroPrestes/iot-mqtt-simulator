const alertRepository = require('../../../src/repositories/alertRepository');
const Alert = require('../../../src/models/Alert');

jest.mock('../../../src/models/Alert');

describe('alertRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findPaginated', () => {
    it('finds paginated alerts', async () => {
      const mockLean = jest.fn().mockResolvedValue(['alert1']);
      const mockLimit = jest.fn().mockReturnValue({ lean: mockLean });
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockSort = jest.fn().mockReturnValue({ skip: mockSkip });
      Alert.find.mockReturnValue({ sort: mockSort });

      const result = await alertRepository.findPaginated({ type: 'temp' }, 0, 10);
      
      expect(Alert.find).toHaveBeenCalledWith({ type: 'temp' });
      expect(mockSort).toHaveBeenCalledWith({ timestamp: -1 });
      expect(mockSkip).toHaveBeenCalledWith(0);
      expect(mockLimit).toHaveBeenCalledWith(10);
      expect(result).toEqual(['alert1']);
    });
  });

  describe('count', () => {
    it('counts documents', async () => {
      Alert.countDocuments.mockResolvedValue(5);
      const result = await alertRepository.count({ type: 'temp' });
      expect(Alert.countDocuments).toHaveBeenCalledWith({ type: 'temp' });
      expect(result).toBe(5);
    });
  });

  describe('updateById', () => {
    it('updates by id', async () => {
      Alert.findByIdAndUpdate.mockResolvedValue({ id: 'a1' });
      const result = await alertRepository.updateById('a1', { level: 'warning' });
      expect(Alert.findByIdAndUpdate).toHaveBeenCalledWith('a1', { level: 'warning' }, { new: true });
      expect(result).toEqual({ id: 'a1' });
    });
  });

  describe('create', () => {
    it('creates an alert', async () => {
      Alert.create.mockResolvedValue({ id: 'a1' });
      const result = await alertRepository.create({ sensorId: 's1' });
      expect(Alert.create).toHaveBeenCalledWith({ sensorId: 's1' });
      expect(result).toEqual({ id: 'a1' });
    });
  });

  describe('findActiveAlert', () => {
    it('finds an active alert', async () => {
      const mockLean = jest.fn().mockResolvedValue({ id: 'a1' });
      Alert.findOne.mockReturnValue({ lean: mockLean });
      
      const result = await alertRepository.findActiveAlert('s1', 'warning');
      expect(Alert.findOne).toHaveBeenCalledWith({ sensorId: 's1', level: 'warning', resolved: false });
      expect(mockLean).toHaveBeenCalled();
      expect(result).toEqual({ id: 'a1' });
    });
  });

  describe('resolveAlertsBySensor', () => {
    it('resolves active alerts by sensorId', async () => {
      Alert.updateMany.mockResolvedValue({ modifiedCount: 2 });
      
      const result = await alertRepository.resolveAlertsBySensor('s1');
      expect(Alert.updateMany).toHaveBeenCalledWith(
        { sensorId: 's1', resolved: false },
        { $set: { resolved: true, resolvedAt: expect.any(Date) } }
      );
      expect(result).toEqual({ modifiedCount: 2 });
    });
  });
});
