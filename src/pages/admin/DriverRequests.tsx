import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import DataTable from '../../components/admin/DataTable';
import Modal from '../../components/admin/Modal';
import adminService, { DriverRequest } from '../../services/adminService';
import { toast } from '../../utils/toast';
import { formatters } from '../../utils/formatters';

const DriverRequests = () => {
  const [requests, setRequests] = useState<DriverRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedRequest, setSelectedRequest] = useState<DriverRequest | null>(null);
  const [actionModal, setActionModal] = useState<'accept' | 'reject' | null>(null);
  const [processing, setProcessing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await adminService.getAllDriverRequests();
      console.log('Driver Requests Response:', response);
      if (response.isSuccess && response.result) {
        console.log('Driver Requests Data:', response.result);
        setRequests(response.result);
      } else {
        console.warn('No driver requests found or unsuccessful response');
        setRequests([]);
      }
    } catch (error) {
      console.error('Failed to fetch driver requests:', error);
      toast.error('Failed to load driver requests');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchRequests, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleAccept = async () => {
    if (!selectedRequest) return;

    try {
      setProcessing(true);
      await adminService.acceptDriverRequest(selectedRequest.id);
      toast.success('Driver request accepted successfully');
      setActionModal(null);
      setSelectedRequest(null);
      await fetchRequests();
    } catch (error) {
      console.error('Failed to accept request:', error);
      toast.error('Failed to accept driver request');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;

    try {
      setProcessing(true);
      await adminService.rejectDriverRequest(selectedRequest.id);
      toast.success('Driver request rejected');
      setActionModal(null);
      setSelectedRequest(null);
      await fetchRequests();
    } catch (error) {
      console.error('Failed to reject request:', error);
      toast.error('Failed to reject driver request');
    } finally {
      setProcessing(false);
    }
  };

  const filteredRequests = requests.filter((req) => {
    if (statusFilter && req.status !== statusFilter) return false;
    return true;
  });

  const getStatusBadge = (status: string) => {
    const colors = {
      Suspend: 'bg-yellow-100 text-yellow-800',
      Accepted: 'bg-green-100 text-green-800',
      Rejected: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const columns = [
    { key: 'id', header: 'ID', sortable: true },
    { key: 'name', header: 'Name', sortable: true },
    { key: 'ssn', header: 'SSN', sortable: true },
    { key: 'phone', header: 'Phone', sortable: true },
    { key: 'email', header: 'Email', sortable: true },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (item: DriverRequest) => getStatusBadge(item.status)
    }
  ];

  return (
    <AdminLayout title="Driver Requests">
      <div className="space-y-6">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full sm:w-auto px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="Suspend">Pending</option>
              <option value="Accepted">Accepted</option>
              <option value="Rejected">Rejected</option>
            </select>
            <div className="flex-1" />
            <button
              onClick={fetchRequests}
              className="w-full sm:w-auto px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Table */}
        <DataTable
          data={filteredRequests}
          columns={columns}
          loading={loading}
          searchable
          searchPlaceholder="Search by name or email..."
          pagination={{
            pageSize: 20,
            currentPage,
            onPageChange: setCurrentPage
          }}
          emptyMessage="No driver requests found"
          actions={(item: DriverRequest) => (
            <div className="flex gap-1 sm:gap-2">
              {item.status === 'Suspend' && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedRequest(item);
                      setActionModal('accept');
                    }}
                    className="px-2 sm:px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs sm:text-sm"
                  >
                    Accept
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedRequest(item);
                      setActionModal('reject');
                    }}
                    className="px-2 sm:px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs sm:text-sm"
                  >
                    Reject
                  </button>
                </>
              )}
            </div>
          )}
        />

        {/* Confirmation Modals */}
        <Modal
          isOpen={actionModal === 'accept'}
          onClose={() => {
            setActionModal(null);
            setSelectedRequest(null);
          }}
          title="Accept Driver Request"
          size="sm"
        >
          <div className="space-y-4">
            <p>
              Are you sure you want to accept the driver request from{' '}
              <strong>{selectedRequest?.name}</strong>?
            </p>
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 justify-end">
              <button
                onClick={() => {
                  setActionModal(null);
                  setSelectedRequest(null);
                }}
                className="w-full sm:w-auto px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={processing}
              >
                Cancel
              </button>
              <button
                onClick={handleAccept}
                disabled={processing}
                className="w-full sm:w-auto px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {processing ? 'Processing...' : 'Accept'}
              </button>
            </div>
          </div>
        </Modal>

        <Modal
          isOpen={actionModal === 'reject'}
          onClose={() => {
            setActionModal(null);
            setSelectedRequest(null);
          }}
          title="Reject Driver Request"
          size="sm"
        >
          <div className="space-y-4">
            <p>
              Are you sure you want to reject the driver request from{' '}
              <strong>{selectedRequest?.name}</strong>?
            </p>
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 justify-end">
              <button
                onClick={() => {
                  setActionModal(null);
                  setSelectedRequest(null);
                }}
                className="w-full sm:w-auto px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={processing}
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={processing}
                className="w-full sm:w-auto px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {processing ? 'Processing...' : 'Reject'}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default DriverRequests;
