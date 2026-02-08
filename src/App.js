import React, { useEffect, useState } from 'react';
import { useAppStore } from './stores/appStore';
import {
  Calendar,
  Plus,
  Search,
  Droplets,
  Thermometer,
  Clock,
  BarChart3,
  Settings,
  Menu,
  X,
  Home,
  Leaf,
  CheckSquare,
  Package,
  TrendingUp,
  Target,
  DollarSign,
  Users,
  LogOut
} from 'lucide-react';
import PropagationOrder from './PropagationOrder';
import EmployeeManagement from './components/EmployeeManagement';

const CropPropagationApp = () => {
  const {
    // State
    activeTab,
    crops,
    tasks,
    orders,
    searchTerm,
    selectedCrop,
    showNewCrop,
    showNewOrder,

    // Filtered data
    getFilteredCrops,
    getPendingTasks,
    getTodaysTasks,
    getStageStats,
    getDashboardStats,

    // Actions
    setActiveTab,
    setSearchTerm,
    setSelectedCrop,
    setShowNewCrop,
    setShowNewOrder,
    addCrop,
    updateCrop,
    toggleTask,
    addTask,
    logout
  } = useAppStore();

  // Mobile navigation state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);

  // Modal states
  const [showAddTask, setShowAddTask] = useState(false);

  // Employee management state
  const [employees, setEmployees] = useState([
    {
      id: 'EMP-001',
      firstName: 'John',
      lastName: 'Smith',
      fullName: 'John Smith',
      email: 'john.smith@floratrack.com',
      phone: '+1-555-0123',
      position: 'Propagation Technician',
      department: 'Propagation',
      skillsets: ['budwood_collection', 'nursery_management'],
      certifications: ['Plant Health', 'Quality Grading'],
      hireDate: '2023-01-15',
      employeeId: 'EMP-001',
      status: 'active',
      hourlyRate: '18.50',
      address: '123 Garden St, Plant City, FL 33563',
      emergencyContact: {
        name: 'Jane Smith',
        phone: '+1-555-0124',
        relationship: 'Spouse'
      },
      notes: 'Experienced in citrus propagation'
    },
    {
      id: 'EMP-002',
      firstName: 'Alice',
      lastName: 'Johnson',
      fullName: 'Alice Johnson',
      email: 'alice.johnson@floratrack.com',
      phone: '+1-555-0125',
      position: 'Grafter',
      department: 'Propagation',
      skillsets: ['grafting', 'quality_control'],
      certifications: ['Grafting Certification', 'Plant Propagation', 'Quality Assurance'],
      hireDate: '2022-03-20',
      employeeId: 'EMP-002',
      status: 'active',
      hourlyRate: '22.00',
      address: '456 Bloom Ave, Plant City, FL 33563',
      emergencyContact: {
        name: 'Bob Johnson',
        phone: '+1-555-0126',
        relationship: 'Husband'
      },
      notes: 'Lead grafter with 10+ years experience'
    },
    {
      id: 'EMP-003',
      firstName: 'Maria',
      lastName: 'Garcia',
      fullName: 'Maria Garcia',
      email: 'maria.garcia@floratrack.com',
      phone: '+1-555-0127',
      position: 'Nursery Worker',
      department: 'Nursery Operations',
      skillsets: ['nursery_management', 'hardening'],
      certifications: ['Horticulture', 'Plant Health'],
      hireDate: '2023-06-10',
      employeeId: 'EMP-003',
      status: 'active',
      hourlyRate: '17.00',
      address: '789 Seedling Rd, Plant City, FL 33563',
      emergencyContact: {
        name: 'Carlos Garcia',
        phone: '+1-555-0128',
        relationship: 'Brother'
      },
      notes: 'Specializes in post-graft care'
    },
    {
      id: 'EMP-004',
      firstName: 'David',
      lastName: 'Chen',
      fullName: 'David Chen',
      email: 'david.chen@floratrack.com',
      phone: '+1-555-0129',
      position: 'Team Lead',
      department: 'Management',
      skillsets: ['supervision', 'quality_control', 'hardening'],
      certifications: ['Leadership', 'Safety Management', 'Plant Physiology'],
      hireDate: '2021-11-05',
      employeeId: 'EMP-004',
      status: 'active',
      hourlyRate: '25.00',
      address: '321 Growth Blvd, Plant City, FL 33563',
      emergencyContact: {
        name: 'Lisa Chen',
        phone: '+1-555-0130',
        relationship: 'Wife'
      },
      notes: 'Team lead for hardening operations'
    },
    {
      id: 'EMP-005',
      firstName: 'Sarah',
      lastName: 'Wilson',
      fullName: 'Sarah Wilson',
      email: 'sarah.wilson@floratrack.com',
      phone: '+1-555-0131',
      position: 'Logistics Coordinator',
      department: 'Logistics',
      skillsets: ['logistics'],
      certifications: ['Transportation', 'Packaging'],
      hireDate: '2023-02-28',
      employeeId: 'EMP-005',
      status: 'active',
      hourlyRate: '19.50',
      address: '654 Shipping Way, Plant City, FL 33563',
      emergencyContact: {
        name: 'Mike Wilson',
        phone: '+1-555-0132',
        relationship: 'Father'
      },
      notes: 'Handles dispatch and delivery coordination'
    }
  ]);

  // Form states
  const [newCrop, setNewCrop] = useState({
    name: '',
    variety: '',
    propagationMethod: 'seed',
    location: '',
    notes: ''
  });

  const [newTask, setNewTask] = useState({
    cropId: '',
    task: '',
    dueDate: '',
    priority: 'medium'
  });

  // Check if mobile view
  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    checkMobileView();
    window.addEventListener('resize', checkMobileView);

    return () => window.removeEventListener('resize', checkMobileView);
  }, []);

  // Close mobile menu when tab changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [activeTab]);

  // Navigation items
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'crops', label: 'Crops', icon: Leaf },
    { id: 'propagation', label: 'Orders', icon: Package },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'employees', label: 'Employees', icon: Users },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp }
  ];

  // Helper functions
  const getStageColor = (stage) => {
    switch(stage) {
      case 'planted': return 'bg-gray-100 text-gray-800';
      case 'germination': return 'bg-yellow-100 text-yellow-800';
      case 'rooting': return 'bg-blue-100 text-blue-800';
      case 'established': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  // Form handlers
  const handleAddCrop = async () => {
    if (newCrop.name && newCrop.variety) {
      await addCrop(newCrop);
      setNewCrop({ name: '', variety: '', propagationMethod: 'seed', location: '', notes: '' });
      setShowNewCrop(false);
    }
  };

  const handleAddTask = async () => {
    if (newTask.task && newTask.cropId && newTask.dueDate) {
      await addTask(newTask);
      setNewTask({ cropId: '', task: '', dueDate: '', priority: 'medium' });
      setShowAddTask(false);
    }
  };

  // Employee management functions
  const handleAddEmployee = (employee) => {
    setEmployees([...employees, employee]);
  };

  const handleUpdateEmployee = (updatedEmployee) => {
    setEmployees(employees.map(emp =>
      emp.id === updatedEmployee.id ? updatedEmployee : emp
    ));
  };

  const handleDeleteEmployee = (employeeId) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      setEmployees(employees.filter(emp => emp.id !== employeeId));
    }
  };

  // Mobile-optimized components
  const MobileNavigation = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 md:hidden">
      <div className="grid grid-cols-5 h-16">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center space-y-1 px-2 py-2 ${
                isActive
                  ? 'text-green-600 bg-green-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              } transition-colors`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium truncate">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  const MobileHeader = () => (
    <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-3 md:hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 -ml-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <h1 className="text-lg font-semibold text-gray-900">
            {navItems.find(item => item.id === activeTab)?.label || 'Crop Propagation'}
          </h1>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowNewCrop(true)}
            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button
            onClick={logout}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );

  const MobileCropCard = ({ crop }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-base text-gray-900">{crop.name}</h3>
          <p className="text-gray-600 text-sm">{crop.variety}</p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStageColor(crop.currentStage)}`}>
          {crop.currentStage}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
        <div>
          <span className="text-gray-500">Method:</span>
          <div className="font-medium mt-1">{crop.propagationMethod}</div>
        </div>
        <div>
          <span className="text-gray-500">Location:</span>
          <div className="font-medium mt-1">{crop.location}</div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <Thermometer className="w-4 h-4 text-red-500" />
            <span className="text-sm">{crop.temperature}°C</span>
          </div>
          <div className="flex items-center space-x-1">
            <Droplets className="w-4 h-4 text-blue-500" />
            <span className="text-sm">{crop.humidity}%</span>
          </div>
        </div>
        <button
          onClick={() => setSelectedCrop(crop)}
          className="px-3 py-1 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
        >
          View
        </button>
      </div>

      {crop.notes && (
        <p className="text-xs text-gray-500 italic border-t border-gray-100 pt-3">
          {crop.notes}
        </p>
      )}
    </div>
  );

  const MobileTaskCard = ({ task, crop }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-3">
      <div className="flex items-start space-x-3">
        <input
          type="checkbox"
          checked={task.completed}
          onChange={() => toggleTask(task.id)}
          className="w-5 h-5 text-green-600 rounded mt-0.5"
        />
        <div className="flex-1">
          <p className={`font-medium text-sm ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
            {task.task}
          </p>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-gray-600">
              {crop?.name} - {crop?.variety}
            </p>
            <div className="flex items-center space-x-2">
              <span className={`text-xs font-medium ${getPriorityColor(task.priority)}`}>
                {task.priority}
              </span>
              <span className="text-xs text-gray-500">{task.dueDate}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Main content renderer
  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'crops':
        return <CropManagement />;
      case 'propagation':
        return <PropagationOrder employees={employees} />;
      case 'tasks':
        return <TaskManagement />;
      case 'employees':
        return (
          <EmployeeManagement
            employees={employees}
            onAddEmployee={handleAddEmployee}
            onUpdateEmployee={handleUpdateEmployee}
            onDeleteEmployee={handleDeleteEmployee}
          />
        );
      case 'calendar':
        return <CalendarView />;
      case 'analytics':
        return <Analytics />;
      default:
        return <Dashboard />;
    }
  };

  // Dashboard component
  const Dashboard = () => {
    const stats = getDashboardStats();
    const stageStats = getStageStats();
    const todaysTasks = getTodaysTasks();

    return (
      <div className="space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-xs font-medium text-gray-600 uppercase tracking-wide">Total Crops</h3>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalCrops}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-xs font-medium text-gray-600 uppercase tracking-wide">Active Plants</h3>
            <p className="text-2xl font-bold text-green-600 mt-1">{stats.activePlants}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-xs font-medium text-gray-600 uppercase tracking-wide">Pending Tasks</h3>
            <p className="text-2xl font-bold text-orange-600 mt-1">{stats.pendingTasks}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-xs font-medium text-gray-600 uppercase tracking-wide">Revenue</h3>
            <p className="text-2xl font-bold text-blue-600 mt-1">${stats.totalRevenue}</p>
          </div>
        </div>

        {/* Today's Tasks */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-blue-600" />
            Today's Tasks
          </h2>
          <div className="space-y-3">
            {todaysTasks.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No tasks scheduled for today</p>
            ) : (
              todaysTasks.map(task => {
                const crop = crops.find(c => c.id === task.cropId);
                return <MobileTaskCard key={task.id} task={task} crop={crop} />;
              })
            )}
          </div>
        </div>

        {/* Stage Overview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-green-600" />
            Propagation Overview
          </h2>
          <div className="space-y-3">
            {Object.entries(stageStats).map(([stage, count]) => (
              <div key={stage} className="flex justify-between items-center py-2">
                <span className="capitalize font-medium text-gray-700">{stage}</span>
                <div className="flex items-center space-x-3">
                  <div className="bg-gray-200 rounded-full h-2 w-20">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${(count / crops.length) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-6">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Crop Management component
  const CropManagement = () => {
    const filteredCrops = getFilteredCrops();

    return (
      <div className="space-y-4">
        {/* Search and Add */}
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search crops..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowNewCrop(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 min-h-[40px]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Crop</span>
          </button>
        </div>

        {/* Crops List */}
        <div>
          {filteredCrops.length === 0 ? (
            <div className="text-center py-12">
              <Leaf className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No crops found</p>
              <button
                onClick={() => setShowNewCrop(true)}
                className="mt-2 text-green-600 hover:text-green-700"
              >
                Add your first crop
              </button>
            </div>
          ) : (
            filteredCrops.map(crop => (
              <MobileCropCard key={crop.id} crop={crop} />
            ))
          )}
        </div>
      </div>
    );
  };

  // Task Management component
  const TaskManagement = () => {
    const pendingTasks = getPendingTasks();

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Tasks</h2>
          <button
            onClick={() => setShowAddTask(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>

        <div>
          {pendingTasks.length === 0 ? (
            <div className="text-center py-12">
              <CheckSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No pending tasks</p>
            </div>
          ) : (
            pendingTasks.map(task => {
              const crop = crops.find(c => c.id === task.cropId);
              return <MobileTaskCard key={task.id} task={task} crop={crop} />;
            })
          )}
        </div>
      </div>
    );
  };

  // Placeholder components
  const CalendarView = () => {
    const getDaysInMonth = (date) => {
      return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date) => {
      return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const currentDate = new Date();
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const tasksByDate = tasks.reduce((acc, task) => {
      if (!acc[task.dueDate]) acc[task.dueDate] = [];
      acc[task.dueDate].push(task);
      return acc;
    }, {});

    const renderCalendarDay = (day) => {
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayTasks = tasksByDate[dateStr] || [];
      const isToday = day === currentDate.getDate();

      return (
        <div
          key={day}
          className={`min-h-24 p-2 border border-gray-200 ${
            isToday ? 'bg-blue-50 border-blue-300' : 'bg-white'
          }`}
        >
          <div className={`text-sm font-medium mb-1 ${
            isToday ? 'text-blue-600' : 'text-gray-900'
          }`}>
            {day}
          </div>
          <div className="space-y-1">
            {dayTasks.slice(0, 3).map(task => {
              const crop = crops.find(c => c.id === task.cropId);
              return (
                <div
                  key={task.id}
                  className={`text-xs p-1 rounded truncate ${
                    task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                    task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                    task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}
                  title={`${task.task} - ${crop?.name}`}
                >
                  {task.task}
                </div>
              );
            })}
            {dayTasks.length > 3 && (
              <div className="text-xs text-gray-500">+{dayTasks.length - 3} more</div>
            )}
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Calendar</h2>
          <div className="flex items-center space-x-4">
            <span className="text-lg font-medium">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <button
              onClick={() => setShowAddTask(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Task</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-7 gap-0">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="bg-gray-50 p-3 text-center font-medium text-gray-700 border-b">
                {day}
              </div>
            ))}

            {Array.from({ length: firstDay }, (_, i) => (
              <div key={`empty-${i}`} className="min-h-24 p-2 border border-gray-200 bg-gray-50"></div>
            ))}

            {Array.from({ length: daysInMonth }, (_, i) => renderCalendarDay(i + 1))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Upcoming Tasks</h3>
          <div className="space-y-3">
            {getPendingTasks().slice(0, 5).map(task => {
              const crop = crops.find(c => c.id === task.cropId);
              const daysUntilDue = Math.ceil((new Date(task.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
              return (
                <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{task.task}</div>
                    <div className="text-sm text-gray-600">{crop?.name} - {crop?.variety}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-medium ${
                      daysUntilDue < 0 ? 'text-red-600' :
                      daysUntilDue === 0 ? 'text-orange-600' :
                      daysUntilDue <= 3 ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {daysUntilDue < 0 ? `${Math.abs(daysUntilDue)} days overdue` :
                       daysUntilDue === 0 ? 'Due today' :
                       `${daysUntilDue} days left`}
                    </div>
                    <div className={`text-xs px-2 py-1 rounded-full ${
                      task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                      task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                      task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {task.priority}
                    </div>
                  </div>
                </div>
              );
            })}
            {getPendingTasks().length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <CheckSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No pending tasks</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const Analytics = () => {
    const [analyticsData, setAnalyticsData] = useState(null);
    const [performanceData, setPerformanceData] = useState(null);
    const [successRateData, setSuccessRateData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
      const fetchAnalyticsData = async () => {
        try {
          setLoading(true);
          const [dashboardRes, performanceRes, successRes] = await Promise.all([
            fetch('http://127.0.0.1:8000/api/v1/analytics/dashboard'),
            fetch('http://127.0.0.1:8000/api/v1/analytics/performance'),
            fetch('http://127.0.0.1:8000/api/v1/analytics/success-rates')
          ]);

          const [dashboard, performance, success] = await Promise.all([
            dashboardRes.json(),
            performanceRes.json(),
            successRes.json()
          ]);

          setAnalyticsData(dashboard);
          setPerformanceData(performance);
          setSuccessRateData(success);
        } catch (error) {
          console.error('Failed to fetch analytics data:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchAnalyticsData();
    }, []);

    if (loading) {
      return (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading analytics...</p>
        </div>
      );
    }

    const tabButtons = [
      { id: 'overview', label: 'Overview', icon: TrendingUp },
      { id: 'performance', label: 'Performance', icon: BarChart3 },
      { id: 'success', label: 'Success Rates', icon: Target }
    ];

    const renderOverview = () => (
      <div className="space-y-6">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Leaf className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Plants</p>
                <p className="text-2xl font-bold text-gray-900">{analyticsData?.active_plants?.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Orders</p>
                <p className="text-2xl font-bold text-gray-900">{analyticsData?.active_orders}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <CheckSquare className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending Tasks</p>
                <p className="text-2xl font-bold text-gray-900">{analyticsData?.pending_tasks}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">${analyticsData?.total_revenue?.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Growth Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Growth Metrics</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Order Fulfillment Rate</span>
                <span className="text-sm font-medium text-green-600">{analyticsData?.growth_metrics?.order_fulfillment_rate}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Task Completion Rate</span>
                <span className="text-sm font-medium text-blue-600">{analyticsData?.growth_metrics?.task_completion_rate}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Average Order Value</span>
                <span className="text-sm font-medium text-purple-600">${analyticsData?.growth_metrics?.average_order_value}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Orders by Status</h3>
            <div className="space-y-3">
              {Object.entries(analyticsData?.orders_by_status || {}).map(([status, count]) => (
                <div key={status} className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 capitalize">{status.replace('_', ' ')}</span>
                  <span className="text-sm font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {analyticsData?.recent_activity?.map((activity, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${activity.type === 'order' ? 'bg-blue-100' : 'bg-green-100'}`}>
                  {activity.type === 'order' ?
                    <Package className={`w-4 h-4 ${activity.type === 'order' ? 'text-blue-600' : 'text-green-600'}`} /> :
                    <CheckSquare className={`w-4 h-4 ${activity.type === 'order' ? 'text-blue-600' : 'text-green-600'}`} />
                  }
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{activity.activity}</p>
                  <p className="text-xs text-gray-500">{activity.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );

    const renderPerformance = () => (
      <div className="space-y-6">
        {/* Efficiency Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{performanceData?.efficiency_metrics?.success_rate}%</p>
              <p className="text-sm text-gray-500 mt-1">Success Rate</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{performanceData?.efficiency_metrics?.average_propagation_time}</p>
              <p className="text-sm text-gray-500 mt-1">Avg. Days</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">${performanceData?.efficiency_metrics?.cost_per_plant}</p>
              <p className="text-sm text-gray-500 mt-1">Cost per Plant</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-600">{performanceData?.efficiency_metrics?.plants_per_sqm}</p>
              <p className="text-sm text-gray-500 mt-1">Plants per m²</p>
            </div>
          </div>
        </div>

        {/* Growth Trends */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Growth Trends</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">+{performanceData?.trends?.revenue_growth}%</div>
              <div className="text-sm text-gray-500">Revenue Growth</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">+{performanceData?.trends?.order_growth}%</div>
              <div className="text-sm text-gray-500">Order Growth</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">+{performanceData?.trends?.plant_production_growth}%</div>
              <div className="text-sm text-gray-500">Production Growth</div>
            </div>
          </div>
        </div>

        {/* Seasonal Performance */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Seasonal Performance</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(performanceData?.seasonal_trends || {}).map(([season, data]) => (
              <div key={season} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-lg font-semibold text-gray-900 capitalize">{season}</div>
                <div className="text-sm text-gray-500 mt-1">{data.orders} orders</div>
                <div className="text-sm text-green-600 font-medium">{data.success_rate}% success</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );

    const renderSuccessRates = () => (
      <div className="space-y-6">
        {/* Overall Success Rate */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">{successRateData?.overall_success_rate}%</div>
            <p className="text-gray-500">Overall Success Rate</p>
          </div>
        </div>

        {/* Success by Propagation Method */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Success Rate by Propagation Method</h3>
          <div className="space-y-4">
            {Object.entries(successRateData?.by_propagation_method || {}).map(([method, data]) => (
              <div key={method} className="flex justify-between items-center">
                <div>
                  <span className="text-sm font-medium text-gray-900 capitalize">{method}</span>
                  <span className="text-xs text-gray-500 ml-2">({data.total_attempts} attempts)</span>
                </div>
                <div className="text-sm font-medium text-green-600">{data.success_rate}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* Success by Crop Type */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Success Rate by Crop Type</h3>
          <div className="space-y-4">
            {Object.entries(successRateData?.by_crop_type || {}).map(([crop, data]) => (
              <div key={crop} className="flex justify-between items-center">
                <div>
                  <span className="text-sm font-medium text-gray-900 capitalize">{crop}</span>
                  <span className="text-xs text-gray-500 ml-2">({data.total_attempts} attempts)</span>
                </div>
                <div className="text-sm font-medium text-green-600">{data.success_rate}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* Factors Affecting Success */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Factors Affecting Success</h3>
          <div className="space-y-3">
            {successRateData?.factors_affecting_success?.map((factor, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm text-gray-900">{factor.factor}</span>
                <span className="text-sm font-medium text-blue-600">{factor.impact}% impact</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );

    return (
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {tabButtons.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'performance' && renderPerformance()}
        {activeTab === 'success' && renderSuccessRates()}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      {isMobileView && <MobileHeader />}

      {/* Desktop Header */}
      {!isMobileView && (
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between items-center py-4">
              <h1 className="text-2xl font-bold text-gray-900">Crop Propagation Manager</h1>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
                <button
                  onClick={logout}
                  className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
                <Settings className="w-5 h-5 text-gray-600" />
              </div>
            </div>

            <nav className="flex space-x-8">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      isActive
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={`max-w-7xl mx-auto px-4 py-4 ${isMobileView ? 'pb-20' : 'py-6'}`}>
        {renderContent()}
      </div>

      {/* Mobile Navigation */}
      {isMobileView && <MobileNavigation />}

      {/* Modals */}
      {showNewCrop && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Add New Crop</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Crop Name"
                value={newCrop.name}
                onChange={(e) => setNewCrop({...newCrop, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
              />
              <input
                type="text"
                placeholder="Variety"
                value={newCrop.variety}
                onChange={(e) => setNewCrop({...newCrop, variety: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
              />
              <select
                value={newCrop.propagationMethod}
                onChange={(e) => setNewCrop({...newCrop, propagationMethod: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
              >
                <option value="seed">Seed</option>
                <option value="cutting">Cutting</option>
                <option value="division">Division</option>
                <option value="grafting">Grafting</option>
              </select>
              <input
                type="text"
                placeholder="Location"
                value={newCrop.location}
                onChange={(e) => setNewCrop({...newCrop, location: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
              />
              <textarea
                placeholder="Notes"
                value={newCrop.notes}
                onChange={(e) => setNewCrop({...newCrop, notes: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                rows="3"
              />
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleAddCrop}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
              >
                Add Crop
              </button>
              <button
                onClick={() => setShowNewCrop(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedCrop && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">{selectedCrop.name} - {selectedCrop.variety}</h2>
              <button onClick={() => setSelectedCrop(null)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Basic Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Method:</span>
                    <span className="font-medium capitalize">{selectedCrop.propagationMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Stage:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStageColor(selectedCrop.currentStage)}`}>
                      {selectedCrop.currentStage}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Location:</span>
                    <span className="font-medium">{selectedCrop.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Planted:</span>
                    <span className="font-medium">{selectedCrop.plantedDate}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Environment</h3>
                <div className="space-y-4">
                  <div className="p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Thermometer className="w-4 h-4 text-red-500 mr-2" />
                        <span className="text-sm font-medium">Temperature</span>
                      </div>
                      <span className="text-lg font-bold text-red-600">{selectedCrop.temperature}°C</span>
                    </div>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Droplets className="w-4 h-4 text-blue-500 mr-2" />
                        <span className="text-sm font-medium">Humidity</span>
                      </div>
                      <span className="text-lg font-bold text-blue-600">{selectedCrop.humidity}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {selectedCrop.notes && (
              <div className="mt-6">
                <h3 className="font-semibold mb-3">Notes</h3>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-700">{selectedCrop.notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Task Creation Modal */}
      {showAddTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Add New Task</h2>
            <div className="space-y-4">
              <select
                value={newTask.cropId}
                onChange={(e) => setNewTask({...newTask, cropId: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Select Crop</option>
                {crops.map(crop => (
                  <option key={crop.id} value={crop.id}>
                    {crop.name} - {crop.variety}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Task Description"
                value={newTask.task}
                onChange={(e) => setNewTask({...newTask, task: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <input
                type="date"
                value={newTask.dueDate}
                onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <select
                value={newTask.priority}
                onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleAddTask}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
              >
                Add Task
              </button>
              <button
                onClick={() => {
                  setShowAddTask(false);
                  setNewTask({ cropId: '', task: '', dueDate: '', priority: 'medium' });
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CropPropagationApp;