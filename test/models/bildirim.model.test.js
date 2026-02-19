import mongoose from 'mongoose';
import Bildirim from '../../backend/models/bildirim.model.js';
import { MockData } from '../helpers/mockData.js';

describe('Bildirim Model Tests', () => {
  
  describe('Schema Validation', () => {
    test('should create a valid notification with required fields', async () => {
      const notificationData = MockData.generateNotification();
      const notification = new Bildirim(notificationData);
      const savedNotification = await notification.save();
      
      expect(savedNotification._id).toBeDefined();
      expect(savedNotification.baslik).toBe(notificationData.baslik);
      expect(savedNotification.icerik).toBe(notificationData.icerik);
      expect(savedNotification.okundu).toBe(false);
      expect(savedNotification.tur).toBe('sistem');
      expect(savedNotification.gizlilik).toBe('bireysel');
      expect(savedNotification.isDeleted).toBe(false);
    });

    test('should fail validation without required fields', async () => {
      const notification = new Bildirim({});
      let error;
      try {
        await notification.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
      expect(error.errors.baslik).toBeDefined();
      expect(error.errors.icerik).toBeDefined();
    });

    test('should allow notification without user or organization references', async () => {
      const notificationData = MockData.generateNotification();
      delete notificationData.kullaniciId;
      delete notificationData.kurumFirmaId;
      
      const notification = new Bildirim(notificationData);
      const savedNotification = await notification.save();
      
      expect(savedNotification.kullaniciId).toBeNull();
      expect(savedNotification.kurumFirmaId).toBeNull();
    });
  });

  describe('Notification Type Validation', () => {
    test('should accept valid notification types', async () => {
      const validTypes = ['gorev', 'talep', 'sistem'];
      
      for (let i = 0; i < validTypes.length; i++) {
        const type = validTypes[i];
        const notificationData = MockData.generateNotification({ 
          tur: type,
          baslik: `${type} notification ${Date.now()}`
        });
        const notification = new Bildirim(notificationData);
        const savedNotification = await notification.save();
        
        expect(savedNotification.tur).toBe(type);
      }
    });

    test('should reject invalid notification types', async () => {
      const notificationData = MockData.generateNotification({ tur: 'invalid_type' });
      const notification = new Bildirim(notificationData);
      
      let error;
      try {
        await notification.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
      expect(error.errors.tur).toBeDefined();
    });

    test('should have default type as sistem', async () => {
      const notificationData = MockData.generateNotification();
      delete notificationData.tur;
      
      const notification = new Bildirim(notificationData);
      const savedNotification = await notification.save();
      
      expect(savedNotification.tur).toBe('sistem');
    });
  });

  describe('Privacy Level Validation', () => {
    test('should accept valid privacy levels', async () => {
      const validPrivacyLevels = ['bireysel', 'kurumsal'];
      
      for (let i = 0; i < validPrivacyLevels.length; i++) {
        const privacy = validPrivacyLevels[i];
        const notificationData = MockData.generateNotification({ 
          gizlilik: privacy,
          baslik: `${privacy} notification ${Date.now()}`
        });
        const notification = new Bildirim(notificationData);
        const savedNotification = await notification.save();
        
        expect(savedNotification.gizlilik).toBe(privacy);
      }
    });

    test('should reject invalid privacy levels', async () => {
      const notificationData = MockData.generateNotification({ gizlilik: 'invalid_privacy' });
      const notification = new Bildirim(notificationData);
      
      let error;
      try {
        await notification.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
      expect(error.errors.gizlilik).toBeDefined();
    });

    test('should have default privacy level as bireysel', async () => {
      const notificationData = MockData.generateNotification();
      delete notificationData.gizlilik;
      
      const notification = new Bildirim(notificationData);
      const savedNotification = await notification.save();
      
      expect(savedNotification.gizlilik).toBe('bireysel');
    });
  });

  describe('Read Status', () => {
    test('should have default read status as false', async () => {
      const notificationData = MockData.generateNotification();
      delete notificationData.okundu;
      
      const notification = new Bildirim(notificationData);
      const savedNotification = await notification.save();
      
      expect(savedNotification.okundu).toBe(false);
    });

    test('should allow setting read status to true', async () => {
      const notificationData = MockData.generateNotification({ okundu: true });
      const notification = new Bildirim(notificationData);
      const savedNotification = await notification.save();
      
      expect(savedNotification.okundu).toBe(true);
    });

    test('should update read status', async () => {
      const notificationData = MockData.generateNotification({ okundu: false });
      const notification = new Bildirim(notificationData);
      let savedNotification = await notification.save();
      
      expect(savedNotification.okundu).toBe(false);
      
      savedNotification.okundu = true;
      savedNotification = await savedNotification.save();
      
      expect(savedNotification.okundu).toBe(true);
    });
  });

  describe('Target URL', () => {
    test('should save target URL correctly', async () => {
      const targetUrl = '/gorev/detay/12345';
      const notificationData = MockData.generateNotification({ hedefUrl: targetUrl });
      const notification = new Bildirim(notificationData);
      const savedNotification = await notification.save();
      
      expect(savedNotification.hedefUrl).toBe(targetUrl);
    });

    test('should allow empty target URL', async () => {
      const notificationData = MockData.generateNotification();
      delete notificationData.hedefUrl;
      
      const notification = new Bildirim(notificationData);
      const savedNotification = await notification.save();
      
      expect(savedNotification.hedefUrl).toBeUndefined();
    });

    test('should accept various URL formats', async () => {
      const urlFormats = [
        '/gorev/detay/123',
        '/talep/detay/456',
        '/kullanici/profil',
        'https://external-link.com',
        '/dashboard#section',
        '/reports?filter=active'
      ];
      
      for (let i = 0; i < urlFormats.length; i++) {
        const url = urlFormats[i];
        const notificationData = MockData.generateNotification({ 
          hedefUrl: url,
          baslik: `Notification ${i} ${Date.now()}`
        });
        const notification = new Bildirim(notificationData);
        const savedNotification = await notification.save();
        
        expect(savedNotification.hedefUrl).toBe(url);
      }
    });
  });

  describe('References', () => {
    test('should save user and organization references correctly', async () => {
      const kullaniciId = new mongoose.Types.ObjectId();
      const kurumFirmaId = new mongoose.Types.ObjectId();
      
      const notificationData = MockData.generateNotification({
        kullaniciId,
        kurumFirmaId
      });
      
      const notification = new Bildirim(notificationData);
      const savedNotification = await notification.save();
      
      expect(savedNotification.kullaniciId).toEqual(kullaniciId);
      expect(savedNotification.kurumFirmaId).toEqual(kurumFirmaId);
    });

    test('should have null default values for references', async () => {
      const notificationData = MockData.generateNotification();
      delete notificationData.kullaniciId;
      delete notificationData.kurumFirmaId;
      
      const notification = new Bildirim(notificationData);
      const savedNotification = await notification.save();
      
      expect(savedNotification.kullaniciId).toBeNull();
      expect(savedNotification.kurumFirmaId).toBeNull();
    });
  });

  describe('Content Validation', () => {
    test('should accept various content lengths', async () => {
      const contents = [
        'Short message',
        'A longer notification message with more details about what happened and what the user should do about it.',
        'Very long notification content that might include detailed instructions, multiple paragraphs, and comprehensive information about the task or event that triggered this notification. This tests the ability to handle longer text content.'
      ];
      
      for (let i = 0; i < contents.length; i++) {
        const content = contents[i];
        const notificationData = MockData.generateNotification({ 
          icerik: content,
          baslik: `Test notification ${i} ${Date.now()}`
        });
        const notification = new Bildirim(notificationData);
        const savedNotification = await notification.save();
        
        expect(savedNotification.icerik).toBe(content);
      }
    });

    test('should require non-empty title and content', async () => {
      const emptyContentData = MockData.generateNotification({ 
        baslik: '',
        icerik: ''
      });
      const notification = new Bildirim(emptyContentData);
      
      let error;
      try {
        await notification.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
      expect(error.errors.baslik || error.errors.icerik).toBeDefined();
    });
  });

  describe('Soft Delete', () => {
    test('should have isDeleted default to false', async () => {
      const notificationData = MockData.generateNotification();
      const notification = new Bildirim(notificationData);
      const savedNotification = await notification.save();
      
      expect(savedNotification.isDeleted).toBe(false);
    });

    test('should allow setting isDeleted to true', async () => {
      const notificationData = MockData.generateNotification({ isDeleted: true });
      const notification = new Bildirim(notificationData);
      const savedNotification = await notification.save();
      
      expect(savedNotification.isDeleted).toBe(true);
    });
  });

  describe('Timestamps', () => {
    test('should automatically set createdAt and updatedAt', async () => {
      const notificationData = MockData.generateNotification();
      const notification = new Bildirim(notificationData);
      const savedNotification = await notification.save();
      
      expect(savedNotification.createdAt).toBeDefined();
      expect(savedNotification.updatedAt).toBeDefined();
      expect(savedNotification.createdAt).toBeInstanceOf(Date);
      expect(savedNotification.updatedAt).toBeInstanceOf(Date);
    });

    test('should update updatedAt on modification', async () => {
      const notificationData = MockData.generateNotification();
      const notification = new Bildirim(notificationData);
      const savedNotification = await notification.save();
      
      const originalUpdatedAt = savedNotification.updatedAt;
      
      // Wait a moment and then update
      await new Promise(resolve => setTimeout(resolve, 100));
      savedNotification.okundu = true;
      const updatedNotification = await savedNotification.save();
      
      expect(updatedNotification.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Notification Scenarios', () => {
    test('should create task notification', async () => {
      const taskNotificationData = MockData.generateNotification({
        baslik: 'Yeni Görev Atandı',
        icerik: 'Size yeni bir görev atanmıştır. Lütfen detayları inceleyin.',
        tur: 'gorev',
        hedefUrl: '/gorev/detay/123',
        gizlilik: 'bireysel'
      });
      
      const notification = new Bildirim(taskNotificationData);
      const savedNotification = await notification.save();
      
      expect(savedNotification.tur).toBe('gorev');
      expect(savedNotification.hedefUrl).toContain('/gorev/');
    });

    test('should create request notification', async () => {
      const requestNotificationData = MockData.generateNotification({
        baslik: 'Yeni Talep Oluşturuldu',
        icerik: 'Bölgenizde yeni bir araç talebi oluşturulmuştur.',
        tur: 'talep',
        hedefUrl: '/talep/detay/456',
        gizlilik: 'kurumsal'
      });
      
      const notification = new Bildirim(requestNotificationData);
      const savedNotification = await notification.save();
      
      expect(savedNotification.tur).toBe('talep');
      expect(savedNotification.gizlilik).toBe('kurumsal');
    });

    test('should create system notification', async () => {
      const systemNotificationData = MockData.generateNotification({
        baslik: 'Sistem Bakımı',
        icerik: 'Sistem bakımı nedeniyle hizmet kısa süre kesintiye uğrayabilir.',
        tur: 'sistem',
        gizlilik: 'bireysel'
      });
      
      const notification = new Bildirim(systemNotificationData);
      const savedNotification = await notification.save();
      
      expect(savedNotification.tur).toBe('sistem');
      expect(savedNotification.hedefUrl).toBeDefined();
    });
  });
}); 