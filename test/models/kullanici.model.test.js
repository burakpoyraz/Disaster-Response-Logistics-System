import mongoose from 'mongoose';
import Kullanici from '../../backend/models/kullanici.model.js';
import { MockData, TestUsers } from '../helpers/mockData.js';

describe('Kullanici Model Tests', () => {
  
  describe('Schema Validation', () => {
    test('should create a valid user with required fields', async () => {
      const userData = MockData.generateUser();
      const user = new Kullanici(userData);
      const savedUser = await user.save();
      
      expect(savedUser._id).toBeDefined();
      expect(savedUser.ad).toBe(userData.ad);
      expect(savedUser.soyad).toBe(userData.soyad);
      expect(savedUser.email).toBe(userData.email);
      expect(savedUser.telefon).toBe(userData.telefon);
      expect(savedUser.rol).toBe('beklemede');
      expect(savedUser.isDeleted).toBe(false);
    });

    test('should fail validation without required fields', async () => {
      const user = new Kullanici({});
      let error;
      try {
        await user.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
      expect(error.errors.ad).toBeDefined();
      expect(error.errors.soyad).toBeDefined();
      expect(error.errors.email).toBeDefined();
      expect(error.errors.sifre).toBeDefined();
      expect(error.errors.telefon).toBeDefined();
    });

    test('should enforce unique email constraint', async () => {
      const userData1 = MockData.generateUser({ email: 'unique@test.com' });
      const userData2 = MockData.generateUser({ email: 'unique@test.com', telefon: '5550009999' });
      
      const user1 = new Kullanici(userData1);
      await user1.save();
      
      const user2 = new Kullanici(userData2);
      let error;
      try {
        await user2.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
      expect(error.code).toBe(11000); // Duplicate key error
    });

    test('should enforce unique phone constraint', async () => {
      const userData1 = MockData.generateUser({ telefon: '5550001234' });
      const userData2 = MockData.generateUser({ telefon: '5550001234', email: 'different@test.com' });
      
      const user1 = new Kullanici(userData1);
      await user1.save();
      
      const user2 = new Kullanici(userData2);
      let error;
      try {
        await user2.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
      expect(error.code).toBe(11000); // Duplicate key error
    });
  });

  describe('Role Management', () => {
    test('should accept valid roles', async () => {
      const validRoles = ['beklemede', 'arac_sahibi', 'talep_eden', 'koordinator'];
      
      for (const rol of validRoles) {
        const userData = MockData.generateUser({ rol, email: `${rol}@test.com`, telefon: `555${Math.random().toString().substr(2,7)}` });
        const user = new Kullanici(userData);
        const savedUser = await user.save();
        
        expect(savedUser.rol).toBe(rol);
      }
    });

    test('should reject invalid roles', async () => {
      const userData = MockData.generateUser({ rol: 'invalid_role' });
      const user = new Kullanici(userData);
      
      let error;
      try {
        await user.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
      expect(error.errors.rol).toBeDefined();
    });
  });

  describe('Organization Information', () => {
    test('should save kullaniciBeyanBilgileri correctly', async () => {
      const userData = MockData.generateUser({
        kullaniciBeyanBilgileri: {
          kurumFirmaAdi: 'Test Organization',
          kurumFirmaTuru: 'kurulus_adina',
          pozisyon: 'Manager'
        }
      });
      
      const user = new Kullanici(userData);
      const savedUser = await user.save();
      
      expect(savedUser.kullaniciBeyanBilgileri.kurumFirmaAdi).toBe('Test Organization');
      expect(savedUser.kullaniciBeyanBilgileri.kurumFirmaTuru).toBe('kurulus_adina');
      expect(savedUser.kullaniciBeyanBilgileri.pozisyon).toBe('Manager');
    });

    test('should accept valid kurumFirmaTuru values', async () => {
      const validTypes = ['kurulus_adina', 'kendi_adima'];
      
      for (const type of validTypes) {
        const userData = MockData.generateUser({ 
          email: `${type}@test.com`, 
          telefon: `555${Math.random().toString().substr(2,7)}`,
          kullaniciBeyanBilgileri: { kurumFirmaTuru: type }
        });
        const user = new Kullanici(userData);
        const savedUser = await user.save();
        
        expect(savedUser.kullaniciBeyanBilgileri.kurumFirmaTuru).toBe(type);
      }
    });
  });

  describe('Soft Delete', () => {
    test('should have isDeleted default to false', async () => {
      const userData = MockData.generateUser();
      const user = new Kullanici(userData);
      const savedUser = await user.save();
      
      expect(savedUser.isDeleted).toBe(false);
    });

    test('should allow setting isDeleted to true', async () => {
      const userData = MockData.generateUser({ isDeleted: true });
      const user = new Kullanici(userData);
      const savedUser = await user.save();
      
      expect(savedUser.isDeleted).toBe(true);
    });
  });

  describe('Timestamps', () => {
    test('should automatically set createdAt and updatedAt', async () => {
      const userData = MockData.generateUser();
      const user = new Kullanici(userData);
      const savedUser = await user.save();
      
      expect(savedUser.createdAt).toBeDefined();
      expect(savedUser.updatedAt).toBeDefined();
      expect(savedUser.createdAt).toBeInstanceOf(Date);
      expect(savedUser.updatedAt).toBeInstanceOf(Date);
    });

    test('should update updatedAt on modification', async () => {
      const userData = MockData.generateUser();
      const user = new Kullanici(userData);
      const savedUser = await user.save();
      
      const originalUpdatedAt = savedUser.updatedAt;
      
      // Wait a moment and then update
      await new Promise(resolve => setTimeout(resolve, 100));
      savedUser.ad = 'Updated Name';
      const updatedUser = await savedUser.save();
      
      expect(updatedUser.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Population Tests', () => {
    test('should populate kurumFirmaId reference', async () => {
      // This test would require KurumFirma model to be imported and data to be created
      // For now, we'll test that the field accepts ObjectId
      const kurumFirmaId = new mongoose.Types.ObjectId();
      const userData = MockData.generateUser({ kurumFirmaId });
      const user = new Kullanici(userData);
      const savedUser = await user.save();
      
      expect(savedUser.kurumFirmaId).toEqual(kurumFirmaId);
    });
  });
}); 