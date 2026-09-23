import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import axios from '../../api/axios';
import { 
    PlusOutlined, 
    EditOutlined, 
    DeleteOutlined, 
    SearchOutlined,
    PoweroffOutlined,
    FilterOutlined,
    CheckOutlined,
    CloseOutlined,
    LoadingOutlined
} from '@ant-design/icons';
import { 
    notification, 
    Modal, 
    Form, 
    Input, 
    InputNumber, 
    Select, 
    Switch, 
    Pagination, 
    Card, 
    Tag, 
    Empty,
    Tooltip,
    Popconfirm
} from 'antd';

const { Option } = Select;

// ─── Inline "Add Category" widget ────────────────────────────────────────────
function AddCategoryInline({ onCreated }) {
    const [mode, setMode]         = useState('idle');   // 'idle' | 'input'
    const [value, setValue]       = useState('');
    const [saving, setSaving]     = useState(false);
    const [error, setError]       = useState('');
    const inputRef                = useRef(null);

    const open = () => {
        setMode('input');
        setError('');
        setValue('');
        // auto-focus on next tick
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    const cancel = () => {
        setMode('idle');
        setValue('');
        setError('');
    };

    const save = async () => {
        const trimmed = value.trim();
        if (!trimmed) {
            setError('Category name cannot be empty.');
            return;
        }
        setSaving(true);
        setError('');
        try {
            const { data } = await axios.post('/menu/categories', { name: trimmed });
            if (data.success && data.data) {
                onCreated(data.data);          // lift the new category up
                cancel();
                notification.success({ message: `Category "${trimmed}" created!` });
            } else {
                setError(data.message || 'Failed to create category.');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Server error. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleKey = (e) => {
        if (e.key === 'Enter') save();
        if (e.key === 'Escape') cancel();
    };

    if (mode === 'idle') {
        return (
            <button
                type="button"
                onClick={open}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-500 hover:text-orange-600 transition-colors ml-1.5 leading-none"
                title="Add a new category"
            >
                <PlusOutlined style={{ fontSize: 10 }} />
                Add Category
            </button>
        );
    }

    return (
        <div className="mt-1.5 flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={e => { setValue(e.target.value); setError(''); }}
                    onKeyDown={handleKey}
                    placeholder="e.g. Starters, Beverages…"
                    disabled={saving}
                    className={`flex-1 text-xs px-2.5 py-1.5 border rounded-lg outline-none transition-all
                        ${error
                            ? 'border-red-400 bg-red-50 focus:border-red-500'
                            : 'border-gray-300 bg-white focus:border-orange-400 focus:ring-1 focus:ring-orange-200'
                        }`}
                    style={{ minWidth: 0 }}
                />

                {/* Save */}
                <button
                    type="button"
                    onClick={save}
                    disabled={saving}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white rounded-lg transition-colors shrink-0"
                >
                    {saving
                        ? <LoadingOutlined style={{ fontSize: 11 }} spin />
                        : <CheckOutlined style={{ fontSize: 11 }} />
                    }
                    {saving ? 'Saving…' : 'Save'}
                </button>

                {/* Cancel */}
                <button
                    type="button"
                    onClick={cancel}
                    disabled={saving}
                    className="flex items-center justify-center w-7 h-7 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
                    title="Cancel"
                >
                    <CloseOutlined style={{ fontSize: 11 }} />
                </button>
            </div>

            {error && (
                <p className="text-[10px] text-red-500 font-medium leading-tight pl-0.5">{error}</p>
            )}
        </div>
    );
}
// ─────────────────────────────────────────────────────────────────────────────

export default function MenuManagement() {
    const { profile, token } = useSelector(state => state.auth);
    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);
    
    // Modal state
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [form] = Form.useForm();

    const fetchCategories = async () => {
        if (!profile?.id) return;
        try {
            const response = await axios.get(`/menu/categories/${profile.id}`);
            if (response.data.success) {
                setCategories(response.data.data || []);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
            setCategories([]);
        }
    };

    const fetchMenu = async (currentPage = page, currentSearch = search, currentCategory = selectedCategory) => {
        if (!profile?.id) {
            setLoading(false);
            setItems([]);
            return;
        }
        setLoading(true);
        try {
            let url = `/menu?restaurantId=${profile.id}&page=${currentPage}&limit=9`;
            if (currentSearch) url += `&search=${currentSearch}`;
            if (currentCategory) url += `&categoryId=${currentCategory}`;

            const response = await axios.get(url);
            if (response.data.success) {
                setItems(response.data.items || []);
                setTotal(response.data.totalItems || 0);
            } else {
                setItems([]);
                setTotal(0);
            }
        } catch (error) {
            console.error('Error fetching menu:', error);
            const msg = error.response?.status === 404
                ? 'Menu route not found — please check the backend is running.'
                : error.message || 'Failed to load menu items.';
            notification.error({ message: 'Could not load menu', description: msg, duration: 5 });
            setItems([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (profile?.id) {
            fetchMenu();
            fetchCategories();
        }
    }, [profile, page]);

    const handleSearch = (e) => {
        setSearch(e.target.value);
        fetchMenu(1, e.target.value, selectedCategory);
        setPage(1);
    };

    const handleCategoryFilter = (val) => {
        setSelectedCategory(val);
        fetchMenu(1, search, val);
        setPage(1);
    };

    const showModal = (item = null) => {
        setEditingItem(item);
        if (item) {
            form.setFieldsValue({
                ...item,
                category_id: item.category_id
            });
        } else {
            form.resetFields();
        }
        setIsModalVisible(true);
    };

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            
            if (editingItem) {
                const { data: res } = await axios.put(`/menu/${editingItem.id}`, values);
                notification.success({ message: 'Item updated successfully' });
                // Optimistically update item in list without waiting for refetch
                if (res.success && res.data) {
                    setItems(prev => prev.map(it => it.id === editingItem.id ? { ...it, ...res.data } : it));
                }
            } else {
                const { data: res } = await axios.post('/menu', values);
                notification.success({ message: 'Item created successfully!' });
                // Optimistically prepend the new item so it shows immediately
                if (res.success && res.data) {
                    const categoryInfo = categories.find(c => c.id === values.category_id);
                    const newItem = {
                        ...res.data,
                        category: categoryInfo ? { name: categoryInfo.name } : null
                    };
                    setItems(prev => [newItem, ...prev]);
                    setTotal(prev => prev + 1);
                }
            }
            
            setIsModalVisible(false);
            // Also re-fetch in background to stay in sync with server
            fetchMenu();
        } catch (error) {
            console.error('Error saving menu item:', error);
            notification.error({ message: error.response?.data?.message || 'Failed to save item' });
        }
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`/menu/${id}`);
            notification.success({ message: 'Item deleted' });
            // Instantly remove from list without refetch
            setItems(prev => prev.filter(it => it.id !== id));
            setTotal(prev => Math.max(0, prev - 1));
        } catch (error) {
            notification.error({ message: 'Failed to delete item' });
        }
    };

    const toggleAvailability = async (id) => {
        // Optimistic: flip is_available immediately in UI
        setItems(prev => prev.map(it => it.id === id ? { ...it, is_available: !it.is_available } : it));
        try {
            await axios.patch(`/menu/${id}/toggle-availability`, {});
        } catch (error) {
            // Revert on failure
            setItems(prev => prev.map(it => it.id === id ? { ...it, is_available: !it.is_available } : it));
            notification.error({ message: 'Failed to update availability' });
        }
    };

    /**
     * Called by AddCategoryInline when a new category is successfully created.
     * Adds the category to the local list and auto-selects it in the form.
     */
    const handleCategoryCreated = (newCategory) => {
        setCategories(prev => [...prev, newCategory]);
        form.setFieldValue('category_id', newCategory.id);
    };

    return (
        <div className="p-8 space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Menu Management</h1>
                    <p className="text-gray-500 mt-1">Manage your restaurant dishes and availability</p>
                </div>
                <button 
                    onClick={() => showModal()}
                    className="btn-primary px-6 py-3 flex items-center gap-2"
                >
                    <PlusOutlined /> Add New Dish
                </button>
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-soft flex flex-wrap gap-4 items-center">
                <div className="flex-1 min-w-[200px]">
                    <Input 
                        prefix={<SearchOutlined className="text-gray-400" />} 
                        placeholder="Search for a dish..." 
                        value={search}
                        onChange={handleSearch}
                        className="rounded-xl border-gray-200"
                        size="large"
                    />
                </div>
                <div className="w-full md:w-64">
                    <Select 
                        placeholder="Filter by category" 
                        allowClear
                        className="w-full h-[40px]"
                        onChange={handleCategoryFilter}
                        suffixIcon={<FilterOutlined />}
                    >
                        {categories.map(c => (
                            <Option key={c.id} value={c.id}>{c.name}</Option>
                        ))}
                    </Select>
                </div>
            </div>

            {loading ? (
                <div className="py-20 text-center text-slate-400 font-medium">Loading menu items...</div>
            ) : (items && items.length > 0) ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {items.map(item => (
                            <Card
                                key={item.id}
                                className={`rounded-3xl shadow-soft hover:shadow-lg transition-all border-none overflow-hidden ${!item.is_available ? 'opacity-70 grayscale-[0.5]' : ''}`}
                                cover={
                                    <div className="relative h-56 group overflow-hidden">
                                        <img
                                            alt={item.name}
                                            src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                        {!item.is_available && (
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                <Tag color="error" className="text-lg px-4 py-1 font-bold uppercase tracking-widest rounded-full">Out of Order</Tag>
                                            </div>
                                        )}
                                        <div className="absolute top-4 right-4 flex gap-2">
                                            <Tooltip title={item.is_available ? 'Mark as Out of Order' : 'Mark as Available'}>
                                                <button 
                                                    onClick={() => toggleAvailability(item.id)}
                                                    className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-colors ${item.is_available ? 'bg-white text-green-500 hover:bg-green-50' : 'bg-red-500 text-white hover:bg-red-600'}`}
                                                >
                                                    <PoweroffOutlined />
                                                </button>
                                            </Tooltip>
                                        </div>
                                    </div>
                                }
                                actions={[
                                    <Tooltip title="Edit Dish" key="edit">
                                        <EditOutlined onClick={() => showModal(item)} className="hover:text-primary transition-colors" />
                                    </Tooltip>,
                                    <Popconfirm
                                        key="delete"
                                        title="Delete Dish"
                                        description="Are you sure you want to delete this menu item?"
                                        onConfirm={() => handleDelete(item.id)}
                                        okText="Yes"
                                        cancelText="No"
                                        okButtonProps={{ danger: true }}
                                    >
                                        <DeleteOutlined className="hover:text-red-500 transition-colors" />
                                    </Popconfirm>
                                ]}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-xl font-bold text-gray-800 line-clamp-1">{item.name}</h3>
                                    <span className="text-primary font-black text-lg">{(parseFloat(item.price || 0)).toLocaleString()}đ</span>
                                </div>
                                <Tag className="mb-3 rounded-full border-none bg-orange-50 text-orange-500 font-bold px-3">
                                    {item.category?.name || 'Uncategorized'}
                                </Tag>
                                <p className="text-gray-500 text-sm line-clamp-2 h-10 mb-2">{item.description || 'No description provided.'}</p>
                            </Card>
                        ))}
                    </div>

                    <div className="flex justify-center mt-12 pb-12">
                        <Pagination 
                            current={page} 
                            total={total} 
                            pageSize={9} 
                            onChange={(p) => setPage(p)}
                            showSizeChanger={false}
                            className="bg-white px-6 py-3 rounded-2xl shadow-soft"
                        />
                    </div>
                </>
            ) : (
                <div className="bg-white py-20 rounded-3xl shadow-soft">
                    <Empty description="No menu items found. Add your first dish to get started!" />
                </div>
            )}

            {/* Add/Edit Modal */}
            <Modal
                title={editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
                open={isModalVisible}
                onOk={handleOk}
                onCancel={() => setIsModalVisible(false)}
                okText={editingItem ? 'Update Item' : 'Create Item'}
                destroyOnHidden
                className="rounded-2xl overflow-hidden"
                width={600}
            >
                <Form
                    form={form}
                    layout="vertical"
                    className="mt-6"
                >
                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item
                            name="name"
                            label="Dish Name"
                            rules={[{ required: true, message: 'Please enter dish name' }]}
                            className="col-span-2"
                        >
                            <Input placeholder="e.g. Grilled Salmon" size="large" className="rounded-xl border-gray-200" />
                        </Form.Item>

                        <Form.Item
                            name="price"
                            label="Price (đ)"
                            rules={[{ required: true, message: 'Please enter price' }]}
                        >
                            <InputNumber 
                                className="w-full rounded-xl border-gray-200" 
                                size="large" 
                                min={0} 
                                step={1000}
                                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                parser={value => value.replace(/\$\s?|(,*)/g, '')}
                            />
                        </Form.Item>

                        {/* ── Category with inline "+ Add Category" ── */}
                        <Form.Item
                            name="category_id"
                            label={
                                <span className="flex items-center gap-0.5 leading-none">
                                    Category
                                    <AddCategoryInline onCreated={handleCategoryCreated} />
                                </span>
                            }
                            rules={[{ required: true, message: 'Please select a category' }]}
                        >
                            <Select placeholder="Select category" size="large" className="rounded-xl border-gray-200">
                                {categories.map(c => (
                                    <Option key={c.id} value={c.id}>{c.name}</Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="image_url"
                            label="Image URL"
                            className="col-span-2"
                        >
                            <Input placeholder="Paste image link here" size="large" className="rounded-xl border-gray-200" />
                        </Form.Item>

                        <Form.Item
                            name="description"
                            label="Short Description"
                            className="col-span-2"
                        >
                            <Input.TextArea 
                                placeholder="Describe your dish..." 
                                rows={4} 
                                className="rounded-xl border-gray-200"
                            />
                        </Form.Item>

                        <Form.Item
                            name="is_available"
                            label="Available for Order?"
                            valuePropName="checked"
                            initialValue={true}
                        >
                            <Switch />
                        </Form.Item>
                    </div>
                </Form>
            </Modal>
        </div>
    );
}
