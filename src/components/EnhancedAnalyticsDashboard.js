import React, { useState, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock,
  Truck, Target, BarChart3, PieChart, Users, Package,
  Calendar, Droplets, Thermometer, Download, TreePine, DollarSign
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart as RechartsPieChart, Pie, Cell, Area, AreaChart
} from 'recharts';

const EnhancedAnalyticsDashboard = ({
  orders = [],
  graftingRecords = [],
  budwoodCollection = [],
  transferRecords = [],
  propagationStages = {}
}) => {
  const [timeFrame, setTimeFrame] = useState('month'); // week, month, quarter, year
  const [selectedMetric, setSelectedMetric] = useState('overview');

  // Calculate comprehensive analytics
  const analytics = useMemo(() => {
    const now = new Date();
    const filteredOrders = orders.filter(order => {
      const orderDate = new Date(order.orderDate);
      const diffTime = Math.abs(now - orderDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      switch (timeFrame) {
        case 'week': return diffDays <= 7;
        case 'month': return diffDays <= 30;
        case 'quarter': return diffDays <= 90;
        case 'year': return diffDays <= 365;
        default: return true;
      }
    });

    // 1. Real-Time Dispatch Tracking
    const dispatchMetrics = {
      readyForDispatch: filteredOrders.filter(o => o.status === 'pre_dispatch').length,
      dispatched: filteredOrders.filter(o => o.status === 'dispatched').length,
      pendingDelivery: filteredOrders.filter(o => {
        return o.status === 'dispatched' && new Date(o.requestedDelivery) <= now;
      }).length,
      avgDispatchTime: calculateAvgDispatchTime(filteredOrders),
      onTimeDeliveries: calculateOnTimeDeliveries(filteredOrders)
    };

    // 2. Plant Survival & Success Rates
    const survivalMetrics = calculateSurvivalRates(filteredOrders, graftingRecords);

    // 3. Grafting Productivity Analysis
    const graftingMetrics = calculateGraftingProductivity(graftingRecords);

    // 4. Propagation Volume per Variety
    const varietyMetrics = calculateVarietyMetrics(filteredOrders);

    // 5. Cost & Resource Optimization
    const costMetrics = calculateCostMetrics(filteredOrders, budwoodCollection);

    // 6. Workflow Efficiency
    const workflowMetrics = calculateWorkflowEfficiency(filteredOrders, transferRecords);

    return {
      dispatch: dispatchMetrics,
      survival: survivalMetrics,
      grafting: graftingMetrics,
      varieties: varietyMetrics,
      costs: costMetrics,
      workflow: workflowMetrics,
      summary: calculateSummaryMetrics(filteredOrders)
    };
  }, [orders, graftingRecords, budwoodCollection, transferRecords, timeFrame]);

  // Calculation functions
  function calculateAvgDispatchTime(orders) {
    const dispatchedOrders = orders.filter(o => o.status === 'dispatched');
    if (dispatchedOrders.length === 0) return 0;

    const totalTime = dispatchedOrders.reduce((sum, order) => {
      const orderDate = new Date(order.orderDate);
      const dispatchDate = new Date(order.stageHistory.find(h => h.stage === 'dispatched')?.date || order.orderDate);
      return sum + Math.abs(dispatchDate - orderDate) / (1000 * 60 * 60 * 24);
    }, 0);

    return Math.round(totalTime / dispatchedOrders.length);
  }

  function calculateOnTimeDeliveries(orders) {
    const dispatchedOrders = orders.filter(o => o.status === 'dispatched');
    if (dispatchedOrders.length === 0) return 100;

    const onTime = dispatchedOrders.filter(order => {
      const requestedDate = new Date(order.requestedDelivery);
      const dispatchDate = new Date(order.stageHistory.find(h => h.stage === 'dispatched')?.date || order.orderDate);
      return dispatchDate <= requestedDate;
    }).length;

    return Math.round((onTime / dispatchedOrders.length) * 100);
  }

  function calculateSurvivalRates(orders, graftingRecords) {
    const stagesSurvival = {};
    const overallSurvival = { started: 0, surviving: 0 };

    orders.forEach(order => {
      overallSurvival.started += order.totalQuantity;
      overallSurvival.surviving += order.currentStageQuantity;

      Object.keys(propagationStages).forEach(stage => {
        if (!stagesSurvival[stage]) {
          stagesSurvival[stage] = { entered: 0, survived: 0 };
        }

        const stageEntry = order.stageHistory.find(h => h.stage === stage);
        if (stageEntry) {
          stagesSurvival[stage].entered += stageEntry.quantity;

          // For current stage, use current quantity
          if (order.status === stage) {
            stagesSurvival[stage].survived += order.currentStageQuantity;
          } else {
            // For completed stages, look at next stage entry
            const stageIndex = Object.keys(propagationStages).indexOf(stage);
            const nextStageKey = Object.keys(propagationStages)[stageIndex + 1];
            if (nextStageKey) {
              const nextStageEntry = order.stageHistory.find(h => h.stage === nextStageKey);
              if (nextStageEntry) {
                stagesSurvival[stage].survived += nextStageEntry.quantity;
              }
            }
          }
        }
      });
    });

    return {
      overall: overallSurvival.started > 0
        ? Math.round((overallSurvival.surviving / overallSurvival.started) * 100)
        : 100,
      byStage: Object.entries(stagesSurvival).map(([stage, data]) => ({
        stage: propagationStages[stage]?.name || stage,
        rate: data.entered > 0 ? Math.round((data.survived / data.entered) * 100) : 100,
        entered: data.entered,
        survived: data.survived
      })),
      graftingSuccess: graftingRecords.length > 0
        ? Math.round(graftingRecords.reduce((sum, r) => sum + r.successRate, 0) / graftingRecords.length)
        : 0
    };
  }

  function calculateGraftingProductivity(graftingRecords) {
    const byOperator = {};
    let totalGrafted = 0;

    graftingRecords.forEach(record => {
      if (!byOperator[record.operator]) {
        byOperator[record.operator] = {
          name: record.operator,
          quantity: 0,
          sessions: 0,
          avgSuccessRate: 0,
          totalSuccessRate: 0
        };
      }

      const operator = byOperator[record.operator];
      operator.quantity += record.quantity || 0;
      operator.sessions++;
      operator.totalSuccessRate += record.successRate || 0;
      totalGrafted += record.quantity || 0;
    });

    // Calculate averages
    Object.values(byOperator).forEach(operator => {
      operator.avgSuccessRate = operator.sessions > 0
        ? Math.round(operator.totalSuccessRate / operator.sessions)
        : 0;
      operator.productivity = Math.round((operator.quantity / totalGrafted) * 100);
    });

    return {
      totalGrafted,
      totalSessions: graftingRecords.length,
      avgDailyOutput: Math.round(totalGrafted / Math.max(1, getUniqueDates(graftingRecords).length)),
      operators: Object.values(byOperator),
      trend: calculateGraftingTrend(graftingRecords)
    };
  }

  function calculateVarietyMetrics(orders) {
    const varieties = {};

    orders.forEach(order => {
      if (!varieties[order.variety]) {
        varieties[order.variety] = {
          name: order.variety,
          orders: 0,
          totalQuantity: 0,
          completedQuantity: 0,
          avgSuccessRate: 0,
          revenue: 0
        };
      }

      const variety = varieties[order.variety];
      variety.orders++;
      variety.totalQuantity += order.totalQuantity;
      variety.completedQuantity += order.completedQuantity || 0;
      variety.revenue += order.totalValue || 0;
    });

    // Calculate success rates
    Object.values(varieties).forEach(variety => {
      variety.avgSuccessRate = variety.totalQuantity > 0
        ? Math.round((variety.completedQuantity / variety.totalQuantity) * 100)
        : 0;
    });

    return Object.values(varieties).sort((a, b) => b.totalQuantity - a.totalQuantity);
  }

  function calculateCostMetrics(orders, budwoodCollection) {
    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalValue || 0), 0);
    const totalBudwoodUsed = budwoodCollection.reduce((sum, b) => sum + b.quantity, 0);
    const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

    // Estimate costs (simplified)
    const estimatedCosts = {
      budwood: totalBudwoodUsed * 0.5, // $0.50 per budwood piece
      labor: orders.reduce((sum, order) => sum + (order.currentStageQuantity * 2), 0), // $2 per plant labor
      materials: orders.reduce((sum, order) => sum + (order.currentStageQuantity * 1.5), 0) // $1.50 per plant materials
    };

    const totalCosts = Object.values(estimatedCosts).reduce((sum, cost) => sum + cost, 0);
    const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalCosts) / totalRevenue) * 100 : 0;

    return {
      revenue: totalRevenue,
      costs: estimatedCosts,
      totalCosts,
      profitMargin: Math.round(profitMargin),
      avgOrderValue: Math.round(avgOrderValue),
      costPerPlant: orders.reduce((sum, o) => sum + o.currentStageQuantity, 0) > 0
        ? Math.round(totalCosts / orders.reduce((sum, o) => sum + o.currentStageQuantity, 0))
        : 0
    };
  }

  function calculateWorkflowEfficiency(orders, transferRecords) {
    const stageEfficiency = {};
    let totalTransferTime = 0;
    let transferCount = 0;

    orders.forEach(order => {
      order.stageHistory.forEach((stage, index) => {
        if (!stageEfficiency[stage.stage]) {
          stageEfficiency[stage.stage] = {
            stage: propagationStages[stage.stage]?.name || stage.stage,
            avgTime: 0,
            totalTime: 0,
            count: 0
          };
        }

        const stageData = stageEfficiency[stage.stage];
        stageData.count++;

        // Calculate time in stage
        if (index < order.stageHistory.length - 1) {
          const nextStage = order.stageHistory[index + 1];
          const timeInStage = Math.abs(new Date(nextStage.date) - new Date(stage.date)) / (1000 * 60 * 60 * 24);
          stageData.totalTime += timeInStage;
          totalTransferTime += timeInStage;
          transferCount++;
        }
      });
    });

    // Calculate averages
    Object.values(stageEfficiency).forEach(stage => {
      stage.avgTime = stage.count > 0 ? Math.round(stage.totalTime / stage.count) : 0;
    });

    return {
      avgTransferTime: transferCount > 0 ? Math.round(totalTransferTime / transferCount) : 0,
      stageEfficiency: Object.values(stageEfficiency),
      bottlenecks: Object.values(stageEfficiency)
        .filter(stage => stage.avgTime > 7) // Stages taking more than a week
        .sort((a, b) => b.avgTime - a.avgTime)
    };
  }

  function calculateSummaryMetrics(orders) {
    const totalPlants = orders.reduce((sum, order) => sum + order.currentStageQuantity, 0);
    const completedOrders = orders.filter(o => o.status === 'dispatched').length;
    const overdueOrders = orders.filter(o => new Date(o.requestedDelivery) < new Date()).length;

    return {
      totalOrders: orders.length,
      completedOrders,
      totalPlants,
      overdueOrders,
      completionRate: orders.length > 0 ? Math.round((completedOrders / orders.length) * 100) : 0
    };
  }

  function getUniqueDates(records) {
    return [...new Set(records.map(r => r.date))];
  }

  function calculateGraftingTrend(graftingRecords) {
    const dailyData = {};
    graftingRecords.forEach(record => {
      const date = record.date;
      if (!dailyData[date]) {
        dailyData[date] = { date, quantity: 0, successRate: 0, count: 0 };
      }
      dailyData[date].quantity += record.quantity || 0;
      dailyData[date].successRate += record.successRate || 0;
      dailyData[date].count++;
    });

    return Object.values(dailyData).map(day => ({
      ...day,
      successRate: day.count > 0 ? Math.round(day.successRate / day.count) : 0
    })).sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Enhanced Analytics Dashboard</h2>
        <div className="flex space-x-4">
          <select
            value={timeFrame}
            onChange={(e) => setTimeFrame(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="quarter">Last 90 Days</option>
            <option value="year">Last Year</option>
          </select>
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Orders</p>
              <p className="text-xl font-bold text-gray-900">{analytics.summary.totalOrders}</p>
              <p className="text-xs text-green-600">
                {analytics.summary.completionRate}% completed
              </p>
            </div>
            <Package className="w-6 h-6 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Plants</p>
              <p className="text-xl font-bold text-gray-900">{analytics.summary.totalPlants}</p>
              <p className="text-xs text-green-600">
                {analytics.survival.overall}% survival rate
              </p>
            </div>
            <TreePine className="w-6 h-6 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Ready to Ship</p>
              <p className="text-xl font-bold text-gray-900">{analytics.dispatch.readyForDispatch}</p>
              <p className="text-xs text-blue-600">
                {analytics.dispatch.avgDispatchTime} days avg
              </p>
            </div>
            <Truck className="w-6 h-6 text-purple-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">On-Time Delivery</p>
              <p className="text-xl font-bold text-gray-900">{analytics.dispatch.onTimeDeliveries}%</p>
              <p className="text-xs text-green-600">Customer satisfaction</p>
            </div>
            <Target className="w-6 h-6 text-orange-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Revenue</p>
              <p className="text-xl font-bold text-gray-900">${Math.round(analytics.costs.revenue)}</p>
              <p className="text-xs text-green-600">
                {analytics.costs.profitMargin}% margin
              </p>
            </div>
            <DollarSign className="w-6 h-6 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Overdue</p>
              <p className="text-xl font-bold text-gray-900">{analytics.summary.overdueOrders}</p>
              <p className="text-xs text-red-600">Require attention</p>
            </div>
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Survival Rates by Stage */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="font-semibold text-lg mb-4 text-gray-900">Plant Survival by Stage</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.survival.byStage}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="stage" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="rate" fill="#10B981" name="Survival Rate %" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Grafting Productivity Trend */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="font-semibold text-lg mb-4 text-gray-900">Grafting Productivity Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analytics.grafting.trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="quantity" stackId="1" stroke="#3B82F6" fill="#3B82F6" />
              <Area type="monotone" dataKey="successRate" stackId="2" stroke="#10B981" fill="#10B981" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Variety Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="font-semibold text-lg mb-4 text-gray-900">Production Volume by Variety</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={analytics.varieties}
                dataKey="totalQuantity"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              >
                {analytics.varieties.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>

        {/* Workflow Efficiency */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="font-semibold text-lg mb-4 text-gray-900">Stage Efficiency (Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.workflow.stageEfficiency}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="stage" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="avgTime" fill="#F59E0B" name="Avg Days" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Operator Performance */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="font-semibold text-lg text-gray-900 mb-4">Grafting Team Performance</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operator</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Success Rate</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analytics.grafting.operators.map(operator => (
                  <tr key={operator.name}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{operator.name}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{operator.quantity}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{operator.avgSuccessRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Workflow Bottlenecks */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="font-semibold text-lg text-gray-900 mb-4">Workflow Bottlenecks</h3>
          <div className="space-y-3">
            {analytics.workflow.bottlenecks.length > 0 ? analytics.workflow.bottlenecks.map(bottleneck => (
              <div key={bottleneck.stage} className="flex justify-between items-center p-3 bg-red-50 border border-red-200 rounded">
                <div>
                  <p className="font-medium text-red-900">{bottleneck.stage}</p>
                  <p className="text-sm text-red-600">{bottleneck.avgTime} days average</p>
                </div>
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
            )) : (
              <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                <span className="text-green-700">No workflow bottlenecks detected</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedAnalyticsDashboard;