import { httpClient } from './httpClient';

export type Schedule = {
  schId: number;
  departureDateTime: string; // ISO 8601 format
  busCode: string;
  busId: number;
  busType: 'Normal' | 'AirConditioned' | 'Luxury';
  driverName: string;
  driverId: string;
  tripId: number;
  from: string;
  to: string;
};

export type ScheduleResponse<T> = {
  isSuccess: boolean;
  message: string;
  result: T;
};

export type CreateScheduleData = {
  departureDateTime: string; // ISO 8601 format
  busId: number;
  driverId: string;
  tripId: number;
};

class ScheduleService {
  async getAll(): Promise<ScheduleResponse<Schedule[]>> {
    const { data } = await httpClient.get<ScheduleResponse<Schedule[]>>('/Schedule');
    return data;
  }

  async getByDriverId(id: string): Promise<ScheduleResponse<Schedule[]>> {
    const { data } = await httpClient.get<ScheduleResponse<Schedule[]>>(`/Schedule/ByDriverId/${id}`);
    return data;
  }

  async getByDriverName(name: string): Promise<ScheduleResponse<Schedule[]>> {
    const { data } = await httpClient.get<ScheduleResponse<Schedule[]>>(`/Schedule/ByDriverName/${encodeURIComponent(name)}`);
    return data;
  }

  async getByTripId(tripId: number): Promise<ScheduleResponse<Schedule[]>> {
    const { data } = await httpClient.get<ScheduleResponse<Schedule[]>>(`/Schedule/ByTripId/${tripId}`);
    return data;
  }

  async getCurrentByDriverId(id: string): Promise<ScheduleResponse<Schedule>> {
    const { data } = await httpClient.get<ScheduleResponse<Schedule>>(`/Schedule/CurrentByDriverId/${id}`);
    return data;
  }

  async create(scheduleData: CreateScheduleData): Promise<ScheduleResponse<Schedule>> {
    const { data } = await httpClient.post<ScheduleResponse<Schedule>>('/Schedule', scheduleData);
    return data;
  }

  async update(schId: number, scheduleData: CreateScheduleData): Promise<ScheduleResponse<Schedule>> {
    const { data } = await httpClient.put<ScheduleResponse<Schedule>>(`/Schedule/${schId}`, scheduleData);
    return data;
  }

  async delete(schId: number): Promise<{ message: string }> {
    const { data } = await httpClient.delete<{ message: string }>(`/Schedule/${schId}`);
    return data;
  }
}

export default new ScheduleService();
