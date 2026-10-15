import type { Database } from '../db.js';
import type { AlertCondition, CreateAlertInput, ListAlertsQuery, UpdateAlertInput } from './alert.schema.js';

export interface Alert {
  id: number;
  symbol: string;
  condition: AlertCondition;
  targetPrice: number;
  note: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AlertPage {
  data: Alert[];
  total: number;
}

export interface AlertRepository {
  create(input: CreateAlertInput): Alert;
  list(query: ListAlertsQuery): AlertPage;
  findById(id: number): Alert | undefined;
  update(id: number, changes: UpdateAlertInput): Alert | undefined;
  delete(id: number): boolean;
}

interface AlertRow extends Omit<Alert, 'active'> {
  active: number;
}

type AlertParams = Omit<AlertRow, 'id'>;

interface WhereClause {
  sql: string;
  params: Record<string, string | number>;
}

const columns = `
  id, symbol, condition, target_price AS targetPrice, note, active,
  created_at AS createdAt, updated_at AS updatedAt
`;

const toAlert = (row: AlertRow): Alert => ({ ...row, active: row.active === 1 });

const toParams = (alert: Omit<Alert, 'id'>): AlertParams => ({
  symbol: alert.symbol,
  condition: alert.condition,
  targetPrice: alert.targetPrice,
  note: alert.note,
  active: alert.active ? 1 : 0,
  createdAt: alert.createdAt,
  updatedAt: alert.updatedAt,
});

const toWhereClause = (query: ListAlertsQuery): WhereClause => {
  const conditions: string[] = [];
  const params: WhereClause['params'] = {};

  if (query.symbol !== undefined) {
    conditions.push('symbol = @symbol');
    params.symbol = query.symbol;
  }
  if (query.condition !== undefined) {
    conditions.push('condition = @condition');
    params.condition = query.condition;
  }
  if (query.active !== undefined) {
    conditions.push('active = @active');
    params.active = query.active ? 1 : 0;
  }
  if (query.minPrice !== undefined) {
    conditions.push('target_price >= @minPrice');
    params.minPrice = query.minPrice;
  }
  if (query.maxPrice !== undefined) {
    conditions.push('target_price <= @maxPrice');
    params.maxPrice = query.maxPrice;
  }

  return { sql: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '', params };
};

export const createAlertRepository = (db: Database): AlertRepository => {
  const insertAlert = db.prepare<AlertParams, AlertRow>(`
    INSERT INTO alerts (symbol, condition, target_price, note, active, created_at, updated_at)
    VALUES (@symbol, @condition, @targetPrice, @note, @active, @createdAt, @updatedAt)
    RETURNING ${columns}
  `);

  const selectAlertById = db.prepare<[number], AlertRow>(`SELECT ${columns} FROM alerts WHERE id = ?`);

  const updateAlert = db.prepare<AlertParams & { id: number }, AlertRow>(`
    UPDATE alerts
    SET symbol = @symbol, condition = @condition, target_price = @targetPrice, note = @note,
        active = @active, updated_at = @updatedAt
    WHERE id = @id
    RETURNING ${columns}
  `);

  const deleteAlert = db.prepare<[number]>('DELETE FROM alerts WHERE id = ?');

  const findById = (id: number) => {
    const row = selectAlertById.get(id);
    return row ? toAlert(row) : undefined;
  };

  const update = db.transaction((id: number, changes: UpdateAlertInput) => {
    const existing = findById(id);
    if (!existing) {
      return undefined;
    }

    const next = { ...existing, ...changes, updatedAt: new Date().toISOString() };
    const row = updateAlert.get({ id, ...toParams(next) });
    return row ? toAlert(row) : undefined;
  });

  return {
    create: input => {
      const now = new Date().toISOString();
      const row = insertAlert.get(toParams({ ...input, createdAt: now, updatedAt: now }));
      if (!row) {
        throw new Error('Insert did not return the created alert');
      }
      return toAlert(row);
    },

    list: query => {
      const where = toWhereClause(query);
      const rows = db
        .prepare<WhereClause['params'], AlertRow>(
          `SELECT ${columns} FROM alerts ${where.sql} ORDER BY created_at DESC, id DESC LIMIT @limit OFFSET @offset`,
        )
        .all({ ...where.params, limit: query.limit, offset: query.offset });
      const total = db
        .prepare<WhereClause['params'], number>(`SELECT COUNT(*) FROM alerts ${where.sql}`)
        .pluck()
        .get(where.params);
      return { data: rows.map(toAlert), total: total ?? 0 };
    },

    findById,

    update,

    delete: id => deleteAlert.run(id).changes > 0,
  };
};
