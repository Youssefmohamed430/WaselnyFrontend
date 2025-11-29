import { useEffect, useState } from 'react';
import AuthService from '../../services/authService';
import notificationService from '../../services/notificationService';
import signalRService from '../../services/signalRService';
import type { Notification } from '../../services/notificationService';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';

const Notifications = () => {
  const authService = new AuthService();
  const user = authService.getUserInfo();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadNotifications();
      connectNotifications();
    }

    return () => {
      signalRService.disconnectNotifications();
    };
  }, [user?.id]);

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

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
        <p className="mt-2 text-gray-600">Stay updated with your bookings and trips</p>
      </div>

      {error && <ErrorMessage message={error} />}

      {notifications.length === 0 ? (
        <div className="rounded-lg border bg-white p-12 text-center shadow-sm">
          <p className="text-gray-600">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.notifid}
              className={`rounded-lg border p-4 shadow-sm ${
                !notification.isRead ? 'bg-blue-50 border-blue-200' : 'bg-white'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-gray-800">{notification.msg}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {new Date(notification.date).toLocaleString('en-US', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </p>
                </div>
                {!notification.isRead && (
                  <span className="ml-2 h-2 w-2 rounded-full bg-blue-600"></span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;

