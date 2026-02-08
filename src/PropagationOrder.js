import React, { useState, useEffect } from 'react';
import BudwoodCalculator from './components/BudwoodCalculator';
import WorkerPerformanceTracker from './components/WorkerPerformanceTracker';
import StageValidation from './components/StageValidation';
import EnhancedAnalyticsDashboard from './components/EnhancedAnalyticsDashboard';
import EmployeeSelector from './components/EmployeeSelector';
import CustomerSelect from './components/CustomerSelect';
import CustomerManagement from './components/CustomerManagement';
import SupplierManagement from './components/SupplierManagement';
import { 
  Plus, Search, Eye, Edit, Trash2, Package, ClipboardList, TreePine, 
  Beaker, QrCode, FileText, Users, DollarSign, TrendingUp, AlertCircle,
  CheckCircle, Clock, Calendar, Droplets, Thermometer, ArrowRight,
  BarChart3, Filter, Download, Upload, Scan, MapPin, Activity, Settings,
  Scissors, Sprout, Shield, Truck, Target, Move, CheckSquare
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const PropagationOrder = ({ employees = [] }) => {
  const [activeTab, setActiveTab] = useState('orders');
  
  // Farm sections configuration
  const farmSections = {
    budwood: {
      name: 'Budwood Collection',
      location: 'Mother Block A-D',
      capacity: 1000,
      current: 0,
      manager: 'John Smith',
      equipment: ['Harvesting Tools', 'Storage Containers', 'Labeling System']
    },
    grafting: {
      name: 'Grafting Station',
      location: 'Propagation House 1-3',
      capacity: 500,
      current: 0,
      manager: 'Alice Johnson',
      equipment: ['Grafting Knives', 'Parafilm', 'Rootstock Prep Area']
    },
    nursery: {
      name: 'Post-Graft Nursery',
      location: 'Greenhouse Complex A',
      capacity: 800,
      current: 0,
      manager: 'Maria Garcia',
      equipment: ['Misting System', 'Heating Mats', 'Growth Chambers']
    },
    hardening: {
      name: 'Hardening Area',
      location: 'Shade House 1-2',
      capacity: 600,
      current: 0,
      manager: 'David Chen',
      equipment: ['Shade Cloth', 'Irrigation System', 'Acclimatization Benches']
    },
    dispatch: {
      name: 'Dispatch Center',
      location: 'Loading Bay',
      capacity: 200,
      current: 0,
      manager: 'Sarah Wilson',
      equipment: ['Packaging Materials', 'Loading Equipment', 'Quality Check Station']
    }
  };

  // Propagation stages with requirements
  const propagationStages = {
    order_created: {
      name: 'Order Created',
      section: null,
      duration: 0,
      requirements: ['Order validation', 'Resource planning'],
      nextStage: 'budwood_collection'
    },
    budwood_collection: {
      name: 'Budwood Collection',
      section: 'budwood',
      duration: 2,
      requirements: ['Mother tree selection', 'Harvesting tools', 'Cold storage'],
      nextStage: 'budwood_preparation'
    },
    budwood_preparation: {
      name: 'Budwood Preparation',
      section: 'budwood',
      duration: 1,
      requirements: ['Cutting to size', 'Quality grading', 'Storage management'],
      nextStage: 'grafting_setup'
    },
    grafting_setup: {
      name: 'Grafting Setup',
      section: 'grafting',
      duration: 1,
      requirements: ['Rootstock preparation', 'Tool sterilization', 'Work area setup'],
      nextStage: 'grafting_operation'
    },
    grafting_operation: {
      name: 'Grafting Operation',
      section: 'grafting',
      duration: 1,
      requirements: ['Skilled operator', 'Environmental control', 'Quality monitoring'],
      nextStage: 'post_graft_care'
    },
    post_graft_care: {
      name: 'Post-Graft Care',
      section: 'nursery',
      duration: 14,
      requirements: ['High humidity', 'Temperature control', 'Daily monitoring'],
      nextStage: 'establishment'
    },
    establishment: {
      name: 'Establishment',
      section: 'nursery',
      duration: 21,
      requirements: ['Growth monitoring', 'Pest management', 'Nutrition program'],
      nextStage: 'quality_check'
    },
    quality_check: {
      name: 'Quality Assessment',
      section: 'nursery',
      duration: 2,
      requirements: ['Union strength test', 'Growth evaluation', 'Health inspection'],
      nextStage: 'hardening_prep'
    },
    hardening_prep: {
      name: 'Hardening Preparation',
      section: 'hardening',
      duration: 3,
      requirements: ['Environmental transition', 'Reduced protection', 'Adaptation monitoring'],
      nextStage: 'hardening_process'
    },
    hardening_process: {
      name: 'Hardening Process',
      section: 'hardening',
      duration: 14,
      requirements: ['Gradual exposure', 'Stress conditioning', 'Final sizing'],
      nextStage: 'pre_dispatch'
    },
    pre_dispatch: {
      name: 'Pre-Dispatch',
      section: 'dispatch',
      duration: 2,
      requirements: ['Final inspection', 'Packaging preparation', 'Documentation'],
      nextStage: 'dispatched'
    },
    dispatched: {
      name: 'Dispatched',
      section: null,
      duration: 0,
      requirements: ['Delivery coordination', 'Customer notification'],
      nextStage: null
    }
  };

  // Main data states
  const [orders, setOrders] = useState([]);
  const [budwoodCollection, setBudwoodCollection] = useState([]);
  const [graftingRecords, setGraftingRecords] = useState([]);
  const [transferRecords, setTransferRecords] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [showBudwoodModal, setShowBudwoodModal] = useState(false);
  const [showGraftingModal, setShowGraftingModal] = useState(false);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSection, setFilterSection] = useState('all');
  const [errors, setErrors] = useState({});

  // Form states
  const [newOrder, setNewOrder] = useState({
    customerId: '',
    clientName: '',
    contactPerson: '',
    phone: '',
    email: '',
    requestedDelivery: '',
    cropType: '',
    variety: '',
    quantity: '',
    propagationMethod: 'grafting',
    unitPrice: '',
    priority: 'medium',
    notes: [],
    budwoodCalculation: {
      requiredBudwood: 0,
      wasteFactorPercent: 15,
      extraForSafety: 0,
      totalRequired: 0
    },
    workerAssignments: {
      budwoodCollector: '',
      grafter: '',
      nurseryManager: '',
      qualityController: '',
      budwoodCollectorId: '',
      grafterId: '',
      nurseryManagerId: '',
      qualityControllerId: ''
    },
    specifications: {
      rootstockType: '',
      containerSize: '',
      heightRequirement: '',
      certifications: []
    }
  });

  const [transferData, setTransferData] = useState({
    orderId: '',
    fromSection: '',
    toSection: '',
    quantity: '',
    notes: '',
    operator: '',
    operatorId: '',
    qualityScore: ''
  });

  const [healthData, setHealthData] = useState({
    orderId: '',
    stage: '',
    lostQuantity: '',
    notes: '',
    operator: '',
    healthScore: ''
  });

  const [budwoodRecord, setBudwoodRecord] = useState({
    orderId: '',
    motherTreeId: '',
    variety: '',
    harvestDate: '',
    quantity: '',
    quality: 'A',
    operator: '',
    operatorId: '',
    storageLocation: '',
    notes: ''
  });

  const [graftingRecord, setGraftingRecord] = useState({
    orderId: '',
    budwoodId: '',
    rootstockId: '',
    operator: '',
    operatorId: '',
    technique: 'whip_and_tongue',
    date: new Date().toISOString().split('T')[0],
    environmentalConditions: {
      temperature: '',
      humidity: '',
      lightLevel: ''
    },
    qualityNotes: '',
    successRate: ''
  });

  // Initialize with sample data on mount
  useEffect(() => {
    const initialOrders = [
      {
        id: 'PO-2025-001',
        orderNumber: 'PO-2025-001',
        status: 'budwood_collection',
        currentSection: 'budwood',
        clientName: 'Green Valley Farms',
        contactPerson: 'John Smith',
        phone: '+1-555-0123',
        email: 'john@greenvalley.com',
        orderDate: '2025-08-15',
        requestedDelivery: '2025-10-15',
        totalQuantity: 500,
        completedQuantity: 125,
        currentStageQuantity: 100,
        cropType: 'Citrus',
        variety: 'Valencia Orange',
        propagationMethod: 'grafting',
        unitPrice: 12.50,
        totalValue: 6250,
        priority: 'high',
        notes: ['Premium rootstock required'],
        stageHistory: [
          { stage: 'order_created', date: '2025-08-15', quantity: 500, operator: 'System' },
          { stage: 'budwood_collection', date: '2025-08-17', quantity: 500, operator: 'John Smith' },
          { stage: 'grafting_setup', date: '2025-08-20', quantity: 450, operator: 'Alice Johnson' }
        ],
        stageValidation: {
          currentStageComplete: true,
          readyForNextStage: true,
          blockers: []
        },
        specifications: {
          rootstockType: 'Carrizo Citrange',
          containerSize: '3-gallon',
          heightRequirement: '18-24 inches',
          certifications: ['Organic', 'Disease-free']
        }
      },
      {
        id: 'PO-2025-002',
        orderNumber: 'PO-2025-002',
        status: 'grafting_operation',
        currentSection: 'grafting',
        clientName: 'Sunny Acres Nursery',
        contactPerson: 'Sarah Johnson',
        phone: '+1-555-0456',
        email: 'sarah@sunnyacres.com',
        orderDate: '2025-08-20',
        requestedDelivery: '2025-11-15',
        totalQuantity: 300,
        completedQuantity: 75,
        currentStageQuantity: 280,
        cropType: 'Citrus',
        variety: 'Navel Orange',
        propagationMethod: 'grafting',
        unitPrice: 15.00,
        totalValue: 4500,
        priority: 'medium',
        notes: ['High-quality rootstock requested'],
        stageHistory: [
          { stage: 'order_created', date: '2025-08-20', quantity: 300, operator: 'System' },
          { stage: 'budwood_collection', date: '2025-08-22', quantity: 300, operator: 'John Smith' },
          { stage: 'budwood_preparation', date: '2025-08-23', quantity: 290, operator: 'John Smith' },
          { stage: 'grafting_setup', date: '2025-08-25', quantity: 285, operator: 'Alice Johnson' },
          { stage: 'grafting_operation', date: '2025-08-26', quantity: 280, operator: 'Alice Johnson' }
        ],
        stageValidation: {
          currentStageComplete: false,
          readyForNextStage: false,
          blockers: []
        },
        specifications: {
          rootstockType: 'Trifoliate Orange',
          containerSize: '2-gallon',
          heightRequirement: '15-20 inches',
          certifications: ['Disease-free']
        }
      }
    ];
    
    setOrders(initialOrders);
    
    // Sample budwood collection data
    setBudwoodCollection([
      {
        id: 'BW-001',
        orderId: 'PO-2025-001',
        motherTreeId: 'MT-A12',
        variety: 'Valencia Orange',
        harvestDate: new Date().toISOString().split('T')[0],
        quantity: 150,
        quality: 'A',
        operator: 'John Smith',
        storageLocation: 'Cold Room 1',
        notes: 'Excellent quality budwood'
      }
    ]);
    
    // Sample grafting records
    setGraftingRecords([
      {
        id: 'GR-001',
        orderId: 'PO-2025-001',
        date: new Date().toISOString().split('T')[0],
        operator: 'Alice Johnson',
        technique: 'whip_and_tongue',
        quantity: 100,
        successRate: 87
      }
    ]);
  }, []);

  // Utility functions
  const generateOrderNumber = () => {
    const year = new Date().getFullYear();
    const orderCount = orders.length + 1;
    return `PO-${year}-${String(orderCount).padStart(3, '0')}`;
  };

  // Budwood calculation functions
  const calculateBudwoodRequired = (quantity, propagationMethod) => {
    const budwoodRatios = {
      grafting: 1.2, // 1.2 budwood pieces per plant
      cutting: 2.0,  // 2 cuttings per plant
      tissue_culture: 0.1 // 0.1 sample per plant
    };
    return Math.ceil(quantity * (budwoodRatios[propagationMethod] || 1.2));
  };

  const calculateTotalBudwoodWithWaste = (quantity, propagationMethod, wastePercent) => {
    const required = calculateBudwoodRequired(quantity, propagationMethod);
    const wasteFactor = 1 + (wastePercent / 100);
    return Math.ceil(required * wasteFactor);
  };

  // Stage validation functions
  const validateStageCompletion = (stage, quantity) => {
    const stageRequirements = propagationStages[stage];
    const blockers = [];

    if (quantity <= 0) {
      blockers.push('No plants available for this stage');
    }

    if (!stageRequirements) {
      blockers.push('Invalid stage configuration');
    }

    return {
      currentStageComplete: blockers.length === 0,
      readyForNextStage: blockers.length === 0 && quantity > 0,
      blockers
    };
  };

  // Worker performance calculation
  const calculateEfficiencyRating = (stage, operatorName) => {
    const operatorRecords = graftingRecords.filter(r => r.operator === operatorName);
    if (operatorRecords.length === 0) return 0;

    const avgSuccessRate = operatorRecords.reduce((acc, curr) => acc + curr.successRate, 0) / operatorRecords.length;
    return Math.round(avgSuccessRate);
  };

  const getStageColor = (stage) => {
    const colors = {
      order_created: 'bg-gray-100 text-gray-800',
      budwood_collection: 'bg-blue-100 text-blue-800',
      budwood_preparation: 'bg-blue-100 text-blue-800',
      grafting_setup: 'bg-orange-100 text-orange-800',
      grafting_operation: 'bg-orange-100 text-orange-800',
      post_graft_care: 'bg-yellow-100 text-yellow-800',
      establishment: 'bg-green-100 text-green-800',
      quality_check: 'bg-purple-100 text-purple-800',
      hardening_prep: 'bg-indigo-100 text-indigo-800',
      hardening_process: 'bg-indigo-100 text-indigo-800',
      pre_dispatch: 'bg-pink-100 text-pink-800',
      dispatched: 'bg-green-100 text-green-800'
    };
    return colors[stage] || 'bg-gray-100 text-gray-800';
  };

  const getSectionIcon = (section) => {
    const icons = {
      budwood: Scissors,
      grafting: Beaker,
      nursery: Sprout,
      hardening: Shield,
      dispatch: Truck
    };
    return icons[section] || Package;
  };

  const calculateDaysInStage = (stageHistory, currentStage) => {
    const stageEntry = stageHistory.find(h => h.stage === currentStage);
    if (!stageEntry) return 0;
    
    const stageDate = new Date(stageEntry.date);
    const today = new Date();
    return Math.floor((today - stageDate) / (1000 * 60 * 60 * 24));
  };

  const calculateExpectedCompletion = (order) => {
    const currentStage = propagationStages[order.status];
    const startDate = new Date(order.orderDate);
    let totalDays = 0;
    
    for (const [stageKey, stage] of Object.entries(propagationStages)) {
      totalDays += stage.duration;
      if (stageKey === order.status) break;
    }
    
    const expectedDate = new Date(startDate);
    expectedDate.setDate(expectedDate.getDate() + totalDays);
    return expectedDate.toISOString().split('T')[0];
  };

  const createOrder = () => {
    const validationErrors = validateOrder(newOrder);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const order = {
      id: generateOrderNumber(),
      orderNumber: generateOrderNumber(),
      status: 'order_created',
      currentSection: null,
      ...newOrder,
      orderDate: new Date().toISOString().split('T')[0],
      totalQuantity: parseInt(newOrder.quantity),
      totalValue: parseFloat(newOrder.quantity) * parseFloat(newOrder.unitPrice || 0),
      completedQuantity: 0,
      currentStageQuantity: parseInt(newOrder.quantity),
      budwoodCalculation: {
        ...newOrder.budwoodCalculation,
        requiredBudwood: calculateBudwoodRequired(parseInt(newOrder.quantity), newOrder.propagationMethod),
        totalRequired: calculateTotalBudwoodWithWaste(parseInt(newOrder.quantity), newOrder.propagationMethod, newOrder.budwoodCalculation.wasteFactorPercent)
      },
      workerAssignments: newOrder.workerAssignments,
      stageValidation: {
        currentStageComplete: false,
        readyForNextStage: false,
        blockers: []
      },
      stageHistory: [{
        stage: 'order_created',
        date: new Date().toISOString().split('T')[0],
        quantity: parseInt(newOrder.quantity),
        operator: 'System',
        workerPerformance: null
      }]
    };

    setOrders([...orders, order]);
    resetNewOrderForm();
    setShowNewOrder(false);
    setErrors({});
  };

  const processTransfer = () => {
    if (!transferData.orderId || !transferData.toSection) {
      alert('Please fill in all required fields');
      return;
    }

    const order = orders.find(o => o.id === transferData.orderId);
    if (!order) return;

    const nextStage = propagationStages[order.status].nextStage;
    const nextSection = propagationStages[nextStage]?.section;

    const transferRecord = {
      id: `TR-${Date.now()}`,
      orderId: transferData.orderId,
      fromSection: transferData.fromSection,
      toSection: transferData.toSection,
      fromStage: order.status,
      toStage: nextStage,
      quantity: parseInt(transferData.quantity),
      transferDate: new Date().toISOString().split('T')[0],
      operator: transferData.operator,
      qualityScore: parseFloat(transferData.qualityScore),
      notes: transferData.notes
    };

    // Update order status and section
    const updatedOrders = orders.map(o => {
      if (o.id === transferData.orderId) {
        return {
          ...o,
          status: nextStage,
          currentSection: nextSection,
          currentStageQuantity: parseInt(transferData.quantity),
          stageHistory: [...o.stageHistory, {
            stage: nextStage,
            date: new Date().toISOString().split('T')[0],
            quantity: parseInt(transferData.quantity),
            operator: transferData.operator,
            notes: transferData.notes,
            workerPerformance: {
              timeInStage: calculateDaysInStage(o.stageHistory, o.status),
              qualityScore: parseFloat(transferData.qualityScore),
              efficiencyRating: calculateEfficiencyRating(o.status, transferData.operator)
            }
          }],
          stageValidation: validateStageCompletion(nextStage, parseInt(transferData.quantity))
        };
      }
      return o;
    });

    setOrders(updatedOrders);
    setTransferRecords([...transferRecords, transferRecord]);
    setTransferData({
      orderId: '',
      fromSection: '',
      toSection: '',
      quantity: '',
      notes: '',
      operator: '',
      operatorId: '',
      qualityScore: ''
    });
    setShowTransferModal(false);
  };
  
  const processHealthAssessment = () => {
    if (!healthData.orderId || !healthData.lostQuantity) {
      alert('Please fill in all required fields');
      return;
    }

    const order = orders.find(o => o.id === healthData.orderId);
    if (!order) return;

    const lostQty = parseInt(healthData.lostQuantity);
    const newQty = order.currentStageQuantity - lostQty;

    const updatedOrders = orders.map(o => {
      if (o.id === healthData.orderId) {
        return {
          ...o,
          currentStageQuantity: newQty > 0 ? newQty : 0,
          notes: [...(o.notes || []), { type: 'health_assessment', date: new Date().toISOString().split('T')[0], lost: lostQty, notes: healthData.notes }]
        };
      }
      return o;
    });

    setOrders(updatedOrders);
    setHealthData({
      orderId: '',
      stage: '',
      lostQuantity: '',
      notes: '',
      operator: '',
      healthScore: ''
    });
    setShowHealthModal(false);
  };

  const processBudwoodCollection = () => {
    const newRecord = {
      ...budwoodRecord,
      id: `BW-${Date.now()}`,
      harvestDate: budwoodRecord.harvestDate || new Date().toISOString().split('T')[0]
    };
    
    setBudwoodCollection([...budwoodCollection, newRecord]);
    setBudwoodRecord({
      orderId: '',
      motherTreeId: '',
      variety: '',
      harvestDate: '',
      quantity: '',
      quality: 'A',
      operator: '',
      operatorId: '',
      storageLocation: '',
      notes: ''
    });
    setShowBudwoodModal(false);
  };

  const processGraftingRecord = () => {
    const newRecord = {
      ...graftingRecord,
      id: `GR-${Date.now()}`,
      quantity: parseInt(graftingRecord.quantity || 0),
      successRate: parseFloat(graftingRecord.successRate || 0)
    };
    
    setGraftingRecords([...graftingRecords, newRecord]);
    setGraftingRecord({
      orderId: '',
      budwoodId: '',
      rootstockId: '',
      operator: '',
      operatorId: '',
      technique: 'whip_and_tongue',
      date: new Date().toISOString().split('T')[0],
      environmentalConditions: {
        temperature: '',
        humidity: '',
        lightLevel: ''
      },
      qualityNotes: '',
      successRate: ''
    });
    setShowGraftingModal(false);
  };

  const validateOrder = (order) => {
    const errors = {};
    if (!order.clientName.trim()) errors.clientName = 'Client name is required';
    if (!order.cropType.trim()) errors.cropType = 'Crop type is required';
    if (!order.variety.trim()) errors.variety = 'Variety is required';
    if (!order.quantity || isNaN(order.quantity) || order.quantity <= 0) errors.quantity = 'Valid quantity is required';
    if (!order.requestedDelivery) errors.requestedDelivery = 'Delivery date is required';
    if (order.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(order.email)) errors.email = 'Invalid email format';
    return errors;
  };

  const resetNewOrderForm = () => {
    setNewOrder({
      customerId: '',
      clientName: '',
      contactPerson: '',
      phone: '',
      email: '',
      requestedDelivery: '',
      cropType: '',
      variety: '',
      quantity: '',
      propagationMethod: 'grafting',
      unitPrice: '',
      priority: 'medium',
      notes: '',
      budwoodCalculation: {
        requiredBudwood: 0,
        wasteFactorPercent: 15,
        extraForSafety: 0,
        totalRequired: 0
      },
      workerAssignments: {
        budwoodCollector: '',
        grafter: '',
        nurseryManager: '',
        qualityController: '',
        budwoodCollectorId: '',
        grafterId: '',
        nurseryManagerId: '',
        qualityControllerId: ''
      },
      specifications: {
        rootstockType: '',
        containerSize: '',
        heightRequirement: '',
        certifications: []
      }
    });
  };

  // Handle customer selection
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
    } else {
      setNewOrder({
        ...newOrder,
        customerId: '',
        clientName: '',
        contactPerson: '',
        phone: '',
        email: ''
      });
    }
  };

  // Handle new customer creation
  const handleCreateNewCustomer = () => {
    setShowNewCustomer(true);
  };

  // Handle budwood calculation updates
  const handleBudwoodCalculationUpdate = (calculationData) => {
    setNewOrder({
      ...newOrder,
      budwoodCalculation: calculationData
    });
  };

  // Handle blocker resolution
  const handleResolveBlocker = (order, blocker) => {
    const updatedOrders = orders.map(o => {
      if (o.id === order.id) {
        const currentValidation = o.stageValidation || { blockers: [], currentStageComplete: false, readyForNextStage: false };
        const updatedValidation = {
          ...currentValidation,
          blockers: currentValidation.blockers.filter(b => b !== blocker),
          currentStageComplete: true,
          readyForNextStage: true
        };

        return {
          ...o,
          stageValidation: updatedValidation,
          notes: [...(o.notes || []), {
            type: 'blocker_resolved',
            date: new Date().toISOString().split('T')[0],
            message: `Resolved: ${blocker.message}`,
            resolvedBy: 'Current User' // In real app, use actual user
          }]
        };
      }
      return o;
    });

    setOrders(updatedOrders);
  };

  const getReadinessScore = (order) => {
    // A simple readiness score based on stage progress and quantity loss
    const totalStages = Object.keys(propagationStages).length;
    const completedStages = order.stageHistory.length;
    const progressFactor = (completedStages / totalStages) * 100;
    
    const quantityFactor = (order.currentStageQuantity / order.totalQuantity) * 100;
    
    // Simple average, can be weighted
    const readiness = (progressFactor * 0.7 + quantityFactor * 0.3);
    return Math.min(100, readiness).toFixed(1);
  };
  
  // Views for different stages
  const OrdersView = () => {
    const filteredOrders = orders.filter(order => {
      const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           order.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           order.variety.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
      const matchesSection = filterSection === 'all' || order.currentSection === filterSection;
      return matchesSearch && matchesStatus && matchesSection;
    });

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Stages</option>
              {Object.entries(propagationStages).map(([key, stage]) => (
                <option key={key} value={key}>{stage.name}</option>
              ))}
            </select>
            <select
              value={filterSection}
              onChange={(e) => setFilterSection(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Sections</option>
              {Object.entries(farmSections).map(([key, section]) => (
                <option key={key} value={key}>{section.name}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setShowNewOrder(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Order
          </button>
        </div>

        {/* Farm Sections Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          {Object.entries(farmSections).map(([key, section]) => {
            const ordersInSection = orders.filter(order => order.currentSection === key).length;
            const SectionIcon = getSectionIcon(key);
            
            return (
              <div key={key} className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <SectionIcon className="w-6 h-6 text-blue-600" />
                  <span className="text-sm text-gray-600">{ordersInSection}/{section.capacity}</span>
                </div>
                <h3 className="font-medium text-gray-900 text-sm">{section.name}</h3>
                <p className="text-xs text-gray-600">{section.location}</p>
                <p className="text-xs text-gray-500 mt-1">Manager: {section.manager}</p>
                <div className="mt-2">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${Math.min((ordersInSection / section.capacity) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredOrders.map(order => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      </div>
    );
  };

  const OrderCard = ({ order }) => {
    const currentStage = propagationStages[order.status];
    const daysInStage = calculateDaysInStage(order.stageHistory, order.status);
    const expectedDuration = currentStage.duration;
    const isOverdue = daysInStage > expectedDuration;
    const SectionIcon = order.currentSection ? getSectionIcon(order.currentSection) : Package;

    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{order.orderNumber}</h3>
            <p className="text-gray-600">{order.clientName}</p>
            <p className="text-sm text-gray-500">{order.variety}</p>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStageColor(order.status)}`}>
              {currentStage.name}
            </span>
            {order.currentSection && (
              <div className="flex items-center text-sm text-gray-600">
                <SectionIcon className="w-4 h-4 mr-1" />
                {farmSections[order.currentSection].name}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div>
            <span className="text-gray-600">Quantity:</span>
            <span className="font-medium ml-2">{order.currentStageQuantity}/{order.totalQuantity}</span>
          </div>
          <div>
            <span className="text-gray-600">Days in Stage:</span>
            <span className={`font-medium ml-2 ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
              {daysInStage}/{expectedDuration} days
              {isOverdue && <AlertCircle className="w-4 h-4 inline ml-1" />}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Expected:</span>
            <span className="font-medium ml-2">{calculateExpectedCompletion(order)}</span>
          </div>
          <div>
            <span className="text-gray-600">Priority:</span>
            <span className={`font-medium ml-2 ${order.priority === 'high' ? 'text-red-600' : order.priority === 'medium' ? 'text-yellow-600' : 'text-green-600'}`}>
              {order.priority}
            </span>
          </div>
          {order.status === 'pre_dispatch' && (
            <div className="col-span-2">
              <span className="text-gray-600">Readiness Score:</span>
              <span className="font-medium ml-2">{getReadinessScore(order)}%</span>
            </div>
          )}
        </div>

        {/* Stage Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Overall Progress</span>
            <span>{Math.round((order.stageHistory.length / Object.keys(propagationStages).length) * 100)}%</span>
          </div>
          <div className="bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(order.stageHistory.length / Object.keys(propagationStages).length) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedOrder(order)}
            className="flex-1 min-w-[120px] bg-blue-600 text-white py-2 px-3 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center text-sm"
          >
            <Eye className="w-4 h-4 mr-1" />
            View Details
          </button>

          {/* Record Budwood Collection - Show during budwood stages */}
          {(order.status === 'budwood_collection' || order.status === 'budwood_preparation') && (
            <button
              onClick={() => {
                setBudwoodRecord({
                  orderId: order.id,
                  motherTreeId: '',
                  variety: order.variety || '',
                  harvestDate: new Date().toISOString().split('T')[0],
                  quantity: '',
                  quality: 'A',
                  operator: '',
                  operatorId: '',
                  storageLocation: '',
                  notes: ''
                });
                setShowBudwoodModal(true);
              }}
              className="bg-purple-600 text-white py-2 px-3 rounded-md hover:bg-purple-700 transition-colors flex items-center justify-center text-sm"
            >
              <Scissors className="w-4 h-4 mr-1" />
              Record Budwood
            </button>
          )}

          {/* Record Grafting - Show during grafting operation stage */}
          {order.status === 'grafting_operation' && (
            <button
              onClick={() => {
                setGraftingRecord({
                  orderId: order.id,
                  budwoodId: '',
                  rootstockId: '',
                  operator: '',
                  operatorId: '',
                  technique: 'whip_and_tongue',
                  date: new Date().toISOString().split('T')[0],
                  environmentalConditions: {
                    temperature: '',
                    humidity: '',
                    lightLevel: ''
                  },
                  qualityNotes: '',
                  successRate: ''
                });
                setShowGraftingModal(true);
              }}
              className="bg-orange-600 text-white py-2 px-3 rounded-md hover:bg-orange-700 transition-colors flex items-center justify-center text-sm"
            >
              <Beaker className="w-4 h-4 mr-1" />
              Record Grafting
            </button>
          )}

          {/* Health Assessment */}
          {(order.status === 'quality_check' || order.status === 'hardening_process') && (
            <button
              onClick={() => {
                setHealthData({
                  orderId: order.id,
                  stage: order.status,
                  lostQuantity: '',
                  notes: '',
                  operator: '',
                  healthScore: ''
                });
                setShowHealthModal(true);
              }}
              className="bg-red-600 text-white py-2 px-3 rounded-md hover:bg-red-700 transition-colors flex items-center justify-center text-sm"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Assess Health
            </button>
          )}

          {/* Transfer to Next Stage */}
          {currentStage.nextStage && (
            <button
              onClick={() => {
                setTransferData({
                  orderId: order.id,
                  fromSection: order.currentSection,
                  toSection: propagationStages[currentStage.nextStage]?.section || '',
                  quantity: order.currentStageQuantity.toString(),
                  notes: '',
                  operator: '',
                  operatorId: '',
                  qualityScore: ''
                });
                setShowTransferModal(true);
              }}
              className="bg-green-600 text-white py-2 px-3 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center text-sm"
            >
              <Move className="w-4 h-4 mr-1" />
              Transfer
            </button>
          )}
        </div>
      </div>
    );
  };

  const BudwoodTrackingView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Budwood Collection & Tracking</h2>
        <button
          onClick={() => setShowBudwoodModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
        >
          <Scissors className="w-4 h-4 mr-2" />
          Record Collection
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today's Collections</p>
              <p className="text-2xl font-bold text-gray-900">{budwoodCollection.filter(b => b.harvestDate === new Date().toISOString().split('T')[0]).length}</p>
            </div>
            <Scissors className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Quality A Grade</p>
              <p className="text-2xl font-bold text-gray-900">{budwoodCollection.filter(b => b.quality === 'A').length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Budwood Collected</p>
              <p className="text-2xl font-bold text-gray-900">{budwoodCollection.reduce((acc, curr) => acc + curr.quantity, 0)}</p>
            </div>
            <ClipboardList className="w-8 h-8 text-gray-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h3 className="font-semibold text-lg text-gray-900 mb-4">Recent Collections</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mother Tree</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variety</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quality</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operator</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {budwoodCollection.map(record => (
                <tr key={record.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{record.orderId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.motherTreeId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.variety}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.quality}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.harvestDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.operator}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const GraftingRecordsView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Grafting Records</h2>
        <button
          onClick={() => setShowGraftingModal(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center"
        >
          <Beaker className="w-4 h-4 mr-2" />
          Record Grafting
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <p className="text-sm font-medium text-gray-600">Average Success Rate</p>
          <p className="text-2xl font-bold text-gray-900">{graftingRecords.length > 0 ? (graftingRecords.reduce((acc, curr) => acc + curr.successRate, 0) / graftingRecords.length).toFixed(1) : 'N/A'}%</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <p className="text-sm font-medium text-gray-600">Total Grafted Plants</p>
          <p className="text-2xl font-bold text-gray-900">{graftingRecords.reduce((acc, curr) => acc + curr.quantity, 0)}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h3 className="font-semibold text-lg text-gray-900 mb-4">Grafting Success Rate Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={graftingRecords}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="successRate" stroke="#82ca9d" name="Success Rate (%)" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h3 className="font-semibold text-lg text-gray-900 mb-4">Recent Grafting Records</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Success Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Technique</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operator</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {graftingRecords.map(record => (
                <tr key={record.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{record.orderId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.successRate}%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.technique}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.operator}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const TeamPerformanceView = () => {
    return (
      <div className="space-y-6">
        <WorkerPerformanceTracker
          graftingRecords={graftingRecords}
          transferRecords={transferRecords}
          orders={orders}
        />
      </div>
    );
  };

  const DashboardView = () => {
    return (
      <div className="space-y-6">
        <EnhancedAnalyticsDashboard
          orders={orders}
          graftingRecords={graftingRecords}
          budwoodCollection={budwoodCollection}
          transferRecords={transferRecords}
          propagationStages={propagationStages}
        />
      </div>
    );
  };
  
  // Modals for forms
  const NewOrderModal = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center">
      <div className="relative bg-white p-8 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-bold mb-4">Create New Propagation Order</h3>
        <form onSubmit={(e) => { e.preventDefault(); createOrder(); }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="md:col-span-2 lg:col-span-3">
            <CustomerSelect
              selectedCustomerId={newOrder.customerId}
              onCustomerSelect={handleCustomerSelect}
              onCreateNew={handleCreateNewCustomer}
              label="Customer"
              placeholder="Search and select customer..."
              required={true}
            />
            {errors.clientName && <p className="mt-1 text-xs text-red-500">{errors.clientName}</p>}
          </div>

          {/* Customer details display (read-only when customer is selected) */}
          {newOrder.customerId && (
            <div className="md:col-span-2 lg:col-span-3 p-4 bg-gray-50 rounded-md">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Customer Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Company:</span>
                  <p className="text-gray-900">{newOrder.clientName}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Contact:</span>
                  <p className="text-gray-900">{newOrder.contactPerson}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Phone:</span>
                  <p className="text-gray-900">{newOrder.phone || 'N/A'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Email:</span>
                  <p className="text-gray-900">{newOrder.email || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Manual customer info fields (when no customer is selected) */}
          {!newOrder.customerId && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">Company Name</label>
                <input type="text" value={newOrder.clientName} onChange={(e) => setNewOrder({ ...newOrder, clientName: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="Enter company name manually" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Contact Person</label>
                <input type="text" value={newOrder.contactPerson} onChange={(e) => setNewOrder({ ...newOrder, contactPerson: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="Enter contact person" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input type="tel" value={newOrder.phone} onChange={(e) => setNewOrder({ ...newOrder, phone: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="Enter phone number" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" value={newOrder.email} onChange={(e) => setNewOrder({ ...newOrder, email: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="Enter email address" />
                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700">Requested Delivery Date</label>
            <input type="date" value={newOrder.requestedDelivery} onChange={(e) => setNewOrder({ ...newOrder, requestedDelivery: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
            {errors.requestedDelivery && <p className="mt-1 text-xs text-red-500">{errors.requestedDelivery}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Crop Type</label>
            <input type="text" value={newOrder.cropType} onChange={(e) => setNewOrder({ ...newOrder, cropType: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
            {errors.cropType && <p className="mt-1 text-xs text-red-500">{errors.cropType}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Variety</label>
            <input type="text" value={newOrder.variety} onChange={(e) => setNewOrder({ ...newOrder, variety: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
            {errors.variety && <p className="mt-1 text-xs text-red-500">{errors.variety}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Quantity</label>
            <input type="number" value={newOrder.quantity} onChange={(e) => setNewOrder({ ...newOrder, quantity: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
            {errors.quantity && <p className="mt-1 text-xs text-red-500">{errors.quantity}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Propagation Method</label>
            <select value={newOrder.propagationMethod} onChange={(e) => setNewOrder({ ...newOrder, propagationMethod: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
              <option value="grafting">Grafting</option>
              <option value="cutting">Cutting</option>
              <option value="tissue_culture">Tissue Culture</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Unit Price ($)</label>
            <input type="number" step="0.01" value={newOrder.unitPrice} onChange={(e) => setNewOrder({ ...newOrder, unitPrice: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea value={newOrder.notes} onChange={(e) => setNewOrder({ ...newOrder, notes: e.target.value })} rows="3" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
          </div>

          {/* Budwood Calculator */}
          <div className="md:col-span-2 lg:col-span-3">
            <BudwoodCalculator
              quantity={parseInt(newOrder.quantity) || 0}
              propagationMethod={newOrder.propagationMethod}
              onCalculationUpdate={handleBudwoodCalculationUpdate}
              existingCalculation={newOrder.budwoodCalculation}
            />
          </div>

          {/* Worker Assignments */}
          <div className="md:col-span-2 lg:col-span-3">
            <h4 className="text-lg font-medium text-gray-900 mb-3">Worker Assignments</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <EmployeeSelector
                employees={employees}
                requiredSkillset="budwood_collection"
                selectedEmployeeId={newOrder.workerAssignments.budwoodCollectorId}
                onEmployeeSelect={(employeeId) => setNewOrder({
                  ...newOrder,
                  workerAssignments: {
                    ...newOrder.workerAssignments,
                    budwoodCollectorId: employeeId,
                    budwoodCollector: employees.find(emp => emp.id === employeeId)?.fullName || ''
                  }
                })}
                label="Budwood Collector"
                placeholder="Select budwood collector..."
              />
              <EmployeeSelector
                employees={employees}
                requiredSkillset="grafting"
                selectedEmployeeId={newOrder.workerAssignments.grafterId}
                onEmployeeSelect={(employeeId) => setNewOrder({
                  ...newOrder,
                  workerAssignments: {
                    ...newOrder.workerAssignments,
                    grafterId: employeeId,
                    grafter: employees.find(emp => emp.id === employeeId)?.fullName || ''
                  }
                })}
                label="Grafter"
                placeholder="Select grafter..."
              />
              <EmployeeSelector
                employees={employees}
                requiredSkillset="nursery_management"
                selectedEmployeeId={newOrder.workerAssignments.nurseryManagerId}
                onEmployeeSelect={(employeeId) => setNewOrder({
                  ...newOrder,
                  workerAssignments: {
                    ...newOrder.workerAssignments,
                    nurseryManagerId: employeeId,
                    nurseryManager: employees.find(emp => emp.id === employeeId)?.fullName || ''
                  }
                })}
                label="Nursery Manager"
                placeholder="Select nursery manager..."
              />
              <EmployeeSelector
                employees={employees}
                requiredSkillset="quality_control"
                selectedEmployeeId={newOrder.workerAssignments.qualityControllerId}
                onEmployeeSelect={(employeeId) => setNewOrder({
                  ...newOrder,
                  workerAssignments: {
                    ...newOrder.workerAssignments,
                    qualityControllerId: employeeId,
                    qualityController: employees.find(emp => emp.id === employeeId)?.fullName || ''
                  }
                })}
                label="Quality Controller"
                placeholder="Select quality controller..."
              />
            </div>
          </div>

          <div className="md:col-span-2 lg:col-span-3 flex justify-end space-x-4 mt-4">
            <button type="button" onClick={() => setShowNewOrder(false)} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300">Cancel</button>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Create Order</button>
          </div>
        </form>
      </div>
    </div>
  );

  const TransferModal = () => {
    const order = orders.find(o => o.id === transferData.orderId);
    if (!order) return null;

    const currentStage = propagationStages[order.status];
    const nextStage = propagationStages[currentStage.nextStage];

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center">
        <div className="relative bg-white p-8 rounded-lg shadow-xl w-full max-w-lg">
          <h3 className="text-2xl font-bold mb-4">Transfer Plants</h3>
          <p className="mb-4 text-gray-600">Order: <span className="font-semibold">{order.orderNumber}</span> - {order.variety}</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">From Stage</label>
              <p className="mt-1 font-semibold text-gray-900">{currentStage.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">To Stage</label>
              <p className="mt-1 font-semibold text-green-600">{nextStage?.name || 'End of Process'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Quantity to Transfer</label>
              <input
                type="number"
                value={transferData.quantity}
                onChange={(e) => setTransferData({ ...transferData, quantity: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>
            <div>
              <EmployeeSelector
                employees={employees}
                selectedEmployeeId={transferData.operatorId}
                onEmployeeSelect={(employeeId) => setTransferData({
                  ...transferData,
                  operatorId: employeeId,
                  operator: employees.find(emp => emp.id === employeeId)?.fullName || ''
                })}
                label="Operator"
                placeholder="Select operator..."
                showSkillMatch={false}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Quality Score (1-100)</label>
              <input
                type="number"
                value={transferData.qualityScore}
                onChange={(e) => setTransferData({ ...transferData, qualityScore: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              <textarea
                value={transferData.notes}
                onChange={(e) => setTransferData({ ...transferData, notes: e.target.value })}
                rows="3"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-4 mt-6">
            <button onClick={() => setShowTransferModal(false)} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300">Cancel</button>
            <button onClick={processTransfer} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">Confirm Transfer</button>
          </div>
        </div>
      </div>
    );
  };
  
  const HealthModal = () => {
    const order = orders.find(o => o.id === healthData.orderId);
    if (!order) return null;

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center">
        <div className="relative bg-white p-8 rounded-lg shadow-xl w-full max-w-lg">
          <h3 className="text-2xl font-bold mb-4">Record Health & Losses</h3>
          <p className="mb-4 text-gray-600">Order: <span className="font-semibold">{order.orderNumber}</span> - {order.variety}</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Current Stage</label>
              <p className="mt-1 font-semibold text-gray-900">{propagationStages[order.status]?.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Quantity to Remove (Dead/Damaged)</label>
              <input
                type="number"
                value={healthData.lostQuantity}
                onChange={(e) => setHealthData({ ...healthData, lostQuantity: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Health Score (1-100)</label>
              <input
                type="number"
                value={healthData.healthScore}
                onChange={(e) => setHealthData({ ...healthData, healthScore: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Notes (e.g., Pest, disease, etc.)</label>
              <textarea
                value={healthData.notes}
                onChange={(e) => setHealthData({ ...healthData, notes: e.target.value })}
                rows="3"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-4 mt-6">
            <button onClick={() => setShowHealthModal(false)} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300">Cancel</button>
            <button onClick={processHealthAssessment} className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700">Submit</button>
          </div>
        </div>
      </div>
    );
  };

  const BudwoodModal = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center">
      <div className="relative bg-white p-8 rounded-lg shadow-xl w-full max-w-lg">
        <h3 className="text-2xl font-bold mb-4">Record Budwood Collection</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Associated Order ID</label>
            <input type="text" value={budwoodRecord.orderId} onChange={(e) => setBudwoodRecord({ ...budwoodRecord, orderId: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Mother Tree ID</label>
            <input type="text" value={budwoodRecord.motherTreeId} onChange={(e) => setBudwoodRecord({ ...budwoodRecord, motherTreeId: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Variety</label>
            <input type="text" value={budwoodRecord.variety} onChange={(e) => setBudwoodRecord({ ...budwoodRecord, variety: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Quantity (units)</label>
            <input type="number" value={budwoodRecord.quantity} onChange={(e) => setBudwoodRecord({ ...budwoodRecord, quantity: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Quality</label>
            <select value={budwoodRecord.quality} onChange={(e) => setBudwoodRecord({ ...budwoodRecord, quality: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
              <option value="A">A - Excellent</option>
              <option value="B">B - Good</option>
              <option value="C">C - Fair</option>
            </select>
          </div>
          <div>
            <EmployeeSelector
              employees={employees}
              requiredSkillset="budwood_collection"
              selectedEmployeeId={budwoodRecord.operatorId}
              onEmployeeSelect={(employeeId) => setBudwoodRecord({
                ...budwoodRecord,
                operatorId: employeeId,
                operator: employees.find(emp => emp.id === employeeId)?.fullName || ''
              })}
              label="Operator"
              placeholder="Select operator..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Storage Location</label>
            <input type="text" value={budwoodRecord.storageLocation} onChange={(e) => setBudwoodRecord({ ...budwoodRecord, storageLocation: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea value={budwoodRecord.notes} onChange={(e) => setBudwoodRecord({ ...budwoodRecord, notes: e.target.value })} rows="3" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
          </div>
        </div>
        <div className="flex justify-end space-x-4 mt-6">
          <button onClick={() => setShowBudwoodModal(false)} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300">Cancel</button>
          <button onClick={processBudwoodCollection} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Record</button>
        </div>
      </div>
    </div>
  );

  const GraftingModal = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center">
      <div className="relative bg-white p-8 rounded-lg shadow-xl w-full max-w-lg">
        <h3 className="text-2xl font-bold mb-4">Record Grafting Operation</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Associated Order ID</label>
            <input type="text" value={graftingRecord.orderId} onChange={(e) => setGraftingRecord({ ...graftingRecord, orderId: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Quantity Grafted</label>
            <input type="number" value={graftingRecord.quantity} onChange={(e) => setGraftingRecord({ ...graftingRecord, quantity: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Success Rate (%)</label>
            <input type="number" value={graftingRecord.successRate} onChange={(e) => setGraftingRecord({ ...graftingRecord, successRate: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
          </div>
          <div>
            <EmployeeSelector
              employees={employees}
              requiredSkillset="grafting"
              selectedEmployeeId={graftingRecord.operatorId}
              onEmployeeSelect={(employeeId) => setGraftingRecord({
                ...graftingRecord,
                operatorId: employeeId,
                operator: employees.find(emp => emp.id === employeeId)?.fullName || ''
              })}
              label="Operator"
              placeholder="Select operator..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Technique</label>
            <select value={graftingRecord.technique} onChange={(e) => setGraftingRecord({ ...graftingRecord, technique: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
              <option value="whip_and_tongue">Whip and Tongue</option>
              <option value="T_budding">T-Budding</option>
              <option value="splice">Splice Grafting</option>
            </select>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Temp (°C)</label>
              <input type="number" value={graftingRecord.environmentalConditions.temperature} onChange={(e) => setGraftingRecord({ ...graftingRecord, environmentalConditions: { ...graftingRecord.environmentalConditions, temperature: e.target.value } })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Humidity (%)</label>
              <input type="number" value={graftingRecord.environmentalConditions.humidity} onChange={(e) => setGraftingRecord({ ...graftingRecord, environmentalConditions: { ...graftingRecord.environmentalConditions, humidity: e.target.value } })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Light (lux)</label>
              <input type="number" value={graftingRecord.environmentalConditions.lightLevel} onChange={(e) => setGraftingRecord({ ...graftingRecord, environmentalConditions: { ...graftingRecord.environmentalConditions, lightLevel: e.target.value } })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Quality Notes</label>
            <textarea value={graftingRecord.qualityNotes} onChange={(e) => setGraftingRecord({ ...graftingRecord, qualityNotes: e.target.value })} rows="3" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
          </div>
        </div>
        <div className="flex justify-end space-x-4 mt-6">
          <button onClick={() => setShowGraftingModal(false)} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300">Cancel</button>
          <button onClick={processGraftingRecord} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">Record</button>
        </div>
      </div>
    </div>
  );

  const OrderDetailModal = ({ order, onClose }) => {
    if (!order) return null;

    const currentStage = propagationStages[order.status];

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center">
        <div className="relative bg-white p-8 rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
          <h3 className="text-2xl font-bold mb-2">Order Details: {order.orderNumber}</h3>
          <p className="text-gray-600 mb-6">{order.clientName} - {order.variety}</p>

          {/* Stage Validation */}
          <div className="mb-6">
            <StageValidation
              order={order}
              propagationStages={propagationStages}
              onResolveBlocker={(blocker) => handleResolveBlocker(order, blocker)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-lg mb-2">General Information</h4>
              <div className="space-y-2 text-sm text-gray-700">
                <p><strong>Status:</strong> <span className={`font-medium ${getStageColor(order.status)} px-2 py-1 rounded`}>{currentStage.name}</span></p>
                <p><strong>Current Section:</strong> {order.currentSection ? farmSections[order.currentSection].name : 'N/A'}</p>
                <p><strong>Quantity:</strong> {order.currentStageQuantity} / {order.totalQuantity}</p>
                <p><strong>Order Date:</strong> {order.orderDate}</p>
                <p><strong>Delivery Request:</strong> {order.requestedDelivery}</p>
                <p><strong>Propagation Method:</strong> {order.propagationMethod}</p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Specifications</h4>
              <div className="space-y-2 text-sm text-gray-700">
                <p><strong>Rootstock Type:</strong> {order.specifications.rootstockType || 'N/A'}</p>
                <p><strong>Container Size:</strong> {order.specifications.containerSize || 'N/A'}</p>
                <p><strong>Height Requirement:</strong> {order.specifications.heightRequirement || 'N/A'}</p>
                <p><strong>Certifications:</strong> {order.specifications.certifications.length > 0 ? order.specifications.certifications.join(', ') : 'N/A'}</p>
              </div>
            </div>

            {/* Worker Assignments */}
            {order.workerAssignments && (
              <div>
                <h4 className="font-semibold text-lg mb-2">Worker Assignments</h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <p><strong>Budwood Collector:</strong> {order.workerAssignments.budwoodCollector || 'Not assigned'}</p>
                  <p><strong>Grafter:</strong> {order.workerAssignments.grafter || 'Not assigned'}</p>
                  <p><strong>Nursery Manager:</strong> {order.workerAssignments.nurseryManager || 'Not assigned'}</p>
                  <p><strong>Quality Controller:</strong> {order.workerAssignments.qualityController || 'Not assigned'}</p>
                </div>
              </div>
            )}

            {/* Budwood Calculation */}
            {order.budwoodCalculation && (
              <div>
                <h4 className="font-semibold text-lg mb-2">Budwood Requirements</h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <p><strong>Required:</strong> {order.budwoodCalculation.requiredBudwood} pieces</p>
                  <p><strong>Waste Factor:</strong> {order.budwoodCalculation.wasteFactorPercent}%</p>
                  <p><strong>Total Needed:</strong> {order.budwoodCalculation.totalRequired} pieces</p>
                </div>
              </div>
            )}

            <div className="md:col-span-2">
              <h4 className="font-semibold text-lg mb-2">Propagation History</h4>
              <div className="bg-gray-50 p-4 rounded-md h-40 overflow-y-auto">
                <ul className="text-sm space-y-2">
                  {order.stageHistory.map((history, index) => (
                    <li key={index} className="flex items-start">
                      <ArrowRight className="w-4 h-4 mt-1 text-gray-500 mr-2" />
                      <div>
                        <p><strong>{propagationStages[history.stage]?.name}</strong> on {history.date}</p>
                        <p className="text-xs text-gray-600">
                          Quantity: {history.quantity} | Operator: {history.operator}
                          {history.workerPerformance && (
                            <span> | Quality: {history.workerPerformance.qualityScore}</span>
                          )}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <button onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300">Close</button>
          </div>
        </div>
      </div>
    );
  };
  
  // Main render
  return (
    <div className="bg-gray-100 min-h-screen font-sans">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Propagation Management</h1>
        
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'dashboard' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              <BarChart3 className="w-4 h-4 inline mr-2" /> Dashboard
            </button>
            <button
              onClick={() => setActiveTab('customers')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'customers' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              <Users className="w-4 h-4 inline mr-2" /> Customers
            </button>
            <button
              onClick={() => setActiveTab('suppliers')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'suppliers' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              <TreePine className="w-4 h-4 inline mr-2" /> Suppliers
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'orders' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              <Package className="w-4 h-4 inline mr-2" /> Orders
            </button>
            <button
              onClick={() => setActiveTab('budwood')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'budwood' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              <Scissors className="w-4 h-4 inline mr-2" /> Budwood
            </button>
            <button
              onClick={() => setActiveTab('grafting')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'grafting' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              <Beaker className="w-4 h-4 inline mr-2" /> Grafting
            </button>
            <button
              onClick={() => setActiveTab('performance')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'performance' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              <TrendingUp className="w-4 h-4 inline mr-2" /> Performance
            </button>
          </nav>
        </div>

        {/* Content based on activeTab */}
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'customers' && <CustomerManagement />}
        {activeTab === 'suppliers' && <SupplierManagement />}
        {activeTab === 'orders' && <OrdersView />}
        {activeTab === 'budwood' && <BudwoodTrackingView />}
        {activeTab === 'grafting' && <GraftingRecordsView />}
        {activeTab === 'performance' && <TeamPerformanceView />}
      </div>

      {showNewOrder && <NewOrderModal />}
      {showTransferModal && <TransferModal />}
      {showHealthModal && <HealthModal />}
      {showBudwoodModal && <BudwoodModal />}
      {showGraftingModal && <GraftingModal />}
      {selectedOrder && <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
    </div>
  );
};

export default PropagationOrder;