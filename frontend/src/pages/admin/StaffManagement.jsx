import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { UserPlus, Trash2, Shield, Users } from 'lucide-react';

const StaffManagement = () => {
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        username: '',
        password: '',
        role: 'waiter' // default
    });
    const [message, setMessage] = useState({ type: '', text: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchStaff = async () => {
        try {
            const response = await axios.get('/api/staff/list');
            if (response.data.success) {
                setStaffList(response.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch staff", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStaff();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage({ type: '', text: '' });

        try {
            const response = await axios.post('/api/staff/add', formData);
            if (response.data.success) {
                setMessage({ type: 'success', text: 'Staff member added successfully!' });
                setFormData({ fullName: '', email: '', username: '', password: '', role: 'waiter' });
                fetchStaff();
            }
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to add staff' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRemove = async (staffId) => {
        if (!window.confirm("Are you sure you want to remove this staff member?")) return;

        try {
            await axios.delete(`/api/staff/remove/${staffId}`);
            fetchStaff();
        } catch (error) {
            alert(error.response?.data?.message || "Failed to remove staff");
        }
    };

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-orange-500 mb-6 flex items-center gap-2">
                <Users size={32} /> Staff Management
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* --- Add Staff Form --- */}
                <div className="lg:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg h-fit border border-gray-200 dark:border-gray-700 transition-colors">
                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-gray-800 dark:text-white">
                        <UserPlus className="text-orange-500" size={24} /> Add New Staff
                    </h2>

                    {message.text && (
                        <div className={`p-3 mb-4 rounded ${message.type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white`}>
                            {message.text}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Full Name</label>
                            <input
                                type="text"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleChange}
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:outline-none focus:border-orange-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Username</label>
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:outline-none focus:border-orange-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:outline-none focus:border-orange-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Password</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:outline-none focus:border-orange-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Role</label>
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:outline-none focus:border-orange-500"
                            >
                                <option value="waiter">Waiter</option>
                                <option value="chef">Chef</option>
                                <option value="manager">Manager</option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded transition ${isSubmitting ? 'opacity-50' : ''}`}
                        >
                            {isSubmitting ? 'Adding...' : 'Add Staff Member'}
                        </button>
                    </form>
                </div>

                {/* --- Staff List --- */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 transition-colors duration-300">
                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-gray-800 dark:text-white">
                        <Shield className="text-orange-500" size={24} /> Existing Staff
                    </h2>

                    {loading ? (
                        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-gray-600 dark:text-gray-300">
                                <thead className="text-xs uppercase bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                                    <tr>
                                        <th className="px-4 py-3">Name</th>
                                        <th className="px-4 py-3">Role</th>
                                        <th className="px-4 py-3">Username</th>
                                        <th className="px-4 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {staffList.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="text-center py-4">No staff members found</td>
                                        </tr>
                                    ) : (
                                        staffList.map((staff) => (
                                            <tr key={staff._id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{staff.fullName}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${staff.role === 'admin' ? 'bg-red-900 text-red-100' :
                                                        staff.role === 'chef' ? 'bg-green-900 text-green-100' :
                                                            staff.role === 'waiter' ? 'bg-blue-900 text-blue-100' :
                                                                'bg-gray-600'
                                                        }`}>
                                                        {staff.role}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">{staff.username}</td>
                                                <td className="px-4 py-3 text-right">
                                                    {staff.role !== 'admin' && ( // Prevent removing admins easily here
                                                        <button
                                                            onClick={() => handleRemove(staff._id)}
                                                            className="text-red-400 hover:text-red-300 p-1"
                                                            title="Remove Staff"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StaffManagement;
