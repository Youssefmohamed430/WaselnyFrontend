import { httpClient } from './httpClient';

export type Booking = {
  bookingId: number;
  bookingDate: string; // ISO 8601 format
  status: 'Booked' | 'Cancelled';
  passengerId: string;
  passengerName: string;
  ticketId: number;
  tripId: number;
  numberOfTickets: number;
  totalPrice: number;
  busType: 'Normal' | 'AirConditioned' | 'Luxury';
  stationFromId: number;
  stationToId: number;
};

export type BookingResponse<T> = {
  isSuccess: boolean;
  message: string;
  result: T;
};

class BookingService {
  async getAll(): Promise<BookingResponse<Booking[]>> {
    const { data } = await httpClient.get<BookingResponse<Booking[]>>('/Booking');
    return data;
  }

  async getByTripId(tripId: number): Promise<BookingResponse<Booking[]>> {
    const { data } = await httpClient.get<BookingResponse<Booking[]>>(`/Booking/trip/${tripId}`);
    return data;
  }

  async getByTicketId(ticketId: number): Promise<BookingResponse<Booking[]>> {
    const { data } = await httpClient.get<BookingResponse<Booking[]>>(`/Booking/ticket/${ticketId}`);
    return data;
  }

  async getByDateRange(startDate: string, endDate: string): Promise<BookingResponse<Booking[]>> {
    const { data } = await httpClient.get<BookingResponse<Booking[]>>(`/Booking/date?start=${startDate}&end=${endDate}`);
    return data;
  }
}

export default new BookingService();
