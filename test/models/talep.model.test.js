import mongoose from 'mongoose';
import Talep from '../../backend/models/talep.model.js';
import { MockData } from '../helpers/mockData.js';

describe('Talep Model Tests', () => {
  
  describe('Schema Validation', () => {
    test('should create a valid request with required fields', async () => {
      const requestData = MockData.generateRequest();
      const request = new Talep(requestData);
      const savedRequest = await request.save();
      
      expect(savedRequest._id).toBeDefined();
      expect(savedRequest.baslik).toBe(requestData.baslik);
      expect(savedRequest.aciklama).toBe(requestData.aciklama);
      expect(savedRequest.talepEdenKullaniciId).toEqual(requestData.talepEdenKullaniciId);
      expect(savedRequest.talepEdenKurumFirmaId).toEqual(requestData.talepEdenKurumFirmaId);
      expect(savedRequest.durum).toBe('beklemede');
      expect(savedRequest.isDeleted).toBe(false);
    });

    test('should fail validation without required fields', async () => {
      const request = new Talep({});
      let error;
      try {
        await request.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
      expect(error.errors.baslik).toBeDefined();
      expect(error.errors.aciklama).toBeDefined();
      expect(error.errors.talepEdenKullaniciId).toBeDefined();
      expect(error.errors.talepEdenKurumFirmaId).toBeDefined();
    });

    test('should validate ObjectId format for user and organization references', async () => {
      const requestData = MockData.generateRequest({
        talepEdenKullaniciId: 'invalid-id',
        talepEdenKurumFirmaId: 'invalid-id'
      });
      
      const request = new Talep(requestData);
      let error;
      try {
        await request.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
    });
  });

  describe('Vehicle Requirements (araclar)', () => {
    test('should save vehicle requirements correctly', async () => {
      const vehicleRequirements = [
        { aracTuru: 'otomobil', aracSayisi: 2 },
        { aracTuru: 'kamyonet', aracSayisi: 1 },
        { aracTuru: 'otobüs', aracSayisi: 3 }
      ];
      
      const requestData = MockData.generateRequest({ araclar: vehicleRequirements });
      const request = new Talep(requestData);
      const savedRequest = await request.save();
      
      expect(savedRequest.araclar).toHaveLength(3);
      expect(savedRequest.araclar[0].aracTuru).toBe('otomobil');
      expect(savedRequest.araclar[0].aracSayisi).toBe(2);
      expect(savedRequest.araclar[1].aracTuru).toBe('kamyonet');
      expect(savedRequest.araclar[1].aracSayisi).toBe(1);
    });

    test('should validate vehicle types in requirements', async () => {
      const invalidVehicleRequirements = [
        { aracTuru: 'invalid_type', aracSayisi: 1 }
      ];
      
      const requestData = MockData.generateRequest({ araclar: invalidVehicleRequirements });
      const request = new Talep(requestData);
      
      let error;
      try {
        await request.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
      expect(error.errors['araclar.0.aracTuru']).toBeDefined();
    });

    test('should validate minimum vehicle count', async () => {
      const invalidVehicleRequirements = [
        { aracTuru: 'otomobil', aracSayisi: 0 }
      ];
      
      const requestData = MockData.generateRequest({ araclar: invalidVehicleRequirements });
      const request = new Talep(requestData);
      
      let error;
      try {
        await request.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
      expect(error.errors['araclar.0.aracSayisi']).toBeDefined();
    });

    test('should require both aracTuru and aracSayisi in vehicle requirements', async () => {
      const incompleteVehicleRequirements = [
        { aracTuru: 'otomobil' } // missing aracSayisi
      ];
      
      const requestData = MockData.generateRequest({ araclar: incompleteVehicleRequirements });
      const request = new Talep(requestData);
      
      let error;
      try {
        await request.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
      expect(error.errors['araclar.0.aracSayisi']).toBeDefined();
    });
  });

  describe('Location Information', () => {
    test('should save location information correctly', async () => {
      const locationData = {
        adres: 'Emergency Location, Ankara',
        lat: 39.9334,
        lng: 32.8597
      };
      
      const requestData = MockData.generateRequest({ lokasyon: locationData });
      const request = new Talep(requestData);
      const savedRequest = await request.save();
      
      expect(savedRequest.lokasyon.adres).toBe(locationData.adres);
      expect(savedRequest.lokasyon.lat).toBe(locationData.lat);
      expect(savedRequest.lokasyon.lng).toBe(locationData.lng);
    });

    test('should require location fields', async () => {
      const requestData = MockData.generateRequest();
      delete requestData.lokasyon;
      
      const request = new Talep(requestData);
      let error;
      try {
        await request.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
      expect(error.errors['lokasyon.adres'] || error.errors['lokasyon.lat'] || error.errors['lokasyon.lng']).toBeDefined();
    });

    test('should validate numeric coordinates', async () => {
      const requestData = MockData.generateRequest({
        lokasyon: {
          adres: 'Test Address',
          lat: 'invalid',
          lng: 'invalid'
        }
      });
      
      const request = new Talep(requestData);
      let error;
      try {
        await request.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
    });
  });

  describe('Request Status', () => {
    test('should have default status as beklemede', async () => {
      const requestData = MockData.generateRequest();
      delete requestData.durum;
      
      const request = new Talep(requestData);
      const savedRequest = await request.save();
      
      expect(savedRequest.durum).toBe('beklemede');
    });

    test('should accept valid status values', async () => {
      const validStatuses = ['beklemede', 'gorevlendirildi', 'tamamlandı', 'iptal edildi'];
      
      for (let i = 0; i < validStatuses.length; i++) {
        const status = validStatuses[i];
        const requestData = MockData.generateRequest({ 
          durum: status,
          baslik: `Request ${i} - ${status}`
        });
        const request = new Talep(requestData);
        const savedRequest = await request.save();
        
        expect(savedRequest.durum).toBe(status);
      }
    });

    test('should reject invalid status values', async () => {
      const requestData = MockData.generateRequest({ durum: 'invalid_status' });
      const request = new Talep(requestData);
      
      let error;
      try {
        await request.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
      expect(error.errors.durum).toBeDefined();
    });
  });

  describe('Soft Delete', () => {
    test('should have isDeleted default to false', async () => {
      const requestData = MockData.generateRequest();
      const request = new Talep(requestData);
      const savedRequest = await request.save();
      
      expect(savedRequest.isDeleted).toBe(false);
    });

    test('should allow setting isDeleted to true', async () => {
      const requestData = MockData.generateRequest({ isDeleted: true });
      const request = new Talep(requestData);
      const savedRequest = await request.save();
      
      expect(savedRequest.isDeleted).toBe(true);
    });
  });

  describe('Complex Vehicle Requirements', () => {
    test('should handle multiple vehicle types with different quantities', async () => {
      const complexVehicleRequirements = [
        { aracTuru: 'otomobil', aracSayisi: 5 },
        { aracTuru: 'kamyonet', aracSayisi: 2 },
        { aracTuru: 'otobüs', aracSayisi: 1 },
        { aracTuru: 'kamyon', aracSayisi: 3 }
      ];
      
      const requestData = MockData.generateRequest({ 
        araclar: complexVehicleRequirements,
        baslik: 'Complex Emergency Request'
      });
      const request = new Talep(requestData);
      const savedRequest = await request.save();
      
      expect(savedRequest.araclar).toHaveLength(4);
      
      const totalVehicles = savedRequest.araclar.reduce((sum, arac) => sum + arac.aracSayisi, 0);
      expect(totalVehicles).toBe(11);
    });

    test('should allow same vehicle type multiple times', async () => {
      const duplicateTypeRequirements = [
        { aracTuru: 'otomobil', aracSayisi: 2 },
        { aracTuru: 'otomobil', aracSayisi: 3 }
      ];
      
      const requestData = MockData.generateRequest({ 
        araclar: duplicateTypeRequirements,
        baslik: 'Duplicate Type Request'
      });
      const request = new Talep(requestData);
      const savedRequest = await request.save();
      
      expect(savedRequest.araclar).toHaveLength(2);
      expect(savedRequest.araclar[0].aracTuru).toBe('otomobil');
      expect(savedRequest.araclar[1].aracTuru).toBe('otomobil');
    });
  });

  describe('References and Population', () => {
    test('should store valid ObjectId references', async () => {
      const userId = new mongoose.Types.ObjectId();
      const organizationId = new mongoose.Types.ObjectId();
      
      const requestData = MockData.generateRequest({
        talepEdenKullaniciId: userId,
        talepEdenKurumFirmaId: organizationId
      });
      
      const request = new Talep(requestData);
      const savedRequest = await request.save();
      
      expect(savedRequest.talepEdenKullaniciId).toEqual(userId);
      expect(savedRequest.talepEdenKurumFirmaId).toEqual(organizationId);
    });
  });

  describe('Timestamps', () => {
    test('should automatically set createdAt and updatedAt', async () => {
      const requestData = MockData.generateRequest();
      const request = new Talep(requestData);
      const savedRequest = await request.save();
      
      expect(savedRequest.createdAt).toBeDefined();
      expect(savedRequest.updatedAt).toBeDefined();
      expect(savedRequest.createdAt).toBeInstanceOf(Date);
      expect(savedRequest.updatedAt).toBeInstanceOf(Date);
    });

    test('should update updatedAt on modification', async () => {
      const requestData = MockData.generateRequest();
      const request = new Talep(requestData);
      const savedRequest = await request.save();
      
      const originalUpdatedAt = savedRequest.updatedAt;
      
      // Wait a moment and then update
      await new Promise(resolve => setTimeout(resolve, 100));
      savedRequest.durum = 'gorevlendirildi';
      const updatedRequest = await savedRequest.save();
      
      expect(updatedRequest.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });
}); 