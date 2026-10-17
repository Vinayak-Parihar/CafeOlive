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
            <div>
                <span className="text-[10px] uppercase tracking-[0.3em] text-[#c2a677] font-semibold">Atelier Team</span>
                <h1 className="text-3xl font-serif font-bold text-[#1e2a1b] tracking-tight">Staff Management</h1>
                <p className="text-stone-500 text-sm mt-0.5">Manage staff accounts, credentials, and role privileges across the venue.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* --- Add Staff Form --- */}
                <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-xs h-fit border border-[#e8e2d5]">
                    <h2 className="text-lg font-serif font-bold mb-5 flex items-center gap-2 text-[#1e2a1b]">
                        <UserPlus className="text-[#c2a677]" size={20} /> Add New Staff
                    </h2>

                    {message.text && (
                        <div className={`p-3 mb-4 rounded-xl text-xs font-semibold ${
                            message.type === 'success' ? 'bg-[#eaf3e8] text-[#245220] border border-[#cbe4c7]' : 'bg-[#fdeeed] text-[#9a2c2c] border border-[#f7cdcd]'
                        }`}>
                            {message.text}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5 text-stone-600">Full Name</label>
                            <input
                                type="text"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleChange}
                                placeholder="e.g. Marco Pierre"
                                className="w-full px-4 py-2.5 bg-[#FAF8F3] border border-[#e8e2d5] rounded-xl text-xs text-[#1e2a1b] focus:outline-none focus:border-[#c2a677]"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5 text-stone-600">Username</label>
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                placeholder="e.g. marco_chef"
                                className="w-full px-4 py-2.5 bg-[#FAF8F3] border border-[#e8e2d5] rounded-xl text-xs text-[#1e2a1b] focus:outline-none focus:border-[#c2a677]"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5 text-stone-600">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="e.g. marco@cafeolive.com"
                                className="w-full px-4 py-2.5 bg-[#FAF8F3] border border-[#e8e2d5] rounded-xl text-xs text-[#1e2a1b] focus:outline-none focus:border-[#c2a677]"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5 text-stone-600">Password</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                className="w-full px-4 py-2.5 bg-[#FAF8F3] border border-[#e8e2d5] rounded-xl text-xs text-[#1e2a1b] focus:outline-none focus:border-[#c2a677]"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5 text-stone-600">Assigned Role</label>
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 bg-[#FAF8F3] border border-[#e8e2d5] rounded-xl text-xs text-[#1e2a1b] focus:outline-none focus:border-[#c2a677]"
                            >
                                <option value="waiter">Service (Waiter)</option>
                                <option value="chef">Kitchen (Chef)</option>
                                <option value="cashier">Cashier (Billing Desk)</option>
                                <option value="manager">Manager</option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`w-full bg-[#1e2a1b] hover:bg-[#2d3e29] text-white text-xs uppercase tracking-wider font-semibold py-3 px-4 rounded-xl shadow-xs transition duration-200 ${isSubmitting ? 'opacity-50' : ''}`}
                        >
                            {isSubmitting ? 'Registering...' : 'Add Staff Member'}
                        </button>
                    </form>
                </div>

                {/* --- Staff List --- */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-xs border border-[#e8e2d5]">
                    <h2 className="text-lg font-serif font-bold mb-5 flex items-center gap-2 text-[#1e2a1b]">
                        <Shield className="text-[#c2a677]" size={20} /> Active Team Roster
                    </h2>

                    {loading ? (
                        <div className="flex justify-center items-center py-16">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#1e2a1b]" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-stone-600 text-xs">
                                <thead className="text-[10px] uppercase tracking-wider bg-[#FAF8F3] text-stone-500 border-b border-[#e8e2d5]">
                                    <tr>
                                        <th className="px-4 py-3.5 font-semibold">Staff Name</th>
                                        <th className="px-4 py-3.5 font-semibold">Role</th>
                                        <th className="px-4 py-3.5 font-semibold">Username</th>
                                        <th className="px-4 py-3.5 font-semibold text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {staffList.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="text-center py-8 text-stone-400 font-serif">No staff members enrolled yet.</td>
                                        </tr>
                                    ) : (
                                        staffList.map((staff) => (
                                            <tr key={staff._id} className="border-b border-[#ece7dc] hover:bg-[#FAF8F3] transition-colors">
                                                <td className="px-4 py-3.5 font-medium text-[#1e2a1b]">{staff.fullName}</td>
                                                <td className="px-4 py-3.5">
                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                                        staff.role === 'admin' ? 'bg-[#FAF8F3] text-[#1e2a1b] border-[#1e2a1b]' :
                                                        staff.role === 'chef' ? 'bg-[#eaf3e8] text-[#245220] border-[#cbe4c7]' :
                                                        staff.role === 'cashier' ? 'bg-[#f4efe6] text-[#784e1b] border-[#e2d5be]' :
                                                        staff.role === 'waiter' ? 'bg-[#eef2f6] text-[#2c4766] border-[#d3dfed]' :
                                                        'bg-[#fef7ea] text-[#935a16] border-[#f5dfb8]'
                                                    }`}>
                                                        {staff.role}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3.5 font-mono text-stone-500">{staff.username}</td>
                                                <td className="px-4 py-3.5 text-right">
                                                    {staff.role !== 'admin' && (
                                                        <button
                                                            onClick={() => handleRemove(staff._id)}
                                                            className="p-1.5 rounded-lg text-stone-400 hover:text-[#9a2c2c] hover:bg-[#fdeeed] transition"
                                                            title="Remove Staff"
                                                        >
                                                            <Trash2 size={15} />
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
