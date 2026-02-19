import mongoose from 'mongoose';
import Arac from '../../backend/models/arac.model.js';
import { MockData } from '../helpers/mockData.js';

describe('Arac Model Tests', () => {
  
  describe('Schema Validation', () => {
    test('should create a valid vehicle with required fields', async () => {
      const vehicleData = MockData.generateVehicle();
      const vehicle = new Arac(vehicleData);
      const savedVehicle = await vehicle.save();
      
      expect(savedVehicle._id).toBeDefined();
      expect(savedVehicle.plaka).toBe(vehicleData.plaka);
      expect(savedVehicle.aracTuru).toBe(vehicleData.aracTuru);
      expect(savedVehicle.kapasite).toBe(vehicleData.kapasite);
      expect(savedVehicle.musaitlikDurumu).toBe(true);
      expect(savedVehicle.aracDurumu).toBe('aktif');
      expect(savedVehicle.isDeleted).toBe(false);
    });

    test('should fail validation without required fields', async () => {
      const vehicle = new Arac({});
      let error;
      try {
        await vehicle.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
      expect(error.errors.plaka).toBeDefined();
      expect(error.errors.aracTuru).toBeDefined();
      expect(error.errors.kapasite).toBeDefined();
    });

    test('should validate kapasite as number', async () => {
      const vehicleData = MockData.generateVehicle({ kapasite: 'not-a-number' });
      const vehicle = new Arac(vehicleData);
      
      let error;
      try {
        await vehicle.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
      expect(error.errors.kapasite).toBeDefined();
    });
  });

  describe('Vehicle Type Validation', () => {
    test('should accept valid vehicle types', async () => {
      const validTypes = [
        'otomobil', 'kamyonet', 'minibüs', 'otobüs', 'kamyon',
        'çekici(Tır)', 'pick-Up', 'tanker', 'y.Römork', 'lowbed', 'motosiklet'
      ];
      
      for (let i = 0; i < validTypes.length; i++) {
        const type = validTypes[i];
        const vehicleData = MockData.generateVehicle({ 
          aracTuru: type,
          plaka: `34 TST ${String(i).padStart(3, '0')}`
        });
        const vehicle = new Arac(vehicleData);
        const savedVehicle = await vehicle.save();
        
        expect(savedVehicle.aracTuru).toBe(type);
      }
    });

    test('should reject invalid vehicle types', async () => {
      const vehicleData = MockData.generateVehicle({ aracTuru: 'invalid_type' });
      const vehicle = new Arac(vehicleData);
      
      let error;
      try {
        await vehicle.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
      expect(error.errors.aracTuru).toBeDefined();
    });
  });

  describe('Usage Purpose Validation', () => {
    test('should accept valid usage purposes', async () => {
      const validPurposes = ['yolcu', 'yuk'];
      
      for (let i = 0; i < validPurposes.length; i++) {
        const purpose = validPurposes[i];
        const vehicleData = MockData.generateVehicle({ 
          kullanimAmaci: purpose,
          plaka: `34 PRP ${String(i).padStart(3, '0')}`
        });
        const vehicle = new Arac(vehicleData);
        const savedVehicle = await vehicle.save();
        
        expect(savedVehicle.kullanimAmaci).toBe(purpose);
      }
    });

    test('should reject invalid usage purposes', async () => {
      const vehicleData = MockData.generateVehicle({ kullanimAmaci: 'invalid_purpose' });
      const vehicle = new Arac(vehicleData);
      
      let error;
      try {
        await vehicle.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
      expect(error.errors.kullanimAmaci).toBeDefined();
    });
  });

  describe('Vehicle Status', () => {
    test('should have default values for status fields', async () => {
      const vehicleData = MockData.generateVehicle();
      delete vehicleData.musaitlikDurumu;
      delete vehicleData.aracDurumu;
      
      const vehicle = new Arac(vehicleData);
      const savedVehicle = await vehicle.save();
      
      expect(savedVehicle.musaitlikDurumu).toBe(true);
      expect(savedVehicle.aracDurumu).toBe('aktif');
    });

    test('should accept valid vehicle status values', async () => {
      const validStatuses = ['aktif', 'pasif'];
      
      for (let i = 0; i < validStatuses.length; i++) {
        const status = validStatuses[i];
        const vehicleData = MockData.generateVehicle({ 
          aracDurumu: status,
          plaka: `34 STS ${String(i).padStart(3, '0')}`
        });
        const vehicle = new Arac(vehicleData);
        const savedVehicle = await vehicle.save();
        
        expect(savedVehicle.aracDurumu).toBe(status);
      }
    });

    test('should reject invalid vehicle status', async () => {
      const vehicleData = MockData.generateVehicle({ aracDurumu: 'invalid_status' });
      const vehicle = new Arac(vehicleData);
      
      let error;
      try {
        await vehicle.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
      expect(error.errors.aracDurumu).toBeDefined();
    });
  });

  describe('Location Information', () => {
    test('should save location information correctly', async () => {
      const locationData = {
        adres: 'Test Address, Istanbul',
        lat: 41.0082,
        lng: 28.9784
      };
      
      const vehicleData = MockData.generateVehicle({ konum: locationData });
      const vehicle = new Arac(vehicleData);
      const savedVehicle = await vehicle.save();
      
      expect(savedVehicle.konum.adres).toBe(locationData.adres);
      expect(savedVehicle.konum.lat).toBe(locationData.lat);
      expect(savedVehicle.konum.lng).toBe(locationData.lng);
    });

    test('should allow empty location', async () => {
      const vehicleData = MockData.generateVehicle();
      delete vehicleData.konum;
      
      const vehicle = new Arac(vehicleData);
      const savedVehicle = await vehicle.save();
      
      expect(savedVehicle.konum).toEqual({});
    });

    test('should validate numeric coordinates', async () => {
      const vehicleData = MockData.generateVehicle({
        konum: {
          adres: 'Test Address',
          lat: 'invalid',
          lng: 'invalid'
        }
      });
      
      const vehicle = new Arac(vehicleData);
      
      let error;
      try {
        await vehicle.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
      expect(error.errors['konum.lat'] || error.errors['konum.lng']).toBeDefined();
    });
  });

  describe('Relationships', () => {
    test('should accept valid ObjectIds for references', async () => {
      const kurumFirmaId = new mongoose.Types.ObjectId();
      const kullaniciId = new mongoose.Types.ObjectId();
      
      const vehicleData = MockData.generateVehicle({
        kurumFirmaId,
        kullaniciId
      });
      
      const vehicle = new Arac(vehicleData);
      const savedVehicle = await vehicle.save();
      
      expect(savedVehicle.kurumFirmaId).toEqual(kurumFirmaId);
      expect(savedVehicle.kullaniciId).toEqual(kullaniciId);
    });

    test('should have null default values for references', async () => {
      const vehicleData = MockData.generateVehicle();
      delete vehicleData.kurumFirmaId;
      delete vehicleData.kullaniciId;
      
      const vehicle = new Arac(vehicleData);
      const savedVehicle = await vehicle.save();
      
      expect(savedVehicle.kurumFirmaId).toBeNull();
      expect(savedVehicle.kullaniciId).toBeNull();
    });
  });

  describe('Soft Delete', () => {
    test('should have isDeleted default to false', async () => {
      const vehicleData = MockData.generateVehicle();
      const vehicle = new Arac(vehicleData);
      const savedVehicle = await vehicle.save();
      
      expect(savedVehicle.isDeleted).toBe(false);
    });

    test('should allow setting isDeleted to true', async () => {
      const vehicleData = MockData.generateVehicle({ isDeleted: true });
      const vehicle = new Arac(vehicleData);
      const savedVehicle = await vehicle.save();
      
      expect(savedVehicle.isDeleted).toBe(true);
    });
  });

  describe('Timestamps', () => {
    test('should automatically set createdAt and updatedAt', async () => {
      const vehicleData = MockData.generateVehicle();
      const vehicle = new Arac(vehicleData);
      const savedVehicle = await vehicle.save();
      
      expect(savedVehicle.createdAt).toBeDefined();
      expect(savedVehicle.updatedAt).toBeDefined();
      expect(savedVehicle.createdAt).toBeInstanceOf(Date);
      expect(savedVehicle.updatedAt).toBeInstanceOf(Date);
    });

    test('should update updatedAt on modification', async () => {
      const vehicleData = MockData.generateVehicle();
      const vehicle = new Arac(vehicleData);
      const savedVehicle = await vehicle.save();
      
      const originalUpdatedAt = savedVehicle.updatedAt;
      
      // Wait a moment and then update
      await new Promise(resolve => setTimeout(resolve, 100));
      savedVehicle.plaka = 'UPDATED PLATE';
      const updatedVehicle = await savedVehicle.save();
      
      expect(updatedVehicle.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Capacity Validation', () => {
    test('should accept positive capacity values', async () => {
      const validCapacities = [1, 5, 10, 50, 100];
      
      for (let i = 0; i < validCapacities.length; i++) {
        const capacity = validCapacities[i];
        const vehicleData = MockData.generateVehicle({ 
          kapasite: capacity,
          plaka: `34 CAP ${String(i).padStart(3, '0')}`
        });
        const vehicle = new Arac(vehicleData);
        const savedVehicle = await vehicle.save();
        
        expect(savedVehicle.kapasite).toBe(capacity);
      }
    });
  });
}); 