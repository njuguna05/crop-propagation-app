import React, { useState, useEffect } from 'react';
import {
    Building,
    Users,
    Settings as SettingsIcon,
    Trash2,
    UserPlus,
    Shield,
    Save,
    Check
} from 'lucide-react';
import {
    getTenant,
    updateTenant,
    deleteTenant,
    getTenantUsers,
    inviteUserToTenant,
    removeUserFromTenant,
    updateUserRole,
    updateTenantSettings
} from '../services/tenantAPI';
import useAppStore from '../stores/appStore';

const TenantSettings = () => {
    const { currentTenant, tenantRole } = useAppStore();
    const [activeTab, setActiveTab] = useState('general');
    const [loading, setLoading] = useState(false);
    const [tenantData, setTenantData] = useState(null);
    const [users, setUsers] = useState([]);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Invitation form state
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('member');
    const [inviting, setInviting] = useState(false);

    // Settings form state
    const [settingsForm, setSettingsForm] = useState({
        name: '',
        description: '',
        contact_email: '',
        contact_phone: ''
    });

    const isOwner = tenantRole === 'owner';
    const isAdmin = ['owner', 'admin'].includes(tenantRole);

    useEffect(() => {
        if (currentTenant?.id) {
            fetchTenantData();
            if (activeTab === 'users') {
                fetchUsers();
            }
        }
    }, [currentTenant, activeTab]);

    const fetchTenantData = async () => {
        try {
            setLoading(true);
            const data = await getTenant(currentTenant.id);
            setTenantData(data);
            setSettingsForm({
                name: data.name,
                description: data.description || '',
                contact_email: data.contact_email || '',
                contact_phone: data.contact_phone || ''
            });
        } catch (error) {
            console.error('Failed to fetch tenant data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const data = await getTenantUsers(currentTenant.id);
            setUsers(data);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        }
    };

    const handleUpdateTenant = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            await updateTenant(currentTenant.id, settingsForm);
            setMessage({ type: 'success', text: 'Organization settings updated successfully' });
            fetchTenantData();
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to update settings' });
        } finally {
            setLoading(false);
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        }
    };

    const handleInviteUser = async (e) => {
        e.preventDefault();
        if (!inviteEmail) return;

        try {
            setInviting(true);
            await inviteUserToTenant(currentTenant.id, {
                email: inviteEmail,
                role: inviteRole
            });
            setMessage({ type: 'success', text: `Invitation sent to ${inviteEmail}` });
            setInviteEmail('');
            fetchUsers();
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to invite user' });
        } finally {
            setInviting(false);
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        }
    };

    const handleRemoveUser = async (userId) => {
        if (!window.confirm('Are you sure you want to remove this user?')) return;

        try {
            await removeUserFromTenant(currentTenant.id, userId);
            setMessage({ type: 'success', text: 'User removed successfully' });
            fetchUsers();
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to remove user' });
        }
    };

    const handleUpdateRole = async (userId, newRole) => {
        try {
            await updateUserRole(currentTenant.id, userId, { role: newRole });
            setMessage({ type: 'success', text: 'User role updated' });
            fetchUsers();
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to update role' });
        }
    };

    if (!currentTenant) return null;

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="md:flex md:items-center md:justify-between mb-8">
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                        Organization Settings
                    </h2>
                </div>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex">
                        <button
                            onClick={() => setActiveTab('general')}
                            className={`${activeTab === 'general'
                                    ? 'border-green-500 text-green-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } w-1/4 py-4 px-1 text-center border-b-2 font-medium text-sm`}
                        >
                            General
                        </button>
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`${activeTab === 'users'
                                    ? 'border-green-500 text-green-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } w-1/4 py-4 px-1 text-center border-b-2 font-medium text-sm`}
                        >
                            Team Members
                        </button>
                        {/* Add more tabs as needed */}
                    </nav>
                </div>

                <div className="p-6">
                    {message.text && (
                        <div className={`mb-4 p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                            }`}>
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    {message.type === 'success' ? (
                                        <Check className="h-5 w-5" />
                                    ) : (
                                        <Shield className="h-5 w-5" />
                                    )}
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm font-medium">{message.text}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'general' && (
                        <form onSubmit={handleUpdateTenant} className="space-y-6">
                            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                                <div className="sm:col-span-4">
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                        Organization Name
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            type="text"
                                            name="name"
                                            id="name"
                                            disabled={!isAdmin}
                                            value={settingsForm.name}
                                            onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                                            className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                        />
                                    </div>
                                </div>

                                <div className="sm:col-span-6">
                                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                                        Description
                                    </label>
                                    <div className="mt-1">
                                        <textarea
                                            id="description"
                                            name="description"
                                            rows={3}
                                            disabled={!isAdmin}
                                            value={settingsForm.description}
                                            onChange={(e) => setSettingsForm({ ...settingsForm, description: e.target.value })}
                                            className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                                        />
                                    </div>
                                </div>

                                <div className="sm:col-span-3">
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                        Contact Email
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            type="email"
                                            name="contact_email"
                                            id="email"
                                            disabled={!isAdmin}
                                            value={settingsForm.contact_email}
                                            onChange={(e) => setSettingsForm({ ...settingsForm, contact_email: e.target.value })}
                                            className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                        />
                                    </div>
                                </div>

                                <div className="sm:col-span-3">
                                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                                        Contact Phone
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            type="text"
                                            name="contact_phone"
                                            id="phone"
                                            disabled={!isAdmin}
                                            value={settingsForm.contact_phone}
                                            onChange={(e) => setSettingsForm({ ...settingsForm, contact_phone: e.target.value })}
                                            className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                        />
                                    </div>
                                </div>
                            </div>

                            {isAdmin && (
                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                    >
                                        {loading ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            )}
                        </form>
                    )}

                    {activeTab === 'users' && (
                        <div className="space-y-6">
                            {isAdmin && (
                                <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Invite New Member</h3>
                                    <form onSubmit={handleInviteUser} className="flex gap-4 items-end">
                                        <div className="flex-1">
                                            <label htmlFor="invite-email" className="block text-sm font-medium text-gray-700">
                                                Email Address
                                            </label>
                                            <input
                                                type="email"
                                                id="invite-email"
                                                required
                                                value={inviteEmail}
                                                onChange={(e) => setInviteEmail(e.target.value)}
                                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                                placeholder="colleague@example.com"
                                            />
                                        </div>
                                        <div className="w-48">
                                            <label htmlFor="invite-role" className="block text-sm font-medium text-gray-700">
                                                Role
                                            </label>
                                            <select
                                                id="invite-role"
                                                value={inviteRole}
                                                onChange={(e) => setInviteRole(e.target.value)}
                                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                            >
                                                <option value="admin">Admin</option>
                                                <option value="member">Member</option>
                                                <option value="viewer">Viewer</option>
                                            </select>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={inviting}
                                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                                        >
                                            <UserPlus className="h-4 w-4 mr-2" />
                                            {inviting ? 'Inviting...' : 'Invite'}
                                        </button>
                                    </form>
                                </div>
                            )}

                            <div className="flex flex-col">
                                <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                                    <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                                        <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            User
                                                        </th>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Role
                                                        </th>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Joined
                                                        </th>
                                                        {isAdmin && (
                                                            <th scope="col" className="relative px-6 py-3">
                                                                <span className="sr-only">Actions</span>
                                                            </th>
                                                        )}
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {users.map((user) => (
                                                        <tr key={user.id}>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="flex items-center">
                                                                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold">
                                                                        {user.user_full_name?.charAt(0) || user.user_username?.charAt(0)}
                                                                    </div>
                                                                    <div className="ml-4">
                                                                        <div className="text-sm font-medium text-gray-900">
                                                                            {user.user_full_name}
                                                                        </div>
                                                                        <div className="text-sm text-gray-500">
                                                                            {user.user_email}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                {isOwner && user.role !== 'owner' ? (
                                                                    <select
                                                                        value={user.role}
                                                                        onChange={(e) => handleUpdateRole(user.user_id, e.target.value)}
                                                                        className="text-sm rounded border-gray-300 focus:ring-green-500 focus:border-green-500"
                                                                    >
                                                                        <option value="admin">Admin</option>
                                                                        <option value="member">Member</option>
                                                                        <option value="viewer">Viewer</option>
                                                                    </select>
                                                                ) : (
                                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'owner' ? 'bg-purple-100 text-purple-800' :
                                                                            user.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                                                                                'bg-green-100 text-green-800'
                                                                        }`}>
                                                                        {user.role}
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {new Date(user.joined_at).toLocaleDateString()}
                                                            </td>
                                                            {isAdmin && (
                                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                                    {user.role !== 'owner' && (
                                                                        <button
                                                                            onClick={() => handleRemoveUser(user.user_id)}
                                                                            className="text-red-600 hover:text-red-900"
                                                                        >
                                                                            <Trash2 className="h-5 w-5" />
                                                                        </button>
                                                                    )}
                                                                </td>
                                                            )}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TenantSettings;
