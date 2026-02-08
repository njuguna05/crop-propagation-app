import React from 'react';
import { CheckCircle, AlertTriangle, X, Clock, User, Package, Droplets } from 'lucide-react';

const StageValidation = ({
  order,
  propagationStages,
  onResolveBlocker,
  showValidation = true
}) => {
  if (!order || !showValidation) return null;

  const currentStage = propagationStages[order.status];
  const validation = order.stageValidation || {
    currentStageComplete: false,
    readyForNextStage: false,
    blockers: []
  };

  // Check stage-specific requirements
  const checkStageRequirements = () => {
    const requirements = [];
    const blockers = [...validation.blockers];

    // Check quantity requirements
    if (order.currentStageQuantity <= 0) {
      blockers.push({
        type: 'quantity',
        message: 'No plants available in current stage',
        severity: 'critical',
        action: 'Check previous stage for losses'
      });
    }

    // Check worker assignment
    if (currentStage) {
      const stageWorkerMap = {
        budwood_collection: order.workerAssignments?.budwoodCollector,
        grafting_operation: order.workerAssignments?.grafter,
        post_graft_care: order.workerAssignments?.nurseryManager,
        quality_check: order.workerAssignments?.qualityController
      };

      const assignedWorker = stageWorkerMap[order.status];
      if (!assignedWorker) {
        blockers.push({
          type: 'worker',
          message: `No worker assigned for ${currentStage.name}`,
          severity: 'warning',
          action: 'Assign qualified worker to this stage'
        });
      }
    }

    // Check environmental requirements for specific stages
    if (order.status === 'post_graft_care') {
      requirements.push({
        type: 'environment',
        description: 'High humidity (85-95%)',
        status: 'pending'
      });
      requirements.push({
        type: 'environment',
        description: 'Temperature control (20-25°C)',
        status: 'pending'
      });
    }

    if (order.status === 'grafting_operation') {
      requirements.push({
        type: 'equipment',
        description: 'Sterilized grafting tools',
        status: 'pending'
      });
      requirements.push({
        type: 'material',
        description: 'Adequate budwood supply',
        status: order.budwoodCalculation?.totalRequired > 0 ? 'completed' : 'pending'
      });
    }

    // Check timing requirements
    const stageHistory = order.stageHistory?.find(h => h.stage === order.status);
    if (stageHistory && currentStage) {
      const daysInStage = Math.floor(
        (new Date() - new Date(stageHistory.date)) / (1000 * 60 * 60 * 24)
      );

      if (daysInStage > currentStage.duration * 1.5) {
        blockers.push({
          type: 'timing',
          message: `Stage overdue by ${daysInStage - currentStage.duration} days`,
          severity: 'critical',
          action: 'Immediate action required to prevent losses'
        });
      } else if (daysInStage < currentStage.duration * 0.5) {
        blockers.push({
          type: 'timing',
          message: 'Minimum stage duration not met',
          severity: 'warning',
          action: 'Allow more time for proper development'
        });
      }
    }

    return { blockers, requirements };
  };

  const stageCheck = checkStageRequirements();
  const allBlockers = stageCheck.blockers;
  const requirements = stageCheck.requirements;

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'border-red-200 bg-red-50';
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return <X className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const canProceedToNext = allBlockers.filter(b => b.severity === 'critical').length === 0;

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Stage Validation: {currentStage?.name}
        </h3>
        <div className="flex items-center">
          {canProceedToNext ? (
            <div className="flex items-center text-green-600">
              <CheckCircle className="w-5 h-5 mr-2" />
              <span className="text-sm font-medium">Ready to Proceed</span>
            </div>
          ) : (
            <div className="flex items-center text-red-600">
              <AlertTriangle className="w-5 h-5 mr-2" />
              <span className="text-sm font-medium">Blocked</span>
            </div>
          )}
        </div>
      </div>

      {/* Current Stage Requirements */}
      {requirements.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-3">Stage Requirements</h4>
          <div className="space-y-2">
            {requirements.map((req, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex items-center">
                  {req.type === 'environment' && <Droplets className="w-4 h-4 text-blue-500 mr-2" />}
                  {req.type === 'equipment' && <Package className="w-4 h-4 text-gray-500 mr-2" />}
                  {req.type === 'material' && <Package className="w-4 h-4 text-green-500 mr-2" />}
                  <span className="text-sm text-gray-700">{req.description}</span>
                </div>
                <div className="flex items-center">
                  {req.status === 'completed' ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <Clock className="w-4 h-4 text-yellow-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Blockers */}
      {allBlockers.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-3">Issues to Resolve</h4>
          <div className="space-y-3">
            {allBlockers.map((blocker, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${getSeverityColor(blocker.severity)}`}
              >
                <div className="flex items-start">
                  {getSeverityIcon(blocker.severity)}
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {blocker.message}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {blocker.action}
                    </p>
                  </div>
                  {onResolveBlocker && (
                    <button
                      onClick={() => onResolveBlocker(blocker)}
                      className="ml-2 text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stage Progress */}
      <div className="mb-4">
        <h4 className="font-medium text-gray-900 mb-3">Stage Progress</h4>
        <div className="bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-300 ${
              canProceedToNext ? 'bg-green-500' : 'bg-yellow-500'
            }`}
            style={{
              width: `${canProceedToNext ? 100 : Math.max(20, 100 - (allBlockers.length * 20))}%`
            }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-gray-600 mt-1">
          <span>Stage Started</span>
          <span>{canProceedToNext ? 'Ready for Next Stage' : 'Issues Need Resolution'}</span>
        </div>
      </div>

      {/* Next Stage Information */}
      {currentStage?.nextStage && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-2">
            Next Stage: {propagationStages[currentStage.nextStage]?.name}
          </h4>
          <div className="text-sm text-blue-700">
            <p>Duration: {propagationStages[currentStage.nextStage]?.duration} days</p>
            <p>Requirements: {propagationStages[currentStage.nextStage]?.requirements.join(', ')}</p>
            {!canProceedToNext && (
              <p className="text-red-600 mt-2 font-medium">
                ⚠️ Resolve all critical issues before transferring to next stage
              </p>
            )}
          </div>
        </div>
      )}

      {/* Validation Summary */}
      <div className="mt-4 p-3 bg-gray-100 rounded">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Validation Status:</span>
          <span className={`font-medium ${canProceedToNext ? 'text-green-600' : 'text-red-600'}`}>
            {canProceedToNext
              ? `✓ All requirements met`
              : `✗ ${allBlockers.filter(b => b.severity === 'critical').length} critical issues`}
          </span>
        </div>
      </div>
    </div>
  );
};

export default StageValidation;