import { httpClient } from './httpClient';

export type TrackingResponse<T> = {
  isSuccess: boolean;
  message: string;
  result: T;
};

class TrackingService {
  /**
   * Check distance to next station and trigger notifications
   * Should be called every 12 location updates (approximately every 60 seconds)
   */
  async checkNextStation(tripId: number, busLng: number, busLat: number): Promise<void> {
    try {
      await httpClient.get(`/Tracking/${tripId}/${busLng}/${busLat}`);
      console.log('✅ Next station check completed');
    } catch (error) {
      console.error('Error checking next station:', error);
      // Don't throw - this is a background operation
    }
  }
}

export default new TrackingService();

