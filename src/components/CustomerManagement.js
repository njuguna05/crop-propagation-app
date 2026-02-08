import React, { useState, useEffect } from 'react';
import {
  Plus, Search, Eye, Edit, Trash2, Users, Building, Phone, Mail,
  MapPin, CreditCard, CheckCircle, XCircle, Filter
} from 'lucide-react';

const CustomerManagement = () => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [showEditCustomer, setShowEditCustomer] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterActive, setFilterActive] = useState('all');
  const [errors, setErrors] = useState({});

  const [newCustomer, setNewCustomer] = useState({
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'USA',
    customer_type: 'retail',
    tax_id: '',
    payment_terms: 'net_30',
    credit_limit: 0,
    notes: '',
    is_active: 'true'
  });

  // Sample data - replace with API calls
  useEffect(() => {
    const sampleCustomers = [
      {
        id: 1,
        company_name: 'Green Valley Farms',
        contact_person: 'John Smith',
        email: 'john@greenvalley.com',
        phone: '+1-555-0123',
        address: '123 Farm Road',
        city: 'Valley Center',
        state: 'CA',
        zip_code: '92082',
        country: 'USA',
        customer_type: 'wholesale',
        tax_id: 'TAX123456789',
        payment_terms: 'net_30',
        credit_limit: 50000,
        notes: 'Large wholesale customer, excellent payment history',
        is_active: 'true',
        created_at: '2024-01-15T10:00:00Z'
      },
      {
        id: 2,
        company_name: 'Sunny Acres Nursery',
        contact_person: 'Sarah Johnson',
        email: 'sarah@sunnyacres.com',
        phone: '+1-555-0456',
        address: '456 Nursery Lane',
        city: 'San Diego',
        state: 'CA',
        zip_code: '92101',
        country: 'USA',
        customer_type: 'nursery',
        tax_id: 'TAX987654321',
        payment_terms: 'net_15',
        credit_limit: 25000,
        notes: 'Regular nursery partner',
        is_active: 'true',
        created_at: '2024-02-01T10:00:00Z'
      },
      {
        id: 3,
        company_name: 'Home Garden Center',
        contact_person: 'Mike Davis',
        email: 'mike@homegardens.com',
        phone: '+1-555-0789',
        address: '789 Garden Street',
        city: 'Escondido',
        state: 'CA',
        zip_code: '92025',
        country: 'USA',
        customer_type: 'retail',
        tax_id: '',
        payment_terms: 'cash',
        credit_limit: 0,
        notes: 'Small retail customer, cash payments only',
        is_active: 'true',
        created_at: '2024-03-10T10:00:00Z'
      }
    ];
    setCustomers(sampleCustomers);
  }, []);

  // Filter customers based on search and filters
  useEffect(() => {
    let filtered = customers;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(customer =>
        customer.company_name.toLowerCase().includes(term) ||
        customer.contact_person.toLowerCase().includes(term) ||
        customer.email.toLowerCase().includes(term) ||
        customer.phone.includes(term)
      );
    }

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(customer => customer.customer_type === filterType);
    }

    // Active filter
    if (filterActive !== 'all') {
      filtered = filtered.filter(customer => customer.is_active === filterActive);
    }

    setFilteredCustomers(filtered);
  }, [customers, searchTerm, filterType, filterActive]);

  const handleCreateCustomer = () => {
    const validationErrors = validateCustomer(newCustomer);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const customer = {
      ...newCustomer,
      id: Date.now(),
      created_at: new Date().toISOString()
    };

    setCustomers([...customers, customer]);
    resetForm();
    setShowNewCustomer(false);
    setErrors({});
  };

  const handleUpdateCustomer = () => {
    const validationErrors = validateCustomer(selectedCustomer);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const updatedCustomers = customers.map(customer =>
      customer.id === selectedCustomer.id ? selectedCustomer : customer
    );

    setCustomers(updatedCustomers);
    setShowEditCustomer(false);
    setSelectedCustomer(null);
    setErrors({});
  };

  const handleDeleteCustomer = (customerId) => {
    if (window.confirm('Are you sure you want to deactivate this customer?')) {
      const updatedCustomers = customers.map(customer =>
        customer.id === customerId ? { ...customer, is_active: 'false' } : customer
      );
      setCustomers(updatedCustomers);
    }
  };

  const handleActivateCustomer = (customerId) => {
    const updatedCustomers = customers.map(customer =>
      customer.id === customerId ? { ...customer, is_active: 'true' } : customer
    );
    setCustomers(updatedCustomers);
  };

  const validateCustomer = (customer) => {
    const errors = {};
    if (!customer.company_name.trim()) errors.company_name = 'Company name is required';
    if (!customer.contact_person.trim()) errors.contact_person = 'Contact person is required';
    if (customer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
      errors.email = 'Invalid email format';
    }
    return errors;
  };

  const resetForm = () => {
    setNewCustomer({
      company_name: '',
      contact_person: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      country: 'USA',
      customer_type: 'retail',
      tax_id: '',
      payment_terms: 'net_30',
      credit_limit: 0,
      notes: '',
      is_active: 'true'
    });
  };

  const getCustomerTypeIcon = (type) => {
    switch (type) {
      case 'wholesale': return <Building className="w-4 h-4 text-blue-600" />;
      case 'nursery': return <Users className="w-4 h-4 text-green-600" />;
      case 'retail': return <Users className="w-4 h-4 text-purple-600" />;
      default: return <Users className="w-4 h-4 text-gray-600" />;
    }
  };

  const getCustomerTypeColor = (type) => {
    switch (type) {
      case 'wholesale': return 'bg-blue-100 text-blue-800';
      case 'nursery': return 'bg-green-100 text-green-800';
      case 'retail': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customer Management</h2>
          <p className="text-gray-600">Manage your customer database</p>
        </div>
        <button
          onClick={() => setShowNewCustomer(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Customer
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="retail">Retail</option>
              <option value="wholesale">Wholesale</option>
              <option value="nursery">Nursery</option>
            </select>
          </div>
          <div>
            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Customers</p>
              <p className="text-2xl font-bold text-gray-900">
                {customers.filter(c => c.is_active === 'true').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Wholesale</p>
              <p className="text-2xl font-bold text-gray-900">
                {customers.filter(c => c.customer_type === 'wholesale').length}
              </p>
            </div>
            <Building className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Credit Limit</p>
              <p className="text-2xl font-bold text-gray-900">
                ${customers.reduce((acc, c) => acc + c.credit_limit, 0).toLocaleString()}
              </p>
            </div>
            <CreditCard className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Customer List */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company / Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Terms
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map(customer => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{customer.company_name}</div>
                      <div className="text-sm text-gray-500">{customer.contact_person}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getCustomerTypeIcon(customer.customer_type)}
                      <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getCustomerTypeColor(customer.customer_type)}`}>
                        {customer.customer_type}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="space-y-1">
                      {customer.email && (
                        <div className="flex items-center">
                          <Mail className="w-3 h-3 mr-1" />
                          {customer.email}
                        </div>
                      )}
                      {customer.phone && (
                        <div className="flex items-center">
                          <Phone className="w-3 h-3 mr-1" />
                          {customer.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>
                      <div>{customer.payment_terms}</div>
                      {customer.credit_limit > 0 && (
                        <div className="text-xs text-gray-400">
                          Credit: ${customer.credit_limit.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {customer.is_active === 'true' ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <XCircle className="w-3 h-3 mr-1" />
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setShowEditCustomer(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {customer.is_active === 'true' ? (
                        <button
                          onClick={() => handleDeleteCustomer(customer.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleActivateCustomer(customer.id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Customer Modal */}
      {showNewCustomer && (
        <CustomerModal
          customer={newCustomer}
          setCustomer={setNewCustomer}
          onSave={handleCreateCustomer}
          onCancel={() => {
            setShowNewCustomer(false);
            resetForm();
            setErrors({});
          }}
          errors={errors}
          title="Add New Customer"
        />
      )}

      {/* Edit Customer Modal */}
      {showEditCustomer && selectedCustomer && (
        <CustomerModal
          customer={selectedCustomer}
          setCustomer={setSelectedCustomer}
          onSave={handleUpdateCustomer}
          onCancel={() => {
            setShowEditCustomer(false);
            setSelectedCustomer(null);
            setErrors({});
          }}
          errors={errors}
          title="Edit Customer"
        />
      )}
    </div>
  );
};

// Customer Modal Component
const CustomerModal = ({ customer, setCustomer, onSave, onCancel, errors, title }) => (
  <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center">
    <div className="relative bg-white p-8 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
      <h3 className="text-2xl font-bold mb-6">{title}</h3>
      <form onSubmit={(e) => { e.preventDefault(); onSave(); }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Company Information */}
        <div className="md:col-span-2 lg:col-span-3">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Company Information</h4>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Company Name *</label>
          <input
            type="text"
            value={customer.company_name}
            onChange={(e) => setCustomer({ ...customer, company_name: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.company_name && <p className="mt-1 text-xs text-red-500">{errors.company_name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Contact Person *</label>
          <input
            type="text"
            value={customer.contact_person}
            onChange={(e) => setCustomer({ ...customer, contact_person: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.contact_person && <p className="mt-1 text-xs text-red-500">{errors.contact_person}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Customer Type</label>
          <select
            value={customer.customer_type}
            onChange={(e) => setCustomer({ ...customer, customer_type: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="retail">Retail</option>
            <option value="wholesale">Wholesale</option>
            <option value="nursery">Nursery</option>
          </select>
        </div>

        {/* Contact Information */}
        <div className="md:col-span-2 lg:col-span-3">
          <h4 className="text-lg font-medium text-gray-900 mb-4 mt-6">Contact Information</h4>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            value={customer.email}
            onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Phone</label>
          <input
            type="tel"
            value={customer.phone}
            onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Tax ID</label>
          <input
            type="text"
            value={customer.tax_id}
            onChange={(e) => setCustomer({ ...customer, tax_id: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {/* Address Information */}
        <div className="md:col-span-2 lg:col-span-3">
          <label className="block text-sm font-medium text-gray-700">Address</label>
          <input
            type="text"
            value={customer.address}
            onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">City</label>
          <input
            type="text"
            value={customer.city}
            onChange={(e) => setCustomer({ ...customer, city: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">State</label>
          <input
            type="text"
            value={customer.state}
            onChange={(e) => setCustomer({ ...customer, state: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">ZIP Code</label>
          <input
            type="text"
            value={customer.zip_code}
            onChange={(e) => setCustomer({ ...customer, zip_code: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {/* Payment Information */}
        <div className="md:col-span-2 lg:col-span-3">
          <h4 className="text-lg font-medium text-gray-900 mb-4 mt-6">Payment Information</h4>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Payment Terms</label>
          <select
            value={customer.payment_terms}
            onChange={(e) => setCustomer({ ...customer, payment_terms: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="cash">Cash</option>
            <option value="net_15">Net 15</option>
            <option value="net_30">Net 30</option>
            <option value="net_60">Net 60</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Credit Limit ($)</label>
          <input
            type="number"
            value={customer.credit_limit}
            onChange={(e) => setCustomer({ ...customer, credit_limit: parseInt(e.target.value) || 0 })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <select
            value={customer.is_active}
            onChange={(e) => setCustomer({ ...customer, is_active: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>

        <div className="md:col-span-2 lg:col-span-3">
          <label className="block text-sm font-medium text-gray-700">Notes</label>
          <textarea
            value={customer.notes}
            onChange={(e) => setCustomer({ ...customer, notes: e.target.value })}
            rows="3"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div className="md:col-span-2 lg:col-span-3 flex justify-end space-x-4 mt-6">
          <button type="button" onClick={onCancel} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300">
            Cancel
          </button>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            Save Customer
          </button>
        </div>
      </form>
    </div>
  </div>
);

export default CustomerManagement;