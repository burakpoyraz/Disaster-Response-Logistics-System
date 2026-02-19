import mongoose from 'mongoose';
import KurumFirma from '../../backend/models/kurumFirma.model.js';
import { MockData } from '../helpers/mockData.js';

describe('KurumFirma Model Tests', () => {
  
  describe('Schema Validation', () => {
    test('should create a valid organization with required fields', async () => {
      const orgData = MockData.generateOrganization();
      const organization = new KurumFirma(orgData);
      const savedOrganization = await organization.save();
      
      expect(savedOrganization._id).toBeDefined();
      expect(savedOrganization.kurumAdi).toBe(orgData.kurumAdi);
      expect(savedOrganization.kurumTuru).toBe(orgData.kurumTuru);
      expect(savedOrganization.isDeleted).toBe(false);
    });

    test('should fail validation without required fields', async () => {
      const organization = new KurumFirma({});
      let error;
      try {
        await organization.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
      expect(error.errors.kurumAdi).toBeDefined();
    });

    test('should allow organization without kurumTuru', async () => {
      const orgData = MockData.generateOrganization();
      delete orgData.kurumTuru;
      
      const organization = new KurumFirma(orgData);
      const savedOrganization = await organization.save();
      
      expect(savedOrganization.kurumAdi).toBe(orgData.kurumAdi);
      expect(savedOrganization.kurumTuru).toBeUndefined();
    });
  });

  describe('Organization Type Validation', () => {
    test('should accept valid organization types', async () => {
      const validTypes = ['kamu', 'özel'];
      
      for (let i = 0; i < validTypes.length; i++) {
        const type = validTypes[i];
        const orgData = MockData.generateOrganization({ 
          kurumTuru: type,
          kurumAdi: `Test Organization ${type} ${Date.now()}`
        });
        const organization = new KurumFirma(orgData);
        const savedOrganization = await organization.save();
        
        expect(savedOrganization.kurumTuru).toBe(type);
      }
    });

    test('should reject invalid organization types', async () => {
      const orgData = MockData.generateOrganization({ kurumTuru: 'invalid_type' });
      const organization = new KurumFirma(orgData);
      
      let error;
      try {
        await organization.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
      expect(error.errors.kurumTuru).toBeDefined();
    });
  });

  describe('Contact Information', () => {
    test('should save contact information correctly', async () => {
      const contactInfo = {
        telefon: '02121234567',
        email: 'contact@organization.com',
        adres: 'Organization Address, Istanbul, Turkey'
      };
      
      const orgData = MockData.generateOrganization({ iletisim: contactInfo });
      const organization = new KurumFirma(orgData);
      const savedOrganization = await organization.save();
      
      expect(savedOrganization.iletisim.telefon).toBe(contactInfo.telefon);
      expect(savedOrganization.iletisim.email).toBe(contactInfo.email);
      expect(savedOrganization.iletisim.adres).toBe(contactInfo.adres);
    });

    test('should allow empty contact information', async () => {
      const orgData = MockData.generateOrganization();
      delete orgData.iletisim;
      
      const organization = new KurumFirma(orgData);
      const savedOrganization = await organization.save();
      
      expect(savedOrganization.iletisim).toEqual({});
    });

    test('should allow partial contact information', async () => {
      const partialContactInfo = {
        telefon: '02121234567'
        // missing email and adres
      };
      
      const orgData = MockData.generateOrganization({ iletisim: partialContactInfo });
      const organization = new KurumFirma(orgData);
      const savedOrganization = await organization.save();
      
      expect(savedOrganization.iletisim.telefon).toBe(partialContactInfo.telefon);
      expect(savedOrganization.iletisim.email).toBeUndefined();
      expect(savedOrganization.iletisim.adres).toBeUndefined();
    });

    test('should save all contact fields when provided', async () => {
      const completeContactInfo = {
        telefon: '02121234567',
        email: 'complete@organization.com',
        adres: 'Complete Address, Istanbul, Turkey'
      };
      
      const orgData = MockData.generateOrganization({ iletisim: completeContactInfo });
      const organization = new KurumFirma(orgData);
      const savedOrganization = await organization.save();
      
      expect(savedOrganization.iletisim.telefon).toBe(completeContactInfo.telefon);
      expect(savedOrganization.iletisim.email).toBe(completeContactInfo.email);
      expect(savedOrganization.iletisim.adres).toBe(completeContactInfo.adres);
    });
  });

  describe('Organization Name', () => {
    test('should accept various organization name formats', async () => {
      const organizationNames = [
        'Simple Name',
        'Organization with Numbers 123',
        'Org-with-Dashes',
        'Org_with_Underscores',
        'Organizasyön Türkçe Karakter',
        'Very Long Organization Name That Should Still Be Accepted'
      ];
      
      for (let i = 0; i < organizationNames.length; i++) {
        const name = organizationNames[i];
        const orgData = MockData.generateOrganization({ 
          kurumAdi: name,
          iletisim: { email: `test${i}@example.com` } // Ensure uniqueness
        });
        const organization = new KurumFirma(orgData);
        const savedOrganization = await organization.save();
        
        expect(savedOrganization.kurumAdi).toBe(name);
      }
    });

    test('should require non-empty organization name', async () => {
      const orgData = MockData.generateOrganization({ kurumAdi: '' });
      const organization = new KurumFirma(orgData);
      
      let error;
      try {
        await organization.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
      expect(error.errors.kurumAdi).toBeDefined();
    });
  });

  describe('Soft Delete', () => {
    test('should have isDeleted default to false', async () => {
      const orgData = MockData.generateOrganization();
      const organization = new KurumFirma(orgData);
      const savedOrganization = await organization.save();
      
      expect(savedOrganization.isDeleted).toBe(false);
    });

    test('should allow setting isDeleted to true', async () => {
      const orgData = MockData.generateOrganization({ isDeleted: true });
      const organization = new KurumFirma(orgData);
      const savedOrganization = await organization.save();
      
      expect(savedOrganization.isDeleted).toBe(true);
    });
  });

  describe('Timestamps', () => {
    test('should automatically set timestamps', async () => {
      const orgData = MockData.generateOrganization();
      const organization = new KurumFirma(orgData);
      const savedOrganization = await organization.save();
      
      // Note: The schema has { timestamp: true } instead of { timestamps: true }
      // This might be a typo in the original model, but we'll test what's actually there
      expect(savedOrganization.createdAt).toBeDefined();
      expect(savedOrganization.updatedAt).toBeDefined();
    });
  });

  describe('Complete Organization Data', () => {
    test('should save complete organization with all fields', async () => {
      const completeOrgData = {
        kurumAdi: 'Complete Test Organization',
        kurumTuru: 'kamu',
        iletisim: {
          telefon: '02121234567',
          email: 'complete@organization.com',
          adres: 'Complete Address, Istanbul, Turkey'
        },
        isDeleted: false
      };
      
      const organization = new KurumFirma(completeOrgData);
      const savedOrganization = await organization.save();
      
      expect(savedOrganization.kurumAdi).toBe(completeOrgData.kurumAdi);
      expect(savedOrganization.kurumTuru).toBe(completeOrgData.kurumTuru);
      expect(savedOrganization.iletisim.telefon).toBe(completeOrgData.iletisim.telefon);
      expect(savedOrganization.iletisim.email).toBe(completeOrgData.iletisim.email);
      expect(savedOrganization.iletisim.adres).toBe(completeOrgData.iletisim.adres);
      expect(savedOrganization.isDeleted).toBe(false);
    });

    test('should save minimal organization with only required fields', async () => {
      const minimalOrgData = {
        kurumAdi: 'Minimal Organization'
      };
      
      const organization = new KurumFirma(minimalOrgData);
      const savedOrganization = await organization.save();
      
      expect(savedOrganization.kurumAdi).toBe(minimalOrgData.kurumAdi);
      expect(savedOrganization.kurumTuru).toBeUndefined();
      expect(savedOrganization.iletisim).toEqual({});
      expect(savedOrganization.isDeleted).toBe(false);
    });
  });

  describe('Organization Types Scenarios', () => {
    test('should create public organization', async () => {
      const publicOrgData = MockData.generateOrganization({
        kurumAdi: 'İstanbul Büyükşehir Belediyesi',
        kurumTuru: 'kamu',
        iletisim: {
          telefon: '02125513600',
          email: 'bilgi@ibb.gov.tr',
          adres: 'Saraçhane, İstanbul'
        }
      });
      
      const organization = new KurumFirma(publicOrgData);
      const savedOrganization = await organization.save();
      
      expect(savedOrganization.kurumTuru).toBe('kamu');
      expect(savedOrganization.kurumAdi).toContain('Belediyesi');
    });

    test('should create private organization', async () => {
      const privateOrgData = MockData.generateOrganization({
        kurumAdi: 'Özel Lojistik Şirketi Ltd.',
        kurumTuru: 'özel',
        iletisim: {
          telefon: '02121234567',
          email: 'info@ozellojistik.com',
          adres: 'İş Merkezi, İstanbul'
        }
      });
      
      const organization = new KurumFirma(privateOrgData);
      const savedOrganization = await organization.save();
      
      expect(savedOrganization.kurumTuru).toBe('özel');
      expect(savedOrganization.kurumAdi).toContain('Şirketi');
    });
  });
}); 