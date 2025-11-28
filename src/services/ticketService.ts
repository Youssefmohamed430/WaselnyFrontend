import { httpClient } from './httpClient';

export type Ticket = {
  id: number;
  minStations: number;
  busType: 'Normal' | 'AirConditioned' | 'Luxury';
  price: number;
};

export type TicketResponse<T> = {
  isSuccess: boolean;
  message: string;
  result: T;
};

export type CreateTicketData = {
  minStations: number;
  busType: 'Normal' | 'AirConditioned' | 'Luxury';
  price: number;
};

class TicketService {
  async getAll(): Promise<TicketResponse<Ticket[]>> {
    const { data } = await httpClient.get<TicketResponse<Ticket[]>>('/Ticket');
    return data;
  }

  async getByNumberOfStations(numOfStations: number): Promise<TicketResponse<Ticket[]>> {
    const { data } = await httpClient.get<TicketResponse<Ticket[]>>(`/Ticket/${numOfStations}`);
    return data;
  }

  async getByTypeAndStations(numOfStations: number, busType: string): Promise<TicketResponse<Ticket[]>> {
    const { data } = await httpClient.get<TicketResponse<Ticket[]>>(`/Ticket/type/${numOfStations}/${busType}`);
    return data;
  }

  async getByStationsAndPriceRange(numOfStations: number, minPrice: number, maxPrice: number): Promise<TicketResponse<Ticket[]>> {
    const { data } = await httpClient.get<TicketResponse<Ticket[]>>(`/Ticket/price/${numOfStations}/${minPrice}/${maxPrice}`);
    return data;
  }

  async getSingleTicket(numOfStations: number, busType: string): Promise<TicketResponse<Ticket>> {
    const { data } = await httpClient.get<TicketResponse<Ticket>>(`/Ticket/single/${numOfStations}/${busType}`);
    return data;
  }

  async create(ticketData: CreateTicketData): Promise<TicketResponse<Ticket>> {
    const { data } = await httpClient.post<TicketResponse<Ticket>>('/Ticket', ticketData);
    return data;
  }

  async update(id: number, ticketData: CreateTicketData): Promise<TicketResponse<Ticket>> {
    const { data } = await httpClient.put<TicketResponse<Ticket>>(`/Ticket/${id}`, ticketData);
    return data;
  }

  async delete(id: number): Promise<{ message: string }> {
    const { data } = await httpClient.delete<{ message: string }>(`/Ticket/${id}`);
    return data;
  }
}

export default new TicketService();
