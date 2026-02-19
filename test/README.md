# Test Suite for Disaster Vehicle Management System (AFET ARAÇ TALEP YÖNETİM SİSTEMİ)

This directory contains comprehensive unit and integration tests for the disaster vehicle management system.

## Test Structure

```
test/
├── controllers/          # Controller unit tests
├── models/              # Model unit tests  
├── integration/         # Integration tests
├── utils/               # Utility function tests
├── helpers/             # Test helper functions and mock data
├── setup.js             # Test environment setup
├── jest.config.js       # Jest configuration
└── README.md            # This file
```

## Test Categories

### Model Tests
- **User Model (kullanici.model.test.js)**: Tests user schema validation, roles, authentication
- **Vehicle Model (arac.model.test.js)**: Tests vehicle registration, types, status management  
- **Request Model (talep.model.test.js)**: Tests emergency requests, vehicle requirements
- **Task Model (gorev.model.test.js)**: Tests task assignment, status tracking
- **Organization Model (kurumFirma.model.test.js)**: Tests organization management
- **Notification Model (bildirim.model.test.js)**: Tests notification system

### Controller Tests
- **Authentication Controller**: Tests registration, login, logout, token management
- **Vehicle Controller**: Tests CRUD operations for vehicles
- **Request Controller**: Tests emergency request management
- **Task Controller**: Tests task assignment and tracking

### Integration Tests
- **Authentication Flow**: End-to-end authentication testing
- **Request-Task Flow**: Complete emergency response workflow
- **User-Organization Integration**: Multi-entity relationship testing

### Utility Tests
- **Token Generation**: JWT token creation and validation
- **Email/SMS Services**: Communication service testing
- **PDF/Excel Generation**: Report generation testing

## Running Tests

### Install Dependencies
```bash
# From project root
npm install

# Install test-specific dependencies
npm install --save-dev jest supertest mongodb-memory-server @babel/preset-env @babel/core
```

### Run All Tests
```bash
npm test
```

### Run Specific Test Categories
```bash
# Model tests only
npm run test:models

# Controller tests only  
npm run test:controllers

# Integration tests only
npm run test:integration

# Utility tests only
npm run test:utils
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Generate Coverage Report
```bash
npm run test:coverage
```

## Test Features

### Mock Data Generation
The `helpers/mockData.js` file provides factories for generating test data:

```javascript
import { MockData, TestUsers } from './helpers/mockData.js';

// Generate a single user
const user = MockData.generateUser();

// Generate multiple vehicles
const vehicles = MockData.generateMultipleVehicles(5);

// Use predefined test users
const coordinator = TestUsers.coordinator;
```

### Database Testing
- Uses MongoDB Memory Server for isolated testing
- Automatic database cleanup between tests
- Realistic data persistence testing

### Authentication Testing
- JWT token generation and validation
- Cookie management
- Protected route access
- Role-based authorization

### Soft Delete Testing
- Tests soft delete functionality across all models
- Ensures deleted records don't appear in queries
- Tests data recovery scenarios

## Test Data

### Sample Users
- **Coordinator**: Administrative user with full system access
- **Vehicle Owner**: User who owns and manages vehicles  
- **Requester**: User who creates emergency requests

### Sample Scenarios
- Emergency vehicle requests with multiple vehicle types
- Task assignment and status updates
- Organization-based access control
- Notification delivery and read status

## Configuration

### Environment Variables
Tests use the following environment variables:
- `JWT_SECRET`: Secret key for JWT token generation
- `NODE_ENV`: Set to 'test' during test execution
- `MONGO_URI`: Overridden by MongoDB Memory Server

### Test Timeout
Tests have a 30-second timeout to accommodate database operations and async operations.

## Best Practices

### Writing New Tests
1. Use the MockData helpers for consistent test data
2. Clean up any created data in test teardown
3. Test both success and error scenarios
4. Include edge cases and boundary conditions
5. Mock external services (email, SMS)

### Test Organization
1. Group related tests in describe blocks
2. Use descriptive test names
3. Follow AAA pattern (Arrange, Act, Assert)
4. Keep tests independent and isolated

### Debugging Tests
1. Use `--verbose` flag for detailed output
2. Use `--detectOpenHandles` to find memory leaks
3. Use `console.log` sparingly in tests
4. Check test coverage reports for gaps

## Coverage Goals

- **Models**: 100% line and branch coverage
- **Controllers**: 95%+ coverage of business logic
- **Utilities**: 100% coverage of pure functions
- **Integration**: Cover all major user workflows

## Contributing

When adding new features:
1. Write tests before implementing features (TDD)
2. Ensure all existing tests pass
3. Add tests for new models, controllers, and utilities
4. Update integration tests for new workflows
5. Maintain or improve test coverage

## Troubleshooting

### Common Issues

**MongoDB Connection Errors**
- Ensure MongoDB Memory Server is properly configured
- Check for hanging database connections

**JWT Token Issues**  
- Verify JWT_SECRET is set in test environment
- Check token expiration settings

**Async/Await Issues**
- Ensure all async operations are properly awaited
- Use proper error handling in async tests

**Memory Leaks**
- Clean up database connections
- Clear timers and intervals
- Use `forceExit` in Jest configuration if needed 