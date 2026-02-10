import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, ArrowRight, Check, User, Mail, Lock } from 'lucide-react';
import { registerTenant } from '../services/tenantAPI';
import { useAppStore } from '../stores/appStore';

const TenantCreation = () => {
    const navigate = useNavigate();
    const { setCurrentTenant, setUserTenants, userTenants, login } = useAppStore();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        // User fields
        email: '',
        username: '',
        password: '',
        full_name: '',
        // Tenant fields
        name: '',
        subdomain: '',
        description: '',
        contact_email: '',
        contact_phone: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Auto-generate subdomain from name if subdomain is empty
        if (name === 'name' && !formData.subdomain) {
            const slug = value
                .toLowerCase()
                .replace(/[^a-z0-9]/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '');

            setFormData(prev => ({
                ...prev,
                [name]: value,
                subdomain: slug
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Register tenant and user
            const response = await registerTenant(formData);

            // Save token
            localStorage.setItem('flora_auth_token', response.access_token);

            // Login to populate user state
            const loginResult = await login({ email: formData.email, password: formData.password });

            if (loginResult.success) {
                // Redirect to dashboard
                navigate('/');
            } else {
                setError('Registration successful, but login failed. Please try logging in.');
            }
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to create organization. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600">
                        <Building size={24} />
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Create your organization
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Set up your workspace to manage crops, orders, and team members.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    {error && (
                        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="border-b border-gray-200 pb-4 mb-4">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Your Account</h3>

                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                                        Full Name
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            id="full_name"
                                            name="full_name"
                                            type="text"
                                            required
                                            value={formData.full_name}
                                            onChange={handleChange}
                                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                        Email Address
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                            placeholder="john@example.com"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                                        Username
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            id="username"
                                            name="username"
                                            type="text"
                                            required
                                            value={formData.username}
                                            onChange={handleChange}
                                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                            placeholder="johndoe"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                        Password
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            id="password"
                                            name="password"
                                            type="password"
                                            required
                                            minLength="6"
                                            value={formData.password}
                                            onChange={handleChange}
                                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                    <p className="mt-1 text-xs text-gray-500">
                                        Minimum 6 characters
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Organization Details</h3>
                        </div>

                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                Organization Name
                            </label>
                            <div className="mt-1">
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                    placeholder="e.g. Green Valley Nursery"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="subdomain" className="block text-sm font-medium text-gray-700">
                                Workspace URL
                            </label>
                            <div className="mt-1 flex rounded-md shadow-sm">
                                <input
                                    id="subdomain"
                                    name="subdomain"
                                    type="text"
                                    required
                                    pattern="[a-z0-9-]+"
                                    value={formData.subdomain}
                                    onChange={handleChange}
                                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md border border-gray-300 focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                    placeholder="green-valley"
                                />
                                <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                                    .floratrack.com
                                </span>
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                                Only lowercase letters, numbers, and dashes allow.
                            </p>
                        </div>

                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                                Description (Optional)
                            </label>
                            <div className="mt-1">
                                <textarea
                                    id="description"
                                    name="description"
                                    rows={3}
                                    value={formData.description}
                                    onChange={handleChange}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="contact_email" className="block text-sm font-medium text-gray-700">
                                    Contact Email
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="contact_email"
                                        name="contact_email"
                                        type="email"
                                        value={formData.contact_email}
                                        onChange={handleChange}
                                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="contact_phone" className="block text-sm font-medium text-gray-700">
                                    Contact Phone
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="contact_phone"
                                        name="contact_phone"
                                        type="tel"
                                        value={formData.contact_phone}
                                        onChange={handleChange}
                                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${loading ? 'opacity-75 cursor-not-allowed' : ''
                                    }`}
                            >
                                {loading ? (
                                    <span className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Creating...
                                    </span>
                                ) : (
                                    <span className="flex items-center">
                                        Create Organization <ArrowRight className="ml-2 w-4 h-4" />
                                    </span>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default TenantCreation;
