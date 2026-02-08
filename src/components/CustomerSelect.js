import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, Plus, Building, Users } from 'lucide-react';

const CustomerSelect = ({
  selectedCustomerId,
  onCustomerSelect,
  onCreateNew,
  label = "Customer",
  placeholder = "Search and select customer...",
  required = false,
  customers = [], // Can be passed in or fetched from API
  showCreateNew = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Sample customers data - replace with API call or prop
  const [allCustomers, setAllCustomers] = useState(customers.length > 0 ? customers : [
    {
      id: 1,
      company_name: 'Green Valley Farms',
      contact_person: 'John Smith',
      email: 'john@greenvalley.com',
      phone: '+1-555-0123',
      customer_type: 'wholesale'
    },
    {
      id: 2,
      company_name: 'Sunny Acres Nursery',
      contact_person: 'Sarah Johnson',
      email: 'sarah@sunnyacres.com',
      phone: '+1-555-0456',
      customer_type: 'nursery'
    },
    {
      id: 3,
      company_name: 'Home Garden Center',
      contact_person: 'Mike Davis',
      email: 'mike@homegardens.com',
      phone: '+1-555-0789',
      customer_type: 'retail'
    },
    {
      id: 4,
      company_name: 'Urban Jungle Nursery',
      contact_person: 'Lisa Chen',
      email: 'lisa@urbanjungle.com',
      phone: '+1-555-0321',
      customer_type: 'nursery'
    },
    {
      id: 5,
      company_name: 'Desert Rose Gardens',
      contact_person: 'Carlos Rodriguez',
      email: 'carlos@desertrose.com',
      phone: '+1-555-0654',
      customer_type: 'retail'
    }
  ]);

  // Set initial selected customer
  useEffect(() => {
    if (selectedCustomerId) {
      const customer = allCustomers.find(c => c.id === selectedCustomerId);
      setSelectedCustomer(customer);
      setSearchTerm(customer ? customer.company_name : '');
    }
  }, [selectedCustomerId, allCustomers]);

  // Filter customers based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCustomers(allCustomers.filter(c => c.id !== selectedCustomerId));
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = allCustomers.filter(customer => {
        const matches =
          customer.company_name.toLowerCase().includes(term) ||
          customer.contact_person.toLowerCase().includes(term) ||
          customer.email.toLowerCase().includes(term) ||
          customer.phone.includes(term);
        return matches && customer.id !== selectedCustomerId;
      });
      setFilteredCustomers(filtered);
    }
  }, [searchTerm, allCustomers, selectedCustomerId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setSearchTerm(customer.company_name);
    setIsOpen(false);
    onCustomerSelect(customer);
  };

  const handleClearSelection = () => {
    setSelectedCustomer(null);
    setSearchTerm('');
    onCustomerSelect(null);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    // If input is cleared, clear selection
    if (!value.trim()) {
      setSelectedCustomer(null);
      onCustomerSelect(null);
    }

    // Open dropdown when typing
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    // If there's a selected customer, clear the search term to show all options
    if (selectedCustomer) {
      setSearchTerm('');
    }
  };

  const getCustomerTypeIcon = (type) => {
    switch (type) {
      case 'wholesale':
        return <Building className="w-4 h-4 text-blue-600" />;
      case 'nursery':
        return <Users className="w-4 h-4 text-green-600" />;
      case 'retail':
        return <Users className="w-4 h-4 text-purple-600" />;
      default:
        return <Users className="w-4 h-4 text-gray-600" />;
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
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="relative">
        <div className="flex">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              placeholder={placeholder}
              className="pl-10 pr-10 py-2 w-full border border-gray-300 rounded-l-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {showCreateNew && onCreateNew && (
            <button
              type="button"
              onClick={onCreateNew}
              className="px-3 py-2 bg-blue-600 text-white border border-blue-600 rounded-r-md hover:bg-blue-700 transition-colors"
              title="Add new customer"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Selected Customer Display */}
        {selectedCustomer && !isOpen && (
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getCustomerTypeIcon(selectedCustomer.customer_type)}
                <div>
                  <div className="font-medium text-gray-900">{selectedCustomer.company_name}</div>
                  <div className="text-sm text-gray-600">{selectedCustomer.contact_person}</div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCustomerTypeColor(selectedCustomer.customer_type)}`}>
                  {selectedCustomer.customer_type}
                </span>
              </div>
              <button
                type="button"
                onClick={handleClearSelection}
                className="text-gray-400 hover:text-gray-600"
                title="Clear selection"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            {filteredCustomers.length > 0 ? (
              <ul className="py-1">
                {filteredCustomers.map((customer) => (
                  <li key={customer.id}>
                    <button
                      type="button"
                      onClick={() => handleCustomerSelect(customer)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getCustomerTypeIcon(customer.customer_type)}
                          <div>
                            <div className="font-medium text-gray-900">{customer.company_name}</div>
                            <div className="text-sm text-gray-600">{customer.contact_person}</div>
                            <div className="text-xs text-gray-500">
                              {customer.email} {customer.phone && `• ${customer.phone}`}
                            </div>
                          </div>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCustomerTypeColor(customer.customer_type)}`}>
                          {customer.customer_type}
                        </span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-4 py-3 text-gray-500 text-center">
                {searchTerm ? 'No customers found matching your search.' : 'No customers available.'}
                {showCreateNew && onCreateNew && (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        onCreateNew();
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      + Create new customer
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerSelect;