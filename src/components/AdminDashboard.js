import React, { useState, useEffect } from 'react';
import { Building, Users, BarChart3, Package, ArrowRight, Search, Shield, LogOut, Crown, Star, Zap, Gift, Calendar, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/appStore';
import FloraTrackLogo from './FloraTrackLogo';
import axios from 'axios';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { user, logout } = useAppStore();
    const [stats, setStats] = useState(null);
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTenant, setSelectedTenant] = useState(null);
    const [showTenantDetails, setShowTenantDetails] = useState(false);
    const [subscriptionFilter, setSubscriptionFilter] = useState('all');
    const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
    const [subscriptionFormData, setSubscriptionFormData] = useState({
        subscription_tier: '',
        subscription_status: '',
        subscription_expires_at: ''
    });

    const API_URL = process.env.REACT_APP_FLORA_API_URL || 'http://localhost:8000/api/v1';

    useEffect(() => {
        fetchAdminData();
    }, []);

    const fetchAdminData = async () => {
        try {
            const token = localStorage.getItem('flora_auth_token');
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };

            // Fetch platform stats
            const statsResponse = await axios.get(`${API_URL}/admin/stats`, config);
            setStats(statsResponse.data);

            // Fetch all tenants
            const tenantsResponse = await axios.get(`${API_URL}/admin/tenants`, config);
            setTenants(tenantsResponse.data);
            setError(null);
        } catch (error) {
            console.error('Error fetching admin data:', error);
            setError(error.response?.data?.detail || error.message || 'Failed to load admin data');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const getSubscriptionIcon = (tier) => {
        switch(tier) {
            case 'enterprise': return <Crown className="w-4 h-4" />;
            case 'premium': return <Star className="w-4 h-4" />;
            case 'basic': return <Zap className="w-4 h-4" />;
            default: return <Gift className="w-4 h-4" />;
        }
    };

    const getSubscriptionColor = (tier) => {
        switch(tier) {
            case 'enterprise': return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'premium': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'basic': return 'bg-green-100 text-green-800 border-green-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusColor = (status) => {
        switch(status) {
            case 'active': return 'bg-green-100 text-green-800';
            case 'suspended': return 'bg-yellow-100 text-yellow-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const handleUpdateSubscription = async () => {
        try {
            const token = localStorage.getItem('flora_auth_token');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            const updateData = {};
            if (subscriptionFormData.subscription_tier) {
                updateData.subscription_tier = subscriptionFormData.subscription_tier;
            }
            if (subscriptionFormData.subscription_status) {
                updateData.subscription_status = subscriptionFormData.subscription_status;
            }
            if (subscriptionFormData.subscription_expires_at) {
                updateData.subscription_expires_at = new Date(subscriptionFormData.subscription_expires_at).toISOString();
            }

            await axios.patch(
                `${API_URL}/admin/tenants/${selectedTenant.id}/subscription`,
                updateData,
                config
            );

            setShowSubscriptionModal(false);
            await fetchAdminData();
        } catch (error) {
            console.error('Error updating subscription:', error);
            alert(error.response?.data?.detail || 'Failed to update subscription');
        }
    };

    const handleToggleTenantStatus = async (tenantId, currentStatus) => {
        if (!window.confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this tenant?`)) {
            return;
        }

        try {
            const token = localStorage.getItem('flora_auth_token');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            await axios.patch(
                `${API_URL}/admin/tenants/${tenantId}/status`,
                { is_active: !currentStatus },
                config
            );

            await fetchAdminData();
        } catch (error) {
            console.error('Error updating tenant status:', error);
            alert(error.response?.data?.detail || 'Failed to update tenant status');
        }
    };

    const filteredTenants = (tenants || []).filter(tenant => {
        const matchesSearch = tenant.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tenant.subdomain?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSubscription = subscriptionFilter === 'all' || tenant.subscription_tier === subscriptionFilter;
        return matchesSearch && matchesSubscription;
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
                    <div className="text-red-600 text-center mb-4">
                        <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <h2 className="text-2xl font-bold mb-2">Error Loading Dashboard</h2>
                        <p className="text-gray-600">{error}</p>
                    </div>
                    <button
                        onClick={() => { setError(null); setLoading(true); fetchAdminData(); }}
                        className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
                    >
                        Try Again
                    </button>
                    <button
                        onClick={handleLogout}
                        className="w-full mt-2 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                        Logout
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                            <FloraTrackLogo width={140} height={35} />
                            <div className="flex items-center space-x-2 bg-purple-100 px-3 py-1 rounded-full">
                                <Shield className="w-4 h-4 text-purple-600" />
                                <span className="text-sm font-medium text-purple-600">Platform Admin</span>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="text-right">
                                <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
                                <p className="text-xs text-gray-500">{user?.email}</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Platform Statistics */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Platform Overview</h2>

                    {/* Main Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Tenants</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.total_tenants || 0}</p>
                                </div>
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <Building className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Active Tenants</p>
                                    <p className="text-3xl font-bold text-green-900 mt-2">{stats?.active_tenants || 0}</p>
                                </div>
                                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                    <Building className="w-6 h-6 text-green-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.total_users || 0}</p>
                                </div>
                                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <Users className="w-6 h-6 text-purple-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Crops</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.total_crops || 0}</p>
                                </div>
                                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                    <BarChart3 className="w-6 h-6 text-green-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Orders</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.total_orders || 0}</p>
                                </div>
                                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                                    <Package className="w-6 h-6 text-orange-600" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Subscription Breakdown */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Subscription Breakdown</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 flex items-center">
                                            <Crown className="w-4 h-4 mr-2 text-purple-600" />
                                            Enterprise
                                        </p>
                                        <p className="text-2xl font-bold text-gray-900 mt-2">
                                            {stats?.subscription_breakdown?.enterprise || 0}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 flex items-center">
                                            <Star className="w-4 h-4 mr-2 text-blue-600" />
                                            Premium
                                        </p>
                                        <p className="text-2xl font-bold text-gray-900 mt-2">
                                            {stats?.subscription_breakdown?.premium || 0}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 flex items-center">
                                            <Zap className="w-4 h-4 mr-2 text-green-600" />
                                            Basic
                                        </p>
                                        <p className="text-2xl font-bold text-gray-900 mt-2">
                                            {stats?.subscription_breakdown?.basic || 0}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-gray-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 flex items-center">
                                            <Gift className="w-4 h-4 mr-2 text-gray-600" />
                                            Free
                                        </p>
                                        <p className="text-2xl font-bold text-gray-900 mt-2">
                                            {stats?.subscription_breakdown?.free || 0}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tenants List */}
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <h3 className="text-lg font-semibold text-gray-900">All Organizations</h3>
                            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                                {/* Subscription Filter */}
                                <select
                                    value={subscriptionFilter}
                                    onChange={(e) => setSubscriptionFilter(e.target.value)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                >
                                    <option value="all">All Plans</option>
                                    <option value="enterprise">Enterprise</option>
                                    <option value="premium">Premium</option>
                                    <option value="basic">Basic</option>
                                    <option value="free">Free</option>
                                </select>

                                {/* Search */}
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search organizations..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organization</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subscription</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sub. Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expires</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Users</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredTenants.map((tenant) => (
                                    <tr key={tenant.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-medium text-gray-900">{tenant.name}</div>
                                            <div className="text-xs text-gray-500">{tenant.subdomain}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {tenant.is_active ? (
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                                    Inactive
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 inline-flex items-center gap-1 text-xs font-semibold rounded-full border ${getSubscriptionColor(tenant.subscription_tier)}`}>
                                                {getSubscriptionIcon(tenant.subscription_tier)}
                                                <span className="capitalize">{tenant.subscription_tier}</span>
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(tenant.subscription_status)}`}>
                                                {tenant.subscription_status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {tenant.subscription_expires_at ? (
                                                <div className="flex items-center text-xs text-gray-600">
                                                    <Calendar className="w-3 h-3 mr-1" />
                                                    {new Date(tenant.subscription_expires_at).toLocaleDateString()}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm text-gray-600">{tenant.user_count}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedTenant(tenant);
                                                        setShowTenantDetails(true);
                                                    }}
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    View
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedTenant(tenant);
                                                        setSubscriptionFormData({
                                                            subscription_tier: tenant.subscription_tier,
                                                            subscription_status: tenant.subscription_status,
                                                            subscription_expires_at: tenant.subscription_expires_at ? tenant.subscription_expires_at.split('T')[0] : ''
                                                        });
                                                        setShowSubscriptionModal(true);
                                                    }}
                                                    className="text-green-600 hover:text-green-900"
                                                >
                                                    Manage
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {filteredTenants.length === 0 && (
                        <div className="text-center py-12">
                            <Building className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No organizations found</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                {searchTerm ? 'Try adjusting your search' : 'No organizations have been created yet'}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Subscription Management Modal */}
            {showSubscriptionModal && selectedTenant && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Manage Subscription</h2>
                                <p className="text-gray-500 mt-1">{selectedTenant.name}</p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowSubscriptionModal(false);
                                    setSelectedTenant(null);
                                }}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <span className="text-3xl">&times;</span>
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Subscription Tier */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Subscription Tier
                                </label>
                                <select
                                    value={subscriptionFormData.subscription_tier}
                                    onChange={(e) => setSubscriptionFormData({
                                        ...subscriptionFormData,
                                        subscription_tier: e.target.value
                                    })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                >
                                    <option value="free">Free</option>
                                    <option value="basic">Basic</option>
                                    <option value="premium">Premium</option>
                                    <option value="enterprise">Enterprise</option>
                                </select>
                            </div>

                            {/* Subscription Status */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Subscription Status
                                </label>
                                <select
                                    value={subscriptionFormData.subscription_status}
                                    onChange={(e) => setSubscriptionFormData({
                                        ...subscriptionFormData,
                                        subscription_status: e.target.value
                                    })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                >
                                    <option value="active">Active</option>
                                    <option value="suspended">Suspended</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>

                            {/* Expiration Date */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                                    <Calendar className="w-4 h-4 mr-2" />
                                    Expiration Date
                                </label>
                                <input
                                    type="date"
                                    value={subscriptionFormData.subscription_expires_at}
                                    onChange={(e) => setSubscriptionFormData({
                                        ...subscriptionFormData,
                                        subscription_expires_at: e.target.value
                                    })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Leave empty for no expiration
                                </p>
                            </div>

                            {/* Current Status Alert */}
                            {selectedTenant.subscription_expires_at &&
                             new Date(selectedTenant.subscription_expires_at) < new Date() && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start">
                                    <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm text-yellow-800">
                                        <p className="font-semibold">Subscription Expired</p>
                                        <p className="mt-1">
                                            This tenant's subscription expired on {new Date(selectedTenant.subscription_expires_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={handleUpdateSubscription}
                                    className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
                                >
                                    Update Subscription
                                </button>
                                <button
                                    onClick={() => {
                                        setShowSubscriptionModal(false);
                                        setSelectedTenant(null);
                                    }}
                                    className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tenant Details Modal */}
            {showTenantDetails && selectedTenant && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-3xl font-bold text-gray-900">{selectedTenant.name}</h2>
                                <p className="text-gray-500 mt-1">{selectedTenant.subdomain}</p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowTenantDetails(false);
                                    setSelectedTenant(null);
                                }}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <span className="text-3xl">&times;</span>
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Status and Subscription */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="text-sm text-gray-500 mb-2">Tenant Status</div>
                                    <div className="flex items-center">
                                        {selectedTenant.is_active ? (
                                            <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                Active
                                            </span>
                                        ) : (
                                            <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                                Inactive
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="text-sm text-gray-500 mb-2">Subscription Tier</div>
                                    <div className={`inline-flex items-center gap-1 px-3 py-1 text-sm font-semibold rounded-full border ${getSubscriptionColor(selectedTenant.subscription_tier)}`}>
                                        {getSubscriptionIcon(selectedTenant.subscription_tier)}
                                        <span className="capitalize">{selectedTenant.subscription_tier}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Subscription Details */}
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                <div className="text-sm text-blue-700 font-semibold mb-3">Subscription Details</div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <div className="text-xs text-blue-600">Status</div>
                                        <div className={`mt-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedTenant.subscription_status)}`}>
                                            {selectedTenant.subscription_status}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-blue-600">Expires</div>
                                        <div className="text-sm font-medium text-blue-900 mt-1">
                                            {selectedTenant.subscription_expires_at ? (
                                                new Date(selectedTenant.subscription_expires_at).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })
                                            ) : (
                                                'Never'
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <div className="text-sm text-blue-600 mb-1">Total Users</div>
                                    <div className="text-2xl font-bold text-blue-900">
                                        {selectedTenant.user_count}
                                    </div>
                                </div>
                                <div className="bg-purple-50 p-4 rounded-lg">
                                    <div className="text-sm text-purple-600 mb-1">Created</div>
                                    <div className="text-lg font-semibold text-purple-900">
                                        {new Date(selectedTenant.created_at).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="pt-4 border-t border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
                                <div className="space-y-2">
                                    <button
                                        onClick={() => {
                                            setShowTenantDetails(false);
                                            setSubscriptionFormData({
                                                subscription_tier: selectedTenant.subscription_tier,
                                                subscription_status: selectedTenant.subscription_status,
                                                subscription_expires_at: selectedTenant.subscription_expires_at ? selectedTenant.subscription_expires_at.split('T')[0] : ''
                                            });
                                            setShowSubscriptionModal(true);
                                        }}
                                        className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center"
                                    >
                                        <Crown className="w-5 h-5 mr-2" />
                                        Manage Subscription
                                    </button>
                                    <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center">
                                        <Users className="w-5 h-5 mr-2" />
                                        View Users
                                    </button>
                                    <button className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center">
                                        <BarChart3 className="w-5 h-5 mr-2" />
                                        View Analytics
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleToggleTenantStatus(selectedTenant.id, selectedTenant.is_active);
                                            setShowTenantDetails(false);
                                        }}
                                        className={`w-full py-3 px-4 rounded-lg transition-colors font-medium flex items-center justify-center ${
                                            selectedTenant.is_active
                                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                                        }`}
                                    >
                                        <Shield className="w-5 h-5 mr-2" />
                                        {selectedTenant.is_active ? 'Deactivate Tenant' : 'Activate Tenant'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
