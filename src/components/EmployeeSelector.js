import React, { useState } from 'react';
import { ChevronDown, User, Award, AlertCircle, CheckCircle } from 'lucide-react';

const EmployeeSelector = ({
  employees,
  requiredSkillset,
  selectedEmployeeId,
  onEmployeeSelect,
  label = "Select Employee",
  placeholder = "Choose an employee...",
  className = "",
  showSkillMatch = true
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Filter employees based on required skillset
  const getFilteredEmployees = () => {
    if (!requiredSkillset) {
      return employees.filter(emp => emp.status === 'active');
    }

    return employees.filter(emp =>
      emp.status === 'active' &&
      emp.skillsets?.includes(requiredSkillset)
    );
  };

  const filteredEmployees = getFilteredEmployees();
  const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);

  // Get skill level indicator
  const getSkillLevel = (employee, skillset) => {
    if (!skillset || !employee.skillsets) return null;

    const hasSkill = employee.skillsets.includes(skillset);
    const hasRelevantCerts = employee.certifications?.some(cert =>
      cert.toLowerCase().includes(skillset.replace('_', ' ').toLowerCase())
    );

    if (hasSkill && hasRelevantCerts) return 'expert';
    if (hasSkill) return 'qualified';
    return 'none';
  };

  const getSkillLevelColor = (level) => {
    switch (level) {
      case 'expert': return 'text-green-600';
      case 'qualified': return 'text-blue-600';
      default: return 'text-gray-400';
    }
  };

  const getSkillLevelIcon = (level) => {
    switch (level) {
      case 'expert': return <Award className="w-4 h-4" />;
      case 'qualified': return <CheckCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {requiredSkillset && (
            <span className="text-xs text-gray-500 ml-1">
              (Requires: {requiredSkillset.replace('_', ' ')})
            </span>
          )}
        </label>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-full bg-white border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        >
          <span className="flex items-center">
            {selectedEmployee ? (
              <>
                <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center mr-2">
                  <User className="w-3 h-3 text-gray-600" />
                </div>
                <span className="block truncate">
                  {selectedEmployee.fullName} - {selectedEmployee.position}
                </span>
                {showSkillMatch && requiredSkillset && (
                  <span className={`ml-2 ${getSkillLevelColor(getSkillLevel(selectedEmployee, requiredSkillset))}`}>
                    {getSkillLevelIcon(getSkillLevel(selectedEmployee, requiredSkillset))}
                  </span>
                )}
              </>
            ) : (
              <span className="block truncate text-gray-500">{placeholder}</span>
            )}
          </span>
          <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <ChevronDown className="w-5 h-5 text-gray-400" />
          </span>
        </button>

        {isOpen && (
          <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
            {filteredEmployees.length === 0 ? (
              <div className="px-3 py-2 text-gray-500 text-sm">
                {requiredSkillset
                  ? `No employees with ${requiredSkillset.replace('_', ' ')} skillset available`
                  : 'No active employees available'
                }
              </div>
            ) : (
              filteredEmployees.map((employee) => {
                const skillLevel = getSkillLevel(employee, requiredSkillset);
                return (
                  <div
                    key={employee.id}
                    onClick={() => {
                      onEmployeeSelect(employee.id);
                      setIsOpen(false);
                    }}
                    className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-blue-50"
                  >
                    <div className="flex items-center">
                      <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center mr-2">
                        <User className="w-3 h-3 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className={`block truncate font-medium ${
                          selectedEmployeeId === employee.id ? 'text-blue-600' : 'text-gray-900'
                        }`}>
                          {employee.fullName}
                        </span>
                        <span className="block truncate text-xs text-gray-500">
                          {employee.position} • {employee.department}
                        </span>
                        {showSkillMatch && requiredSkillset && (
                          <div className="flex items-center mt-1">
                            <span className={`text-xs ${getSkillLevelColor(skillLevel)} flex items-center`}>
                              {getSkillLevelIcon(skillLevel)}
                              <span className="ml-1">
                                {skillLevel === 'expert' ? 'Expert' :
                                 skillLevel === 'qualified' ? 'Qualified' : 'No skillset match'}
                              </span>
                            </span>
                          </div>
                        )}
                      </div>
                      {selectedEmployeeId === employee.id && (
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Show available employees count */}
      {requiredSkillset && (
        <p className="mt-1 text-xs text-gray-500">
          {filteredEmployees.length} qualified employee{filteredEmployees.length !== 1 ? 's' : ''} available
        </p>
      )}
    </div>
  );
};

export default EmployeeSelector;