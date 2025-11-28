import { httpClient } from './httpClient';

export type Trip = {
  id: number;
  duration: string; // TimeSpan format "HH:MM:SS"
  from: string;
  to: string;
};

export type TripResponse<T> = {
  isSuccess: boolean;
  message: string;
  result: T;
};

export type CreateTripData = {
  duration: string; // "HH:MM:SS"
  from: string;
  to: string;
};

class TripService {
  async getAll(): Promise<TripResponse<Trip[]>> {
    const { data } = await httpClient.get<TripResponse<Trip[]>>('/Trip');
    return data;
  }

  async create(tripData: CreateTripData): Promise<TripResponse<Trip>> {
    const { data } = await httpClient.post<TripResponse<Trip>>('/Trip', tripData);
    return data;
  }

  async update(tripId: number, tripData: CreateTripData): Promise<TripResponse<Trip>> {
    const { data } = await httpClient.put<TripResponse<Trip>>(`/Trip/${tripId}`, tripData);
    return data;
  }

  async delete(tripId: number): Promise<{ message: string }> {
    const { data } = await httpClient.delete<{ message: string }>(`/Trip/${tripId}`);
    return data;
  }
}

export default new TripService();
