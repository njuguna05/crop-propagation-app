# Crop Propagation API

A FastAPI backend for crop propagation management, designed to integrate seamlessly with the existing React frontend.

## Features

- **JWT Authentication** - Secure token-based authentication
- **CRUD Operations** - Complete management for crops, tasks, orders, and records
- **Offline Sync** - Incremental sync with conflict resolution
- **Analytics** - Dashboard statistics and performance metrics
- **Multi-User Support** - User isolation and team collaboration
- **PostgreSQL Database** - Async SQLAlchemy with connection pooling

## Quick Start

### Prerequisites

- Python 3.11+
- PostgreSQL 12+
- Node.js 18+ (for frontend)

### Installation

1. **Clone and navigate to backend**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Database setup**
   ```bash
   createdb crop_propagation_db
   alembic upgrade head
   ```

6. **Run development server**
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

The API will be available at:
- **API**: http://localhost:8000
- **Docs**: http://localhost:8000/api/v1/docs
- **Health**: http://localhost:8000/health

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/refresh` - Token refresh
- `GET /api/v1/auth/me` - Current user

### Crops
- `GET /api/v1/crops` - List crops
- `POST /api/v1/crops` - Create crop
- `GET /api/v1/crops/{id}` - Get crop
- `PUT /api/v1/crops/{id}` - Update crop
- `DELETE /api/v1/crops/{id}` - Delete crop

### Tasks
- `GET /api/v1/tasks` - List tasks
- `POST /api/v1/tasks` - Create task
- `PUT /api/v1/tasks/{id}` - Update task
- `PATCH /api/v1/tasks/{id}/complete` - Toggle completion
- `DELETE /api/v1/tasks/{id}` - Delete task

### Orders
- `GET /api/v1/orders` - List orders
- `POST /api/v1/orders` - Create order
- `GET /api/v1/orders/{id}` - Get order
- `PUT /api/v1/orders/{id}` - Update order
- `POST /api/v1/orders/{id}/transfer` - Transfer between stages
- `POST /api/v1/orders/{id}/health-assessment` - Record losses

### Records
- `GET /api/v1/records/budwood` - Budwood collection records
- `POST /api/v1/records/budwood` - Create budwood record
- `GET /api/v1/records/grafting` - Grafting records
- `POST /api/v1/records/grafting` - Create grafting record
- `GET /api/v1/records/transfers` - Transfer records

### Analytics
- `GET /api/v1/analytics/dashboard` - Dashboard stats
- `GET /api/v1/analytics/performance` - Performance metrics
- `GET /api/v1/analytics/success-rates` - Success rate analysis

### Sync
- `POST /api/v1/sync/push` - Upload local changes
- `GET /api/v1/sync/pull` - Download server changes
- `POST /api/v1/sync/full` - Full synchronization

## Database Schema

### Core Tables
- **users** - User authentication and profiles
- **crops** - Individual crop tracking
- **tasks** - Task management
- **orders** - Propagation orders and workflow
- **budwood_collection** - Budwood harvest records
- **grafting_records** - Grafting operations
- **transfer_records** - Stage-to-stage transfers
- **order_stage_history** - Order stage transitions

## Environment Variables

```env
# Database
DATABASE_URL=postgresql+asyncpg://user:password@localhost/crop_propagation_db
DATABASE_ECHO=false

# JWT
SECRET_KEY=your-secret-key
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# Environment
ENVIRONMENT=development
DEBUG=true

# CORS
BACKEND_CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

## Frontend Integration

The API is designed to work seamlessly with the existing React frontend:

1. **Update environment variable**
   ```bash
   REACT_APP_FLORA_API_URL=http://localhost:8000
   REACT_APP_MOCK_API=false
   ```

2. **Existing sync service continues working**
3. **All current data flows are preserved**
4. **JWT authentication integrates with existing auth**

## Development

### Database Migrations

```bash
# Create migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

### Running Tests

```bash
pytest
```

### Code Quality

```bash
# Format code
black app/

# Lint
ruff check app/

# Type checking
mypy app/
```

## Production Deployment

### Docker

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Environment

- Set `ENVIRONMENT=production`
- Set `DEBUG=false`
- Use strong `SECRET_KEY`
- Configure production database
- Set up reverse proxy (nginx)
- Enable SSL/TLS

## Architecture

```
backend/
├── app/
│   ├── main.py              # FastAPI app entry
│   ├── dependencies.py      # Auth & DB dependencies
│   ├── core/               # Core configuration
│   ├── models/             # Database models
│   ├── schemas/            # Pydantic schemas
│   ├── api/v1/endpoints/   # API endpoints
│   └── services/           # Business logic
├── alembic/                # Database migrations
├── requirements.txt
└── .env.example
```

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Add tests
5. Submit pull request

## License

See LICENSE file for details.