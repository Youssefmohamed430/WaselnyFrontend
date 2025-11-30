import { httpClient } from './httpClient';

export type Driver = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  ssn?: string;
  status?: string;
};

export type DriverResponse<T> = {
  isSuccess: boolean;
  message: string;
  result: T;
};

class DriverService {
  async getAll(): Promise<DriverResponse<Driver[]>> {
    const { data } = await httpClient.get<DriverResponse<Driver[]>>('/Driver');
    return data;
  }

  async updateTripStatus(driverId: string, status: 'Start' | 'Cancel' | 'End'): Promise<DriverResponse<null>> {
    const { data } = await httpClient.put<DriverResponse<null>>(`/Driver/${driverId}/${status}`);
    return data;
  }

  async startTrip(driverId: string): Promise<DriverResponse<null>> {
    return this.updateTripStatus(driverId, 'Start');
  }

  async cancelTrip(driverId: string): Promise<DriverResponse<null>> {
    return this.updateTripStatus(driverId, 'Cancel');
  }

  async endTrip(driverId: string): Promise<DriverResponse<null>> {
    return this.updateTripStatus(driverId, 'End');
  }
}

export default new DriverService();

