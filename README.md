# Agentic AI Customer Support

A full-stack customer support platform being developed with an agentic AI architecture.

The system will allow customers to communicate with an AI support agent that can understand customer issues, retrieve trusted information, use controlled backend tools, search a knowledge base, maintain conversation history, and escalate cases to human support when required.

## Current Architecture

Browser
↓
Next.js Frontend
↓
FastAPI Backend
↓
PostgreSQL + pgvector

## Tech Stack

### Frontend
- Next.js
- TypeScript
- Tailwind CSS

### Backend
- FastAPI
- Python
- Psycopg

### Database
- PostgreSQL
- pgvector

### Infrastructure
- Docker
- Docker Compose

## Current Development Status

Phase 1: SRS and Architecture - Completed

Phase 2: Project Foundation and Infrastructure - Completed

Current infrastructure supports:

- Next.js frontend
- FastAPI backend
- PostgreSQL database
- pgvector extension
- Dockerized frontend and backend
- Docker Compose orchestration
- Frontend to backend communication
- Backend to PostgreSQL communication
- Environment-based configuration
- Persistent PostgreSQL storage
- Service health checks

## Running the Project

### 1. Create the environment file

Copy the example environment configuration:

```bash
cp .env.example .env