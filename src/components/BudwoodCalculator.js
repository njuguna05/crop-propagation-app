import React, { useState, useEffect } from 'react';
import { Calculator, AlertTriangle, CheckCircle, Info } from 'lucide-react';

const BudwoodCalculator = ({
  quantity,
  propagationMethod,
  onCalculationUpdate,
  existingCalculation = {
    requiredBudwood: 0,
    wasteFactorPercent: 15,
    extraForSafety: 0,
    totalRequired: 0
  }
}) => {
  const [calculation, setCalculation] = useState(existingCalculation);

  // Budwood requirements by propagation method
  const budwoodRatios = {
    grafting: {
      ratio: 1.2,
      unit: 'budwood pieces',
      description: 'Standard grafting requires 1.2 budwood pieces per plant (includes backup)'
    },
    cutting: {
      ratio: 2.0,
      unit: 'cuttings',
      description: 'Cutting propagation requires 2 cuttings per plant for optimal success rate'
    },
    tissue_culture: {
      ratio: 0.1,
      unit: 'mother plant samples',
      description: 'Tissue culture requires 0.1 sample per plant (high multiplication rate)'
    }
  };

  const calculateBudwood = () => {
    const methodConfig = budwoodRatios[propagationMethod] || budwoodRatios.grafting;
    const baseRequired = Math.ceil(quantity * methodConfig.ratio);
    const wasteFactor = 1 + (calculation.wasteFactorPercent / 100);
    const withWaste = Math.ceil(baseRequired * wasteFactor);
    const totalWithSafety = withWaste + parseInt(calculation.extraForSafety || 0);

    const newCalculation = {
      ...calculation,
      requiredBudwood: baseRequired,
      totalRequired: totalWithSafety,
      methodConfig
    };

    setCalculation(newCalculation);
    onCalculationUpdate(newCalculation);
  };

  useEffect(() => {
    if (quantity > 0) {
      calculateBudwood();
    }
  }, [quantity, propagationMethod, calculation.wasteFactorPercent, calculation.extraForSafety]);

  const getWasteRecommendation = () => {
    if (calculation.wasteFactorPercent < 10) {
      return { color: 'text-red-600', message: 'Very low waste factor - high risk of shortage' };
    } else if (calculation.wasteFactorPercent <= 20) {
      return { color: 'text-green-600', message: 'Recommended waste factor range' };
    } else {
      return { color: 'text-yellow-600', message: 'High waste factor - may increase costs' };
    }
  };

  const wasteRecommendation = getWasteRecommendation();

  if (!quantity || quantity <= 0) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center text-gray-500">
          <Calculator className="w-5 h-5 mr-2" />
          <span>Enter order quantity to calculate budwood requirements</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
      <div className="flex items-center mb-4">
        <Calculator className="w-5 h-5 text-blue-600 mr-2" />
        <h3 className="text-lg font-semibold text-blue-900">Budwood Calculator</h3>
      </div>

      {/* Method Information */}
      <div className="mb-4 p-3 bg-white rounded border">
        <div className="flex items-start">
          <Info className="w-4 h-4 text-blue-500 mr-2 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-gray-900">
              {propagationMethod.charAt(0).toUpperCase() + propagationMethod.slice(1)} Method
            </p>
            <p className="text-xs text-gray-600 mt-1">
              {calculation.methodConfig?.description}
            </p>
          </div>
        </div>
      </div>

      {/* Calculation Results */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-white p-3 rounded border">
          <p className="text-xs text-gray-600">Base Required</p>
          <p className="text-lg font-bold text-gray-900">
            {calculation.requiredBudwood} {calculation.methodConfig?.unit}
          </p>
        </div>
        <div className="bg-white p-3 rounded border">
          <p className="text-xs text-gray-600">With Waste Factor</p>
          <p className="text-lg font-bold text-orange-600">
            {Math.ceil(calculation.requiredBudwood * (1 + calculation.wasteFactorPercent / 100))}
          </p>
        </div>
        <div className="bg-white p-3 rounded border">
          <p className="text-xs text-gray-600">Total Required</p>
          <p className="text-lg font-bold text-green-600">
            {calculation.totalRequired}
          </p>
        </div>
      </div>

      {/* Waste Factor Controls */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Waste Factor (%) - Accounts for damaged/unusable budwood
          </label>
          <div className="flex items-center space-x-3">
            <input
              type="number"
              min="5"
              max="50"
              value={calculation.wasteFactorPercent}
              onChange={(e) => setCalculation({
                ...calculation,
                wasteFactorPercent: parseInt(e.target.value) || 15
              })}
              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
            />
            <div className="flex items-center">
              {calculation.wasteFactorPercent <= 20 ? (
                <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-yellow-500 mr-1" />
              )}
              <span className={`text-xs ${wasteRecommendation.color}`}>
                {wasteRecommendation.message}
              </span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Extra Safety Buffer (units) - Additional budwood for emergencies
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={calculation.extraForSafety}
            onChange={(e) => setCalculation({
              ...calculation,
              extraForSafety: parseInt(e.target.value) || 0
            })}
            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
          />
        </div>
      </div>

      {/* Prevention Alerts */}
      <div className="mt-4 space-y-2">
        {calculation.wasteFactorPercent < 10 && (
          <div className="flex items-center p-2 bg-red-50 border border-red-200 rounded">
            <AlertTriangle className="w-4 h-4 text-red-500 mr-2" />
            <span className="text-sm text-red-700">
              Warning: Low waste factor may lead to budwood shortage
            </span>
          </div>
        )}

        {calculation.totalRequired > calculation.requiredBudwood * 1.5 && (
          <div className="flex items-center p-2 bg-yellow-50 border border-yellow-200 rounded">
            <AlertTriangle className="w-4 h-4 text-yellow-500 mr-2" />
            <span className="text-sm text-yellow-700">
              High budwood requirement detected - verify calculations
            </span>
          </div>
        )}

        <div className="flex items-center p-2 bg-green-50 border border-green-200 rounded">
          <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
          <span className="text-sm text-green-700">
            Prevents over-harvesting by calculating exact requirements
          </span>
        </div>
      </div>
    </div>
  );
};

export default BudwoodCalculator;