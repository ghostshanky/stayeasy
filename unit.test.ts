import { AuthService } from '../server/auth';
import { PaymentsController } from '../prisma/paymentsController'; // Assuming this is the path
import { generateInvoicePdf } from '../prisma/pdfGenerator';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';

// Mock dependencies
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('fs');

jest.mock('@prisma/client', () => {
  const mPrismaClient = {
    $transaction: jest.fn().mockImplementation(async (callback) => callback(mPrismaClient)),
    refreshToken: {
      findMany: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    invoice: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    file: {
      create: jest.fn(),
    }
  };
  return { PrismaClient: jest.fn(() => mPrismaClient) };
});

const mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient> & {
  $transaction: jest.Mock,
  refreshToken: { findMany: jest.Mock, delete: jest.Mock, deleteMany: jest.Mock },
  user: { findUnique: jest.Mock },
  invoice: { findUnique: jest.Mock, create: jest.Mock },
  file: { create: jest.Mock },
};

describe('Unit Tests', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AuthService.refreshToken', () => {
    it('should rotate refresh tokens successfully', async () => {
      const user = { id: 'user1', email: 'user@test.com', name: 'Test', role: 'TENANT', emailVerified: true };
      const oldRefreshToken = 'old-token';
      const newTokens = { accessToken: 'new-access', refreshToken: 'new-refresh' };

      (AuthService.verifyRefreshToken as jest.Mock).mockReturnValue({ userId: user.id });
      mockPrisma.refreshToken.findMany.mockResolvedValue([{ id: 'rt1', token: 'hashed-old-token', userId: user.id }]);
      (AuthService.verifyPassword as jest.Mock).mockResolvedValue(true);
      mockPrisma.user.findUnique.mockResolvedValue(user);
      (AuthService.createSession as jest.Mock).mockResolvedValue(newTokens);

      const result = await AuthService.refreshToken(oldRefreshToken, '::1', 'jest');

      expect(result).toEqual(newTokens);
      expect(mockPrisma.refreshToken.delete).toHaveBeenCalledWith({ where: { id: 'rt1' } });
      expect(AuthService.createSession).toHaveBeenCalledWith(user, '::1', 'jest');
    });
  });

  describe('generateInvoicePdf', () => {
    it('should generate a PDF and create a file record', async () => {
      const mockInvoice = {
        id: 'inv1',
        invoiceNo: 'INV-001',
        createdAt: new Date(),
        status: 'PAID',
        amount: 10000,
        lineItems: [],
        user: { name: 'Tenant', email: 'tenant@test.com' },
        owner: { name: 'Owner', email: 'owner@test.com' },
        booking: { property: { name: 'Test Prop' } },
      };
      mockPrisma.invoice.findUnique.mockResolvedValue(mockInvoice);
      mockPrisma.file.create.mockResolvedValue({ id: 'file1', url: '/path/to/file.pdf', type: 'application/pdf' });
      (fs.createWriteStream as jest.Mock).mockReturnValue({ on: jest.fn().mockImplementation((event, cb) => { if (event === 'finish') cb(); }), end: jest.fn() });

      const fileId = await generateInvoicePdf('inv1');

      expect(fs.createWriteStream).toHaveBeenCalledWith(expect.stringContaining('INV-001.pdf'));
      expect(mockPrisma.file.create).toHaveBeenCalled();
      expect(fileId).toBe('file1');
    });
  });
});