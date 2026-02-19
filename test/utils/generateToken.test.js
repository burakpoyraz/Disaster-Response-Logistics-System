import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { tokenVeCookieOlustur } from '../../backend/lib/utils/generateToken.js';

// Mock response object
const createMockResponse = () => {
  const res = {};
  res.cookie = jest.fn().mockReturnValue(res);
  return res;
};

describe('Generate Token Utility Tests', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.JWT_SECRET = 'test-secret-key';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('tokenVeCookieOlustur', () => {
    test('should generate a valid JWT token', () => {
      const kullaniciId = new mongoose.Types.ObjectId();
      const res = createMockResponse();

      const token = tokenVeCookieOlustur(kullaniciId, res);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      // Verify token can be decoded
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded.kullaniciId).toBe(kullaniciId.toString());
    });

    test('should set HTTP-only cookie with token', () => {
      const kullaniciId = new mongoose.Types.ObjectId();
      const res = createMockResponse();

      const token = tokenVeCookieOlustur(kullaniciId, res);

      expect(res.cookie).toHaveBeenCalledWith('token', token, {
        maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV !== 'development'
      });
    });

    test('should include user ID in token payload', () => {
      const kullaniciId = new mongoose.Types.ObjectId();
      const res = createMockResponse();

      const token = tokenVeCookieOlustur(kullaniciId, res);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      expect(decoded.kullaniciId).toBe(kullaniciId.toString());
      expect(decoded.iat).toBeDefined(); // Issued at
      expect(decoded.exp).toBeDefined(); // Expiration
    });

    test('should generate different tokens for different users', () => {
      const kullaniciId1 = new mongoose.Types.ObjectId();
      const kullaniciId2 = new mongoose.Types.ObjectId();
      const res1 = createMockResponse();
      const res2 = createMockResponse();

      const token1 = tokenVeCookieOlustur(kullaniciId1, res1);
      const token2 = tokenVeCookieOlustur(kullaniciId2, res2);

      expect(token1).not.toBe(token2);

      const decoded1 = jwt.verify(token1, process.env.JWT_SECRET);
      const decoded2 = jwt.verify(token2, process.env.JWT_SECRET);

      expect(decoded1.kullaniciId).toBe(kullaniciId1.toString());
      expect(decoded2.kullaniciId).toBe(kullaniciId2.toString());
      expect(decoded1.kullaniciId).not.toBe(decoded2.kullaniciId);
    });

    test('should set secure cookie in production environment', () => {
      process.env.NODE_ENV = 'production';
      
      const kullaniciId = new mongoose.Types.ObjectId();
      const res = createMockResponse();

      tokenVeCookieOlustur(kullaniciId, res);

      expect(res.cookie).toHaveBeenCalledWith(
        'token',
        expect.any(String),
        expect.objectContaining({
          secure: true
        })
      );
    });

    test('should not set secure cookie in development environment', () => {
      process.env.NODE_ENV = 'development';
      
      const kullaniciId = new mongoose.Types.ObjectId();
      const res = createMockResponse();

      tokenVeCookieOlustur(kullaniciId, res);

      expect(res.cookie).toHaveBeenCalledWith(
        'token',
        expect.any(String),
        expect.objectContaining({
          secure: false
        })
      );
    });

    test('should return the generated token', () => {
      const kullaniciId = new mongoose.Types.ObjectId();
      const res = createMockResponse();

      const token = tokenVeCookieOlustur(kullaniciId, res);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    test('should handle ObjectId as string parameter', () => {
      const kullaniciId = new mongoose.Types.ObjectId();
      const res = createMockResponse();

      const token = tokenVeCookieOlustur(kullaniciId.toString(), res);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      expect(decoded.kullaniciId).toBe(kullaniciId.toString());
    });
  });

  describe('Token Expiration', () => {
    test('should set token to expire in 15 days', () => {
      const kullaniciId = new mongoose.Types.ObjectId();
      const res = createMockResponse();

      const token = tokenVeCookieOlustur(kullaniciId, res);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const now = Math.floor(Date.now() / 1000);
      const fifteenDays = 15 * 24 * 60 * 60; // 15 days in seconds

      expect(decoded.exp - decoded.iat).toBe(fifteenDays);
      expect(decoded.exp).toBeGreaterThan(now);
    });
  });

  describe('Error Handling', () => {
    test('should throw error if JWT_SECRET is not set', () => {
      delete process.env.JWT_SECRET;
      
      const kullaniciId = new mongoose.Types.ObjectId();
      const res = createMockResponse();

      expect(() => {
        tokenVeCookieOlustur(kullaniciId, res);
      }).toThrow();
    });

    test('should handle invalid user ID gracefully', () => {
      const res = createMockResponse();

      expect(() => {
        tokenVeCookieOlustur(null, res);
      }).toThrow();

      expect(() => {
        tokenVeCookieOlustur(undefined, res);
      }).toThrow();
    });
  });
}); 