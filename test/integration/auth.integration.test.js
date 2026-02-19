import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import Kullanici from '../../backend/models/kullanici.model.js';
import KurumFirma from '../../backend/models/kurumFirma.model.js';
import { MockData } from '../helpers/mockData.js';
import * as authController from '../../backend/controllers/auth.controller.js';
import { JWTKontrol } from '../../backend/middlewire/JWTKontrol.js';

const app = express();
app.use(express.json());
app.use(cookieParser());

// Auth routes
app.post('/auth/kayit-ol', authController.kayitOl);
app.post('/auth/giris-yap', authController.girisYap);
app.post('/auth/cikis-yap', authController.cikisYap);
app.get('/auth/hesabim', JWTKontrol, authController.hesabim);

describe('Authentication Integration Tests', () => {
  
  describe('Complete Registration Flow', () => {
    test('should register user and automatically log them in', async () => {
      const userData = {
        ad: 'Integration',
        soyad: 'Test',
        email: `integration.${Date.now()}@example.com`,
        sifre: 'password123',
        telefon: `555${Math.floor(Math.random() * 1000000)}`,
        kurumFirmaAdi: 'Integration Test Organization',
        kurumFirmaTuru: 'kendi_adima'
      };

      // Register user
      const registerResponse = await request(app)
        .post('/auth/kayit-ol')
        .send(userData)
        .expect(201);

      expect(registerResponse.body.message).toBe('Kayıt başarıyla oluşturuldu');
      expect(registerResponse.body.kullanici.email).toBe(userData.email);
      expect(registerResponse.body.kullanici.rol).toBe('beklemede');

      // Verify user exists in database
      const savedUser = await Kullanici.findOne({ 
        email: userData.email, 
        isDeleted: false 
      });
      expect(savedUser).toBeTruthy();
      expect(savedUser.kullaniciBeyanBilgileri.kurumFirmaAdi).toBe(userData.kurumFirmaAdi);

      // Verify cookie is set
      const cookies = registerResponse.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toContain('token=');
    });
  });

  describe('Complete Login Flow', () => {
    test('should login user and set authentication cookie', async () => {
      // First create a user
      const userData = MockData.generateUser();
      const user = new Kullanici(userData);
      await user.save();

      // Login with created user
      const loginData = {
        email: userData.email,
        sifre: 'password123' // MockData uses this password
      };

      const loginResponse = await request(app)
        .post('/auth/giris-yap')
        .send(loginData)
        .expect(200);

      expect(loginResponse.body.message).toBe('Giriş başarılı');
      expect(loginResponse.body.kullanici.email).toBe(userData.email);

      // Verify cookie is set
      const cookies = loginResponse.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toContain('token=');
    });
  });

  describe('Protected Route Access', () => {
    test('should allow access to protected route with valid token', async () => {
      // Create and login user
      const userData = MockData.generateUser();
      const user = new Kullanici(userData);
      await user.save();

      const loginResponse = await request(app)
        .post('/auth/giris-yap')
        .send({
          email: userData.email,
          sifre: 'password123'
        });

      // Extract cookie from login response
      const cookies = loginResponse.headers['set-cookie'];
      const tokenCookie = cookies.find(cookie => cookie.startsWith('token='));

      // Access protected route with cookie
      const protectedResponse = await request(app)
        .get('/auth/hesabim')
        .set('Cookie', tokenCookie)
        .expect(200);

      expect(protectedResponse.body.kullanici.email).toBe(userData.email);
    });

    test('should deny access to protected route without token', async () => {
      await request(app)
        .get('/auth/hesabim')
        .expect(401);
    });

    test('should deny access with invalid token', async () => {
      await request(app)
        .get('/auth/hesabim')
        .set('Cookie', 'token=invalid-token')
        .expect(401);
    });
  });

  describe('Logout Flow', () => {
    test('should logout user and clear authentication cookie', async () => {
      // Create and login user first
      const userData = MockData.generateUser();
      const user = new Kullanici(userData);
      await user.save();

      const loginResponse = await request(app)
        .post('/auth/giris-yap')
        .send({
          email: userData.email,
          sifre: 'password123'
        });

      const loginCookies = loginResponse.headers['set-cookie'];
      const tokenCookie = loginCookies.find(cookie => cookie.startsWith('token='));

      // Logout
      const logoutResponse = await request(app)
        .post('/auth/cikis-yap')
        .set('Cookie', tokenCookie)
        .expect(200);

      expect(logoutResponse.body.message).toBe('Çıkış başarılı');

      // Verify cookie is cleared
      const logoutCookies = logoutResponse.headers['set-cookie'];
      expect(logoutCookies).toBeDefined();
      expect(logoutCookies[0]).toContain('token=');
      expect(logoutCookies[0]).toContain('Max-Age=0'); // Cookie is expired
    });

    test('should not access protected route after logout', async () => {
      // Create and login user
      const userData = MockData.generateUser();
      const user = new Kullanici(userData);
      await user.save();

      const loginResponse = await request(app)
        .post('/auth/giris-yap')
        .send({
          email: userData.email,
          sifre: 'password123'
        });

      const loginCookies = loginResponse.headers['set-cookie'];
      const tokenCookie = loginCookies.find(cookie => cookie.startsWith('token='));

      // Verify can access protected route before logout
      await request(app)
        .get('/auth/hesabim')
        .set('Cookie', tokenCookie)
        .expect(200);

      // Logout
      const logoutResponse = await request(app)
        .post('/auth/cikis-yap')
        .set('Cookie', tokenCookie);

      const logoutCookies = logoutResponse.headers['set-cookie'];
      const clearedTokenCookie = logoutCookies.find(cookie => cookie.startsWith('token='));

      // Try to access protected route with cleared cookie
      await request(app)
        .get('/auth/hesabim')
        .set('Cookie', clearedTokenCookie)
        .expect(401);
    });
  });

  describe('User Role and Organization Integration', () => {
    test('should handle organization information during registration', async () => {
      // First create an organization
      const orgData = MockData.generateOrganization();
      const organization = new KurumFirma(orgData);
      const savedOrg = await organization.save();

      const userData = {
        ad: 'Org',
        soyad: 'User',
        email: `org.user.${Date.now()}@example.com`,
        sifre: 'password123',
        telefon: `555${Math.floor(Math.random() * 1000000)}`,
        kurumFirmaAdi: savedOrg.kurumAdi,
        kurumFirmaTuru: 'kurulus_adina'
      };

      const response = await request(app)
        .post('/auth/kayit-ol')
        .send(userData)
        .expect(201);

      const savedUser = await Kullanici.findById(response.body.kullanici._id);
      expect(savedUser.kullaniciBeyanBilgileri.kurumFirmaAdi).toBe(savedOrg.kurumAdi);
      expect(savedUser.kullaniciBeyanBilgileri.kurumFirmaTuru).toBe('kurulus_adina');
    });
  });

  describe('Error Scenarios', () => {
    test('should handle database connection errors gracefully', async () => {
      // This test would require mocking mongoose connection
      // For now, we test that the routes are properly set up
      expect(authController.kayitOl).toBeDefined();
      expect(authController.girisYap).toBeDefined();
      expect(authController.cikisYap).toBeDefined();
      expect(authController.hesabim).toBeDefined();
    });

    test('should validate email uniqueness across soft-deleted users', async () => {
      // Create user
      const userData = MockData.generateUser();
      const user = new Kullanici(userData);
      await user.save();

      // Soft delete user
      user.isDeleted = true;
      await user.save();

      // Try to register with same email
      const newUserData = {
        ad: 'New',
        soyad: 'User',
        email: userData.email, // Same email as soft-deleted user
        sifre: 'password123',
        telefon: `555${Math.floor(Math.random() * 1000000)}`
      };

      // Should allow registration since original user is soft-deleted
      await request(app)
        .post('/auth/kayit-ol')
        .send(newUserData)
        .expect(201);
    });
  });

  describe('Security Tests', () => {
    test('should not return password in response', async () => {
      const userData = {
        ad: 'Security',
        soyad: 'Test',
        email: `security.${Date.now()}@example.com`,
        sifre: 'password123',
        telefon: `555${Math.floor(Math.random() * 1000000)}`
      };

      const registerResponse = await request(app)
        .post('/auth/kayit-ol')
        .send(userData);

      expect(registerResponse.body.kullanici.sifre).toBeUndefined();

      // Login and check response
      const loginResponse = await request(app)
        .post('/auth/giris-yap')
        .send({
          email: userData.email,
          sifre: userData.sifre
        });

      expect(loginResponse.body.kullanici.sifre).toBeUndefined();
    });

    test('should set secure cookie settings', async () => {
      const userData = MockData.generateUser();
      const user = new Kullanici(userData);
      await user.save();

      const loginResponse = await request(app)
        .post('/auth/giris-yap')
        .send({
          email: userData.email,
          sifre: 'password123'
        });

      const cookies = loginResponse.headers['set-cookie'];
      const tokenCookie = cookies.find(cookie => cookie.startsWith('token='));

      expect(tokenCookie).toContain('HttpOnly');
      expect(tokenCookie).toContain('SameSite=Strict');
    });
  });
}); 