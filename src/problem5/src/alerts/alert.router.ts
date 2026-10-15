import { Router } from 'express';
import { HttpError } from '../errors.js';
import type { AlertRepository } from './alert.repository.js';
import { alertIdParamsSchema, createAlertSchema, listAlertsQuerySchema, updateAlertSchema } from './alert.schema.js';

const alertNotFound = (id: number) => new HttpError(404, 'not_found', `Alert ${id} not found`);

export const createAlertRouter = (alerts: AlertRepository): Router => {
  const router = Router();

  router.post('/', (req, res) => {
    const input = createAlertSchema.parse(req.body ?? {});
    const alert = alerts.create(input);
    res.status(201).location(`${req.baseUrl}/${alert.id}`).json(alert);
  });

  router.get('/', (req, res) => {
    const query = listAlertsQuerySchema.parse(req.query);
    const { data, total } = alerts.list(query);
    res.json({ data, page: { limit: query.limit, offset: query.offset, total } });
  });

  router.get('/:id', (req, res) => {
    const { id } = alertIdParamsSchema.parse(req.params);
    const alert = alerts.findById(id);
    if (!alert) {
      throw alertNotFound(id);
    }
    res.json(alert);
  });

  router.patch('/:id', (req, res) => {
    const { id } = alertIdParamsSchema.parse(req.params);
    const changes = updateAlertSchema.parse(req.body ?? {});
    const alert = alerts.update(id, changes);
    if (!alert) {
      throw alertNotFound(id);
    }
    res.json(alert);
  });

  router.delete('/:id', (req, res) => {
    const { id } = alertIdParamsSchema.parse(req.params);
    if (!alerts.delete(id)) {
      throw alertNotFound(id);
    }
    res.status(204).end();
  });

  return router;
};
