import { PrismaClient, User } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';
import { diff } from 'deep-object-diff';

const prisma = new PrismaClient();

export class AuditService {
  static async log(
    actorId: string | null,
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    model: string,
    modelId: string,
    details: {
      oldData?: any;
      newData?: any;
      ip?: string;
      userAgent?: string;
    }
  ) {
    const changeDiff =
      details.oldData || details.newData
        ? diff(details.oldData || {}, details.newData || {})
        : {};

    // Don't log if there's no change
    if (action === 'UPDATE' && Object.keys(changeDiff).length === 0) {
      return;
    }

    await prisma.auditLog.create({
      data: {
        actorId,
        action: `${model}_${action}`,
        details: JSON.stringify({
          model,
          modelId,
          diff: changeDiff,
          ip: details.ip,
          userAgent: details.userAgent,
        }),
        // Link to relevant models if needed
        [`${model.toLowerCase()}Id`]: modelId,
      },
    });
  }
}

/**
 * Middleware factory to audit database operations.
 * This is a higher-order function that wraps your route handler.
 *
 * @param modelName - The name of the Prisma model (e.g., 'Property').
 * @param idSource - A function to extract the model's ID from the request.
 * @param action - The type of action being performed.
 */
export function audit(
  modelName: keyof PrismaClient,
  idSource: (req: Request, res: Response) => string | undefined,
  action: 'UPDATE' | 'DELETE'
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const modelId = idSource(req, res);
    if (!modelId) {
      return next(); // Cannot audit without an ID
    }

    const prismaModel = prisma[modelName] as any;
    const oldData = await prismaModel.findUnique({ where: { id: modelId } });

    // Monkey-patch res.json to capture the new state after the handler runs
    const originalJson = res.json;
    res.json = function (body) {
      // On successful update/delete, log the audit record
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const newData = action === 'UPDATE' ? body.data : null;
        AuditService.log(req.currentUser?.id ?? null, action, modelName.toUpperCase(), modelId, {
          oldData,
          newData,
          ip: req.ip,
          userAgent: req.headers['user-agent'],
        }).catch(console.error);
      }
      return originalJson.call(this, body);
    };

    next();
  };
}

/**
 * Special audit wrapper for CREATE actions, as there is no 'oldData'.
 */
export function auditCreate(modelName: keyof PrismaClient) {
    return (req: Request, res: Response, next: NextFunction) => {
        const originalJson = res.json;
        res.json = function (body) {
            if (res.statusCode === 201 && body.data?.id) {
                AuditService.log(req.currentUser?.id ?? null, 'CREATE', modelName.toUpperCase(), body.data.id, { newData: body.data, ip: req.ip, userAgent: req.headers['user-agent'] }).catch(console.error);
            }
            return originalJson.call(this, body);
        };
        next();
    };
}