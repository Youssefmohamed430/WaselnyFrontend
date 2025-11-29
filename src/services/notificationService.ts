import { httpClient } from './httpClient';

export type Notification = {
  notifid: number;
  msg: string;
  date: string; // ISO 8601 format
  userId: string;
  isRead?: boolean;
};

export type NotificationResponse<T> = {
  isSuccess: boolean;
  message: string;
  result: T;
};

class NotificationService {
  async getByUserId(userId: string): Promise<NotificationResponse<Notification[]>> {
    const { data } = await httpClient.get<NotificationResponse<Notification[]>>(`/Notification/${userId}`);
    return data;
  }
}

export default new NotificationService();

