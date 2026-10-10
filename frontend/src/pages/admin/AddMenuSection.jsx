import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Upload, Tag } from 'lucide-react';

const AddMenuSection = () => {
    // --- Category State ---
    const [categories, setCategories] = useState([]);
    const [categoryName, setCategoryName] = useState('');
    const [categoryMsg, setCategoryMsg] = useState({ type: '', text: '' });
    const [categoryLoading, setCategoryLoading] = useState(false);

    // --- Menu Item State ---
    const [itemData, setItemData] = useState({
        name: '',
        description: '',
        price: '',
        categoryId: '',
        image: null
    });
    const [itemMsg, setItemMsg] = useState({ type: '', text: '' });
    const [itemLoading, setItemLoading] = useState(false);

    // Fetch Categories on Mount
    const fetchCategories = async () => {
        try {
            const response = await axios.get('/api/menu/category');
            if (response.data.success) {
                setCategories(response.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch categories", error);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    // --- Handlers for Category ---
    const handleCategorySubmit = async (e) => {
        e.preventDefault();
        setCategoryLoading(true);
        setCategoryMsg({ type: '', text: '' });

        try {
            await axios.post('/api/menu/category', { name: categoryName });
            setCategoryMsg({ type: 'success', text: 'Category added successfully!' });
            setCategoryName('');
            fetchCategories(); // Refresh list
        } catch (error) {
            setCategoryMsg({ type: 'error', text: error.response?.data?.message || 'Failed to add category' });
        } finally {
            setCategoryLoading(false);
        }
    };

    // --- Handlers for Menu Item ---
    const handleItemChange = (e) => {
        const { name, value } = e.target;
        setItemData({ ...itemData, [name]: value });
    };

    const handleFileChange = (e) => {
        setItemData({ ...itemData, image: e.target.files[0] });
    };

    const handleItemSubmit = async (e) => {
        e.preventDefault();
        setItemLoading(true);
        setItemMsg({ type: '', text: '' });

        const data = new FormData();
        data.append('name', itemData.name);
        data.append('description', itemData.description);
        data.append('price', itemData.price);
        data.append('categoryId', itemData.categoryId);
        if (itemData.image) {
            data.append('image', itemData.image);
        }

        try {
            await axios.post('/api/menu/item', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setItemMsg({ type: 'success', text: 'Menu item added successfully!' });
            setItemData({ name: '', description: '', price: '', categoryId: '', image: null });
        } catch (error) {
            setItemMsg({ type: 'error', text: error.response?.data?.message || 'Failed to add item' });
        } finally {
            setItemLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-orange-500 mb-6">Manage Menu</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* --- Add Category Section --- */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg h-fit border border-gray-200 dark:border-gray-700 transition-colors">
                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-gray-800 dark:text-white">
                        <Tag className="text-orange-500" size={24} /> Add Category
                    </h2>

                    {categoryMsg.text && (
                        <div className={`p-3 mb-4 rounded ${categoryMsg.type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white`}>
                            {categoryMsg.text}
                        </div>
                    )}

                    <form onSubmit={handleCategorySubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Category Name</label>
                            <input
                                type="text"
                                value={categoryName}
                                onChange={(e) => setCategoryName(e.target.value)}
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:outline-none focus:border-orange-500"
                                placeholder="e.g. Starters, Main Course"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={categoryLoading}
                            className={`w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded transition ${categoryLoading ? 'opacity-50' : ''}`}
                        >
                            {categoryLoading ? 'Adding...' : 'Add Category'}
                        </button>
                    </form>
                </div>

                {/* --- Add Menu Item Section --- */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 transition-colors">
                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-gray-800 dark:text-white">
                        <Plus className="text-orange-500" size={24} /> Add Menu Item
                    </h2>

                    {itemMsg.text && (
                        <div className={`p-3 mb-4 rounded ${itemMsg.type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white`}>
                            {itemMsg.text}
                        </div>
                    )}

                    <form onSubmit={handleItemSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Item Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={itemData.name}
                                    onChange={handleItemChange}
                                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:outline-none focus:border-orange-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Price (₹)</label>
                                <input
                                    type="number"
                                    name="price"
                                    value={itemData.price}
                                    onChange={handleItemChange}
                                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:outline-none focus:border-orange-500"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Description</label>
                            <textarea
                                name="description"
                                value={itemData.description}
                                onChange={handleItemChange}
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:outline-none focus:border-orange-500 h-20"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Category</label>
                            <select
                                name="categoryId"
                                value={itemData.categoryId}
                                onChange={handleItemChange}
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:outline-none focus:border-orange-500"
                                required
                            >
                                <option value="" disabled>Select a Category</option>
                                {categories.map((cat) => (
                                    <option key={cat._id} value={cat._id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Image</label>
                            <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 hover:border-orange-500 transition">
                                <input
                                    type="file"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    accept="image/*"
                                />
                                <div className="text-center">
                                    <Upload className="mx-auto h-8 w-8 text-gray-400" />
                                    <p className="mt-1 text-sm text-gray-400">
                                        {itemData.image ? itemData.image.name : "Upload Image"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={itemLoading}
                            className={`w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded transition ${itemLoading ? 'opacity-50' : ''}`}
                        >
                            {itemLoading ? 'Adding Item...' : 'Add Menu Item'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddMenuSection;
