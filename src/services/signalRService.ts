import * as signalR from '@microsoft/signalr';
import { API_BASE_URL } from '../config/api.config';

type LocationUpdateCallback = (busId: number, latitude: number, longitude: number) => void;
type NotificationCallback = (notification: { notifid: number; msg: string; date: string }) => void;

class SignalRService {
  private trackingConnection: signalR.HubConnection | null = null;
  private notificationConnection: signalR.HubConnection | null = null;
  private locationCallbacks: Map<number, LocationUpdateCallback> = new Map();
  private notificationCallback: NotificationCallback | null = null;

  async connectTracking(tripId: number, onLocationUpdate: LocationUpdateCallback): Promise<void> {
    if (this.trackingConnection && this.trackingConnection.state === signalR.HubConnectionState.Connected) {
      // Already connected, just add callback
      this.locationCallbacks.set(tripId, onLocationUpdate);
      return;
    }

    if (this.trackingConnection) {
      await this.trackingConnection.stop();
    }

    this.trackingConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE_URL}/trackingHub`)
      .withAutomaticReconnect()
      .build();

    // Store callback
    this.locationCallbacks.set(tripId, onLocationUpdate);

    // Set up handler for this trip
    this.trackingConnection.on(`ReceiveLocationUpdate[${tripId}]`, (busId: number, latitude: number, longitude: number) => {
      const callback = this.locationCallbacks.get(tripId);
      if (callback) {
        callback(busId, latitude, longitude);
      }
    });

    try {
      await this.trackingConnection.start();
      console.log('Tracking hub connected');
    } catch (error) {
      console.error('Error connecting to tracking hub:', error);
      throw error;
    }
  }

  async connectNotifications(userId: string, onNotification: NotificationCallback): Promise<void> {
    if (this.notificationConnection && this.notificationConnection.state === signalR.HubConnectionState.Connected) {
      // Already connected, just update callback
      this.notificationCallback = onNotification;
      return;
    }

    if (this.notificationConnection) {
      await this.notificationConnection.stop();
    }

    this.notificationConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE_URL}/notificationHub?userId=${userId}`)
      .withAutomaticReconnect()
      .build();

    this.notificationCallback = onNotification;

    this.notificationConnection.on('ReceiveNotification', (notification: { notifid: number; msg: string; date: string }) => {
      if (this.notificationCallback) {
        this.notificationCallback(notification);
      }
    });

    try {
      await this.notificationConnection.start();
      console.log('Notification hub connected');
    } catch (error) {
      console.error('Error connecting to notification hub:', error);
      throw error;
    }
  }

  async disconnectTracking(tripId?: number): Promise<void> {
    if (tripId) {
      this.locationCallbacks.delete(tripId);
      // Only disconnect if no more callbacks
      if (this.locationCallbacks.size === 0 && this.trackingConnection) {
        await this.trackingConnection.stop();
        this.trackingConnection = null;
      }
    } else {
      // Disconnect all
      this.locationCallbacks.clear();
      if (this.trackingConnection) {
        await this.trackingConnection.stop();
        this.trackingConnection = null;
      }
    }
  }

  async disconnectNotifications(): Promise<void> {
    if (this.notificationConnection) {
      await this.notificationConnection.stop();
      this.notificationConnection = null;
      this.notificationCallback = null;
    }
  }

  async disconnectAll(): Promise<void> {
    await this.disconnectTracking();
    await this.disconnectNotifications();
  }

  isTrackingConnected(): boolean {
    return this.trackingConnection?.state === signalR.HubConnectionState.Connected ?? false;
  }

  isNotificationConnected(): boolean {
    return this.notificationConnection?.state === signalR.HubConnectionState.Connected ?? false;
  }
}

export default new SignalRService();

