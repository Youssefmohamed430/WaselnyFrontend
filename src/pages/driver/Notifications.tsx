import { useEffect, useState } from 'react';
import AuthService from '../../services/authService';
import notificationService from '../../services/notificationService';
import signalRService from '../../services/signalRService';
import type { Notification } from '../../services/notificationService';
import { getTimeAgo } from '../../utils/dateUtils';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import Button from '../../components/Button';

const DriverNotifications = () => {
  const authService = new AuthService();
  const user = authService.getUserInfo();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  useEffect(() => {
    if (user?.id) {
      loadNotifications();
      connectNotifications();
    }

    return () => {
      signalRService.disconnectNotifications();
    };
  }, [user?.id]);

  useEffect(() => {
    applyFilter();
  }, [notifications, filter]);

  const loadNotifications = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      setError(null);
      const response = await notificationService.getByUserId(user.id);
      if (response.isSuccess && response.result) {
        // Sort by date (newest first)
        const sorted = response.result.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setNotifications(sorted);
      } else {
        setError(response.message || 'Failed to load notifications');
      }
    } catch (error) {
      setError('Failed to load notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const connectNotifications = async () => {
    if (!user?.id) return;
    try {
      await signalRService.connectNotifications(user.id, (notification) => {
        // Add new notification to the list
        setNotifications((prev) => [notification, ...prev]);
      });
    } catch (error) {
      console.error('Failed to connect to notifications:', error);
    }
  };

  const applyFilter = () => {
    let filtered = [...notifications];
    
    if (filter === 'unread') {
      filtered = filtered.filter(n => !n.isRead);
    } else if (filter === 'read') {
      filtered = filtered.filter(n => n.isRead);
    }
    
    setFilteredNotifications(filtered);
  };

  const markAsRead = (notifId: number) => {
    setNotifications(prev =>
      prev.map(n =>
        n.notifid === notifId ? { ...n, isRead: true } : n
      )
    );
    // In production, you'd call an API to mark as read
    // For now, we'll just update locally
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, isRead: true }))
    );
    // In production, you'd call an API to mark all as read
  };

  const getNotificationIcon = (message: string): string => {
    if (message.toLowerCase().includes('schedule') || message.toLowerCase().includes('shift')) {
      return '📅';
    } else if (message.toLowerCase().includes('trip') || message.toLowerCase().includes('start')) {
      return '🚌';
    } else if (message.toLowerCase().includes('cancel')) {
      return '❌';
    } else if (message.toLowerCase().includes('complete')) {
      return '✅';
    } else {
      return '🔔';
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
            <p className="mt-2 text-gray-600">Stay updated with your schedules and trips</p>
          </div>
          {unreadCount > 0 && (
            <Button
              onClick={markAllAsRead}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2"
            >
              Mark All as Read
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'unread'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Unread ({unreadCount})
          </button>
          <button
            onClick={() => setFilter('read')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'read'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Read ({notifications.length - unreadCount})
          </button>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <p className="text-gray-600 text-lg">No notifications found</p>
          <p className="text-gray-400 text-sm mt-2">
            {filter !== 'all'
              ? 'Try adjusting your filter'
              : 'You have no notifications yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.notifid}
              className={`bg-white rounded-lg shadow-sm p-6 transition-colors ${
                !notification.isRead ? 'border-l-4 border-blue-600' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="text-3xl flex-shrink-0">
                  {getNotificationIcon(notification.msg)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className={`text-gray-800 ${!notification.isRead ? 'font-medium' : ''}`}>
                        {notification.msg}
                      </p>
                      <p className="mt-2 text-sm text-gray-500">
                        {getTimeAgo(notification.date)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!notification.isRead && (
                        <span className="h-2 w-2 rounded-full bg-blue-600"></span>
                      )}
                      {!notification.isRead && (
                        <button
                          onClick={() => markAsRead(notification.notifid)}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DriverNotifications;

