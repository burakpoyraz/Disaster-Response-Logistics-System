import { MockData } from './helpers/mockData.js';
import Kullanici from '../backend/models/kullanici.model.js';
import Arac from '../backend/models/arac.model.js';
import Talep from '../backend/models/talep.model.js';

describe('Example End-to-End Test Workflow', () => {
  
  test('should demonstrate complete disaster response workflow', async () => {
    // 1. Create a coordinator
    const coordinatorData = MockData.generateUser({ rol: 'koordinator' });
    const coordinator = new Kullanici(coordinatorData);
    await coordinator.save();

    // 2. Create a vehicle owner
    const vehicleOwnerData = MockData.generateUser({ rol: 'arac_sahibi' });
    const vehicleOwner = new Kullanici(vehicleOwnerData);
    await vehicleOwner.save();

    // 3. Create a requester
    const requesterData = MockData.generateUser({ rol: 'talep_eden' });
    const requester = new Kullanici(requesterData);
    await requester.save();

    // 4. Vehicle owner adds vehicles
    const vehicleData1 = MockData.generateVehicle({
      kullaniciId: vehicleOwner._id,
      aracTuru: 'otomobil',
      kapasite: 5
    });
    const vehicle1 = new Arac(vehicleData1);
    await vehicle1.save();

    const vehicleData2 = MockData.generateVehicle({
      kullaniciId: vehicleOwner._id,
      aracTuru: 'kamyonet',
      kapasite: 10
    });
    const vehicle2 = new Arac(vehicleData2);
    await vehicle2.save();

    // 5. Emergency occurs - requester creates request
    const requestData = MockData.generateRequest({
      talepEdenKullaniciId: requester._id,
      araclar: [
        { aracTuru: 'otomobil', aracSayisi: 1 },
        { aracTuru: 'kamyonet', aracSayisi: 1 }
      ],
      baslik: 'Acil Yardım Talebi - Deprem Bölgesi',
      aciklama: 'Deprem sonrası kurtarma operasyonu için araç talebi'
    });
    const request = new Talep(requestData);
    await request.save();

    // 6. Verify the complete workflow
    expect(coordinator._id).toBeDefined();
    expect(vehicleOwner._id).toBeDefined();
    expect(requester._id).toBeDefined();
    
    expect(vehicle1.aracTuru).toBe('otomobil');
    expect(vehicle2.aracTuru).toBe('kamyonet');
    
    expect(request.durum).toBe('beklemede');
    expect(request.araclar).toHaveLength(2);
    expect(request.araclar[0].aracTuru).toBe('otomobil');
    expect(request.araclar[1].aracTuru).toBe('kamyonet');

    // 7. Verify relationships
    expect(request.talepEdenKullaniciId).toEqual(requester._id);
    expect(vehicle1.kullaniciId).toEqual(vehicleOwner._id);
    expect(vehicle2.kullaniciId).toEqual(vehicleOwner._id);

    console.log('✅ Complete disaster response workflow test passed!');
    console.log(`- Created coordinator: ${coordinator.ad} ${coordinator.soyad}`);
    console.log(`- Created vehicle owner: ${vehicleOwner.ad} ${vehicleOwner.soyad}`);
    console.log(`- Created requester: ${requester.ad} ${requester.soyad}`);
    console.log(`- Registered vehicles: ${vehicle1.plaka}, ${vehicle2.plaka}`);
    console.log(`- Created emergency request: ${request.baslik}`);
  });

  test('should demonstrate data validation and error handling', async () => {
    // Test invalid user data
    const invalidUser = new Kullanici({
      ad: '', // Invalid: empty name
      email: 'invalid-email', // Invalid format
      sifre: '123', // Too short
      telefon: '123' // Invalid format
    });

    let error;
    try {
      await invalidUser.save();
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.errors).toBeDefined();

    // Test valid user data
    const validUserData = MockData.generateUser();
    const validUser = new Kullanici(validUserData);
    const savedUser = await validUser.save();

    expect(savedUser._id).toBeDefined();
    expect(savedUser.ad).toBe(validUserData.ad);
    expect(savedUser.email).toBe(validUserData.email);

    console.log('✅ Data validation and error handling test passed!');
  });

  test('should demonstrate mock data generation capabilities', async () => {
    // Generate single entities
    const user = MockData.generateUser();
    const vehicle = MockData.generateVehicle();
    const request = MockData.generateRequest();

    // Generate multiple entities
    const users = MockData.generateMultipleUsers(3);
    const vehicles = MockData.generateMultipleVehicles(5);
    const requests = MockData.generateMultipleRequests(2);

    // Verify data structure
    expect(user).toHaveProperty('ad');
    expect(user).toHaveProperty('email');
    expect(user).toHaveProperty('telefon');

    expect(vehicle).toHaveProperty('plaka');
    expect(vehicle).toHaveProperty('aracTuru');
    expect(vehicle).toHaveProperty('kapasite');

    expect(request).toHaveProperty('baslik');
    expect(request).toHaveProperty('araclar');
    expect(request).toHaveProperty('lokasyon');

    expect(users).toHaveLength(3);
    expect(vehicles).toHaveLength(5);
    expect(requests).toHaveLength(2);

    // Verify unique values
    const emails = users.map(u => u.email);
    const uniqueEmails = [...new Set(emails)];
    expect(uniqueEmails).toHaveLength(emails.length);

    console.log('✅ Mock data generation test passed!');
    console.log(`- Generated ${users.length} users with unique emails`);
    console.log(`- Generated ${vehicles.length} vehicles with different types`);
    console.log(`- Generated ${requests.length} emergency requests`);
  });
});

describe('Test Infrastructure Verification', () => {
  
  test('should verify database connection and cleanup', async () => {
    const initialUserCount = await Kullanici.countDocuments();
    
    // Create test data
    const userData = MockData.generateUser();
    const user = new Kullanici(userData);
    await user.save();
    
    const afterCreateCount = await Kullanici.countDocuments();
    expect(afterCreateCount).toBe(initialUserCount + 1);
    
    // Database should be cleaned up after each test automatically
    console.log('✅ Database connection and operations working correctly!');
  });

  test('should verify all test utilities are available', () => {
    // Check global test utilities
    expect(global.testUtils).toBeDefined();
    expect(global.testUtils.generateObjectId).toBeDefined();
    expect(global.testUtils.sleep).toBeDefined();

    // Check mock data utilities
    expect(MockData.generateUser).toBeDefined();
    expect(MockData.generateVehicle).toBeDefined();
    expect(MockData.generateRequest).toBeDefined();
    expect(MockData.generateMultipleUsers).toBeDefined();

    console.log('✅ All test utilities are properly configured!');
  });
}); 