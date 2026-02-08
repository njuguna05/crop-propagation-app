import { render, screen } from '@testing-library/react';
import App from './App';

// Mock recharts to avoid JSDOM rendering issues
jest.mock('recharts', () => {
  const OriginalModule = jest.requireActual('recharts');
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
    BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
    LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
    PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
    AreaChart: ({ children }) => <div data-testid="area-chart">{children}</div>,
    Bar: () => null,
    Line: () => null,
    Pie: () => null,
    Area: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    Legend: () => null,
    Cell: () => null,
  };
});

// Mock zustand store
jest.mock('./stores/appStore', () => ({
  useAppStore: () => ({
    crops: [],
    tasks: [],
    orders: [],
    budwoodRecords: [],
    graftingRecords: [],
    transferRecords: [],
    employees: [],
    customers: [],
    activeTab: 'dashboard',
    selectedCrop: null,
    showNewCrop: false,
    showNewOrder: false,
    searchTerm: '',
    setActiveTab: jest.fn(),
    setSearchTerm: jest.fn(),
    setSelectedCrop: jest.fn(),
    setShowNewCrop: jest.fn(),
    setShowNewOrder: jest.fn(),
    isAuthenticated: true,
    isOnline: true,
    user: { username: 'testuser', full_name: 'Test User' },
    addCrop: jest.fn(),
    updateCrop: jest.fn(),
    deleteCrop: jest.fn(),
    addTask: jest.fn(),
    updateTask: jest.fn(),
    deleteTask: jest.fn(),
    toggleTask: jest.fn(),
    addOrder: jest.fn(),
    updateOrder: jest.fn(),
    deleteOrder: jest.fn(),
    logout: jest.fn(),
    getFilteredCrops: () => [],
    getPendingTasks: () => [],
    getTodaysTasks: () => [],
    getStageStats: () => ({
      budwoodCollection: 0, graftingOperation: 0, postGraftCare: 0,
      qualityCheck: 0, hardening: 0, preDispatch: 0,
    }),
    getDashboardStats: () => ({
      totalCrops: 0, activeTasks: 0, activeOrders: 0,
      completedOrders: 0, totalRevenue: 0, tasksDueToday: 0,
    }),
  }),
}));

test('renders the main application', () => {
  render(<App />);
  expect(document.querySelector('.min-h-screen')).toBeInTheDocument();
});
