# SupportSphere — Customer Support Ticket Management

## Main features
- JWT registration and login
- Create support tickets with category and priority
- Search tickets and filter by status
- Update ticket status: Open, In Progress, Resolved
- Add conversation notes/comments
- Dashboard counts for ticket status and unresolved high-priority tickets

## API routes
- POST `/api/auth/register`, POST `/api/auth/login`
- GET/POST `/api/tickets`
- PATCH `/api/tickets/:id/status`
- POST `/api/tickets/:id/comments`
- DELETE `/api/tickets/:id`
- GET `/api/dashboard`

## Suggested next improvements
Add customer/agent/admin roles, assignment to agents, email notifications, file attachments, SLA timers, pagination, automated tests, and an AI draft-reply feature using a real approved AI API.
