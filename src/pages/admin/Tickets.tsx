import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import DataTable from '../../components/admin/DataTable';
import Modal from '../../components/admin/Modal';
import ticketService, { Ticket, CreateTicketData } from '../../services/ticketService';
import { toast } from '../../utils/toast';
import { formatters } from '../../utils/formatters';

const Tickets = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [formData, setFormData] = useState<CreateTicketData>({
    minStations: 1,
    busType: 'Normal',
    price: 0
  });
  const [processing, setProcessing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await ticketService.getAll();
      if (response.isSuccess && response.result) {
        setTickets(response.result);
      }
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleOpenModal = (ticket?: Ticket) => {
    if (ticket) {
      setEditingTicket(ticket);
      setFormData({
        minStations: ticket.minStations,
        busType: ticket.busType,
        price: ticket.price
      });
    } else {
      setEditingTicket(null);
      setFormData({
        minStations: 1,
        busType: 'Normal',
        price: 0
      });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingTicket(null);
    setFormData({
      minStations: 1,
      busType: 'Normal',
      price: 0
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (formData.minStations < 1) {
      toast.error('Minimum stations must be at least 1');
      return;
    }

    if (formData.price <= 0) {
      toast.error('Price must be greater than 0');
      return;
    }

    // Round price to 2 decimal places
    const roundedPrice = Math.round(formData.price * 100) / 100;

    try {
      setProcessing(true);

      if (editingTicket) {
        await ticketService.update(editingTicket.id, { ...formData, price: roundedPrice });
        toast.success('Ticket updated successfully');
      } else {
        await ticketService.create({ ...formData, price: roundedPrice });
        toast.success('Ticket created successfully');
      }

      handleCloseModal();
      await fetchTickets();
    } catch (error) {
      console.error('Failed to save ticket:', error);
      toast.error(editingTicket ? 'Failed to update ticket' : 'Failed to create ticket');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (ticket: Ticket) => {
    if (!confirm(`Are you sure you want to delete this ticket?`)) {
      return;
    }

    try {
      await ticketService.delete(ticket.id);
      toast.success('Ticket deleted successfully');
      await fetchTickets();
    } catch (error) {
      console.error('Failed to delete ticket:', error);
      toast.error('Failed to delete ticket');
    }
  };

  const filteredTickets = tickets.filter((ticket) => {
    if (typeFilter && ticket.busType !== typeFilter) return false;
    return true;
  });

  const getTypeBadge = (type: string) => {
    const colors = {
      Normal: 'bg-gray-100 text-gray-800',
      AirConditioned: 'bg-blue-100 text-blue-800',
      Luxury: 'bg-purple-100 text-purple-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {type}
      </span>
    );
  };

  const columns = [
    { key: 'minStations', header: 'Min Stations', sortable: true },
    {
      key: 'busType',
      header: 'Bus Type',
      sortable: true,
      render: (item: Ticket) => getTypeBadge(item.busType)
    },
    {
      key: 'price',
      header: 'Price',
      sortable: true,
      render: (item: Ticket) => formatters.formatCurrency(item.price)
    },
    {
      key: 'price',
      header: 'Price per Station',
      sortable: false,
      render: (item: Ticket) => formatters.formatCurrency(item.price / item.minStations)
    }
  ];

  return (
    <AdminLayout title="Ticket Management">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between items-stretch sm:items-center">
          <div className="flex gap-3 sm:gap-4 flex-1 sm:flex-initial">
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full sm:w-auto px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="Normal">Normal</option>
              <option value="AirConditioned">Air Conditioned</option>
              <option value="Luxury">Luxury</option>
            </select>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap"
          >
            + Add Ticket
          </button>
        </div>

        {/* Table */}
        <DataTable
          data={filteredTickets}
          columns={columns}
          loading={loading}
          searchable
          searchPlaceholder="Search tickets..."
          pagination={{
            pageSize: 20,
            currentPage,
            onPageChange: setCurrentPage
          }}
          emptyMessage="No tickets found"
          actions={(item: Ticket) => (
            <div className="flex gap-1 sm:gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenModal(item);
                }}
                className="px-2 sm:px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs sm:text-sm"
              >
                Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(item);
                }}
                className="px-2 sm:px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs sm:text-sm"
              >
                Delete
              </button>
            </div>
          )}
        />

        {/* Add/Edit Modal */}
        <Modal
          isOpen={modalOpen}
          onClose={handleCloseModal}
          title={editingTicket ? 'Edit Ticket' : 'Add New Ticket'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Stations *
              </label>
              <input
                type="number"
                value={formData.minStations}
                onChange={(e) => setFormData({ ...formData, minStations: parseInt(e.target.value) || 1 })}
                className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bus Type *
              </label>
              <select
                value={formData.busType}
                onChange={(e) => setFormData({ ...formData, busType: e.target.value as CreateTicketData['busType'] })}
                className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="Normal">Normal</option>
                <option value="AirConditioned">Air Conditioned</option>
                <option value="Luxury">Luxury</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price (EGP) *
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                step="0.01"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Price per {formData.minStations} station(s): {formatters.formatCurrency(formData.price / formData.minStations || 0)}
              </p>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 justify-end pt-4">
              <button
                type="button"
                onClick={handleCloseModal}
                className="w-full sm:w-auto px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={processing}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={processing}
                className="w-full sm:w-auto px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {processing ? 'Saving...' : editingTicket ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default Tickets;
