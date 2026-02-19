import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export const MockData = {
  // Generate mock user data
  generateUser: (overrides = {}) => ({
    ad: 'Test',
    soyad: 'User',
    email: `test.user.${Date.now()}@example.com`,
    sifre: bcrypt.hashSync('password123', 10),
    telefon: `555000${Math.floor(Math.random() * 10000)}`,
    rol: 'beklemede',
    kurumFirmaId: null,
    kullaniciBeyanBilgileri: {
      kurumFirmaAdi: 'Test Organization',
      kurumFirmaTuru: 'kendi_adima',
      pozisyon: 'Test Position'
    },
    isDeleted: false,
    ...overrides
  }),

  // Generate mock vehicle data
  generateVehicle: (overrides = {}) => ({
    plaka: `34 TEST ${Math.floor(Math.random() * 1000)}`,
    aracTuru: 'otomobil',
    kullanimAmaci: 'yolcu',
    kapasite: 5,
    musaitlikDurumu: true,
    aracDurumu: 'aktif',
    konum: {
      adres: 'Test Address, Istanbul',
      lat: 41.0082,
      lng: 28.9784
    },
    kurumFirmaId: null,
    kullaniciId: null,
    isDeleted: false,
    ...overrides
  }),

  // Generate mock request data
  generateRequest: (overrides = {}) => ({
    baslik: 'Test Emergency Request',
    aciklama: 'This is a test emergency vehicle request',
    talepEdenKullaniciId: new mongoose.Types.ObjectId(),
    talepEdenKurumFirmaId: new mongoose.Types.ObjectId(),
    araclar: [{
      aracTuru: 'otomobil',
      aracSayisi: 2
    }],
    lokasyon: {
      adres: 'Emergency Location, Istanbul',
      lat: 41.0082,
      lng: 28.9784
    },
    durum: 'beklemede',
    isDeleted: false,
    ...overrides
  }),

  // Generate mock organization data
  generateOrganization: (overrides = {}) => ({
    kurumAdi: `Test Organization ${Date.now()}`,
    kurumTuru: 'kamu',
    iletisim: {
      telefon: '02121234567',
      email: `org.${Date.now()}@example.com`,
      adres: 'Organization Address, Istanbul'
    },
    isDeleted: false,
    ...overrides
  }),

  // Generate mock task data
  generateTask: (overrides = {}) => ({
    talepId: new mongoose.Types.ObjectId(),
    aracId: new mongoose.Types.ObjectId(),
    sofor: {
      ad: 'Driver',
      soyad: 'Test',
      telefon: '05551234567'
    },
    koordinatorId: new mongoose.Types.ObjectId(),
    gorevDurumu: 'beklemede',
    gorevNotu: 'Test task note',
    hedefKonumu: {
      lat: 41.0082,
      lng: 28.9784
    },
    isDeleted: false,
    ...overrides
  }),

  // Generate mock notification data
  generateNotification: (overrides = {}) => ({
    kullaniciId: new mongoose.Types.ObjectId(),
    kurumFirmaId: new mongoose.Types.ObjectId(),
    baslik: 'Test Notification',
    icerik: 'This is a test notification content',
    hedefUrl: '/test-url',
    okundu: false,
    tur: 'sistem',
    gizlilik: 'bireysel',
    isDeleted: false,
    ...overrides
  }),

  // Generate multiple entities
  generateMultipleUsers: (count = 5, overrides = {}) => {
    return Array.from({ length: count }, (_, index) => 
      MockData.generateUser({ 
        email: `test.user.${Date.now()}.${index}@example.com`,
        telefon: `555000${String(index).padStart(4, '0')}`,
        ...overrides 
      })
    );
  },

  generateMultipleVehicles: (count = 3, overrides = {}) => {
    const vehicleTypes = ['otomobil', 'kamyonet', 'otobüs'];
    return Array.from({ length: count }, (_, index) => 
      MockData.generateVehicle({ 
        plaka: `34 TST ${String(index + 100).padStart(3, '0')}`,
        aracTuru: vehicleTypes[index % vehicleTypes.length],
        ...overrides 
      })
    );
  },

  generateMultipleRequests: (count = 3, overrides = {}) => {
    return Array.from({ length: count }, (_, index) => 
      MockData.generateRequest({ 
        baslik: `Emergency Request ${index + 1}`,
        ...overrides 
      })
    );
  }
};

// Predefined test users with specific roles
export const TestUsers = {
  coordinator: {
    ad: 'Koordinator',
    soyad: 'Test',
    email: 'koordinator@test.com',
    sifre: bcrypt.hashSync('password123', 10),
    telefon: '5550001111',
    rol: 'koordinator',
    isDeleted: false
  },
  
  vehicleOwner: {
    ad: 'Arac',
    soyad: 'Sahibi',
    email: 'arac.sahibi@test.com',
    sifre: bcrypt.hashSync('password123', 10),
    telefon: '5550002222',
    rol: 'arac_sahibi',
    isDeleted: false
  },
  
  requester: {
    ad: 'Talep',
    soyad: 'Eden',
    email: 'talep.eden@test.com',
    sifre: bcrypt.hashSync('password123', 10),
    telefon: '5550003333',
    rol: 'talep_eden',
    isDeleted: false
  }
}; 