# FastAPI Integration Analysis for Crop Propagation App

## 📊 Current Architecture Analysis

### Frontend Structure
- **Framework**: React 19.1.1 with Create React App
- **State Management**: Zustand with persistence and subscribeWithSelector middleware
- **Offline Capabilities**: IndexedDB via Dexie for local data storage
- **UI Components**: Custom components with Lucide React icons and Tailwind CSS
- **HTTP Client**: Axios with interceptors for API communication
- **Key Dependencies**:
  - @tanstack/react-query for server state management
  - react-router-dom for navigation
  - date-fns for date manipulation
  - recharts for data visualization

### Data Models
- **Crops**: name, variety, propagationMethod, currentStage, location, plantedDate, temperature, humidity
- **Tasks**: cropId, task, dueDate, completed, priority
- **Orders**: orderNumber, status, clientName, quantity, stageHistory, propagation workflow
- **Budwood Collection**: harvest tracking for grafting operations
- **Grafting Records**: success rates and technique tracking
- **Transfer Records**: stage-to-stage movement tracking

### Existing API Layer
- **FloraAPI Service**: Complete service layer with mock API fallback
- **Offline-First Design**: Sync service with conflict resolution
- **Authentication**: JWT token management with local storage
- **Data Mapping**: Conversion between app structure and API format

### State Management Architecture
- **Zustand Store** (`src/stores/appStore.js`): Centralized state with actions
- **Persistence**: Selected state persisted to localStorage
- **Sync Integration**: Event listeners for online/offline status
- **Optimistic Updates**: Local changes immediately reflected in UI

## 🏗️ Proposed FastAPI Backend Architecture

### Project Structure
```
backend/
├── app/
│   ├── main.py              # FastAPI app entry point
│   ├── config.py            # Configuration & settings
│   ├── dependencies.py      # Auth & database dependencies
│   ├── models/              # SQLAlchemy models
│   │   ├── user.py
│   │   ├── crop.py
│   │   ├── task.py
│   │   ├── order.py
│   │   └── records.py
│   ├── schemas/             # Pydantic schemas
│   │   ├── user.py
│   │   ├── crop.py
│   │   └── common.py
│   ├── api/
│   │   ├── v1/
│   │   │   ├── endpoints/
│   │   │   │   ├── auth.py
│   │   │   │   ├── crops.py
│   │   │   │   ├── tasks.py
│   │   │   │   ├── orders.py
│   │   │   │   └── analytics.py
│   │   │   └── api.py       # API router
│   │   └── deps.py
│   ├── core/
│   │   ├── security.py      # JWT handling
│   │   └── database.py      # Database connection
│   └── services/            # Business logic
│       ├── crop_service.py
│       ├── sync_service.py
│       └── analytics_service.py
```

### Database Design
- **Database**: PostgreSQL for production reliability
- **ORM**: SQLAlchemy with async support (asyncpg driver)
- **Migrations**: Alembic for schema versioning
- **Tables**:
  - `users` - user authentication and profiles
  - `crops` - crop tracking and environmental data
  - `tasks` - task management linked to crops
  - `orders` - propagation orders and workflow
  - `budwood_collection` - budwood harvest records
  - `grafting_records` - grafting operations and success rates
  - `transfer_records` - stage-to-stage transfers

### API Endpoints Structure
```
/api/v1/
├── /auth/
│   ├── POST /login          # User authentication
│   ├── POST /register       # User registration
│   ├── POST /refresh        # Token refresh
│   └── GET /me             # Current user profile
├── /crops/
│   ├── GET /               # List crops with optional sync timestamp
│   ├── POST /              # Create new crop
│   ├── PUT /{id}           # Update crop
│   └── DELETE /{id}        # Delete crop
├── /tasks/
│   ├── GET /               # List tasks with filtering
│   ├── POST /              # Create task
│   ├── PUT /{id}           # Update task
│   └── DELETE /{id}        # Delete task
├── /orders/
│   ├── GET /               # List orders with filtering
│   ├── POST /              # Create order
│   ├── PUT /{id}           # Update order
│   ├── PATCH /{id}/status  # Update order status
│   └── POST /{id}/transfer # Transfer order between stages
├── /budwood/
│   ├── GET /               # List budwood records
│   ├── POST /              # Create budwood record
│   └── PUT /{id}           # Update budwood record
├── /grafting/
│   ├── GET /               # List grafting records
│   ├── POST /              # Create grafting record
│   └── PUT /{id}           # Update grafting record
├── /transfers/
│   ├── GET /               # List transfer records
│   ├── POST /              # Create transfer record
│   └── PUT /{id}           # Update transfer record
├── /analytics/
│   ├── GET /dashboard      # Dashboard statistics
│   ├── GET /performance    # Performance metrics
│   └── GET /success-rates  # Success rate analysis
└── /sync/
    ├── POST /push          # Push local changes to server
    └── GET /pull           # Pull server changes since timestamp
```

## 🔄 Frontend Integration Strategy

### Enhanced API Service Layer
- **Extend FloraAPI**: Build on existing `src/services/floraAPI.js`
- **Environment Detection**: Automatic fallback to real API in production
- **Error Handling**: Comprehensive error handling with user feedback
- **Request Interceptors**: Automatic token attachment and refresh
- **Response Interceptors**: Token validation and renewal

### Authentication Flow
- **JWT Implementation**: Access tokens (15min) + refresh tokens (7 days)
- **Automatic Refresh**: Transparent token renewal on API calls
- **Secure Storage**: Consider httpOnly cookies for production
- **Logout Cleanup**: Token blacklisting and local data clearing
- **Multi-Device Support**: Device registration and session management

### Sync Architecture
- **Incremental Sync**: Use `lastUpdated` timestamps for efficient syncing
- **Conflict Resolution**: Last-write-wins with conflict detection alerts
- **Batch Operations**: Bulk sync endpoints to minimize network requests
- **Background Sync**: Service worker integration for offline changes
- **Sync Status**: Real-time sync status indicators in UI

### State Management Integration
- **React Query**: Server state management for caching and background updates
- **Optimistic Updates**: Immediate UI updates with rollback on failure
- **Cache Invalidation**: Smart cache updates on data mutations
- **Offline Queue**: Queue mutations when offline, sync when online

## 🚀 Development & Deployment

### Development Setup
```bash
# Backend setup
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install fastapi uvicorn sqlalchemy alembic asyncpg
uvicorn app.main:app --reload --port 8000

# Frontend (existing)
npm start  # Runs on port 3000
```

### Vite Migration (Optional)
```javascript
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://localhost:8000",
    },
  },
})
```

### Production Deployment
- **Containerization**: Docker containers for backend, frontend, and database
- **Reverse Proxy**: Nginx for routing and SSL termination
- **Environment Config**: Separate configs for dev/staging/production
- **CI/CD Pipeline**: GitHub Actions for automated testing and deployment
- **Monitoring**: Application monitoring and error tracking

## ⚡ Performance Optimizations

### Backend Optimizations
- **Async Operations**: All database operations use async/await
- **Connection Pooling**: SQLAlchemy connection pool for database efficiency
- **Caching Layer**: Redis for frequently accessed data and session storage
- **Background Tasks**: Celery for heavy operations (reports, bulk operations)
- **Database Indexing**: Optimized indexes for common query patterns

### Frontend Optimizations
- **React Query**: Server state management with intelligent caching
- **Code Splitting**: Lazy loading for route-based components
- **Optimistic Updates**: Immediate UI feedback before server confirmation
- **Request Deduplication**: Prevent duplicate API calls
- **Virtual Scrolling**: Handle large datasets efficiently

## 🔒 Security Considerations

### Backend Security
- **Input Validation**: Pydantic schemas for request validation
- **SQL Injection Prevention**: SQLAlchemy ORM parameterized queries
- **Rate Limiting**: slowapi for API endpoint protection
- **CORS Configuration**: Proper cross-origin request handling
- **Authentication Middleware**: JWT validation on protected routes

### Frontend Security
- **Token Storage**: Secure token storage strategies
- **XSS Prevention**: Input sanitization and Content Security Policy
- **HTTPS Enforcement**: Redirect HTTP to HTTPS in production
- **Environment Variables**: Secure API endpoint configuration

## 🧪 Testing Strategy

### Backend Testing
- **Unit Tests**: pytest for business logic and utilities
- **Integration Tests**: API endpoint testing with test database
- **Database Testing**: Test fixtures and factories for data setup
- **Authentication Testing**: JWT token validation and refresh flows

### Frontend Testing
- **Component Tests**: React Testing Library for UI components
- **API Integration Tests**: Mock service worker for API testing
- **E2E Tests**: Playwright for critical user workflows
- **Sync Testing**: Offline/online scenario testing

## 📈 Migration Timeline

### Phase 1: Backend Foundation (Week 1-2)
- Set up FastAPI project structure
- Implement database models and migrations
- Create basic CRUD endpoints for crops, tasks, orders
- Set up authentication with JWT

### Phase 2: Sync Integration (Week 3-4)
- Implement sync endpoints (/sync/push, /sync/pull)
- Add incremental sync with timestamps
- Create conflict resolution mechanisms
- Update frontend API service integration

### Phase 3: Enhanced Features (Week 5-6)
- Add analytics endpoints
- Implement background task processing
- Enhance error handling and logging
- Add comprehensive API documentation

### Phase 4: Production Readiness (Week 7-8)
- Set up deployment infrastructure (Docker, Nginx)
- Implement monitoring and logging
- Performance optimization and caching
- Security hardening and testing

### Phase 5: Advanced Features (Week 9+)
- Real-time updates with WebSockets
- Advanced analytics and reporting
- Multi-tenant support
- Mobile app API extensions

## 🔗 Integration Benefits

### Immediate Benefits
- **Scalability**: Handle multiple users and large datasets
- **Collaboration**: Real-time data sharing between team members
- **Reliability**: Professional-grade database with ACID properties
- **Performance**: Optimized queries and caching for fast responses

### Long-term Benefits
- **Analytics**: Advanced reporting and business intelligence
- **Integration**: API for mobile apps and third-party tools
- **Compliance**: Audit trails and data governance
- **Growth**: Support for multiple locations and operations

## 📋 Current Implementation Status

### Existing Strengths
- ✅ Comprehensive data models already defined
- ✅ Offline-first architecture with sync capabilities
- ✅ Authentication flow implemented
- ✅ API service layer with proper error handling
- ✅ State management with Zustand
- ✅ Mobile-responsive UI components

### Areas for Enhancement
- 🔄 Replace mock API with real FastAPI backend
- 🔄 Add React Query for server state management
- 🔄 Implement real-time sync with conflict resolution
- 🔄 Add comprehensive error handling and user feedback
- 🔄 Set up production deployment pipeline

This analysis provides a roadmap for transforming your crop propagation app from a prototype with mock data into a production-ready system capable of supporting agricultural operations at scale.

## 🌱 Landing Page Workflow Demonstration

### Overview
The landing page now includes a comprehensive visual workflow demonstration section that showcases the complete propagation process. This enhancement provides visitors with a clear understanding of how FloraTrack supports every stage of plant propagation operations.

### Implementation Details

#### **Section Location**
- **File**: `src/components/LandingPage.js`
- **Position**: Between Features section and Benefits section
- **Background**: Gradient from green-50 to blue-50 for visual appeal

#### **Workflow Steps Visualization**

##### **Step 1: Budwood Collection** 🟣
```javascript
// Icon: Scissors with purple theme
<div className="bg-purple-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 relative">
  <Scissors className="w-10 h-10 text-purple-600" />
  <div className="absolute -top-2 -right-2 bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</div>
</div>
```
- **Features Tracked**:
  - Variety tracking with source documentation
  - Quality assessment and grading
  - Cold storage management
- **Description**: "Harvest quality budwood from mother trees with proper documentation and traceability"

##### **Step 2: Grafting Operations** 🔵
```javascript
// Icon: TreePine with blue theme
<div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 relative">
  <TreePine className="w-10 h-10 text-blue-600" />
  <div className="absolute -top-2 -right-2 bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</div>
</div>
```
- **Features Tracked**:
  - Success rate tracking and analytics
  - Technique documentation (whip & tongue, T-budding, etc.)
  - Operator assignment and performance monitoring
- **Description**: "Perform precise grafting techniques with success rate tracking and operator performance monitoring"

##### **Step 3: Seedling Development** 🟢
```javascript
// Icon: Sprout with green theme
<div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 relative">
  <Sprout className="w-10 h-10 text-green-600" />
  <div className="absolute -top-2 -right-2 bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</div>
</div>
```
- **Features Tracked**:
  - Growth monitoring and stage progression
  - Health assessments and plant loss tracking
  - Environmental data (temperature, humidity)
- **Description**: "Monitor early growth stages with environmental controls and health assessments"

##### **Step 4: Nursery Beds** 🟠
```javascript
// Icon: Home with orange theme
<div className="bg-orange-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 relative">
  <Home className="w-10 h-10 text-orange-600" />
  <div className="absolute -top-2 -right-2 bg-orange-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">4</div>
</div>
```
- **Features Tracked**:
  - Transfer management between sections
  - Shipping preparation and logistics
  - Final quality control and grading
- **Description**: "Manage mature plants in nursery beds with transfer tracking and shipping preparation"

#### **Visual Design Elements**

##### **Flow Connectors**
```javascript
// Arrow connectors between workflow steps (desktop only)
<div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
  <ArrowRight className="w-8 h-8 text-gray-400" />
</div>
```

##### **Interactive Cards**
- **Hover Effects**: `hover:shadow-xl transition-shadow`
- **Card Styling**: White background with border and shadow
- **Feature Lists**: Green checkmarks with capability descriptions
- **Responsive Grid**: `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`

#### **Workflow Summary Section**

##### **Traceability Emphasis**
```javascript
<h4 className="text-2xl font-bold text-gray-900 mb-4">
  Complete Traceability Throughout Your Operation
</h4>
<p className="text-lg text-gray-600 mb-8 max-w-3xl mx-auto">
  Every plant, from budwood source to final shipment, is tracked with detailed records,
  environmental data, and quality assessments. Generate comprehensive reports and
  maintain compliance with industry standards.
</p>
```

##### **Key Benefits Grid**
```javascript
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  <div className="flex items-center justify-center space-x-3 p-4 bg-gray-50 rounded-lg">
    <BarChart3 className="w-6 h-6 text-blue-600" />
    <span className="font-medium text-gray-900">Real-time Analytics</span>
  </div>
  <div className="flex items-center justify-center space-x-3 p-4 bg-gray-50 rounded-lg">
    <Shield className="w-6 h-6 text-green-600" />
    <span className="font-medium text-gray-900">Quality Assurance</span>
  </div>
  <div className="flex items-center justify-center space-x-3 p-4 bg-gray-50 rounded-lg">
    <Users className="w-6 h-6 text-purple-600" />
    <span className="font-medium text-gray-900">Team Coordination</span>
  </div>
</div>
```

### **Dependencies Added**
```javascript
// New icons imported for workflow demonstration
import { Scissors, TreePine, Sprout, Home } from 'lucide-react';
```

### **Responsive Design**
- **Mobile**: Single column layout with vertical flow
- **Tablet**: 2-column grid layout
- **Desktop**: 4-column grid with arrow connectors
- **Large screens**: Full workflow visualization with connecting arrows

### **User Experience Benefits**
1. **Clear Process Visualization**: Users immediately understand the complete workflow
2. **Feature Highlighting**: Each step shows specific FloraTrack capabilities
3. **Professional Presentation**: High-quality visual design builds trust
4. **Educational Value**: Demonstrates industry best practices
5. **Conversion Focused**: Encourages trial signup by showing comprehensive value

### **Technical Implementation Notes**
- **Component Structure**: Self-contained section within existing LandingPage component
- **Styling**: Utilizes existing Tailwind CSS classes for consistency
- **Performance**: Lightweight implementation using SVG icons
- **Accessibility**: Proper color contrast and semantic HTML structure
- **Maintainability**: Clear component structure for future updates

### **Future Enhancements**
- **Animation**: Add scroll-triggered animations for workflow steps
- **Interactive Elements**: Click-through demos for each workflow stage
- **Video Integration**: Embed workflow demonstration videos
- **Customization**: Industry-specific workflow variations
- **Metrics**: Track user engagement with workflow section

This workflow demonstration significantly enhances the landing page's ability to communicate FloraTrack's comprehensive capabilities to potential users, providing a clear visual representation of the complete propagation management process.

## 👥 Customer Management System

### Overview
Comprehensive customer relationship management system integrated with the propagation order workflow, providing full customer lifecycle tracking and searchable customer selection throughout the application.

### Database Schema

#### Customer Model (`backend/app/models/customer.py`)
```python
class Customer(Base):
    __tablename__ = "customers"

    # Basic Information
    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String(200), nullable=False, index=True)
    contact_person = Column(String(100), nullable=False)
    email = Column(String(100), index=True)
    phone = Column(String(20))

    # Address Information
    address = Column(Text)
    city = Column(String(100))
    state = Column(String(50))
    zip_code = Column(String(20))
    country = Column(String(100), default="USA")

    # Business Information
    customer_type = Column(String(50), default="retail")  # retail, wholesale, nursery
    tax_id = Column(String(50))
    payment_terms = Column(String(50), default="net_30")
    credit_limit = Column(Integer, default=0)

    # Status and Tracking
    notes = Column(Text)
    is_active = Column(String(10), default="true")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
```

### API Endpoints (`/api/v1/customers/`)

#### Core Customer Operations
- **GET `/`** - List customers with search and filtering
  - Search by company name, contact person, or email
  - Filter by customer type (retail, wholesale, nursery)
  - Filter by active status
  - Pagination support (skip/limit)

- **GET `/summary`** - Lightweight customer data for dropdowns
  - Optimized for autocomplete and select components
  - Returns essential fields only (id, company_name, contact_person, type)
  - Limited result set for performance

- **GET `/{customer_id}`** - Get specific customer details
- **POST `/`** - Create new customer with validation
- **PUT `/{customer_id}`** - Update existing customer
- **DELETE `/{customer_id}`** - Soft delete (deactivate) customer

#### Advanced Features
- **Company name uniqueness validation**
- **Email format validation**
- **Soft delete with reactivation capability**
- **Full audit trail with timestamps**

### Frontend Components

#### CustomerManagement (`src/components/CustomerManagement.js`)
**Full-featured customer management interface:**

##### Key Features:
- **Advanced Search & Filtering**:
  - Real-time search across multiple fields
  - Filter by customer type (retail, wholesale, nursery)
  - Filter by active/inactive status

- **Statistics Dashboard**:
  - Total customers count
  - Active customers count
  - Customer type breakdown
  - Total credit limit across all customers

- **Customer Table View**:
  - Company/Contact information
  - Customer type with visual indicators
  - Contact information (email, phone)
  - Payment terms and credit limits
  - Active/inactive status badges
  - Quick action buttons (edit, activate/deactivate)

##### Visual Design:
- **Customer Type Icons**:
  - 🏢 **Wholesale**: Blue building icon
  - 👥 **Nursery**: Green users icon
  - 👥 **Retail**: Purple users icon
- **Status Indicators**: Green checkmark (active), red X (inactive)
- **Responsive Design**: Mobile-friendly table and card layouts

#### CustomerSelect (`src/components/CustomerSelect.js`)
**Advanced searchable customer selection component:**

##### Features:
- **Real-time Search**: Type-ahead functionality with instant filtering
- **Visual Customer Display**: Shows company name, contact person, type, and badges
- **Create New Customer**: Integrated "+" button for quick customer creation
- **Selected Customer Display**: Clean preview of selected customer details
- **Fallback Mode**: Manual entry fields when no customer is selected
- **Keyboard Navigation**: Full accessibility support

##### Implementation Details:
```javascript
<CustomerSelect
  selectedCustomerId={customerId}
  onCustomerSelect={handleCustomerSelect}
  onCreateNew={handleCreateNewCustomer}
  label="Customer"
  placeholder="Search and select customer..."
  required={true}
/>
```

##### Smart Integration:
- **Auto-populate**: Selecting a customer fills related form fields
- **Bidirectional**: Can clear selection and return to manual entry
- **Validation**: Integrates with form validation systems
- **Caching**: Stores customer list for offline functionality

### Integration with Order System

#### Enhanced Order Form
The new order form now includes sophisticated customer handling:

##### Customer Selection Flow:
1. **Customer Search**: Type to search existing customers
2. **Quick Selection**: Click to select from dropdown results
3. **Auto-populate**: Customer details automatically fill form fields
4. **Create New**: Option to create customer on-the-fly
5. **Manual Entry**: Fallback for one-time customers

##### Order Form Enhancement:
```javascript
// Customer selection at top of form
<CustomerSelect
  selectedCustomerId={newOrder.customerId}
  onCustomerSelect={handleCustomerSelect}
  onCreateNew={handleCreateNewCustomer}
  required={true}
/>

// Conditional display based on selection
{newOrder.customerId ? (
  // Show read-only customer details card
  <CustomerDetailsDisplay customer={selectedCustomer} />
) : (
  // Show manual entry fields
  <ManualCustomerFields />
)}
```

### Data Structure Integration

#### Order Model Enhancement
```javascript
const [newOrder, setNewOrder] = useState({
  customerId: '',           // Link to customer record
  clientName: '',          // Auto-populated from customer
  contactPerson: '',       // Auto-populated from customer
  phone: '',              // Auto-populated from customer
  email: '',              // Auto-populated from customer
  // ... rest of order fields
});
```

#### Customer Selection Handler
```javascript
const handleCustomerSelect = (customer) => {
  if (customer) {
    setNewOrder({
      ...newOrder,
      customerId: customer.id,
      clientName: customer.company_name,
      contactPerson: customer.contact_person,
      phone: customer.phone || '',
      email: customer.email || ''
    });
  }
};
```

### Business Benefits

#### Operational Efficiency
- **Eliminate Duplicate Entry**: Reuse customer information across orders
- **Maintain Consistency**: Standardized customer data format
- **Speed Up Order Creation**: Quick customer selection vs manual entry
- **Reduce Errors**: Pre-validated customer information

#### Customer Relationship Management
- **Complete Customer History**: Track all orders and interactions
- **Credit Management**: Monitor credit limits and payment terms
- **Communication**: Centralized contact information
- **Segmentation**: Customer type classification for targeted marketing

#### Data Quality
- **Validation**: Email format and required field validation
- **Deduplication**: Prevent duplicate customer records
- **Audit Trail**: Complete history of customer changes
- **Data Integrity**: Foreign key relationships ensure consistency

### Future Enhancements

#### Advanced CRM Features
- **Order History**: View all orders for each customer
- **Payment Tracking**: Integration with accounting systems
- **Communication Log**: Track calls, emails, and meetings
- **Customer Portal**: Self-service order tracking

#### Analytics & Reporting
- **Customer Lifetime Value**: Revenue analysis per customer
- **Geographic Analysis**: Customer distribution mapping
- **Growth Tracking**: New vs returning customer metrics
- **Payment Analysis**: Payment term compliance tracking

## 🚛 Supplier Management System

### Overview
Comprehensive external supplier management system for purchasing budwood, rootstock, and propagation materials. Includes supplier evaluation, catalog management, purchase orders, and quality tracking.

### Database Architecture

#### Core Models (`backend/app/models/supplier.py`)

##### Supplier Model
```python
class Supplier(Base):
    __tablename__ = "suppliers"

    # Company Information
    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String(200), nullable=False, index=True)
    contact_person = Column(String(100), nullable=False)
    email = Column(String(100), index=True)
    phone = Column(String(20))
    address = Column(Text)

    # Supplier Classification
    supplier_type = Column(String(50), default="nursery")
    # Types: nursery, collector, farm, distributor
    specializations = Column(Text)  # JSON: Citrus, Avocado, Tools
    certifications = Column(Text)   # JSON: Organic, Disease-free, CDFA

    # Performance Ratings (1-5 scale)
    quality_rating = Column(Float, default=0.0)
    delivery_rating = Column(Float, default=0.0)
    price_rating = Column(Float, default=0.0)

    # Business Terms
    payment_terms = Column(String(50), default="net_30")
    minimum_order_value = Column(Float, default=0.0)
    lead_time_days = Column(Integer, default=7)
    shipping_cost = Column(Float, default=0.0)

    # Status and Tracking
    is_active = Column(Boolean, default=True)
    is_preferred = Column(Boolean, default=False)
    total_orders = Column(Integer, default=0)
    total_spent = Column(Float, default=0.0)
    last_order_date = Column(DateTime(timezone=True))
```

##### Supplier Catalog Model
```python
class SupplierCatalog(Base):
    __tablename__ = "supplier_catalog"

    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"))

    # Product Information
    product_type = Column(String(50))  # budwood, rootstock, seedlings, tools
    species = Column(String(100))      # Citrus, Avocado
    variety = Column(String(100))      # Valencia Orange, Hass Avocado
    rootstock_type = Column(String(100))

    # Product Details
    age_months = Column(Integer)
    size_description = Column(String(200))
    container_size = Column(String(50))

    # Pricing and Availability
    unit_price = Column(Float, nullable=False)
    minimum_quantity = Column(Integer, default=1)
    availability_season = Column(String(100))
    current_stock = Column(Integer, default=0)
    lead_time_days = Column(Integer, default=7)

    # Quality Specifications
    quality_grade = Column(String(10), default="A")
    disease_tested = Column(Boolean, default=False)
    virus_indexed = Column(Boolean, default=False)
```

##### Purchase Order System
```python
class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id = Column(Integer, primary_key=True, index=True)
    po_number = Column(String(50), unique=True, nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"))

    # Order Lifecycle
    order_date = Column(DateTime(timezone=True), server_default=func.now())
    requested_delivery_date = Column(DateTime(timezone=True))
    actual_delivery_date = Column(DateTime(timezone=True))
    status = Column(String(50), default="draft")
    # Status flow: draft → sent → confirmed → partial → delivered → cancelled

    # Financial Tracking
    subtotal = Column(Float, default=0.0)
    tax_amount = Column(Float, default=0.0)
    shipping_cost = Column(Float, default=0.0)
    total_amount = Column(Float, default=0.0)

    # Quality and Inspection
    inspection_required = Column(Boolean, default=True)
    inspection_completed = Column(Boolean, default=False)
    quality_score = Column(Float)  # 1-5 rating

    # Relationships
    line_items = relationship("PurchaseOrderItem", back_populates="purchase_order")
```

##### Quality Evaluation System
```python
class SupplierEvaluation(Base):
    __tablename__ = "supplier_evaluations"

    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"))
    purchase_order_id = Column(Integer, ForeignKey("purchase_orders.id"))

    # Multi-dimensional Scoring (1-5 scale)
    quality_score = Column(Float, nullable=False)
    delivery_score = Column(Float, nullable=False)
    communication_score = Column(Float, nullable=False)
    price_score = Column(Float, nullable=False)
    packaging_score = Column(Float, nullable=False)
    overall_score = Column(Float, nullable=False)

    # Detailed Feedback
    quality_comments = Column(Text)
    delivery_comments = Column(Text)
    general_comments = Column(Text)

    # Recommendations
    would_reorder = Column(Boolean, default=True)
    recommend_to_others = Column(Boolean, default=True)

    evaluated_by = Column(String(100), nullable=False)
    evaluation_date = Column(DateTime(timezone=True), server_default=func.now())
```

### API Endpoints (`/api/v1/suppliers/`)

#### Supplier Management
- **GET `/`** - List suppliers with advanced filtering
  - Search by company name, contact person, specializations
  - Filter by supplier type (nursery, collector, farm, distributor)
  - Filter by preferred status and active status
  - Sort by quality rating and preferred status

- **GET `/summary`** - Lightweight supplier data for dropdowns
- **POST `/`** - Create new supplier with validation
- **PUT `/{supplier_id}`** - Update supplier information
- **DELETE `/{supplier_id}`** - Soft delete supplier

#### Catalog Management
- **GET `/{supplier_id}/catalog`** - View supplier's product catalog
  - Filter by product type (budwood, rootstock, seedlings)
  - Filter by species and in-stock status
  - Sort by price and availability

- **POST `/{supplier_id}/catalog`** - Add products to supplier catalog
- **PUT `/catalog/{catalog_id}`** - Update catalog items
- **GET `/catalog/search`** - Search across all supplier catalogs
  - Global search by variety, species, product type
  - Price range filtering
  - Stock availability filtering

#### Purchase Order System
- **GET `/purchase-orders/`** - List all purchase orders
  - Filter by supplier and status
  - Sort by order date (newest first)

- **POST `/purchase-orders/`** - Create new purchase order
  - Auto-generate PO numbers
  - Calculate totals (subtotal, tax, shipping)
  - Create line items with product details

- **PUT `/purchase-orders/{po_id}`** - Update order status
  - Status transitions (draft → sent → confirmed → delivered)
  - Delivery tracking and quality scoring

#### Supplier Evaluation
- **GET `/{supplier_id}/evaluations`** - View supplier performance history
- **POST `/evaluations/`** - Submit supplier evaluation
  - Auto-update supplier ratings based on evaluations
  - Calculate rolling averages for quality metrics

### Frontend Implementation

#### SupplierManagement (`src/components/SupplierManagement.js`)

##### Main Dashboard Features:
- **Statistics Cards**:
  - Total suppliers count
  - Preferred suppliers count
  - Active purchase orders
  - Year-to-date spending total

##### Supplier Card Display:
```javascript
<SupplierCard supplier={supplier}>
  // Company info with type badge
  <CompanyHeader>
    <TypeIcon type={supplier.supplier_type} />
    <CompanyName>{supplier.company_name}</CompanyName>
    <PreferredStar visible={supplier.is_preferred} />
  </CompanyHeader>

  // Contact information
  <ContactInfo>
    <Email>{supplier.email}</Email>
    <Phone>{supplier.phone}</Phone>
    <Location>{supplier.city}, {supplier.state}</Location>
  </ContactInfo>

  // Performance ratings with color coding
  <RatingsGrid>
    <Rating label="Quality" value={supplier.quality_rating} />
    <Rating label="Delivery" value={supplier.delivery_rating} />
    <Rating label="Price" value={supplier.price_rating} />
  </RatingsGrid>

  // Order statistics
  <OrderStats>
    <Stat label="Orders" value={supplier.total_orders} />
    <Stat label="Spent" value={supplier.total_spent} />
    <Stat label="Payment" value={supplier.payment_terms} />
  </OrderStats>

  // Quick actions
  <ActionButtons>
    <ViewButton />
    <OrderButton />
    <EditButton />
  </ActionButtons>
</SupplierCard>
```

##### Visual Indicators:
- **Supplier Types**:
  - 🌲 **Nursery** (Green): Rootstock and young plants
  - 🍃 **Collector** (Blue): Budwood collection specialists
  - 🏢 **Farm** (Yellow): Direct farm suppliers
  - 📦 **Distributor** (Purple): Tools and supplies

- **Rating Colors**:
  - **Green** (4.5+): Excellent performance
  - **Yellow** (4.0-4.4): Good performance
  - **Orange** (3.0-3.9): Fair performance
  - **Red** (<3.0): Poor performance

##### Advanced Filtering:
```javascript
<FilterControls>
  <SearchInput placeholder="Search suppliers..." />
  <TypeFilter options={['all', 'nursery', 'collector', 'farm', 'distributor']} />
  <StatusFilter options={['all', 'active', 'inactive']} />
</FilterControls>
```

#### Tab-based Interface:
1. **Suppliers**: Main supplier management interface
2. **Catalog**: Product catalog browser (coming soon)
3. **Purchase Orders**: Order management system (coming soon)
4. **Evaluations**: Supplier performance tracking (coming soon)

### Business Workflow Integration

#### Purchase Order Creation Process:
1. **Supplier Selection**: Choose from preferred or search all suppliers
2. **Catalog Browse**: View available products with current pricing
3. **Order Composition**: Add multiple line items with quantities
4. **Order Review**: Verify totals, delivery dates, terms
5. **Approval**: Submit for approval workflow
6. **Tracking**: Monitor delivery and quality upon receipt

#### Quality Assurance Integration:
1. **Incoming Inspection**: Required quality checks upon delivery
2. **Lot Tracking**: Traceability from supplier to final product
3. **Quality Scoring**: Rate received materials (1-5 scale)
4. **Supplier Feedback**: Continuous improvement communication
5. **Performance Trends**: Track supplier improvement over time

#### Material Integration with Production:
```javascript
// Link purchased materials to internal production
const budwoodRecord = {
  orderId: productionOrder.id,
  externalSource: true,
  supplierId: purchaseOrder.supplier_id,
  supplierLotNumber: item.lot_number,
  qualityGrade: item.quality_grade,
  harvestDate: item.harvest_date,
  // ... standard budwood fields
};
```

### Advanced Features

#### Smart Sourcing:
- **Multi-supplier Price Comparison**: Find best prices across suppliers
- **Availability Aggregation**: Real-time stock across all suppliers
- **Seasonal Planning**: Plan purchases based on availability calendars
- **Alternative Suggestions**: Similar products from different suppliers

#### Supplier Performance Analytics:
- **Trend Analysis**: Performance improvement/decline over time
- **Comparative Analysis**: Rank suppliers by category
- **Cost Analysis**: Total cost of ownership including shipping, quality issues
- **Risk Assessment**: Supplier diversification and dependency analysis

#### Business Intelligence:
```javascript
<SupplierAnalytics>
  <SpendingTrends />          // Monthly spending patterns
  <PerformanceMetrics />      // Quality/delivery/price trends
  <SupplierComparison />      // Side-by-side supplier comparison
  <CostOptimization />        // Recommendations for cost savings
  <RiskAssessment />          // Supplier concentration analysis
</SupplierAnalytics>
```

### Integration Benefits

#### Supply Chain Optimization:
- **Vendor Diversification**: Reduce dependency on single suppliers
- **Quality Assurance**: Consistent material quality through tracking
- **Cost Management**: Transparent pricing and spend analysis
- **Delivery Reliability**: Performance-based supplier selection

#### Operational Efficiency:
- **Streamlined Procurement**: Digital purchase order workflow
- **Automated Tracking**: From order to delivery to production
- **Quality Documentation**: Complete audit trail for compliance
- **Performance Management**: Data-driven supplier relationship management

#### Business Growth:
- **Scalable Sourcing**: Support for increased production volume
- **Compliance Ready**: Meet industry certification requirements
- **Cost Optimization**: Identify savings opportunities
- **Risk Mitigation**: Supplier performance monitoring and backup planning

This comprehensive supplier management system transforms external material sourcing from an informal process into a professional, trackable, and optimized supply chain operation that seamlessly integrates with the internal propagation management workflow.