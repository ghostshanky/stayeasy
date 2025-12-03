import React, { useState, useEffect } from 'react';
import { Page } from '../types';
import AdminSideNavBar from '../components/admin/AdminSideNavBar';
import AdminStatCard from '../components/admin/AdminStatCard';
import { apiClient } from '../api/apiClient';
import toast from 'react-hot-toast';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
  _count: {
    properties: number;
    bookings: number;
    reviews: number;
  };
}

interface AuditLog {
  id: string;
  action: string;
  details: string;
  created_at: string;
  actor: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

interface Stats {
  users: {
    total: number;
    byRole: Record<string, number>;
  };
  properties: {
    total: number;
  };
  bookings: {
    total: number;
    byStatus: Record<string, number>;
  };
  payments: {
    total: number;
    totalAmount: number;
    byStatus: Record<string, number>;
  };
  reviews: {
    total: number;
    averageRating: number | null;
  };
}

const AdminDashboard = ({ navigate }: { navigate: (page: Page) => void }) => {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'users', 'audit', 'moderation'
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/admin/stats');

        if (response.success && response.data) {
          setStats(response.data);
          setError(null);
        } else {
          throw new Error(response.error?.message || 'Failed to fetch admin data');
        }
      } catch (err: any) {
        console.error("Failed to fetch admin data:", err);
        setError("Could not load dashboard data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
      });
      if (selectedRole) params.append('role', selectedRole);

      const response = await apiClient.get(`/admin/users?${params}`);

      if (response.success && response.data) {
        setUsers(response.data.data || []);
        setTotalPages(response.data.pagination?.totalPages || 1);
      } else {
        throw new Error(response.error?.message || 'Failed to fetch users');
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
      toast.error("Failed to fetch users");
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
      });

      const response = await apiClient.get(`/admin/audit-logs?${params}`);

      if (response.success && response.data) {
        setAuditLogs(response.data.data || []);
        setTotalPages(response.data.pagination?.totalPages || 1);
      } else {
        throw new Error(response.error?.message || 'Failed to fetch audit logs');
      }
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
      toast.error("Failed to fetch audit logs");
    }
  };

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'audit') {
      fetchAuditLogs();
    }
  }, [activeTab, currentPage, selectedRole]);

  const handleUserUpdate = async (userId: string, updates: any) => {
    try {
      const response = await apiClient.put(`/admin/users/${userId}`, updates);

      if (response.success) {
        toast.success('User updated successfully');
        fetchUsers(); // Refresh the list
      } else {
        throw new Error(response.error?.message || 'Failed to update user');
      }
    } catch (err: any) {
      console.error("Failed to update user:", err);
      toast.error(err.message || "Failed to update user");
    }
  };

  const handleUserDelete = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const response = await apiClient.delete(`/admin/users/${userId}`);

        if (response.success) {
          toast.success('User deleted successfully');
          fetchUsers(); // Refresh the list
        } else {
          throw new Error(response.error?.message || 'Failed to delete user');
        }
      } catch (err: any) {
        console.error("Failed to delete user:", err);
        toast.error(err.message || "Failed to delete user");
      }
    }
  };

  const handleContentRemoval = async (type: string, id: string) => {
    if (window.confirm(`Are you sure you want to remove this ${type}?`)) {
      try {
        const response = await apiClient.delete(`/admin/content/${type}/${id}`);

        if (response.success) {
          toast.success(`${type} removed successfully`);
          // Refresh data based on current tab
          if (activeTab === 'users') fetchUsers();
          else if (activeTab === 'audit') fetchAuditLogs();
        } else {
          throw new Error(response.error?.message || 'Failed to remove content');
        }
      } catch (err: any) {
        console.error("Failed to remove content:", err);
        toast.error(err.message || "Failed to remove content");
      }
    }
  };

  const renderOverview = () => {
    if (!stats) return <div>Loading statistics...</div>;

    const statCards = [
      {
        title: 'Total Users',
        value: stats.users?.total?.toString() || '0',
        change: '+12%',
        changeDirection: 'increase' as 'increase',
        changeColorClass: 'text-green-600',
        icon: 'people'
      },
      {
        title: 'Total Properties',
        value: stats.properties?.total?.toString() || '0',
        change: '+8%',
        changeDirection: 'increase' as 'increase',
        changeColorClass: 'text-green-600',
        icon: 'apartment'
      },
      {
        title: 'Active Bookings',
        value: stats.bookings?.byStatus?.CONFIRMED?.toString() || '0',
        change: '+15%',
        changeDirection: 'increase' as 'increase',
        changeColorClass: 'text-green-600',
        icon: 'calendar_month'
      },
      {
        title: 'Total Revenue',
        value: `₹${stats.payments?.totalAmount?.toLocaleString() || '0'}`,
        change: '+22%',
        changeDirection: 'increase' as 'increase',
        changeColorClass: 'text-green-600',
        icon: 'payments'
      }
    ];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat) => (
            <AdminStatCard key={stat.title} title={stat.title} value={stat.value} change={stat.change} changeDirection={stat.changeDirection as any} changeColorClass={stat.changeColorClass} icon={stat.icon} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Users by Role</h3>
            <div className="space-y-3">
              {Object.entries(stats.users?.byRole || {}).map(([role, count]) => (
                <div key={role} className="flex justify-between items-center">
                  <span className="capitalize">{role.toLowerCase()}</span>
                  <span className="font-semibold">{count as number}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Booking Status</h3>
            <div className="space-y-3">
              {Object.entries(stats.bookings?.byStatus || {}).map(([status, count]) => (
                <div key={status} className="flex justify-between items-center">
                  <span className="capitalize">{status.toLowerCase()}</span>
                  <span className="font-semibold">{count as number}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderUsers = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">User Management</h2>
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          <option value="">All Roles</option>
          <option value="TENANT">Tenant</option>
          <option value="OWNER">Owner</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">Properties</th>
              <th className="py-3 px-4">Bookings</th>
              <th className="py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{user.name}</td>
                <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{user.email}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                      user.role === 'OWNER' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                        'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                    }`}>
                    {user.role}
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{user._count?.properties || 0}</td>
                <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{user._count?.bookings || 0}</td>
                <td className="py-3 px-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUserUpdate(user.id, { role: user.role === 'TENANT' ? 'OWNER' : 'TENANT' })}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                    >
                      Toggle Role
                    </button>
                    <button
                      onClick={() => handleUserDelete(user.id)}
                      className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAuditLogs = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      <h2 className="text-xl font-bold mb-6">Audit Logs</h2>

      <div className="space-y-4">
        {auditLogs.map((log) => (
          <div key={log.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{log.action}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{log.details}</p>
              <p className="text-xs text-gray-500 mt-1">{new Date(log.created_at).toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="font-medium text-gray-900 dark:text-white">{log.actor?.name || 'Unknown'}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{log.actor?.role || 'N/A'}</p>
            </div>
          </div>
        ))}
        {auditLogs.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No audit logs found.
          </div>
        )}
      </div>
    </div>
  );

  const renderModeration = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      <h2 className="text-xl font-bold mb-6">Content Moderation</h2>

      <div className="space-y-4">
        <div className="p-4 border border-red-200 dark:border-red-700 rounded-lg bg-red-50 dark:bg-red-900/20">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium text-red-800 dark:text-red-200">Inappropriate Review</h3>
              <p className="text-sm text-red-600 dark:text-red-400">Review ID: REV123456</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                "This property is terrible and the owner is a scam artist..."
              </p>
            </div>
            <button
              onClick={() => handleContentRemoval('review', 'REV123456')}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Remove Review
            </button>
          </div>
        </div>

        <div className="p-4 border border-yellow-200 dark:border-yellow-700 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium text-yellow-800 dark:text-yellow-200">Spam Property Listing</h3>
              <p className="text-sm text-yellow-600 dark:text-yellow-400">Property ID: PROP789012</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Multiple duplicate listings from the same owner...
              </p>
            </div>
            <button
              onClick={() => handleContentRemoval('property', 'PROP789012')}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              Remove Property
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex bg-background-light dark:bg-background-dark text-text-light-primary dark:text-text-dark-primary">
      <AdminSideNavBar />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage users, monitor system activity, and moderate content</p>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 font-medium text-sm whitespace-nowrap ${activeTab === 'overview' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 font-medium text-sm whitespace-nowrap ${activeTab === 'users' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              User Management
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-4 py-2 font-medium text-sm whitespace-nowrap ${activeTab === 'audit' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              Audit Logs
            </button>
            <button
              onClick={() => setActiveTab('moderation')}
              className={`px-4 py-2 font-medium text-sm whitespace-nowrap ${activeTab === 'moderation' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              Content Moderation
            </button>
          </div>

          {loading && <div className="text-center py-10">Loading Dashboard...</div>}
          {error && <div className="text-center py-10 text-error">{error}</div>}
          {!loading && !error && (
            <>
              {activeTab === 'overview' && renderOverview()}
              {activeTab === 'users' && renderUsers()}
              {activeTab === 'audit' && renderAuditLogs()}
              {activeTab === 'moderation' && renderModeration()}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
