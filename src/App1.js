import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Search, Droplets, Thermometer, Clock, CheckCircle, AlertCircle, BarChart3, Settings, Edit, Trash2, Eye } from 'lucide-react';
import './App.css';

const CropPropagationApp = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [crops, setCrops] = useState([
    {
      id: 1,
      name: 'Tomato Heritage',
      variety: 'Cherokee Purple',
      propagationMethod: 'seed',
      plantedDate: '2025-08-15',
      expectedGermination: '2025-08-25',
      currentStage: 'germination',
      location: 'Greenhouse A - Tray 1',
      temperature: 22,
      humidity: 75,
      watered: '2025-09-01',
      notes: 'Good germination rate, 85% sprouted'
    },
    {
      id: 2,
      name: 'Basil Sweet',
      variety: 'Genovese',
      propagationMethod: 'cutting',
      plantedDate: '2025-08-20',
      expectedGermination: '2025-08-27',
      currentStage: 'rooting',
      location: 'Propagation Station B',
      temperature: 24,
      humidity: 80,
      watered: '2025-09-02',
      notes: 'Strong root development'
    },
    {
      id: 3,
      name: 'Lettuce Buttercrunch',
      variety: 'Buttercrunch',
      propagationMethod: 'seed',
      plantedDate: '2025-08-25',
      expectedGermination: '2025-09-05',
      currentStage: 'planted',
      location: 'Cold Frame 1',
      temperature: 18,
      humidity: 70,
      watered: '2025-09-01',
      notes: 'Pre-germination stage'
    }
  ]);

  const [tasks, setTasks] = useState([
    { id: 1, cropId: 1, task: 'Water seedlings', dueDate: '2025-09-03', completed: false, priority: 'high' },
    { id: 2, cropId: 2, task: 'Check root development', dueDate: '2025-09-04', completed: false, priority: 'medium' },
    { id: 3, cropId: 1, task: 'Transplant to larger pots', dueDate: '2025-09-10', completed: false, priority: 'medium' },
    { id: 4, cropId: 3, task: 'Monitor germination', dueDate: '2025-09-06', completed: false, priority: 'high' }
  ]);

  const [showAddCrop, setShowAddCrop] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCrop, setSelectedCrop] = useState(null);

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

  const addCrop = () => {
    if (newCrop.name && newCrop.variety) {
      const crop = {
        id: Date.now(),
        ...newCrop,
        plantedDate: new Date().toISOString().split('T')[0],
        expectedGermination: new Date(Date.now() + 10*24*60*60*1000).toISOString().split('T')[0],
        currentStage: 'planted',
        temperature: 20,
        humidity: 65,
        watered: new Date().toISOString().split('T')[0]
      };
      setCrops([...crops, crop]);
      setNewCrop({ name: '', variety: '', propagationMethod: 'seed', location: '', notes: '' });
      setShowAddCrop(false);
    }
  };

  const addTask = () => {
    if (newTask.task && newTask.cropId && newTask.dueDate) {
      const task = {
        id: Date.now(),
        ...newTask,
        completed: false
      };
      setTasks([...tasks, task]);
      setNewTask({ cropId: '', task: '', dueDate: '', priority: 'medium' });
      setShowAddTask(false);
    }
  };

  const toggleTask = (taskId) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  const updateCropStage = (cropId, newStage) => {
    setCrops(crops.map(crop => 
      crop.id === cropId ? { ...crop, currentStage: newStage } : crop
    ));
  };

  const filteredCrops = crops.filter(crop => 
    crop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    crop.variety.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const upcomingTasks = tasks.filter(task => !task.completed).slice(0, 5);
  const todaysTasks = tasks.filter(task => 
    task.dueDate === new Date().toISOString().split('T')[0] && !task.completed
  );

  const stageStats = crops.reduce((acc, crop) => {
    acc[crop.currentStage] = (acc[crop.currentStage] || 0) + 1;
    return acc;
  }, {});

  const CropCard = ({ crop, onSelect }) => (
    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-lg text-gray-800">{crop.name}</h3>
          <p className="text-gray-600">{crop.variety}</p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStageColor(crop.currentStage)}`}>
          {crop.currentStage}
        </span>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Method:</span>
          <span className="font-medium">{crop.propagationMethod}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Location:</span>
          <span className="font-medium">{crop.location}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Environment:</span>
          <div className="flex items-center space-x-2">
            <div className="flex items-center">
              <Thermometer className="w-4 h-4 text-red-500 mr-1" />
              <span>{crop.temperature}°C</span>
            </div>
            <div className="flex items-center">
              <Droplets className="w-4 h-4 text-blue-500 mr-1" />
              <span>{crop.humidity}%</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 flex space-x-2">
        <button 
          onClick={() => onSelect(crop)}
          className="flex-1 bg-green-600 text-white py-2 px-3 rounded-md text-sm hover:bg-green-700 transition-colors flex items-center justify-center"
        >
          <Eye className="w-4 h-4 mr-1" />
          Details
        </button>
        <select 
          value={crop.currentStage}
          onChange={(e) => updateCropStage(crop.id, e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="planted">Planted</option>
          <option value="germination">Germination</option>
          <option value="rooting">Rooting</option>
          <option value="established">Established</option>
        </select>
      </div>
      
      {crop.notes && (
        <p className="mt-2 text-xs text-gray-500 italic">{crop.notes}</p>
      )}
    </div>
  );

  const Dashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-sm font-medium text-gray-600">Total Crops</h3>
          <p className="text-2xl font-bold text-gray-900">{crops.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-sm font-medium text-gray-600">Active Germination</h3>
          <p className="text-2xl font-bold text-green-600">{stageStats.germination || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-sm font-medium text-gray-600">Pending Tasks</h3>
          <p className="text-2xl font-bold text-orange-600">{tasks.filter(t => !t.completed).length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-sm font-medium text-gray-600">Success Rate</h3>
          <p className="text-2xl font-bold text-blue-600">87%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-blue-600" />
            Today's Tasks
          </h2>
          <div className="space-y-3">
            {todaysTasks.length === 0 ? (
              <p className="text-gray-500">No tasks scheduled for today</p>
            ) : (
              todaysTasks.map(task => {
                const crop = crops.find(c => c.id === task.cropId);
                return (
                  <div key={task.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTask(task.id)}
                      className="w-4 h-4 text-green-600"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{task.task}</p>
                      <p className="text-sm text-gray-600">{crop?.name} - {crop?.variety}</p>
                    </div>
                    <span className={`text-xs font-medium ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-green-600" />
            Propagation Overview
          </h2>
          <div className="space-y-3">
            {Object.entries(stageStats).map(([stage, count]) => (
              <div key={stage} className="flex justify-between items-center">
                <span className="capitalize font-medium">{stage}</span>
                <div className="flex items-center space-x-2">
                  <div className="bg-gray-200 rounded-full h-2 w-24">
                    <div 
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${(count / crops.length) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        <div className="space-y-3">
          <div className="flex items-center space-x-3 p-3 border-l-4 border-green-500 bg-green-50">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-medium">Tomato Heritage reached 85% germination</p>
              <p className="text-sm text-gray-600">2 hours ago</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 border-l-4 border-blue-500 bg-blue-50">
            <Droplets className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-medium">Basil Sweet watered and misted</p>
              <p className="text-sm text-gray-600">Today at 8:00 AM</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 border-l-4 border-yellow-500 bg-yellow-50">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <div>
              <p className="font-medium">Temperature alert: Greenhouse A reached 28°C</p>
              <p className="text-sm text-gray-600">Yesterday at 2:30 PM</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const CropManagement = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search crops..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>
        <button
          onClick={() => setShowAddCrop(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Crop
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCrops.map(crop => (
          <CropCard key={crop.id} crop={crop} onSelect={setSelectedCrop} />
        ))}
      </div>

      {showAddCrop && (
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
                onClick={addCrop}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
              >
                Add Crop
              </button>
              <button
                onClick={() => setShowAddCrop(false)}
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

  const TaskManagement = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Task Management</h1>
        <button
          onClick={() => setShowAddTask(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Task
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">All Tasks</h2>
          <div className="space-y-3">
            {tasks.map(task => {
              const crop = crops.find(c => c.id === task.cropId);
              const isOverdue = new Date(task.dueDate) < new Date() && !task.completed;
              return (
                <div key={task.id} className={`flex items-center space-x-3 p-4 rounded-lg border ${
                  task.completed ? 'bg-gray-50 opacity-75' : 
                  isOverdue ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'
                }`}>
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTask(task.id)}
                    className="w-4 h-4 text-green-600"
                  />
                  <div className="flex-1">
                    <p className={`font-medium ${task.completed ? 'line-through text-gray-500' : ''}`}>
                      {task.task}
                    </p>
                    <p className="text-sm text-gray-600">
                      {crop?.name} - {crop?.variety} | Due: {task.dueDate}
                    </p>
                  </div>
                  <span className={`text-xs font-medium ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                  {isOverdue && <AlertCircle className="w-4 h-4 text-red-500" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {showAddTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Add New Task</h2>
            <div className="space-y-4">
              <select
                value={newTask.cropId}
                onChange={(e) => setNewTask({...newTask, cropId: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
              />
              <input
                type="date"
                value={newTask.dueDate}
                onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
              />
              <select
                value={newTask.priority}
                onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={addTask}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
              >
                Add Task
              </button>
              <button
                onClick={() => setShowAddTask(false)}
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

  const Calendar = () => {
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
                    task.priority === 'high' ? 'bg-red-100 text-red-800' :
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
          <h1 className="text-2xl font-bold text-gray-900">Propagation Calendar</h1>
          <div className="flex items-center space-x-4">
            <span className="text-lg font-medium">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
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
          <h2 className="text-lg font-semibold mb-4">Upcoming Milestones</h2>
          <div className="space-y-3">
            {crops.filter(crop => crop.currentStage !== 'established').map(crop => {
              const daysToGermination = Math.ceil((new Date(crop.expectedGermination) - new Date()) / (1000 * 60 * 60 * 24));
              return (
                <div key={crop.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                  <div>
                    <p className="font-medium">{crop.name} - {crop.variety}</p>
                    <p className="text-sm text-gray-600">Expected germination</p>
                  </div>
                  <span className="text-sm font-medium text-green-600">
                    {daysToGermination > 0 ? `${daysToGermination} days` : 'Due now'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const Analytics = () => (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Success Rates by Method</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Seed Propagation</span>
              <div className="flex items-center space-x-2">
                <div className="bg-gray-200 rounded-full h-2 w-32">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '87%' }}></div>
                </div>
                <span className="text-sm font-medium">87%</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span>Cutting Propagation</span>
              <div className="flex items-center space-x-2">
                <div className="bg-gray-200 rounded-full h-2 w-32">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                </div>
                <span className="text-sm font-medium">92%</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span>Division</span>
              <div className="flex items-center space-x-2">
                <div className="bg-gray-200 rounded-full h-2 w-32">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '95%' }}></div>
                </div>
                <span className="text-sm font-medium">95%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Environmental Conditions</h2>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-800">Optimal Temperature Range</h3>
              <p className="text-blue-600">18°C - 24°C</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-medium text-green-800">Optimal Humidity Range</h3>
              <p className="text-green-600">65% - 80%</p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <h3 className="font-medium text-yellow-800">Average Germination Time</h3>
              <p className="text-yellow-600">7-14 days</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Monthly Performance Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">24</p>
            <p className="text-green-800">Crops Started</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">21</p>
            <p className="text-blue-800">Successfully Established</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">18</p>
            <p className="text-purple-800">Transplanted</p>
          </div>
        </div>
      </div>
    </div>
  );

  const CropDetailModal = ({ crop, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">{crop.name} - {crop.variety}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-3">Basic Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Propagation Method:</span>
                <span className="font-medium capitalize">{crop.propagationMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Current Stage:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStageColor(crop.currentStage)}`}>
                  {crop.currentStage}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Planted Date:</span>
                <span className="font-medium">{crop.plantedDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Expected Germination:</span>
                <span className="font-medium">{crop.expectedGermination}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Location:</span>
                <span className="font-medium">{crop.location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Watered:</span>
                <span className="font-medium">{crop.watered}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Environmental Conditions</h3>
            <div className="space-y-4">
              <div className="p-3 bg-red-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Thermometer className="w-4 h-4 text-red-500 mr-2" />
                    <span className="text-sm font-medium">Temperature</span>
                  </div>
                  <span className="text-lg font-bold text-red-600">{crop.temperature}°C</span>
                </div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Droplets className="w-4 h-4 text-blue-500 mr-2" />
                    <span className="text-sm font-medium">Humidity</span>
                  </div>
                  <span className="text-lg font-bold text-blue-600">{crop.humidity}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {crop.notes && (
          <div className="mt-6">
            <h3 className="font-semibold mb-3">Notes</h3>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-700">{crop.notes}</p>
            </div>
          </div>
        )}

        <div className="mt-6">
          <h3 className="font-semibold mb-3">Related Tasks</h3>
          <div className="space-y-2">
            {tasks.filter(task => task.cropId === crop.id).map(task => (
              <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTask(task.id)}
                    className="w-4 h-4 text-green-600"
                  />
                  <span className={task.completed ? 'line-through text-gray-500' : ''}>{task.task}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-xs font-medium ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                  <span className="text-xs text-gray-500">{task.dueDate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex space-x-3">
          <button className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center">
            <Edit className="w-4 h-4 mr-2" />
            Edit Crop
          </button>
          <button className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors flex items-center justify-center">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
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
              <Settings className="w-5 h-5 text-gray-600" />
            </div>
          </div>
          
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'dashboard'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('crops')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'crops'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Crop Management
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'tasks'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Task Management
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'calendar'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Calendar
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analytics'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Analytics
            </button>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'crops' && <CropManagement />}
        {activeTab === 'tasks' && <TaskManagement />}
        {activeTab === 'calendar' && <Calendar />}
        {activeTab === 'analytics' && <Analytics />}
      </div>

      {selectedCrop && (
        <CropDetailModal crop={selectedCrop} onClose={() => setSelectedCrop(null)} />
      )}
    </div>
  );
};

export default CropPropagationApp;