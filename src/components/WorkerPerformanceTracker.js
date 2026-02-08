import React, { useState, useEffect } from 'react';
import { User, TrendingUp, Clock, Award, AlertTriangle, Target, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const WorkerPerformanceTracker = ({
  graftingRecords = [],
  transferRecords = [],
  orders = []
}) => {
  const [selectedWorker, setSelectedWorker] = useState('');
  const [timeFrame, setTimeFrame] = useState('all'); // all, week, month
  const [performanceData, setPerformanceData] = useState({});

  useEffect(() => {
    calculatePerformanceMetrics();
  }, [graftingRecords, transferRecords, orders, timeFrame]);

  const calculatePerformanceMetrics = () => {
    const metrics = {};

    // Process grafting records
    graftingRecords.forEach(record => {
      if (!isInTimeFrame(record.date)) return;

      if (!metrics[record.operator]) {
        metrics[record.operator] = {
          name: record.operator,
          graftingCount: 0,
          totalGrafted: 0,
          avgSuccessRate: 0,
          totalSuccessRate: 0,
          efficiency: 0,
          qualityScores: [],
          tasks: [],
          stages: new Set(),
          timeInStages: {},
          productivity: 0
        };
      }

      const worker = metrics[record.operator];
      worker.graftingCount++;
      worker.totalGrafted += record.quantity || 0;
      worker.totalSuccessRate += record.successRate || 0;
      worker.tasks.push({
        type: 'grafting',
        date: record.date,
        quantity: record.quantity,
        successRate: record.successRate,
        technique: record.technique
      });
    });

    // Process transfer records and stage history
    orders.forEach(order => {
      order.stageHistory.forEach(stage => {
        if (!isInTimeFrame(stage.date) || !stage.operator) return;

        if (!metrics[stage.operator]) {
          metrics[stage.operator] = {
            name: stage.operator,
            graftingCount: 0,
            totalGrafted: 0,
            avgSuccessRate: 0,
            totalSuccessRate: 0,
            efficiency: 0,
            qualityScores: [],
            tasks: [],
            stages: new Set(),
            timeInStages: {},
            productivity: 0
          };
        }

        const worker = metrics[stage.operator];
        worker.stages.add(stage.stage);
        worker.tasks.push({
          type: 'transfer',
          stage: stage.stage,
          date: stage.date,
          quantity: stage.quantity,
          orderId: order.id
        });

        if (stage.workerPerformance) {
          worker.qualityScores.push(stage.workerPerformance.qualityScore);
          worker.timeInStages[stage.stage] = stage.workerPerformance.timeInStage;
        }
      });
    });

    // Calculate derived metrics
    Object.values(metrics).forEach(worker => {
      worker.avgSuccessRate = worker.graftingCount > 0
        ? (worker.totalSuccessRate / worker.graftingCount).toFixed(1)
        : 0;

      worker.avgQualityScore = worker.qualityScores.length > 0
        ? (worker.qualityScores.reduce((a, b) => a + b, 0) / worker.qualityScores.length).toFixed(1)
        : 0;

      worker.productivity = calculateProductivityScore(worker);
      worker.efficiency = calculateEfficiencyScore(worker);
      worker.stagesWorked = Array.from(worker.stages);
    });

    setPerformanceData(metrics);
  };

  const isInTimeFrame = (dateStr) => {
    if (timeFrame === 'all') return true;

    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (timeFrame === 'week') return diffDays <= 7;
    if (timeFrame === 'month') return diffDays <= 30;
    return true;
  };

  const calculateProductivityScore = (worker) => {
    // Base score on quantity processed and task completion rate
    const taskCount = worker.tasks.length;
    const quantityProcessed = worker.totalGrafted + worker.tasks
      .filter(t => t.type === 'transfer')
      .reduce((sum, task) => sum + (task.quantity || 0), 0);

    // Normalize to 0-100 scale
    return Math.min(100, Math.round((taskCount * 10) + (quantityProcessed / 10)));
  };

  const calculateEfficiencyScore = (worker) => {
    // Base efficiency on success rate and quality scores
    const successRateScore = parseFloat(worker.avgSuccessRate) || 0;
    const qualityScore = parseFloat(worker.avgQualityScore) || 0;

    return Math.round((successRateScore * 0.6) + (qualityScore * 0.4));
  };

  const getPerformanceColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceBadge = (score) => {
    if (score >= 90) return { label: 'Excellent', color: 'bg-green-100 text-green-800' };
    if (score >= 80) return { label: 'Good', color: 'bg-blue-100 text-blue-800' };
    if (score >= 60) return { label: 'Average', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'Needs Improvement', color: 'bg-red-100 text-red-800' };
  };

  const workersList = Object.values(performanceData);
  const selectedWorkerData = selectedWorker ? performanceData[selectedWorker] : null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Worker Performance Tracking</h2>
        <div className="flex space-x-4">
          <select
            value={timeFrame}
            onChange={(e) => setTimeFrame(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Time</option>
            <option value="month">Last 30 Days</option>
            <option value="week">Last 7 Days</option>
          </select>
          <select
            value={selectedWorker}
            onChange={(e) => setSelectedWorker(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Workers</option>
            {workersList.map(worker => (
              <option key={worker.name} value={worker.name}>{worker.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Performance Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Workers</p>
              <p className="text-2xl font-bold text-gray-900">{workersList.length}</p>
            </div>
            <User className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Success Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {workersList.length > 0
                  ? (workersList.reduce((sum, w) => sum + parseFloat(w.avgSuccessRate), 0) / workersList.length).toFixed(1)
                  : 0}%
              </p>
            </div>
            <Target className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tasks</p>
              <p className="text-2xl font-bold text-gray-900">
                {workersList.reduce((sum, w) => sum + w.tasks.length, 0)}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Top Performer</p>
              <p className="text-lg font-bold text-gray-900">
                {workersList.length > 0
                  ? workersList.reduce((top, worker) =>
                      worker.efficiency > top.efficiency ? worker : top, workersList[0]
                    ).name
                  : 'N/A'}
              </p>
            </div>
            <Award className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Worker Performance Table */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h3 className="font-semibold text-lg text-gray-900 mb-4">Individual Performance</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Worker</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tasks</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Success Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quality Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Productivity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Efficiency</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {workersList.map(worker => {
                const badge = getPerformanceBadge(worker.efficiency);
                return (
                  <tr key={worker.name} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900">{worker.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {worker.tasks.length}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={getPerformanceColor(worker.avgSuccessRate)}>
                        {worker.avgSuccessRate}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={getPerformanceColor(worker.avgQualityScore)}>
                        {worker.avgQualityScore}/100
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${Math.min(worker.productivity, 100)}%` }}
                          ></div>
                        </div>
                        <span>{worker.productivity}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${worker.efficiency}%` }}
                          ></div>
                        </div>
                        <span>{worker.efficiency}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badge.color}`}>
                        {badge.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="font-semibold text-lg mb-4 text-gray-900">Success Rate Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={workersList}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="avgSuccessRate" fill="#10B981" name="Success Rate (%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="font-semibold text-lg mb-4 text-gray-900">Productivity vs Efficiency</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={workersList}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="productivity" fill="#3B82F6" name="Productivity" />
              <Bar dataKey="efficiency" fill="#F59E0B" name="Efficiency %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Individual Worker Details */}
      {selectedWorkerData && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="font-semibold text-lg text-gray-900 mb-4">
            Performance Details: {selectedWorkerData.name}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-sm text-gray-600">Total Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{selectedWorkerData.tasks.length}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-sm text-gray-600">Stages Worked</p>
              <p className="text-2xl font-bold text-gray-900">{selectedWorkerData.stagesWorked.length}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-sm text-gray-600">Plants Processed</p>
              <p className="text-2xl font-bold text-gray-900">
                {selectedWorkerData.totalGrafted + selectedWorkerData.tasks
                  .filter(t => t.type === 'transfer')
                  .reduce((sum, task) => sum + (task.quantity || 0), 0)}
              </p>
            </div>
          </div>

          <h4 className="font-medium text-gray-900 mb-2">Recent Tasks</h4>
          <div className="max-h-40 overflow-y-auto">
            <div className="space-y-2">
              {selectedWorkerData.tasks.slice(-10).map((task, index) => (
                <div key={index} className="flex justify-between items-center text-sm border-b pb-1">
                  <span>{task.type === 'grafting' ? 'Grafting' : `Transfer - ${task.stage}`}</span>
                  <span className="text-gray-500">{task.date}</span>
                  <span className="text-gray-700">{task.quantity} plants</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerPerformanceTracker;