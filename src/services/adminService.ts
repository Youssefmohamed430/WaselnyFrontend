import { httpClient } from './httpClient';

export type DriverRequest = {
  id: number;
  name: string;
  ssn: string;
  phone: string;
  email: string;
  status: 'Suspend' | 'Accepted' | 'Rejected';
};

export type AdminResponse<T> = {
  isSuccess: boolean;
  message: string;
  result: T;
};

class AdminService {
  async getAllDriverRequests(): Promise<AdminResponse<DriverRequest[]>> {
    const { data } = await httpClient.get<AdminResponse<DriverRequest[]>>('/Admin');
    return data;
  }

  async acceptDriverRequest(id: number): Promise<{ message: string }> {
    const { data } = await httpClient.patch<{ message: string }>(`/Admin/AcceptRequest/${id}`);
    return data;
  }

  async rejectDriverRequest(id: number): Promise<{ message: string }> {
    const { data } = await httpClient.patch<{ message: string }>(`/Admin/RejectRequest/${id}`);
    return data;
  }
}

export default new AdminService();
