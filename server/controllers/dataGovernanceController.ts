import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { AuditService } from '../middleware/audit';

const prisma = new PrismaClient();

export class DataGovernanceController {
  /**
   * GET /api/user/:id/export
   * Exports all data related to a user.
   */
  static async exportUserData(req: Request, res: Response) {
    const { id: userIdToExport } = req.params;
    const actor = req.currentUser;

    // Authorization: User can export their own data, or an ADMIN can export anyone's.
    if (actor?.id !== userIdToExport && actor?.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You are not authorized to export this user\'s data.' } });
    }

    try {
      const user = await prisma.user.findUnique({ where: { id: userIdToExport } });
      if (!user) {
        return res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND' } });
      }

      const [bookings, payments, invoices, reviews, chats] = await Promise.all([
        prisma.booking.findMany({ where: { userId: userIdToExport } }),
        prisma.payment.findMany({ where: { userId: userIdToExport } }),
        prisma.invoice.findMany({ where: { userId: userIdToExport } }),
        prisma.review.findMany({ where: { userId: userIdToExport } }),
        prisma.chat.findMany({
          where: { OR: [{ userId: userIdToExport }, { ownerId: userIdToExport }] },
          include: { messages: true },
        }),
      ]);

      const exportData = {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt,
        },
        bookings,
        payments,
        invoices,
        reviews,
        chats,
      };

      await AuditService.log(actor!.id, 'UPDATE', 'USER', userIdToExport, {
          newData: { action: 'DATA_EXPORT' },
          ip: req.ip,
          userAgent: req.headers['user-agent']
      });

      res.setHeader('Content-Disposition', `attachment; filename="export-${userIdToExport}.json"`);
      res.setHeader('Content-Type', 'application/json');
      res.status(200).send(JSON.stringify(exportData, null, 2));
    } catch (error) {
      console.error('Data export error:', error);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to export user data.' } });
    }
  }

  /**
   * POST /api/user/:id/delete
   * Deletes or pseudonymizes a user's data.
   */
  static async deleteUser(req: Request, res: Response) {
    const { id: userIdToDelete } = req.params;
    const actor = req.currentUser;

    // Authorization: User can delete themselves, or an ADMIN can.
    if (actor?.id !== userIdToDelete && actor?.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You are not authorized to delete this user.' } });
    }

    try {
      // Check for financial records which prevent hard deletion.
      const financialRecordsCount = await prisma.payment.count({
        where: {
          userId: userIdToDelete,
          status: { in: ['VERIFIED', 'REFUNDED'] },
        },
      });

      const oldData = await prisma.user.findUnique({ where: { id: userIdToDelete } });
      if (!oldData) {
        return res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND' } });
      }

      if (financialRecordsCount > 0) {
        // --- Perform Pseudonymization ---
        const anonymizedId = `deleted-user-${userIdToDelete.substring(0, 8)}`;
        const updatedUser = await prisma.user.update({
          where: { id: userIdToDelete },
          data: {
            name: 'Deleted User',
            email: `${anonymizedId}@deleted.stayeasy`,
            password: 'deleted',
            emailVerified: false,
            emailToken: null,
            emailTokenExpiry: null,
          },
        });

        // Invalidate all sessions
        await prisma.refreshToken.deleteMany({ where: { userId: userIdToDelete } });

        await AuditService.log(actor!.id, 'UPDATE', 'USER', userIdToDelete, {
            oldData,
            newData: updatedUser,
            ip: req.ip,
            userAgent: req.headers['user-agent']
        });

        res.status(200).json({ success: true, message: 'User has been pseudonymized due to financial records.' });
      } else {
        // --- Perform Hard Deletion ---
        await prisma.user.delete({ where: { id: userIdToDelete } });

        await AuditService.log(actor!.id, 'DELETE', 'USER', userIdToDelete, {
            oldData,
            ip: req.ip,
            userAgent: req.headers['user-agent']
        });

        res.status(200).json({ success: true, message: 'User has been permanently deleted.' });
      }
    } catch (error) {
      console.error('User deletion error:', error);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete user.' } });
    }
  }
}

import express from 'express';
import { requireAuth } from '../middleware.js';

const dataGovernanceRouter = express.Router();

dataGovernanceRouter.get('/user/:id/export', requireAuth, DataGovernanceController.exportUserData);
dataGovernanceRouter.post('/user/:id/delete', requireAuth, DataGovernanceController.deleteUser);

export default dataGovernanceRouter;