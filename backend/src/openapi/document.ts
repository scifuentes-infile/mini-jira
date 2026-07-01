import { OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { registry, ChangePositionSchema, ChangeStatusSchema, CreateTicketSchema, ErrorEnvelopeSchema, LoginSchema, TicketEnvelopeSchema, TicketListEnvelopeSchema, UpdateTicketSchema, UserEnvelopeSchema, VersionPayloadSchema, LockTicketSchema, TicketLockEnvelopeSchema, AuditLogListEnvelopeSchema } from '@/lib/schemas';
const json = (schema: z.ZodTypeAny) => ({ 'application/json': { schema } });
const response = (description: string, schema: z.ZodTypeAny) => ({ description, content: json(schema) });
const errors = { 400: response('Validation error', ErrorEnvelopeSchema), 401: response('Unauthenticated', ErrorEnvelopeSchema), 403: response('Forbidden', ErrorEnvelopeSchema), 404: response('Not found', ErrorEnvelopeSchema), 409: response('Version conflict', ErrorEnvelopeSchema), 422: response('Archived', ErrorEnvelopeSchema) };
registry.registerPath({ method: 'post', path: '/api/v1/auth/login', tags: ['Auth'], request: { body: { content: json(LoginSchema) } }, responses: { 200: response('Logged in', UserEnvelopeSchema), 400: errors[400], 401: errors[401] } });
registry.registerPath({ method: 'post', path: '/api/v1/auth/logout', tags: ['Auth'], responses: { 204: { description: 'Logged out' } } });
registry.registerPath({ method: 'get', path: '/api/v1/auth/me', tags: ['Auth'], responses: { 200: response('Current user', UserEnvelopeSchema) } });
registry.registerPath({ method: 'get', path: '/api/v1/tickets', tags: ['Tickets'], responses: { 200: response('Ticket list', TicketListEnvelopeSchema), 400: errors[400], 401: errors[401] } });
registry.registerPath({ method: 'post', path: '/api/v1/tickets', tags: ['Tickets'], request: { body: { content: json(CreateTicketSchema) } }, responses: { 201: response('Created ticket', TicketEnvelopeSchema), 400: errors[400], 401: errors[401] } });
registry.registerPath({ method: 'get', path: '/api/v1/tickets/{ticketId}', tags: ['Tickets'], responses: { 200: response('Ticket detail', TicketEnvelopeSchema), 401: errors[401], 404: errors[404] } });
registry.registerPath({ method: 'put', path: '/api/v1/tickets/{ticketId}', tags: ['Tickets'], request: { body: { content: json(UpdateTicketSchema) } }, responses: { 200: response('Updated ticket', TicketEnvelopeSchema), ...errors } });
registry.registerPath({ method: 'patch', path: '/api/v1/tickets/{ticketId}', tags: ['Tickets'], request: { body: { content: json(UpdateTicketSchema) } }, responses: { 200: response('Patched ticket', TicketEnvelopeSchema), ...errors } });
registry.registerPath({ method: 'patch', path: '/api/v1/tickets/{ticketId}/status', tags: ['Tickets'], request: { body: { content: json(ChangeStatusSchema) } }, responses: { 200: response('Changed status', TicketEnvelopeSchema), ...errors } });
registry.registerPath({ method: 'patch', path: '/api/v1/tickets/{ticketId}/position', tags: ['Tickets'], request: { body: { content: json(ChangePositionSchema) } }, responses: { 200: response('Changed position', TicketEnvelopeSchema), ...errors } });
registry.registerPath({ method: 'post', path: '/api/v1/tickets/{ticketId}/archive', tags: ['Tickets'], request: { body: { content: json(VersionPayloadSchema) } }, responses: { 200: response('Archived ticket', TicketEnvelopeSchema), 401: errors[401], 403: errors[403], 404: errors[404], 409: errors[409] } });
registry.registerPath({ method: 'post', path: '/api/v1/tickets/{ticketId}/restore', tags: ['Tickets'], request: { body: { content: json(VersionPayloadSchema) } }, responses: { 200: response('Restored ticket', TicketEnvelopeSchema), 401: errors[401], 403: errors[403], 404: errors[404], 409: errors[409] } });

registry.registerPath({ method: 'post', path: '/api/v1/tickets/{ticketId}/lock', tags: ['Locks'], request: { body: { content: json(LockTicketSchema) } }, responses: { 200: response('Locked or renewed ticket lock', TicketLockEnvelopeSchema), 400: errors[400], 401: errors[401], 404: errors[404], 409: errors[409] } });
registry.registerPath({ method: 'delete', path: '/api/v1/tickets/{ticketId}/lock', tags: ['Locks'], responses: { 204: { description: 'Released ticket lock' }, 401: errors[401], 404: errors[404], 409: errors[409] } });
registry.registerPath({ method: 'get', path: '/api/v1/audit/{ticketId}', tags: ['Audit'], responses: { 200: response('Ticket audit log', AuditLogListEnvelopeSchema), 401: errors[401], 404: errors[404] } });

export const createOpenApiDocument = () => new OpenApiGeneratorV3(registry.definitions).generateDocument({ openapi: '3.0.3', info: { title: 'Mini Jira API', version: '1.0.0' }, servers: [{ url: 'http://localhost:3000' }] });
