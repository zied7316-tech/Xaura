import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import supportTicketService from '../../services/supportTicketService';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import { MessageSquare, CheckCircle, Clock, AlertCircle, Send } from 'lucide-react';

const SupportTicketsPage = () => {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    status: '',
    priority: '',
    category: '',
  });

  useEffect(() => {
    fetchTickets();
    fetchStats();
  }, [filters.page, filters.status, filters.priority, filters.category]);

  useEffect(() => {
    if (selectedTicket) {
      fetchMessages();
    }
  }, [selectedTicket]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const data = await supportTicketService.getAllTickets(filters);
      setTickets(data.data);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await supportTicketService.getTicketStats();
      setStats(data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const data = await supportTicketService.getTicketMessages(selectedTicket._id);
      setMessages(data.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const handleAssignTicket = async (id) => {
    try {
      await supportTicketService.assignTicket(id);
      toast.success('Ticket assigned to you!');
      fetchTickets();
      if (selectedTicket?._id === id) {
        const updatedTicket = await supportTicketService.getTicket(id);
        setSelectedTicket(updatedTicket.data);
      }
    } catch (error) {
      console.error('Error assigning ticket:', error);
      toast.error('Failed to assign ticket');
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await supportTicketService.updateTicketStatus(id, status);
      toast.success('Ticket status updated!');
      fetchTickets();
      if (selectedTicket?._id === id) {
        const updatedTicket = await supportTicketService.getTicket(id);
        setSelectedTicket(updatedTicket.data);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      setSending(true);
      await supportTicketService.addMessage(selectedTicket._id, newMessage);
      setNewMessage('');
      fetchMessages();
      toast.success('Message sent!');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      open: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800',
    };

    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[status]}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const styles = {
      low: 'bg-gray-100 text-gray-600',
      medium: 'bg-blue-100 text-blue-600',
      high: 'bg-orange-100 text-orange-600',
      urgent: 'bg-red-100 text-red-600',
    };

    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded ${styles[priority]}`}>
        {priority.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Support Tickets</h1>
        <p className="text-gray-600 mt-2">Manage customer support requests</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Total Tickets</p>
            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Open</p>
            <p className="text-2xl font-bold text-blue-600">{stats.open}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">In Progress</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Avg Response Time</p>
            <p className="text-2xl font-bold text-green-600">
              {stats.avgResponseTime.toFixed(1)}h
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            className="p-2 border rounded-lg"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <select
            className="p-2 border rounded-lg"
            value={filters.priority}
            onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
          >
            <option value="">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select
            className="p-2 border rounded-lg"
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          >
            <option value="">All Categories</option>
            <option value="bug">Bug</option>
            <option value="feature">Feature Request</option>
            <option value="billing">Billing</option>
            <option value="technical">Technical</option>
            <option value="general">General</option>
          </select>
        </div>
      </div>

      {/* Tickets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tickets List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-800">All Tickets</h3>
          </div>
          <div className="divide-y max-h-[600px] overflow-y-auto">
            {loading ? (
              <LoadingSkeleton count={5} />
            ) : tickets.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No tickets found</div>
            ) : (
              tickets.map((ticket) => (
                <div
                  key={ticket._id}
                  onClick={() => setSelectedTicket(ticket)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition ${
                    selectedTicket?._id === ticket._id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-800">{ticket.subject}</p>
                      <p className="text-xs text-gray-500">{ticket.ticketNumber}</p>
                    </div>
                    {getPriorityBadge(ticket.priority)}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{ticket.salon?.name}</p>
                  <div className="flex items-center justify-between">
                    {getStatusBadge(ticket.status)}
                    <span className="text-xs text-gray-500">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Ticket Details & Chat */}
        <div className="bg-white rounded-lg shadow">
          {selectedTicket ? (
            <>
              {/* Ticket Header */}
              <div className="p-4 border-b">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-800">{selectedTicket.subject}</h3>
                    <p className="text-xs text-gray-500">{selectedTicket.ticketNumber}</p>
                  </div>
                  <div className="flex gap-2">
                    {getPriorityBadge(selectedTicket.priority)}
                    {getStatusBadge(selectedTicket.status)}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-3">{selectedTicket.description}</p>
                <div className="flex gap-2">
                  {!selectedTicket.assignedTo && (
                    <button
                      onClick={() => handleAssignTicket(selectedTicket._id)}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Assign to Me
                    </button>
                  )}
                  {selectedTicket.status === 'in_progress' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedTicket._id, 'resolved')}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Mark Resolved
                    </button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="p-4 h-96 overflow-y-auto">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">No messages yet</div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div
                        key={msg._id}
                        className={`flex ${msg.sender.role === 'SuperAdmin' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-lg ${
                            msg.sender.role === 'SuperAdmin'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          <p className="text-xs font-semibold mb-1">{msg.sender.name}</p>
                          <p className="text-sm">{msg.message}</p>
                          <p className="text-xs opacity-75 mt-1">
                            {new Date(msg.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type your message..."
                    className="flex-1 p-2 border rounded-lg"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={sending || !newMessage.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>Select a ticket to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupportTicketsPage;


