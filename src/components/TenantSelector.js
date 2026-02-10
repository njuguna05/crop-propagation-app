import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Plus, Building } from 'lucide-react';
import useAppStore from '../stores/appStore';
import { getTenants } from '../services/tenantAPI';

const TenantSelector = () => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const {
        currentTenant,
        userTenants,
        setCurrentTenant,
        setUserTenants
    } = useAppStore();

    useEffect(() => {
        const fetchTenants = async () => {
            try {
                setLoading(true);
                const response = await getTenants();
                setUserTenants(response.tenants);

                // If no current tenant is selected but we have tenants, select the first one
                if (!currentTenant && response.tenants.length > 0) {
                    setCurrentTenant(response.tenants[0]);
                }
            } catch (error) {
                console.error('Failed to fetch tenants:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTenants();
    }, [setUserTenants, setCurrentTenant, currentTenant]);

    const handleTenantChange = async (tenant) => {
        setCurrentTenant(tenant);
        setIsOpen(false);

        // Clear local data and reload from server with new tenant context
        const store = useAppStore.getState();
        await store.loadLocalData();

        // Navigate to dashboard
        navigate('/');
    };

    if (loading && !currentTenant) {
        return <div className="animate-pulse h-10 w-48 bg-gray-200 rounded"></div>;
    }

    if (!currentTenant) {
        return (
            <button
                onClick={() => navigate('/tenants/create')}
                className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-green-600 transition-colors"
            >
                <Plus size={16} />
                <span>Create Organization</span>
            </button>
        );
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
                <div className="w-8 h-8 rounded bg-green-100 flex items-center justify-center text-green-700">
                    <Building size={16} />
                </div>
                <div className="text-left">
                    <p className="text-sm font-semibold text-gray-900 leading-none">
                        {currentTenant.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        {currentTenant.role}
                    </p>
                </div>
                <ChevronDown size={14} className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <div className="px-2 py-1.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Switch Organization
                    </div>

                    {userTenants.map((tenant) => (
                        <button
                            key={tenant.id}
                            onClick={() => handleTenantChange(tenant)}
                            className={`w-full flex items-center space-x-3 px-3 py-2 text-sm transition-colors ${currentTenant.id === tenant.id
                                    ? 'bg-green-50 text-green-700'
                                    : 'text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            <div className={`w-2 h-2 rounded-full ${currentTenant.id === tenant.id ? 'bg-green-500' : 'bg-transparent'
                                }`} />
                            <span className="truncate">{tenant.name}</span>
                        </button>
                    ))}

                    <div className="border-t border-gray-100 mt-1 pt-1">
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                navigate('/tenants/create');
                            }}
                            className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-green-600 hover:bg-gray-50 transition-colors"
                        >
                            <Plus size={14} />
                            <span>Create New Organization</span>
                        </button>
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                navigate('/tenants/settings');
                            }}
                            className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-green-600 hover:bg-gray-50 transition-colors"
                        >
                            <Building size={14} />
                            <span>Organization Settings</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TenantSelector;
