import { httpClient } from './httpClient';

export type Bus = {
  busId: number;
  busCode: string;
  busType: 'Normal' | 'AirConditioned' | 'Luxury';
  totalSeats: number;
};

export type BusResponse<T> = {
  isSuccess: boolean;
  message: string;
  result: T;
};

export type CreateBusData = {
  busCode: string;
  busType: 'Normal' | 'AirConditioned' | 'Luxury';
  totalSeats: number;
};

class BusService {
  async getAll(): Promise<BusResponse<Bus[]>> {
    const { data } = await httpClient.get<BusResponse<Bus[]>>('/Bus');
    return data;
  }

  async getByCode(code: string): Promise<BusResponse<Bus>> {
    const { data } = await httpClient.get<BusResponse<Bus>>(`/Bus/GetBusByCode/${code}`);
    return data;
  }

  async getByType(type: string): Promise<BusResponse<Bus[]>> {
    const { data } = await httpClient.get<BusResponse<Bus[]>>(`/Bus/GetBusesByType/${type}`);
    return data;
  }

  async create(busData: CreateBusData): Promise<BusResponse<Bus>> {
    const { data } = await httpClient.post<BusResponse<Bus>>('/Bus', busData);
    return data;
  }

  async update(id: number, busData: CreateBusData): Promise<BusResponse<Bus>> {
    const { data } = await httpClient.put<BusResponse<Bus>>(`/Bus/${id}`, busData);
    return data;
  }

  async delete(id: number): Promise<{ message: string }> {
    const { data } = await httpClient.delete<{ message: string }>(`/Bus/${id}`);
    return data;
  }
}

export default new BusService();
