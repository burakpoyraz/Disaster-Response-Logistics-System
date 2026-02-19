import request from 'supertest';
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Kullanici from '../../backend/models/kullanici.model.js';
import { MockData, TestUsers } from '../helpers/mockData.js';
import * as authController from '../../backend/controllers/auth.controller.js';

// Mock the token generation utility
jest.mock('../../backend/lib/utils/generateToken.js', () => ({
  tokenVeCookieOlustur: jest.fn((kullaniciId, res) => {
    const token = jwt.sign({ id: kullaniciId }, 'test-secret', { expiresIn: '1d' });
    res.cookie('token', token, { httpOnly: true });
    return token;
  })
}));

const app = express();
app.use(express.json());

// Mock routes for testing
app.post('/auth/kayit-ol', authController.kayitOl);
app.post('/auth/giris-yap', authController.girisYap);
app.post('/auth/cikis-yap', authController.cikisYap);
app.get('/auth/hesabim', authController.hesabim);

describe('Auth Controller Tests', () => {
  
  describe('Registration (kayitOl)', () => {
    test('should register a new user successfully', async () => {
      const userData = {
        ad: 'Test',
        soyad: 'User',
        email: `test.${Date.now()}@example.com`,
        sifre: 'password123',
        telefon: `555${Math.floor(Math.random() * 1000000)}`,
        kurumFirmaAdi: 'Test Organization',
        kurumFirmaTuru: 'kendi_adima'
      };

      const response = await request(app)
        .post('/auth/kayit-ol')
        .send(userData)
        .expect(201);

      expect(response.body.message).toBe('Kayıt başarıyla oluşturuldu');
      expect(response.body.kullanici).toBeDefined();
      expect(response.body.kullanici.email).toBe(userData.email);
      expect(response.body.kullanici.sifre).toBeUndefined(); // Password should not be returned
      
      // Verify user was saved to database
      const savedUser = await Kullanici.findOne({ email: userData.email, isDeleted: false });
      expect(savedUser).toBeTruthy();
      expect(savedUser.ad).toBe(userData.ad);
      expect(bcrypt.compareSync(userData.sifre, savedUser.sifre)).toBe(true);
    });

    test('should fail registration with missing required fields', async () => {
      const incompleteData = {
        ad: 'Test',
        // missing required fields
      };

      const response = await request(app)
        .post('/auth/kayit-ol')
        .send(incompleteData)
        .expect(400);

      expect(response.body.error).toBe('Tüm zorunlu alanları doldurunuz');
    });

    test('should fail registration with invalid email', async () => {
      const userData = MockData.generateUser({
        email: 'invalid-email',
        telefon: `555${Math.floor(Math.random() * 1000000)}`
      });

      const response = await request(app)
        .post('/auth/kayit-ol')
        .send({
          ad: userData.ad,
          soyad: userData.soyad,
          email: userData.email,
          sifre: 'password123',
          telefon: userData.telefon
        })
        .expect(400);

      expect(response.body.error).toBe('Geçerli bir email adresi giriniz');
    });

    test('should fail registration with invalid phone number', async () => {
      const userData = {
        ad: 'Test',
        soyad: 'User',
        email: `test.${Date.now()}@example.com`,
        sifre: 'password123',
        telefon: '123' // Invalid phone number
      };

      const response = await request(app)
        .post('/auth/kayit-ol')
        .send(userData)
        .expect(400);

      expect(response.body.error).toBe('Geçerli bir telefon numarası giriniz');
    });

    test('should fail registration with short password', async () => {
      const userData = {
        ad: 'Test',
        soyad: 'User',
        email: `test.${Date.now()}@example.com`,
        sifre: '123', // Too short
        telefon: `555${Math.floor(Math.random() * 1000000)}`
      };

      const response = await request(app)
        .post('/auth/kayit-ol')
        .send(userData)
        .expect(400);

      expect(response.body.error).toBe('Şifre en az 6 karakter olmalıdır');
    });

    test('should fail registration with duplicate email', async () => {
      const userData = MockData.generateUser();
      const user = new Kullanici(userData);
      await user.save();

      const duplicateUserData = {
        ad: 'Different',
        soyad: 'User',
        email: userData.email, // Same email
        sifre: 'password123',
        telefon: `555${Math.floor(Math.random() * 1000000)}`
      };

      const response = await request(app)
        .post('/auth/kayit-ol')
        .send(duplicateUserData)
        .expect(400);

      expect(response.body.error).toBe('Bu email veya telefon numarası ile kayıtlı bir kullanıcı var');
    });

    test('should fail registration with duplicate phone', async () => {
      const userData = MockData.generateUser();
      const user = new Kullanici(userData);
      await user.save();

      const duplicateUserData = {
        ad: 'Different',
        soyad: 'User',
        email: `different.${Date.now()}@example.com`,
        sifre: 'password123',
        telefon: userData.telefon // Same phone
      };

      const response = await request(app)
        .post('/auth/kayit-ol')
        .send(duplicateUserData)
        .expect(400);

      expect(response.body.error).toBe('Bu email veya telefon numarası ile kayıtlı bir kullanıcı var');
    });
  });

  describe('Login (girisYap)', () => {
    test('should login successfully with valid credentials', async () => {
      // Create a test user
      const password = 'password123';
      const userData = MockData.generateUser({
        sifre: bcrypt.hashSync(password, 10)
      });
      const user = new Kullanici(userData);
      await user.save();

      const loginData = {
        email: userData.email,
        sifre: password
      };

      const response = await request(app)
        .post('/auth/giris-yap')
        .send(loginData)
        .expect(200);

      expect(response.body.message).toBe('Giriş başarılı');
      expect(response.body.kullanici).toBeDefined();
      expect(response.body.kullanici.email).toBe(userData.email);
      expect(response.body.kullanici.sifre).toBeUndefined();
      expect(response.headers['set-cookie']).toBeDefined(); // Cookie should be set
    });

    test('should fail login with missing credentials', async () => {
      const response = await request(app)
        .post('/auth/giris-yap')
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Email ve şifre gereklidir');
    });

    test('should fail login with non-existent user', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        sifre: 'password123'
      };

      const response = await request(app)
        .post('/auth/giris-yap')
        .send(loginData)
        .expect(400);

      expect(response.body.error).toBe('Geçersiz email veya şifre');
    });

    test('should fail login with wrong password', async () => {
      const password = 'password123';
      const userData = MockData.generateUser({
        sifre: bcrypt.hashSync(password, 10)
      });
      const user = new Kullanici(userData);
      await user.save();

      const loginData = {
        email: userData.email,
        sifre: 'wrongpassword'
      };

      const response = await request(app)
        .post('/auth/giris-yap')
        .send(loginData)
        .expect(400);

      expect(response.body.error).toBe('Geçersiz email veya şifre');
    });

    test('should fail login with deleted user', async () => {
      const password = 'password123';
      const userData = MockData.generateUser({
        sifre: bcrypt.hashSync(password, 10),
        isDeleted: true
      });
      const user = new Kullanici(userData);
      await user.save();

      const loginData = {
        email: userData.email,
        sifre: password
      };

      const response = await request(app)
        .post('/auth/giris-yap')
        .send(loginData)
        .expect(400);

      expect(response.body.error).toBe('Geçersiz email veya şifre');
    });
  });

  describe('Logout (cikisYap)', () => {
    test('should logout successfully', async () => {
      const response = await request(app)
        .post('/auth/cikis-yap')
        .expect(200);

      expect(response.body.message).toBe('Çıkış başarılı');
      
      // Check that cookie is cleared
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toContain('token=');
    });
  });

  describe('Get Current User (hesabim)', () => {
    // Note: This test would require middleware setup for JWT verification
    // For now, we'll test the basic structure
    test('should return user information when authenticated', async () => {
      // This would require setting up proper middleware and authentication
      // For a complete test, you'd need to mock the JWT middleware
      expect(authController.hesabim).toBeDefined();
    });
  });

  describe('Password Security', () => {
    test('should hash password before saving', async () => {
      const userData = {
        ad: 'Test',
        soyad: 'User',
        email: `test.${Date.now()}@example.com`,
        sifre: 'password123',
        telefon: `555${Math.floor(Math.random() * 1000000)}`
      };

      await request(app)
        .post('/auth/kayit-ol')
        .send(userData)
        .expect(201);

      const savedUser = await Kullanici.findOne({ email: userData.email, isDeleted: false });
      expect(savedUser.sifre).not.toBe(userData.sifre); // Should be hashed
      expect(bcrypt.compareSync(userData.sifre, savedUser.sifre)).toBe(true); // But should match when compared
    });
  });

  describe('User Organization Information', () => {
    test('should save organization information during registration', async () => {
      const userData = {
        ad: 'Test',
        soyad: 'User',
        email: `test.${Date.now()}@example.com`,
        sifre: 'password123',
        telefon: `555${Math.floor(Math.random() * 1000000)}`,
        kurumFirmaAdi: 'Test Organization',
        kurumFirmaTuru: 'kurulus_adina'
      };

      const response = await request(app)
        .post('/auth/kayit-ol')
        .send(userData)
        .expect(201);

      const savedUser = await Kullanici.findOne({ email: userData.email, isDeleted: false });
      expect(savedUser.kullaniciBeyanBilgileri.kurumFirmaAdi).toBe(userData.kurumFirmaAdi);
      expect(savedUser.kullaniciBeyanBilgileri.kurumFirmaTuru).toBe(userData.kurumFirmaTuru);
    });

    test('should default kurumFirmaTuru to kendi_adima when not provided', async () => {
      const userData = {
        ad: 'Test',
        soyad: 'User',
        email: `test.${Date.now()}@example.com`,
        sifre: 'password123',
        telefon: `555${Math.floor(Math.random() * 1000000)}`,
        kurumFirmaAdi: 'Test Organization'
        // kurumFirmaTuru not provided
      };

      await request(app)
        .post('/auth/kayit-ol')
        .send(userData)
        .expect(201);

      const savedUser = await Kullanici.findOne({ email: userData.email, isDeleted: false });
      expect(savedUser.kullaniciBeyanBilgileri.kurumFirmaTuru).toBe('kendi_adima');
    });
  });
}); 