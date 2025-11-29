import { httpClient } from './httpClient';
import type { Booking, BookingResponse } from './bookingService';

export type CreateBookingData = {
  tripId: number;
  numberOfTickets: number;
  stationFromId: number;
  stationToId: number;
  ticketId: number;
};

export type BookingDTO = {
  bookingId: number;
  bookingDate: string;
  status: 'Booked' | 'Cancelled' | 'Completed';
  passengerId: string;
  passengerName: string;
  ticketId: number;
  tripId: number;
  numberOfTickets: number;
  totalPrice: number;
  busType: 'Normal' | 'Gold' | 'Platinum' | 'AirConditioned' | 'Luxury';
  stationFromId: number;
  stationToId: number;
  stationFrom?: {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
  };
  stationTo?: {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
  };
};

class PassengerBookingService {
  async getByPassengerId(passengerId: string): Promise<BookingResponse<BookingDTO[]>> {
    const { data } = await httpClient.get<BookingResponse<BookingDTO[]>>(`/Booking/${passengerId}`);
    return data;
  }

  async create(bookingData: CreateBookingData): Promise<BookingResponse<BookingDTO>> {
    const { data } = await httpClient.post<BookingResponse<BookingDTO>>('/Booking', bookingData);
    return data;
  }

  async update(bookingId: number, bookingData: Partial<CreateBookingData>): Promise<BookingResponse<BookingDTO>> {
    const { data } = await httpClient.put<BookingResponse<BookingDTO>>(`/Booking/${bookingId}`, bookingData);
    return data;
  }

  async cancel(bookingId: number): Promise<BookingResponse<BookingDTO>> {
    const { data } = await httpClient.patch<BookingResponse<BookingDTO>>(`/Booking/cancel/${bookingId}`);
    return data;
  }

  async getStartStation(passengerId: string): Promise<BookingResponse<{ stationId: number; stationName: string }>> {
    const { data } = await httpClient.get<BookingResponse<{ stationId: number; stationName: string }>>(`/Booking/StartStation/${passengerId}`);
    return data;
  }
}

export default new PassengerBookingService();

