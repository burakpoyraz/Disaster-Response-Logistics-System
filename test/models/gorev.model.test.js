import mongoose from 'mongoose';
import Gorev from '../../backend/models/gorev.model.js';
import { MockData } from '../helpers/mockData.js';

describe('Gorev Model Tests', () => {
  
  describe('Schema Validation', () => {
    test('should create a valid task with required fields', async () => {
      const taskData = MockData.generateTask();
      const task = new Gorev(taskData);
      const savedTask = await task.save();
      
      expect(savedTask._id).toBeDefined();
      expect(savedTask.talepId).toEqual(taskData.talepId);
      expect(savedTask.aracId).toEqual(taskData.aracId);
      expect(savedTask.koordinatorId).toEqual(taskData.koordinatorId);
      expect(savedTask.gorevDurumu).toBe('beklemede');
      expect(savedTask.isDeleted).toBe(false);
    });

    test('should fail validation without required fields', async () => {
      const task = new Gorev({});
      let error;
      try {
        await task.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
      expect(error.errors.talepId).toBeDefined();
      expect(error.errors.aracId).toBeDefined();
      expect(error.errors.koordinatorId).toBeDefined();
      expect(error.errors['hedefKonumu.lat']).toBeDefined();
      expect(error.errors['hedefKonumu.lng']).toBeDefined();
    });

    test('should validate ObjectId format for references', async () => {
      const taskData = MockData.generateTask({
        talepId: 'invalid-id',
        aracId: 'invalid-id',
        koordinatorId: 'invalid-id'
      });
      
      const task = new Gorev(taskData);
      let error;
      try {
        await task.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
    });
  });

  describe('Driver Information', () => {
    test('should save driver information correctly', async () => {
      const driverInfo = {
        ad: 'John',
        soyad: 'Driver',
        telefon: '05551234567'
      };
      
      const taskData = MockData.generateTask({ sofor: driverInfo });
      const task = new Gorev(taskData);
      const savedTask = await task.save();
      
      expect(savedTask.sofor.ad).toBe(driverInfo.ad);
      expect(savedTask.sofor.soyad).toBe(driverInfo.soyad);
      expect(savedTask.sofor.telefon).toBe(driverInfo.telefon);
    });

    test('should require driver information fields', async () => {
      const taskData = MockData.generateTask({ sofor: {} });
      const task = new Gorev(taskData);
      
      let error;
      try {
        await task.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
      expect(error.errors['sofor.ad']).toBeDefined();
      expect(error.errors['sofor.soyad']).toBeDefined();
      expect(error.errors['sofor.telefon']).toBeDefined();
    });

    test('should validate complete driver information', async () => {
      const incompleteDriverInfo = {
        ad: 'John'
        // missing soyad and telefon
      };
      
      const taskData = MockData.generateTask({ sofor: incompleteDriverInfo });
      const task = new Gorev(taskData);
      
      let error;
      try {
        await task.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
      expect(error.errors['sofor.soyad']).toBeDefined();
      expect(error.errors['sofor.telefon']).toBeDefined();
    });
  });

  describe('Task Status', () => {
    test('should have default status as beklemede', async () => {
      const taskData = MockData.generateTask();
      delete taskData.gorevDurumu;
      
      const task = new Gorev(taskData);
      const savedTask = await task.save();
      
      expect(savedTask.gorevDurumu).toBe('beklemede');
    });

    test('should accept valid status values', async () => {
      const validStatuses = ['beklemede', 'başladı', 'tamamlandı', 'iptal edildi'];
      
      for (let i = 0; i < validStatuses.length; i++) {
        const status = validStatuses[i];
        const taskData = MockData.generateTask({ 
          gorevDurumu: status,
          talepId: new mongoose.Types.ObjectId(),
          aracId: new mongoose.Types.ObjectId(),
          koordinatorId: new mongoose.Types.ObjectId()
        });
        const task = new Gorev(taskData);
        const savedTask = await task.save();
        
        expect(savedTask.gorevDurumu).toBe(status);
      }
    });

    test('should reject invalid status values', async () => {
      const taskData = MockData.generateTask({ gorevDurumu: 'invalid_status' });
      const task = new Gorev(taskData);
      
      let error;
      try {
        await task.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
      expect(error.errors.gorevDurumu).toBeDefined();
    });
  });

  describe('Target Location', () => {
    test('should save target location correctly', async () => {
      const targetLocation = {
        lat: 40.7128,
        lng: -74.0060
      };
      
      const taskData = MockData.generateTask({ hedefKonumu: targetLocation });
      const task = new Gorev(taskData);
      const savedTask = await task.save();
      
      expect(savedTask.hedefKonumu.lat).toBe(targetLocation.lat);
      expect(savedTask.hedefKonumu.lng).toBe(targetLocation.lng);
    });

    test('should require target location coordinates', async () => {
      const taskData = MockData.generateTask();
      delete taskData.hedefKonumu;
      
      const task = new Gorev(taskData);
      let error;
      try {
        await task.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
      expect(error.errors['hedefKonumu.lat']).toBeDefined();
      expect(error.errors['hedefKonumu.lng']).toBeDefined();
    });

    test('should validate numeric coordinates', async () => {
      const taskData = MockData.generateTask({
        hedefKonumu: {
          lat: 'invalid',
          lng: 'invalid'
        }
      });
      
      const task = new Gorev(taskData);
      let error;
      try {
        await task.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
    });

    test('should require both lat and lng', async () => {
      const incompleteLocation = {
        lat: 41.0082
        // missing lng
      };
      
      const taskData = MockData.generateTask({ hedefKonumu: incompleteLocation });
      const task = new Gorev(taskData);
      
      let error;
      try {
        await task.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
      expect(error.errors['hedefKonumu.lng']).toBeDefined();
    });
  });

  describe('Optional Fields', () => {
    test('should save optional task note', async () => {
      const taskNote = 'This is a detailed task note with instructions';
      const taskData = MockData.generateTask({ gorevNotu: taskNote });
      const task = new Gorev(taskData);
      const savedTask = await task.save();
      
      expect(savedTask.gorevNotu).toBe(taskNote);
    });

    test('should save start and end times', async () => {
      const startTime = new Date();
      const endTime = new Date(Date.now() + 3600000); // 1 hour later
      
      const taskData = MockData.generateTask({ 
        baslangicZamani: startTime,
        bitisZamani: endTime
      });
      const task = new Gorev(taskData);
      const savedTask = await task.save();
      
      expect(savedTask.baslangicZamani).toEqual(startTime);
      expect(savedTask.bitisZamani).toEqual(endTime);
    });

    test('should allow null values for optional timestamp fields', async () => {
      const taskData = MockData.generateTask();
      delete taskData.baslangicZamani;
      delete taskData.bitisZamani;
      
      const task = new Gorev(taskData);
      const savedTask = await task.save();
      
      expect(savedTask.baslangicZamani).toBeUndefined();
      expect(savedTask.bitisZamani).toBeUndefined();
    });
  });

  describe('Relationships', () => {
    test('should store valid ObjectId references', async () => {
      const talepId = new mongoose.Types.ObjectId();
      const aracId = new mongoose.Types.ObjectId();
      const koordinatorId = new mongoose.Types.ObjectId();
      
      const taskData = MockData.generateTask({
        talepId,
        aracId,
        koordinatorId
      });
      
      const task = new Gorev(taskData);
      const savedTask = await task.save();
      
      expect(savedTask.talepId).toEqual(talepId);
      expect(savedTask.aracId).toEqual(aracId);
      expect(savedTask.koordinatorId).toEqual(koordinatorId);
    });
  });

  describe('Soft Delete', () => {
    test('should have isDeleted default to false', async () => {
      const taskData = MockData.generateTask();
      const task = new Gorev(taskData);
      const savedTask = await task.save();
      
      expect(savedTask.isDeleted).toBe(false);
    });

    test('should allow setting isDeleted to true', async () => {
      const taskData = MockData.generateTask({ isDeleted: true });
      const task = new Gorev(taskData);
      const savedTask = await task.save();
      
      expect(savedTask.isDeleted).toBe(true);
    });
  });

  describe('Timestamps', () => {
    test('should automatically set createdAt and updatedAt', async () => {
      const taskData = MockData.generateTask();
      const task = new Gorev(taskData);
      const savedTask = await task.save();
      
      expect(savedTask.createdAt).toBeDefined();
      expect(savedTask.updatedAt).toBeDefined();
      expect(savedTask.createdAt).toBeInstanceOf(Date);
      expect(savedTask.updatedAt).toBeInstanceOf(Date);
    });

    test('should update updatedAt on modification', async () => {
      const taskData = MockData.generateTask();
      const task = new Gorev(taskData);
      const savedTask = await task.save();
      
      const originalUpdatedAt = savedTask.updatedAt;
      
      // Wait a moment and then update
      await new Promise(resolve => setTimeout(resolve, 100));
      savedTask.gorevDurumu = 'başladı';
      const updatedTask = await savedTask.save();
      
      expect(updatedTask.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Task Workflow', () => {
    test('should handle complete task lifecycle', async () => {
      const taskData = MockData.generateTask();
      const task = new Gorev(taskData);
      let savedTask = await task.save();
      
      // Initially pending
      expect(savedTask.gorevDurumu).toBe('beklemede');
      expect(savedTask.baslangicZamani).toBeUndefined();
      expect(savedTask.bitisZamani).toBeUndefined();
      
      // Start the task
      savedTask.gorevDurumu = 'başladı';
      savedTask.baslangicZamani = new Date();
      savedTask = await savedTask.save();
      
      expect(savedTask.gorevDurumu).toBe('başladı');
      expect(savedTask.baslangicZamani).toBeDefined();
      
      // Complete the task
      savedTask.gorevDurumu = 'tamamlandı';
      savedTask.bitisZamani = new Date();
      savedTask.gorevNotu = 'Task completed successfully';
      savedTask = await savedTask.save();
      
      expect(savedTask.gorevDurumu).toBe('tamamlandı');
      expect(savedTask.bitisZamani).toBeDefined();
      expect(savedTask.gorevNotu).toBe('Task completed successfully');
    });
  });
}); 