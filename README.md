# 🌱 Crop Propagation Management App

A comprehensive web application for managing crop propagation operations, designed for nurseries, agricultural businesses, and farming operations. This system provides end-to-end management of plant propagation workflows, from order creation to task management and comprehensive analytics.

## 📋 Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [Usage Guide](#usage-guide)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [License](#license)

## ✨ Features

### 🏠 Dashboard
- **Real-time Statistics**: Live metrics for crops, tasks, orders, and revenue
- **Quick Actions**: Fast access to create orders, tasks, and manage operations
- **Status Overview**: Visual indicators for pending tasks and order status
- **Recent Activity**: Timeline of recent system activities

### 📦 Order Management
- **Order Creation**: Comprehensive order forms with client details and specifications
- **Order Tracking**: Multi-stage workflow tracking (order created → in propagation → ready for delivery)
- **Client Management**: Customer information and order history
- **Delivery Scheduling**: Requested delivery dates and fulfillment tracking

### ✅ Task Management
- **Task Creation**: Create tasks linked to specific crops or orders
- **Priority Management**: High, medium, low priority assignment
- **Due Date Tracking**: Calendar-based task scheduling
- **Completion Tracking**: Mark tasks complete with timestamps

### 📅 Calendar View
- **Monthly Calendar**: Visual task scheduling and overview
- **Task Display**: See all tasks organized by date
- **Interactive Interface**: Click dates to view/add tasks
- **Navigation**: Easy month-to-month navigation

### 📊 Analytics & Reporting
- **Overview Dashboard**: Key performance indicators and growth metrics
- **Performance Analytics**: Success rates, efficiency metrics, seasonal trends
- **Success Rate Analysis**: Breakdown by propagation method and crop type
- **Real-time Updates**: Analytics automatically update with new data

### 🔄 Offline-First Architecture
- **IndexedDB Storage**: Local data persistence for offline operation
- **Sync Service**: Automatic synchronization when online
- **Conflict Resolution**: Smart handling of data conflicts
- **PWA Support**: Progressive Web App capabilities

### 📱 Responsive Design
- **Mobile-First**: Optimized for mobile devices and tablets
- **Desktop Compatible**: Full-featured desktop experience
- **Touch-Friendly**: Intuitive touch interfaces for mobile users
- **Adaptive UI**: Layout adapts to screen size and orientation

## 🛠 Technology Stack

### Frontend
- **React 19.1.1**: Modern React with hooks and concurrent features
- **Zustand**: Lightweight state management with persistence
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Lucide React**: Modern icon library
- **Dexie**: IndexedDB wrapper for offline storage
- **Axios**: HTTP client for API communication
- **Date-fns**: Date manipulation and formatting
- **Recharts**: Data visualization library

### Backend
- **FastAPI**: Modern Python web framework
- **Uvicorn**: ASGI server for FastAPI
- **Pydantic**: Data validation and serialization
- **Python 3.8+**: Core backend language

### Development Tools
- **Create React App**: React development environment
- **ESLint**: Code linting and quality
- **NPM**: Package management
- **Git**: Version control

## 📁 Project Structure

```
crop-propagation-app/
├── public/                 # Static assets
│   ├── manifest.json      # PWA manifest
│   └── sw.js             # Service worker
├── src/                   # Frontend source code
│   ├── components/        # Reusable React components
│   │   ├── LoginScreen.js
│   │   └── SyncStatus.js
│   ├── services/          # API and database services
│   │   ├── database.js    # IndexedDB management
│   │   ├── syncService.js # Online/offline sync
│   │   ├── floraAPI.js    # API communication
│   │   └── mockAPI.js     # Development API mock
│   ├── stores/            # State management
│   │   └── appStore.js    # Zustand store
│   ├── App.js            # Main application component
│   ├── AppWrapper.js     # App initialization wrapper
│   ├── PropagationOrder.js # Order management component
│   └── index.js          # Application entry point
├── backend/               # Backend API
│   ├── simple_api.py     # FastAPI application
│   └── app/              # Structured backend (future)
├── package.json          # Frontend dependencies
├── tailwind.config.js    # Tailwind CSS configuration
└── README.md            # This documentation
```

## 🚀 Installation & Setup

### Prerequisites
- **Node.js** (v16 or higher)
- **Python** (v3.8 or higher)
- **NPM** or **Yarn**
- **Git**

### Quick Start

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd crop-propagation-app
   ```

2. **Install Frontend Dependencies**
   ```bash
   npm install
   ```

3. **Install Backend Dependencies**
   ```bash
   cd backend
   pip install fastapi uvicorn python-multipart
   ```

4. **Start the Backend API**
   ```bash
   # From the backend directory
   python simple_api.py
   ```
   The API will be available at `http://127.0.0.1:8000`

5. **Start the Frontend Development Server**
   ```bash
   # From the root directory
   npm start
   ```
   The app will be available at `http://localhost:3000`

### Environment Configuration

Create a `.env` file in the root directory:

```env
REACT_APP_API_URL=http://127.0.0.1:8000
REACT_APP_MOCK_API=false
```

### Production Build

```bash
npm run build
```

This creates an optimized production build in the `build/` directory.

## 📖 Usage Guide

### Getting Started

1. **Launch the Application**: Navigate to `http://localhost:3000`
2. **Login**: Use default credentials (admin/admin) or create an account
3. **Explore the Dashboard**: Familiarize yourself with the main interface

### Creating Orders

1. **Navigate to Orders Tab**
2. **Click "New Order" Button**
3. **Fill in Order Details**:
   - Client information (name, contact, email)
   - Crop specifications (type, variety, quantity)
   - Delivery requirements
   - Propagation method
   - Pricing information
4. **Submit Order**

### Managing Tasks

1. **Navigate to Tasks Tab**
2. **Click "Add Task" Button**
3. **Configure Task**:
   - Link to specific crop/order
   - Set due date
   - Assign priority level
   - Add task description
4. **Track Progress**: Mark tasks complete as they're finished

### Using the Calendar

1. **Navigate to Calendar Tab**
2. **View Monthly Layout**: See all tasks organized by date
3. **Navigate Months**: Use arrow buttons to move between months
4. **Task Details**: Click on tasks to view details

### Analytics Dashboard

1. **Navigate to Analytics Tab**
2. **Explore Three Views**:
   - **Overview**: Key metrics and recent activity
   - **Performance**: Efficiency metrics and trends
   - **Success Rates**: Detailed success analysis
3. **Real-time Updates**: Data updates automatically with new orders/tasks

### Offline Usage

- **Automatic Sync**: App syncs data when online
- **Offline Operation**: Create orders/tasks offline
- **Data Persistence**: All data stored locally in IndexedDB
- **Conflict Resolution**: Smart handling when reconnecting

## 🔌 API Documentation

### Base URL
```
http://127.0.0.1:8000
```

### Authentication Endpoints

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin"
}
```

#### Get Current User
```http
GET /api/v1/auth/me
Authorization: Bearer <token>
```

### Order Management Endpoints

#### Get All Orders
```http
GET /api/v1/orders
```

#### Create Order
```http
POST /api/v1/orders
Content-Type: application/json

{
  "clientName": "Example Farm",
  "contactPerson": "John Doe",
  "phone": "+1234567890",
  "email": "john@example.com",
  "requestedDelivery": "2024-03-01",
  "cropType": "Vegetables",
  "variety": "Tomato",
  "quantity": 1000,
  "propagationMethod": "seed",
  "unitPrice": 2.50,
  "notes": "Special handling required"
}
```

### Task Management Endpoints

#### Get All Tasks
```http
GET /api/v1/tasks
```

#### Create Task
```http
POST /api/v1/tasks
Content-Type: application/json

{
  "task": "Water seedlings",
  "cropId": 1,
  "dueDate": "2024-02-15",
  "priority": "high"
}
```

### Analytics Endpoints

#### Dashboard Statistics
```http
GET /api/v1/analytics/dashboard
```

#### Performance Metrics
```http
GET /api/v1/analytics/performance
```

#### Success Rate Analysis
```http
GET /api/v1/analytics/success-rates
```

### Data Management Endpoints

#### Get Crops
```http
GET /api/v1/crops
```

#### Get Budwood Collection Records
```http
GET /api/v1/budwood
```

#### Get Grafting Records
```http
GET /api/v1/grafting
```

#### Get Transfer Records
```http
GET /api/v1/transfers
```

## 🤝 Contributing

### Development Setup

1. **Fork the Repository**
2. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make Changes**: Implement your feature or fix
4. **Test Thoroughly**: Ensure all functionality works
5. **Commit Changes**
   ```bash
   git commit -m "Add your feature description"
   ```
6. **Push to Branch**
   ```bash
   git push origin feature/your-feature-name
   ```
7. **Create Pull Request**

### Code Style Guidelines

- **Frontend**: Follow React best practices and ESLint rules
- **Backend**: Follow PEP 8 Python style guidelines
- **Commits**: Use conventional commit messages
- **Documentation**: Update documentation for new features

### Testing

```bash
# Frontend tests
npm test

# Backend tests (when implemented)
pytest
```

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🔧 Troubleshooting

### Common Issues

1. **API Connection Error**
   - Ensure backend is running on port 8000
   - Check CORS settings in simple_api.py
   - Verify network connectivity

2. **Build Errors**
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   - Check Node.js version compatibility
   - Verify all dependencies are installed

3. **Data Not Persisting**
   - Check IndexedDB browser support
   - Verify sync service configuration
   - Clear browser storage if corrupted

4. **Mobile Responsiveness Issues**
   - Test on multiple device sizes
   - Check Tailwind CSS responsive classes
   - Verify touch event handling

### Getting Help

- **Issues**: Create an issue on the repository
- **Discussions**: Use GitHub Discussions for questions
- **Documentation**: Check this README and inline code comments

## 🚀 Future Enhancements

- **Real Database Integration**: PostgreSQL or MongoDB
- **Advanced Analytics**: Charts and graphs with Recharts
- **Inventory Management**: Stock and supply tracking
- **Reporting System**: PDF report generation
- **Multi-user Support**: Role-based access control
- **Mobile App**: React Native companion app
- **IoT Integration**: Sensor data for environmental monitoring
- **Notifications**: Email and push notifications
- **Backup & Export**: Data backup and export functionality
- **Advanced Search**: Full-text search and filtering

---

**Built with ❤️ for the agricultural community**
