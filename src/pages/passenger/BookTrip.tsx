import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthService from '../../services/authService';
import stationService from '../../services/stationService';
import tripService from '../../services/tripService';
import scheduleService from '../../services/scheduleService';
import ticketService from '../../services/ticketService';
import routeService from '../../services/routeService';
import passengerBookingService from '../../services/passengerBookingService';
import walletService from '../../services/walletService';
import type { Station } from '../../services/stationService';
import type { Trip } from '../../services/tripService';
import type { Schedule } from '../../services/scheduleService';
import type { Ticket } from '../../services/ticketService';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import { showToast } from '../../utils/toast';

type BookingStep = 'location' | 'destination' | 'trip' | 'schedule' | 'ticket' | 'confirm';

const BookTrip = () => {
  const authService = new AuthService();
  const navigate = useNavigate();
  const user = authService.getUserInfo();
  const [step, setStep] = useState<BookingStep>('location');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Location & Stations
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [nearestStation, setNearestStation] = useState<Station | null>(null);
  const [selectedFromStation, setSelectedFromStation] = useState<Station | null>(null);
  const [selectedToStation, setSelectedToStation] = useState<Station | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [stationsByArea, setStationsByArea] = useState<Record<string, Station[]>>({});

  // Trips & Schedules
  const [availableTrips, setAvailableTrips] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);

  // Tickets & Booking
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [numberOfTickets, setNumberOfTickets] = useState(1);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [numStations, setNumStations] = useState<number>(0);

  useEffect(() => {
    if (user?.id) {
      loadWalletBalance();
    }
  }, [user?.id]);

  useEffect(() => {
    loadStations();
  }, []);

  useEffect(() => {
    if (selectedFromStation && selectedToStation && selectedTrip) {
      calculateStationsAndPrice();
    }
  }, [selectedFromStation, selectedToStation, selectedTrip, selectedSchedule]);

  const loadWalletBalance = async () => {
    if (!user?.id) return;
    try {
      const response = await walletService.getById(user.id);
      if (response.isSuccess && response.result) {
        setWalletBalance(response.result.balance);
      }
    } catch (error) {
      console.error('Failed to load wallet:', error);
    }
  };

  const loadStations = async () => {
    try {
      const response = await stationService.getAll();
      if (response.isSuccess && response.result) {
        setStations(response.result);
        // Group by area
        const byArea: Record<string, Station[]> = {};
        response.result.forEach((station) => {
          if (!byArea[station.area]) {
            byArea[station.area] = [];
          }
          byArea[station.area].push(station);
        });
        setStationsByArea(byArea);
      }
    } catch (error) {
      setError('Failed to load stations');
    }
  };

  const getCurrentLocation = () => {
    setLoading(true);
    setError(null);
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setUserLocation({ lat, lng });

        try {
          // Find nearest station
          const areas = Object.keys(stationsByArea);
          if (areas.length > 0) {
            const response = await stationService.getNearestStation({
              area: areas[0],
              latitude: lat,
              longitude: lng,
            });
            if (response.isSuccess && response.result) {
              setNearestStation(response.result);
              setSelectedFromStation(response.result);
            }
          }
        } catch (error) {
          setError('Failed to find nearest station');
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        setError('Failed to get your location. Please select a station manually.');
        setLoading(false);
      }
    );
  };

  const handleFromStationSelect = (station: Station) => {
    setSelectedFromStation(station);
    setNearestStation(station);
  };

  const handleToStationSelect = async (station: Station) => {
    setSelectedToStation(station);
    setError(null);
    setLoading(true);

    try {
      // Load all trips
      const tripsResponse = await tripService.getAll();
      if (tripsResponse.isSuccess && tripsResponse.result) {
        setAvailableTrips(tripsResponse.result);
        setStep('trip');
      }
    } catch (error) {
      setError('Failed to load trips');
    } finally {
      setLoading(false);
    }
  };

  const handleTripSelect = async (trip: Trip) => {
    setSelectedTrip(trip);
    setError(null);
    setLoading(true);

    try {
      const schedulesResponse = await scheduleService.getByTripId(trip.id);
      if (schedulesResponse.isSuccess && schedulesResponse.result) {
        // Filter future schedules
        const now = new Date();
        const futureSchedules = schedulesResponse.result.filter(
          (sch) => new Date(sch.departureDateTime) > now
        );
        setSchedules(futureSchedules);
        setStep('schedule');
      }
    } catch (error) {
      setError('Failed to load schedules');
    } finally {
      setLoading(false);
    }
  };

  const calculateStationsAndPrice = async () => {
    if (!selectedFromStation || !selectedToStation || !selectedTrip || !selectedSchedule) return;

    try {
      // Get route for trip
      const routeResponse = await routeService.getRouteForTrip(selectedTrip.id);
      if (routeResponse.isSuccess && routeResponse.result) {
        const routeStations = routeResponse.result.sort((a, b) => a.order - b.order);
        const fromIndex = routeStations.findIndex((r) => r.stationId === selectedFromStation.id);
        const toIndex = routeStations.findIndex((r) => r.stationId === selectedToStation.id);

        if (fromIndex !== -1 && toIndex !== -1 && toIndex > fromIndex) {
          const stationsCount = toIndex - fromIndex;
          setNumStations(stationsCount);

          // Get ticket price - use the schedule's bus type directly
          const ticketResponse = await ticketService.getSingleTicket(stationsCount, selectedSchedule.busType);
          if (ticketResponse.isSuccess && ticketResponse.result) {
            setTicket(ticketResponse.result);
          }
        } else {
          setError('Selected stations are not on this trip route');
        }
      }
    } catch (error) {
      console.error('Failed to calculate price:', error);
    }
  };

  const handleScheduleSelect = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setStep('ticket');
  };

  const handleConfirmBooking = async () => {
    if (!selectedFromStation || !selectedToStation || !selectedTrip || !selectedSchedule || !ticket || !user?.id) {
      setError('Please complete all steps');
      return;
    }

    const totalPrice = ticket.price * numberOfTickets;
    if (walletBalance === null || walletBalance < totalPrice) {
      setError('Insufficient wallet balance. Please charge your wallet.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await passengerBookingService.create({
        tripId: selectedTrip.id,
        numberOfTickets,
        stationFromId: selectedFromStation.id,
        stationToId: selectedToStation.id,
        ticketId: ticket.id,
      });

      if (response.isSuccess) {
        showToast('Booking confirmed successfully!', 'success');
        navigate('/passenger/bookings');
      } else {
        setError(response.message || 'Failed to create booking');
      }
    } catch (error) {
      setError('Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const totalPrice = ticket ? ticket.price * numberOfTickets : 0;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800">Book a Trip</h1>
        <p className="mt-2 text-gray-600">Follow the steps below to book your trip</p>
      </div>

      {/* Progress Steps */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          {(['location', 'destination', 'trip', 'schedule', 'ticket', 'confirm'] as BookingStep[]).map((s, index) => (
            <div key={s} className="flex flex-1 items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  step === s
                    ? 'bg-blue-600 text-white'
                    : ['location', 'destination', 'trip', 'schedule', 'ticket', 'confirm'].indexOf(step) > index
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                }`}
              >
                {index + 1}
              </div>
              {index < 5 && (
                <div
                  className={`h-1 flex-1 ${
                    ['location', 'destination', 'trip', 'schedule', 'ticket', 'confirm'].indexOf(step) > index
                      ? 'bg-green-500'
                      : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Step 1: Get Location / Select From Station */}
      {step === 'location' && (
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-gray-800">Select Origin Station</h2>
          <div className="space-y-4">
            <button
              onClick={getCurrentLocation}
              disabled={loading}
              className="w-full rounded-md bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Getting location...' : '📍 Use My Current Location'}
            </button>
            <div className="text-center text-gray-600">OR</div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Select by Area</label>
              <div className="space-y-2">
                {Object.entries(stationsByArea).map(([area, areaStations]) => (
                  <div key={area}>
                    <p className="mb-2 text-sm font-medium text-gray-600">{area}</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {areaStations.map((station) => (
                        <button
                          key={station.id}
                          onClick={() => handleFromStationSelect(station)}
                          className={`rounded-md border px-4 py-2 text-left text-sm ${
                            selectedFromStation?.id === station.id
                              ? 'border-blue-600 bg-blue-50 text-blue-700'
                              : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {station.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {selectedFromStation && (
              <div className="mt-4 rounded-md bg-green-50 p-4">
                <p className="text-sm font-medium text-green-800">
                  Selected: {selectedFromStation.name} ({selectedFromStation.area})
                </p>
                <button
                  onClick={() => setStep('destination')}
                  className="mt-2 w-full rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                >
                  Continue to Destination
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Select Destination */}
      {step === 'destination' && (
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-gray-800">Select Destination Station</h2>
          <p className="mb-4 text-sm text-gray-600">
            From: <span className="font-medium">{selectedFromStation?.name}</span>
          </p>
          <div className="space-y-2">
            {Object.entries(stationsByArea).map(([area, areaStations]) => (
              <div key={area}>
                <p className="mb-2 text-sm font-medium text-gray-600">{area}</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {areaStations
                    .filter((s) => s.id !== selectedFromStation?.id)
                    .map((station) => (
                      <button
                        key={station.id}
                        onClick={() => handleToStationSelect(station)}
                        className={`rounded-md border px-4 py-2 text-left text-sm ${
                          selectedToStation?.id === station.id
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {station.name}
                      </button>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Select Trip */}
      {step === 'trip' && (
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-gray-800">Select Trip</h2>
          <p className="mb-4 text-sm text-gray-600">
            Route: <span className="font-medium">{selectedFromStation?.name} → {selectedToStation?.name}</span>
          </p>
          {loading ? (
            <LoadingSpinner />
          ) : (
            <div className="space-y-2">
              {availableTrips.map((trip) => (
                <button
                  key={trip.id}
                  onClick={() => handleTripSelect(trip)}
                  className={`w-full rounded-md border px-4 py-3 text-left ${
                    selectedTrip?.id === trip.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <p className="font-medium text-gray-800">
                    {trip.from} → {trip.to}
                  </p>
                  <p className="text-sm text-gray-600">Duration: {trip.duration}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 4: Select Schedule */}
      {step === 'schedule' && (
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-gray-800">Select Schedule</h2>
          {loading ? (
            <LoadingSpinner />
          ) : schedules.length === 0 ? (
            <p className="text-gray-600">No available schedules for this trip</p>
          ) : (
            <div className="space-y-2">
              {schedules.map((schedule) => (
                <button
                  key={schedule.schId}
                  onClick={() => handleScheduleSelect(schedule)}
                  className={`w-full rounded-md border px-4 py-3 text-left ${
                    selectedSchedule?.schId === schedule.schId
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <p className="font-medium text-gray-800">
                    {new Date(schedule.departureDateTime).toLocaleString('en-US', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </p>
                  <p className="text-sm text-gray-600">
                    Bus: {schedule.busCode} ({schedule.busType}) • Driver: {schedule.driverName}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 5: Select Ticket Type & Quantity */}
      {step === 'ticket' && ticket && (
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-gray-800">Ticket Details</h2>
          <div className="space-y-4">
            <div className="rounded-md bg-gray-50 p-4">
              <p className="text-sm text-gray-600">Stations: {numStations}</p>
              <p className="text-sm text-gray-600">Bus Type: {selectedSchedule?.busType}</p>
              <p className="mt-2 text-lg font-semibold text-gray-800">Price per ticket: {ticket.price} EGP</p>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Number of Tickets</label>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setNumberOfTickets(Math.max(1, numberOfTickets - 1))}
                  className="rounded-md border border-gray-300 px-4 py-2 hover:bg-gray-50"
                >
                  -
                </button>
                <span className="text-lg font-semibold">{numberOfTickets}</span>
                <button
                  onClick={() => setNumberOfTickets(numberOfTickets + 1)}
                  className="rounded-md border border-gray-300 px-4 py-2 hover:bg-gray-50"
                >
                  +
                </button>
              </div>
            </div>
            <div className="rounded-md bg-blue-50 p-4">
              <p className="text-lg font-bold text-blue-800">Total Price: {totalPrice.toFixed(2)} EGP</p>
              {walletBalance !== null && (
                <p className="mt-1 text-sm text-gray-600">
                  Wallet Balance: {walletBalance.toFixed(2)} EGP
                  {walletBalance < totalPrice && (
                    <span className="ml-2 text-red-600">(Insufficient)</span>
                  )}
                </p>
              )}
            </div>
            <button
              onClick={() => setStep('confirm')}
              disabled={walletBalance !== null && walletBalance < totalPrice}
              className="w-full rounded-md bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Continue to Confirmation
            </button>
          </div>
        </div>
      )}

      {/* Step 6: Confirm Booking */}
      {step === 'confirm' && (
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-gray-800">Confirm Booking</h2>
          <div className="space-y-4">
            <div className="space-y-2 rounded-md border p-4">
              <p>
                <span className="font-medium">From:</span> {selectedFromStation?.name}
              </p>
              <p>
                <span className="font-medium">To:</span> {selectedToStation?.name}
              </p>
              <p>
                <span className="font-medium">Date & Time:</span>{' '}
                {selectedSchedule &&
                  new Date(selectedSchedule.departureDateTime).toLocaleString('en-US', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
              </p>
              <p>
                <span className="font-medium">Tickets:</span> {numberOfTickets} × {ticket?.price} EGP = {totalPrice.toFixed(2)} EGP
              </p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => setStep('ticket')}
                className="flex-1 rounded-md border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={handleConfirmBooking}
                disabled={loading}
                className="flex-1 rounded-md bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Booking...' : 'Confirm Booking'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookTrip;

