import { z } from 'zod';

const symbol = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9]{2,12}$/, 'Must be 2 to 12 letters or digits');

const condition = z.enum(['above', 'below']);

const targetPrice = z.number().positive();

const note = z.string().trim().max(280).nullable();

export const alertIdParamsSchema = z.object({
  id: z
    .string()
    .regex(/^[1-9]\d{0,14}$/, 'Must be a positive integer')
    .transform(Number),
});

export const createAlertSchema = z.strictObject({
  symbol,
  condition,
  targetPrice,
  note: note.default(null),
  active: z.boolean().default(true),
});

export const updateAlertSchema = z
  .strictObject({
    symbol: symbol.optional(),
    condition: condition.optional(),
    targetPrice: targetPrice.optional(),
    note: note.optional(),
    active: z.boolean().optional(),
  })
  .refine(changes => Object.keys(changes).length > 0, {
    error: 'Provide at least one field to update',
    when: payload => payload.issues.length === 0,
  });

const price = z.string().trim().min(1, 'Must be a number').transform(Number).pipe(z.number().nonnegative());

export const listAlertsQuerySchema = z
  .strictObject({
    symbol: symbol.optional(),
    condition: condition.optional(),
    active: z
      .enum(['true', 'false'])
      .transform(value => value === 'true')
      .optional(),
    minPrice: price.optional(),
    maxPrice: price.optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
  })
  .refine(query => query.minPrice === undefined || query.maxPrice === undefined || query.minPrice <= query.maxPrice, {
    error: 'Must not be greater than maxPrice',
    path: ['minPrice'],
  });

export type AlertCondition = z.infer<typeof condition>;
export type CreateAlertInput = z.infer<typeof createAlertSchema>;
export type UpdateAlertInput = z.infer<typeof updateAlertSchema>;
export type ListAlertsQuery = z.infer<typeof listAlertsQuerySchema>;
