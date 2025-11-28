import { httpClient } from './httpClient';

export type Station = {
  id: number;
  name: string;
  area: string;
  location: string;
  latitude: number;
  longitude: number;
};

export type StationResponse<T> = {
  isSuccess: boolean;
  message: string;
  result: T;
};

export type CreateStationData = {
  name: string;
  area: string;
  location: string;
  latitude: number;
  longitude: number;
};

export type NearestStationRequest = {
  area: string;
  longitude: number;
  latitude: number;
};

class StationService {
  async getAll(): Promise<StationResponse<Station[]>> {
    const { data } = await httpClient.get<StationResponse<Station[]>>('/Station');
    return data;
  }

  async getByName(name: string): Promise<StationResponse<Station>> {
    const { data } = await httpClient.get<StationResponse<Station>>(`/Station/${encodeURIComponent(name)}`);
    return data;
  }

  async getByArea(area: string): Promise<StationResponse<Station[]>> {
    const { data } = await httpClient.get<StationResponse<Station[]>>(`/Station/GetStationByArea/${encodeURIComponent(area)}`);
    return data;
  }

  async getNearestStation(request: NearestStationRequest): Promise<StationResponse<Station>> {
    const { data } = await httpClient.post<StationResponse<Station>>('/Station/GetTheNearestStation', request);
    return data;
  }

  async create(stationData: CreateStationData): Promise<StationResponse<Station>> {
    const { data } = await httpClient.post<StationResponse<Station>>('/Station', stationData);
    return data;
  }

  async update(id: number, stationData: CreateStationData): Promise<StationResponse<Station>> {
    const { data } = await httpClient.put<StationResponse<Station>>(`/Station/${id}`, stationData);
    return data;
  }

  async delete(id: number): Promise<{ message: string }> {
    const { data } = await httpClient.delete<{ message: string }>(`/Station/${id}`);
    return data;
  }
}

export default new StationService();
