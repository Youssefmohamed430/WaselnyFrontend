import { httpClient } from './httpClient';

export type Route = {
  tripId: number;
  from: string;
  to: string;
  stationId: number;
  stationName: string;
  order: number;
};

export type RouteResponse<T> = {
  isSuccess: boolean;
  message: string;
  result: T;
};

export type CreateRouteData = {
  tripId: number;
  stationId: number;
  order: number;
};

export type DistanceResponse = {
  distance: number; // km
  duration: number; // minutes
};

class RouteService {
  async getAll(): Promise<RouteResponse<Route[]>> {
    const { data } = await httpClient.get<RouteResponse<Route[]>>('/Route');
    return data;
  }

  async getRouteForTrip(tripId: number): Promise<RouteResponse<Route[]>> {
    const { data } = await httpClient.get<RouteResponse<Route[]>>(`/Route/RouteForTrip/${tripId}`);
    return data;
  }

  async getNearestStationAtRoute(tripId: number, longitude: number, latitude: number): Promise<RouteResponse<Station>> {
    const { data } = await httpClient.get<RouteResponse<Station>>(`/Route/TheNearestStationAtRoute/${tripId}/${longitude}/${latitude}`);
    return data;
  }

  async calculateDistance(userLng: number, userLat: number, stationLong: number, stationLat: number): Promise<DistanceResponse> {
    const { data } = await httpClient.get<DistanceResponse>(`/Route/CalcDistanceToDistnation/${userLng}/${userLat}/${stationLong}/${stationLat}`);
    return data;
  }

  async create(routeData: CreateRouteData): Promise<RouteResponse<Route>> {
    const { data } = await httpClient.post<RouteResponse<Route>>('/Route', routeData);
    return data;
  }

  async update(id: number, routeData: CreateRouteData): Promise<RouteResponse<Route>> {
    const { data } = await httpClient.put<RouteResponse<Route>>(`/Route/${id}`, routeData);
    return data;
  }

  async delete(id: number): Promise<{ message: string }> {
    const { data } = await httpClient.delete<{ message: string }>(`/Route/${id}`);
    return data;
  }
}

type Station = {
  id: number;
  name: string;
  area: string;
  location: string;
  latitude: number;
  longitude: number;
};

export default new RouteService();
