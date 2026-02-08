import React, { useState, useEffect } from 'react';
import {
  Plus, Search, Eye, Edit, Trash2, Building, Phone, Mail, MapPin,
  Star, Award, Package, Truck, DollarSign, CheckCircle, XCircle,
  Filter, FileText, ShoppingCart, BarChart3, Leaf, TreePine
} from 'lucide-react';

const SupplierManagement = () => {
  const [activeTab, setActiveTab] = useState('suppliers');
  const [suppliers, setSuppliers] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [showNewSupplier, setShowNewSupplier] = useState(false);
  const [showEditSupplier, setShowEditSupplier] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterActive, setFilterActive] = useState('true');
  const [errors, setErrors] = useState({});

  const [newSupplier, setNewSupplier] = useState({
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'USA',
    supplier_type: 'nursery',
    specializations: '',
    certifications: '',
    payment_terms: 'net_30',
    minimum_order_value: 0,
    lead_time_days: 7,
    shipping_cost: 0,
    tax_id: '',
    is_active: true,
    is_preferred: false,
    notes: ''
  });

  // Sample suppliers data
  useEffect(() => {
    const sampleSuppliers = [
      {
        id: 1,
        company_name: 'California Budwood Co.',
        contact_person: 'Maria Rodriguez',
        email: 'maria@cabudwood.com',
        phone: '+1-559-555-0123',
        address: '1234 Orchard Avenue',
        city: 'Fresno',
        state: 'CA',
        zip_code: '93720',
        country: 'USA',
        supplier_type: 'collector',
        specializations: 'Citrus budwood, Disease-free materials',
        certifications: 'CDFA Certified, Organic',
        payment_terms: 'net_15',
        minimum_order_value: 500,
        lead_time_days: 5,
        shipping_cost: 25,
        quality_rating: 4.8,
        delivery_rating: 4.5,
        price_rating: 4.2,
        is_active: true,
        is_preferred: true,
        total_orders: 15,
        total_spent: 12500,
        last_order_date: '2024-03-15T10:00:00Z',
        notes: 'Excellent quality citrus budwood, very reliable',
        created_at: '2023-01-15T10:00:00Z'
      },
      {
        id: 2,
        company_name: 'Sierra Rootstock Nursery',
        contact_person: 'John Thompson',
        email: 'john@sierrarootstock.com',
        phone: '+1-209-555-0456',
        address: '5678 Mountain View Road',
        city: 'Modesto',
        state: 'CA',
        zip_code: '95350',
        country: 'USA',
        supplier_type: 'nursery',
        specializations: 'Citrus rootstock, Avocado rootstock',
        certifications: 'Virus-indexed, CCPP Certified',
        payment_terms: 'net_30',
        minimum_order_value: 1000,
        lead_time_days: 14,
        shipping_cost: 50,
        quality_rating: 4.6,
        delivery_rating: 4.8,
        price_rating: 3.9,
        is_active: true,
        is_preferred: true,
        total_orders: 8,
        total_spent: 8900,
        last_order_date: '2024-02-28T10:00:00Z',
        notes: 'Great rootstock quality, sometimes slow delivery',
        created_at: '2023-03-10T10:00:00Z'
      },
      {
        id: 3,
        company_name: 'Valley Farm Supply',
        contact_person: 'Sarah Chen',
        email: 'sarah@valleyfarm.com',
        phone: '+1-661-555-0789',
        address: '9012 Agricultural Way',
        city: 'Bakersfield',
        state: 'CA',
        zip_code: '93301',
        country: 'USA',
        supplier_type: 'distributor',
        specializations: 'Tools, Containers, Propagation supplies',
        certifications: 'ISO 9001',
        payment_terms: 'net_45',
        minimum_order_value: 200,
        lead_time_days: 3,
        shipping_cost: 15,
        quality_rating: 4.1,
        delivery_rating: 4.9,
        price_rating: 4.7,
        is_active: true,
        is_preferred: false,
        total_orders: 25,
        total_spent: 5600,
        last_order_date: '2024-03-20T10:00:00Z',
        notes: 'Good for supplies, competitive pricing',
        created_at: '2023-05-20T10:00:00Z'
      }
    ];
    setSuppliers(sampleSuppliers);
  }, []);

  // Filter suppliers
  useEffect(() => {
    let filtered = suppliers;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(supplier =>
        supplier.company_name.toLowerCase().includes(term) ||
        supplier.contact_person.toLowerCase().includes(term) ||
        supplier.specializations.toLowerCase().includes(term)
      );
    }

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(supplier => supplier.supplier_type === filterType);
    }

    // Active filter
    if (filterActive !== 'all') {
      filtered = filtered.filter(supplier => supplier.is_active.toString() === filterActive);
    }

    setFilteredSuppliers(filtered);
  }, [suppliers, searchTerm, filterType, filterActive]);

  const getSupplierTypeIcon = (type) => {
    switch (type) {
      case 'nursery': return <TreePine className="w-4 h-4 text-green-600" />;
      case 'collector': return <Leaf className="w-4 h-4 text-blue-600" />;
      case 'farm': return <Building className="w-4 h-4 text-yellow-600" />;
      case 'distributor': return <Package className="w-4 h-4 text-purple-600" />;
      default: return <Building className="w-4 h-4 text-gray-600" />;
    }
  };

  const getSupplierTypeColor = (type) => {
    switch (type) {
      case 'nursery': return 'bg-green-100 text-green-800';
      case 'collector': return 'bg-blue-100 text-blue-800';
      case 'farm': return 'bg-yellow-100 text-yellow-800';
      case 'distributor': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRatingColor = (rating) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 4.0) return 'text-yellow-600';
    if (rating >= 3.0) return 'text-orange-600';
    return 'text-red-600';
  };

  const handleCreateSupplier = () => {
    const validationErrors = validateSupplier(newSupplier);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const supplier = {
      ...newSupplier,
      id: Date.now(),
      quality_rating: 0,
      delivery_rating: 0,
      price_rating: 0,
      total_orders: 0,
      total_spent: 0,
      last_order_date: null,
      created_at: new Date().toISOString()
    };

    setSuppliers([...suppliers, supplier]);
    resetForm();
    setShowNewSupplier(false);
    setErrors({});
  };

  const validateSupplier = (supplier) => {
    const errors = {};
    if (!supplier.company_name.trim()) errors.company_name = 'Company name is required';
    if (!supplier.contact_person.trim()) errors.contact_person = 'Contact person is required';
    if (supplier.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supplier.email)) {
      errors.email = 'Invalid email format';
    }
    return errors;
  };

  const resetForm = () => {
    setNewSupplier({
      company_name: '',
      contact_person: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      country: 'USA',
      supplier_type: 'nursery',
      specializations: '',
      certifications: '',
      payment_terms: 'net_30',
      minimum_order_value: 0,
      lead_time_days: 7,
      shipping_cost: 0,
      tax_id: '',
      is_active: true,
      is_preferred: false,
      notes: ''
    });
  };

  const SuppliersView = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Supplier Management</h2>
          <p className="text-gray-600">Manage your budwood and rootstock suppliers</p>
        </div>
        <button
          onClick={() => setShowNewSupplier(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Supplier
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
                placeholder="Search suppliers..."
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
              <option value="nursery">Nursery</option>
              <option value="collector">Collector</option>
              <option value="farm">Farm</option>
              <option value="distributor">Distributor</option>
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
              <p className="text-sm font-medium text-gray-600">Total Suppliers</p>
              <p className="text-2xl font-bold text-gray-900">{suppliers.length}</p>
            </div>
            <Building className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Preferred Suppliers</p>
              <p className="text-2xl font-bold text-gray-900">
                {suppliers.filter(s => s.is_preferred).length}
              </p>
            </div>
            <Star className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Orders</p>
              <p className="text-2xl font-bold text-gray-900">12</p>
            </div>
            <ShoppingCart className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">YTD Spending</p>
              <p className="text-2xl font-bold text-gray-900">
                ${suppliers.reduce((acc, s) => acc + s.total_spent, 0).toLocaleString()}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Supplier Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredSuppliers.map(supplier => (
          <SupplierCard key={supplier.id} supplier={supplier} />
        ))}
      </div>

      {/* Modals */}
      {showNewSupplier && (
        <SupplierModal
          supplier={newSupplier}
          setSupplier={setNewSupplier}
          onSave={handleCreateSupplier}
          onCancel={() => {
            setShowNewSupplier(false);
            resetForm();
            setErrors({});
          }}
          errors={errors}
          title="Add New Supplier"
        />
      )}
    </div>
  );

  const SupplierCard = ({ supplier }) => (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            {getSupplierTypeIcon(supplier.supplier_type)}
            <h3 className="text-lg font-semibold text-gray-900 ml-2">{supplier.company_name}</h3>
            {supplier.is_preferred && (
              <Star className="w-4 h-4 text-yellow-500 ml-2 fill-current" />
            )}
          </div>
          <p className="text-gray-600">{supplier.contact_person}</p>
          <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full mt-2 ${getSupplierTypeColor(supplier.supplier_type)}`}>
            {supplier.supplier_type}
          </span>
        </div>
        <div className="flex items-center">
          {supplier.is_active ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
          ) : (
            <XCircle className="w-5 h-5 text-red-500" />
          )}
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {supplier.email && (
          <div className="flex items-center text-sm text-gray-600">
            <Mail className="w-3 h-3 mr-2" />
            {supplier.email}
          </div>
        )}
        {supplier.phone && (
          <div className="flex items-center text-sm text-gray-600">
            <Phone className="w-3 h-3 mr-2" />
            {supplier.phone}
          </div>
        )}
        <div className="flex items-center text-sm text-gray-600">
          <MapPin className="w-3 h-3 mr-2" />
          {supplier.city}, {supplier.state}
        </div>
      </div>

      {/* Ratings */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Quality</span>
          <div className="flex items-center">
            <span className={`font-medium ${getRatingColor(supplier.quality_rating)}`}>
              {supplier.quality_rating.toFixed(1)}
            </span>
            <Star className={`w-3 h-3 ml-1 ${getRatingColor(supplier.quality_rating)}`} />
          </div>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Delivery</span>
          <div className="flex items-center">
            <span className={`font-medium ${getRatingColor(supplier.delivery_rating)}`}>
              {supplier.delivery_rating.toFixed(1)}
            </span>
            <Truck className={`w-3 h-3 ml-1 ${getRatingColor(supplier.delivery_rating)}`} />
          </div>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Price</span>
          <div className="flex items-center">
            <span className={`font-medium ${getRatingColor(supplier.price_rating)}`}>
              {supplier.price_rating.toFixed(1)}
            </span>
            <DollarSign className={`w-3 h-3 ml-1 ${getRatingColor(supplier.price_rating)}`} />
          </div>
        </div>
      </div>

      {/* Order Stats */}
      <div className="bg-gray-50 p-3 rounded-md mb-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Orders:</span>
            <span className="font-medium ml-1">{supplier.total_orders}</span>
          </div>
          <div>
            <span className="text-gray-600">Spent:</span>
            <span className="font-medium ml-1">${supplier.total_spent.toLocaleString()}</span>
          </div>
          <div className="col-span-2">
            <span className="text-gray-600">Payment:</span>
            <span className="font-medium ml-1">{supplier.payment_terms}</span>
          </div>
        </div>
      </div>

      {/* Specializations */}
      {supplier.specializations && (
        <div className="mb-4">
          <p className="text-xs text-gray-600 mb-1">Specializations:</p>
          <p className="text-sm text-gray-800">{supplier.specializations}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex space-x-2">
        <button
          onClick={() => {
            setSelectedSupplier(supplier);
            // Open supplier details modal or navigate to detail view
          }}
          className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-md hover:bg-blue-700 transition-colors text-sm flex items-center justify-center"
        >
          <Eye className="w-4 h-4 mr-1" />
          View
        </button>
        <button className="bg-green-600 text-white py-2 px-3 rounded-md hover:bg-green-700 transition-colors text-sm flex items-center justify-center">
          <ShoppingCart className="w-4 h-4" />
        </button>
        <button className="bg-gray-600 text-white py-2 px-3 rounded-md hover:bg-gray-700 transition-colors text-sm flex items-center justify-center">
          <Edit className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const SupplierModal = ({ supplier, setSupplier, onSave, onCancel, errors, title }) => (
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
              value={supplier.company_name}
              onChange={(e) => setSupplier({ ...supplier, company_name: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.company_name && <p className="mt-1 text-xs text-red-500">{errors.company_name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Contact Person *</label>
            <input
              type="text"
              value={supplier.contact_person}
              onChange={(e) => setSupplier({ ...supplier, contact_person: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.contact_person && <p className="mt-1 text-xs text-red-500">{errors.contact_person}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Supplier Type</label>
            <select
              value={supplier.supplier_type}
              onChange={(e) => setSupplier({ ...supplier, supplier_type: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="nursery">Nursery</option>
              <option value="collector">Collector</option>
              <option value="farm">Farm</option>
              <option value="distributor">Distributor</option>
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
              value={supplier.email}
              onChange={(e) => setSupplier({ ...supplier, email: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input
              type="tel"
              value={supplier.phone}
              onChange={(e) => setSupplier({ ...supplier, phone: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Tax ID</label>
            <input
              type="text"
              value={supplier.tax_id}
              onChange={(e) => setSupplier({ ...supplier, tax_id: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* Address */}
          <div className="md:col-span-2 lg:col-span-3">
            <label className="block text-sm font-medium text-gray-700">Address</label>
            <input
              type="text"
              value={supplier.address}
              onChange={(e) => setSupplier({ ...supplier, address: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">City</label>
            <input
              type="text"
              value={supplier.city}
              onChange={(e) => setSupplier({ ...supplier, city: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">State</label>
            <input
              type="text"
              value={supplier.state}
              onChange={(e) => setSupplier({ ...supplier, state: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">ZIP Code</label>
            <input
              type="text"
              value={supplier.zip_code}
              onChange={(e) => setSupplier({ ...supplier, zip_code: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* Business Terms */}
          <div className="md:col-span-2 lg:col-span-3">
            <h4 className="text-lg font-medium text-gray-900 mb-4 mt-6">Business Terms</h4>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Payment Terms</label>
            <select
              value={supplier.payment_terms}
              onChange={(e) => setSupplier({ ...supplier, payment_terms: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="cash">Cash</option>
              <option value="net_15">Net 15</option>
              <option value="net_30">Net 30</option>
              <option value="net_45">Net 45</option>
              <option value="net_60">Net 60</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Minimum Order ($)</label>
            <input
              type="number"
              value={supplier.minimum_order_value}
              onChange={(e) => setSupplier({ ...supplier, minimum_order_value: parseFloat(e.target.value) || 0 })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Lead Time (days)</label>
            <input
              type="number"
              value={supplier.lead_time_days}
              onChange={(e) => setSupplier({ ...supplier, lead_time_days: parseInt(e.target.value) || 7 })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* Specializations */}
          <div className="md:col-span-2 lg:col-span-3">
            <label className="block text-sm font-medium text-gray-700">Specializations</label>
            <textarea
              value={supplier.specializations}
              onChange={(e) => setSupplier({ ...supplier, specializations: e.target.value })}
              rows="2"
              placeholder="e.g., Citrus budwood, Avocado rootstock, Disease-free materials"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="md:col-span-2 lg:col-span-3">
            <label className="block text-sm font-medium text-gray-700">Certifications</label>
            <textarea
              value={supplier.certifications}
              onChange={(e) => setSupplier({ ...supplier, certifications: e.target.value })}
              rows="2"
              placeholder="e.g., CDFA Certified, Organic, Virus-indexed"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="md:col-span-2 lg:col-span-3">
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              value={supplier.notes}
              onChange={(e) => setSupplier({ ...supplier, notes: e.target.value })}
              rows="3"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* Status */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={supplier.is_active}
                onChange={(e) => setSupplier({ ...supplier, is_active: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Active</span>
            </label>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={supplier.is_preferred}
                onChange={(e) => setSupplier({ ...supplier, is_preferred: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Preferred Supplier</span>
            </label>
          </div>

          <div className="md:col-span-2 lg:col-span-3 flex justify-end space-x-4 mt-6">
            <button type="button" onClick={onCancel} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300">
              Cancel
            </button>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
              Save Supplier
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('suppliers')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'suppliers' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            <Building className="w-4 h-4 inline mr-2" /> Suppliers
          </button>
          <button
            onClick={() => setActiveTab('catalog')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'catalog' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            <Package className="w-4 h-4 inline mr-2" /> Catalog
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'orders' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            <ShoppingCart className="w-4 h-4 inline mr-2" /> Purchase Orders
          </button>
          <button
            onClick={() => setActiveTab('evaluations')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'evaluations' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            <BarChart3 className="w-4 h-4 inline mr-2" /> Evaluations
          </button>
        </nav>
      </div>

      {/* Content based on activeTab */}
      {activeTab === 'suppliers' && <SuppliersView />}
      {activeTab === 'catalog' && <div className="text-center py-12 text-gray-500">Catalog management coming soon...</div>}
      {activeTab === 'orders' && <div className="text-center py-12 text-gray-500">Purchase orders coming soon...</div>}
      {activeTab === 'evaluations' && <div className="text-center py-12 text-gray-500">Supplier evaluations coming soon...</div>}
    </div>
  );
};

export default SupplierManagement;