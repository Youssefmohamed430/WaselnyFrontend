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
}

export default new DriverService();

