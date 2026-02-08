import React, { useState, useEffect } from 'react';
import {
  Users, Plus, Edit, Trash2, Search, UserCheck, Award, Clock,
  Phone, Mail, MapPin, Calendar, Shield, Star, CheckCircle,
  AlertCircle, User, Settings, Filter
} from 'lucide-react';

const EmployeeManagement = ({ employees, onAddEmployee, onUpdateEmployee, onDeleteEmployee }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSkillset, setFilterSkillset] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Employee form data
  const [employeeData, setEmployeeData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    skillsets: [],
    certifications: [],
    hireDate: '',
    employeeId: '',
    status: 'active',
    hourlyRate: '',
    address: '',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    },
    notes: ''
  });

  const [errors, setErrors] = useState({});

  // Skillsets and their associated activities
  const skillsetDefinitions = {
    budwood_collection: {
      name: 'Budwood Collection',
      description: 'Harvesting and preparing budwood from mother trees',
      requiredCertifications: ['Plant Health', 'Quality Grading'],
      activities: ['Mother tree selection', 'Budwood harvesting', 'Quality assessment', 'Cold storage management']
    },
    grafting: {
      name: 'Grafting Operations',
      description: 'Plant grafting techniques and operations',
      requiredCertifications: ['Grafting Certification', 'Plant Propagation'],
      activities: ['Whip and tongue grafting', 'T-budding', 'Splice grafting', 'Rootstock preparation']
    },
    nursery_management: {
      name: 'Nursery Management',
      description: 'Post-graft care and plant establishment',
      requiredCertifications: ['Horticulture', 'Plant Health'],
      activities: ['Environmental control', 'Pest management', 'Growth monitoring', 'Watering systems']
    },
    quality_control: {
      name: 'Quality Control',
      description: 'Plant inspection and quality assessment',
      requiredCertifications: ['Quality Assurance', 'Plant Health'],
      activities: ['Union strength testing', 'Health inspection', 'Growth evaluation', 'Final inspection']
    },
    hardening: {
      name: 'Hardening & Conditioning',
      description: 'Plant hardening and environmental conditioning',
      requiredCertifications: ['Plant Physiology'],
      activities: ['Environmental transition', 'Stress conditioning', 'Adaptation monitoring']
    },
    logistics: {
      name: 'Logistics & Dispatch',
      description: 'Packaging, shipping and delivery coordination',
      requiredCertifications: ['Transportation', 'Packaging'],
      activities: ['Packaging preparation', 'Delivery coordination', 'Documentation', 'Customer communication']
    },
    supervision: {
      name: 'Supervision',
      description: 'Team leadership and operational oversight',
      requiredCertifications: ['Leadership', 'Safety Management'],
      activities: ['Team coordination', 'Training', 'Safety oversight', 'Performance monitoring']
    }
  };

  const departments = [
    'Propagation',
    'Nursery Operations',
    'Quality Assurance',
    'Logistics',
    'Management',
    'Maintenance'
  ];

  const positions = [
    'Propagation Technician',
    'Grafter',
    'Nursery Worker',
    'Quality Inspector',
    'Team Lead',
    'Section Manager',
    'Operations Manager',
    'Logistics Coordinator'
  ];

  // Reset form
  const resetForm = () => {
    setEmployeeData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      position: '',
      department: '',
      skillsets: [],
      certifications: [],
      hireDate: '',
      employeeId: '',
      status: 'active',
      hourlyRate: '',
      address: '',
      emergencyContact: {
        name: '',
        phone: '',
        relationship: ''
      },
      notes: ''
    });
    setErrors({});
  };

  // Validation
  const validateEmployee = (data) => {
    const newErrors = {};

    if (!data.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!data.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!data.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) newErrors.email = 'Invalid email format';
    if (!data.phone.trim()) newErrors.phone = 'Phone is required';
    if (!data.position) newErrors.position = 'Position is required';
    if (!data.department) newErrors.department = 'Department is required';
    if (!data.employeeId.trim()) newErrors.employeeId = 'Employee ID is required';
    if (!data.hireDate) newErrors.hireDate = 'Hire date is required';
    if (data.skillsets.length === 0) newErrors.skillsets = 'At least one skillset is required';

    return newErrors;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validateEmployee(employeeData);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const employee = {
      ...employeeData,
      id: showEditModal ? selectedEmployee.id : `EMP-${Date.now()}`,
      fullName: `${employeeData.firstName} ${employeeData.lastName}`,
      skillsetDetails: employeeData.skillsets.map(skill => skillsetDefinitions[skill])
    };

    if (showEditModal) {
      onUpdateEmployee(employee);
      setShowEditModal(false);
    } else {
      onAddEmployee(employee);
      setShowAddModal(false);
    }

    resetForm();
    setSelectedEmployee(null);
  };

  // Handle edit
  const handleEdit = (employee) => {
    setEmployeeData(employee);
    setSelectedEmployee(employee);
    setShowEditModal(true);
  };

  // Filter employees
  const filteredEmployees = employees.filter(employee => {
    const matchesSearch =
      employee.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.department?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSkillset = filterSkillset === 'all' ||
      employee.skillsets?.includes(filterSkillset);

    const matchesStatus = filterStatus === 'all' || employee.status === filterStatus;

    return matchesSearch && matchesSkillset && matchesStatus;
  });

  // Get skill color
  const getSkillColor = (skillset) => {
    const colors = {
      budwood_collection: 'bg-blue-100 text-blue-800',
      grafting: 'bg-orange-100 text-orange-800',
      nursery_management: 'bg-green-100 text-green-800',
      quality_control: 'bg-purple-100 text-purple-800',
      hardening: 'bg-indigo-100 text-indigo-800',
      logistics: 'bg-pink-100 text-pink-800',
      supervision: 'bg-yellow-100 text-yellow-800'
    };
    return colors[skillset] || 'bg-gray-100 text-gray-800';
  };

  // Get employees by skillset for quick assignment
  const getEmployeesBySkillset = (skillset) => {
    return employees.filter(emp =>
      emp.status === 'active' && emp.skillsets?.includes(skillset)
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Employee Management</h2>
          <p className="text-gray-600">Manage employees, skillsets, and assignments</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Employee
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Employees</p>
              <p className="text-2xl font-bold text-gray-900">{employees.length}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Employees</p>
              <p className="text-2xl font-bold text-gray-900">
                {employees.filter(emp => emp.status === 'active').length}
              </p>
            </div>
            <UserCheck className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Certified Grafters</p>
              <p className="text-2xl font-bold text-gray-900">
                {getEmployeesBySkillset('grafting').length}
              </p>
            </div>
            <Award className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Team Leaders</p>
              <p className="text-2xl font-bold text-gray-900">
                {getEmployeesBySkillset('supervision').length}
              </p>
            </div>
            <Shield className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={filterSkillset}
            onChange={(e) => setFilterSkillset(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Skillsets</option>
            {Object.entries(skillsetDefinitions).map(([key, skillset]) => (
              <option key={key} value={key}>{skillset.name}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="on_leave">On Leave</option>
          </select>
        </div>
      </div>

      {/* Employee Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEmployees.map(employee => (
          <div key={employee.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-gray-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-semibold text-gray-900">{employee.fullName}</h3>
                  <p className="text-sm text-gray-600">{employee.position}</p>
                  <p className="text-xs text-gray-500">{employee.employeeId}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                employee.status === 'active' ? 'bg-green-100 text-green-800' :
                employee.status === 'inactive' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {employee.status}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <Mail className="w-4 h-4 mr-2" />
                {employee.email}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Phone className="w-4 h-4 mr-2" />
                {employee.phone}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="w-4 h-4 mr-2" />
                Hired: {employee.hireDate}
              </div>
            </div>

            {/* Skillsets */}
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Skillsets:</p>
              <div className="flex flex-wrap gap-1">
                {employee.skillsets?.map(skillset => (
                  <span
                    key={skillset}
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getSkillColor(skillset)}`}
                  >
                    {skillsetDefinitions[skillset]?.name || skillset}
                  </span>
                ))}
              </div>
            </div>

            {/* Certifications */}
            {employee.certifications && employee.certifications.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Certifications:</p>
                <div className="flex flex-wrap gap-1">
                  {employee.certifications.map((cert, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                    >
                      {cert}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-2">
              <button
                onClick={() => handleEdit(employee)}
                className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center text-sm"
              >
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </button>
              <button
                onClick={() => onDeleteEmployee(employee.id)}
                className="bg-red-600 text-white py-2 px-3 rounded-md hover:bg-red-700 transition-colors flex items-center justify-center text-sm"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Employee Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center">
          <div className="relative bg-white p-8 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6">
              {showEditModal ? 'Edit Employee' : 'Add New Employee'}
            </h3>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="md:col-span-2">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h4>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">First Name</label>
                <input
                  type="text"
                  value={employeeData.firstName}
                  onChange={(e) => setEmployeeData({ ...employeeData, firstName: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                <input
                  type="text"
                  value={employeeData.lastName}
                  onChange={(e) => setEmployeeData({ ...employeeData, lastName: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Employee ID</label>
                <input
                  type="text"
                  value={employeeData.employeeId}
                  onChange={(e) => setEmployeeData({ ...employeeData, employeeId: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                {errors.employeeId && <p className="mt-1 text-xs text-red-500">{errors.employeeId}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Hire Date</label>
                <input
                  type="date"
                  value={employeeData.hireDate}
                  onChange={(e) => setEmployeeData({ ...employeeData, hireDate: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                {errors.hireDate && <p className="mt-1 text-xs text-red-500">{errors.hireDate}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={employeeData.email}
                  onChange={(e) => setEmployeeData({ ...employeeData, email: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="tel"
                  value={employeeData.phone}
                  onChange={(e) => setEmployeeData({ ...employeeData, phone: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Position</label>
                <select
                  value={employeeData.position}
                  onChange={(e) => setEmployeeData({ ...employeeData, position: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Select Position</option>
                  {positions.map(position => (
                    <option key={position} value={position}>{position}</option>
                  ))}
                </select>
                {errors.position && <p className="mt-1 text-xs text-red-500">{errors.position}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Department</label>
                <select
                  value={employeeData.department}
                  onChange={(e) => setEmployeeData({ ...employeeData, department: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                {errors.department && <p className="mt-1 text-xs text-red-500">{errors.department}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={employeeData.status}
                  onChange={(e) => setEmployeeData({ ...employeeData, status: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="on_leave">On Leave</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Hourly Rate ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={employeeData.hourlyRate}
                  onChange={(e) => setEmployeeData({ ...employeeData, hourlyRate: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              {/* Skillsets */}
              <div className="md:col-span-2">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Skillsets & Certifications</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Skillsets</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {Object.entries(skillsetDefinitions).map(([key, skillset]) => (
                      <label key={key} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={employeeData.skillsets.includes(key)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEmployeeData({
                                ...employeeData,
                                skillsets: [...employeeData.skillsets, key]
                              });
                            } else {
                              setEmployeeData({
                                ...employeeData,
                                skillsets: employeeData.skillsets.filter(s => s !== key)
                              });
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        />
                        <span className="ml-2 text-sm">{skillset.name}</span>
                      </label>
                    ))}
                  </div>
                  {errors.skillsets && <p className="mt-1 text-xs text-red-500">{errors.skillsets}</p>}
                </div>
              </div>

              {/* Certifications */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Certifications (comma-separated)</label>
                <input
                  type="text"
                  value={employeeData.certifications.join(', ')}
                  onChange={(e) => setEmployeeData({
                    ...employeeData,
                    certifications: e.target.value.split(',').map(cert => cert.trim()).filter(cert => cert)
                  })}
                  placeholder="e.g., Plant Health, Grafting Certification, Safety Training"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              {/* Address */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <textarea
                  value={employeeData.address}
                  onChange={(e) => setEmployeeData({ ...employeeData, address: e.target.value })}
                  rows="2"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              {/* Emergency Contact */}
              <div className="md:col-span-2">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Emergency Contact</h4>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={employeeData.emergencyContact.name}
                  onChange={(e) => setEmployeeData({
                    ...employeeData,
                    emergencyContact: { ...employeeData.emergencyContact, name: e.target.value }
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="tel"
                  value={employeeData.emergencyContact.phone}
                  onChange={(e) => setEmployeeData({
                    ...employeeData,
                    emergencyContact: { ...employeeData.emergencyContact, phone: e.target.value }
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Relationship</label>
                <input
                  type="text"
                  value={employeeData.emergencyContact.relationship}
                  onChange={(e) => setEmployeeData({
                    ...employeeData,
                    emergencyContact: { ...employeeData.emergencyContact, relationship: e.target.value }
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              {/* Notes */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  value={employeeData.notes}
                  onChange={(e) => setEmployeeData({ ...employeeData, notes: e.target.value })}
                  rows="3"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              {/* Actions */}
              <div className="md:col-span-2 flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    resetForm();
                    setSelectedEmployee(null);
                  }}
                  className="bg-gray-200 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
                >
                  {showEditModal ? 'Update Employee' : 'Add Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManagement;