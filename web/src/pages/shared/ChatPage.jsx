import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import chatService from '../../services/chatService';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import { MessageSquare, Send, User } from 'lucide-react';

const ChatPage = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages();
    }
  }, [selectedChat]);

  const fetchChats = async () => {
    try {
      setLoading(true);
      const data = await chatService.getMyChats();
      setChats(data.data);
    } catch (error) {
      console.error('Error fetching chats:', error);
      toast.error('Failed to load chats');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const data = await chatService.getChatMessages(selectedChat._id);
      setMessages(data.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      setSending(true);
      await chatService.sendMessage(selectedChat._id, newMessage);
      setNewMessage('');
      fetchMessages();
      fetchChats(); // Update chat list with new last message
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const getOtherPerson = (chat) => {
    if (user.role === 'Client') {
      return chat.worker;
    } else {
      return chat.client;
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diff = now - messageDate;
    
    // Less than 24 hours - show time
    if (diff < 24 * 60 * 60 * 1000) {
      return messageDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    
    // Less than 7 days - show day
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      return messageDate.toLocaleDateString('en-US', { weekday: 'short' });
    }
    
    // Older - show date
    return messageDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Messages</h1>
        <p className="text-gray-600 mt-2">
          {user.role === 'Client'
            ? 'Chat with your service providers'
            : 'Chat with your clients'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Chats List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h3 className="font-semibold text-gray-800">Conversations</h3>
          </div>
          <div className="divide-y overflow-y-auto h-full">
            {loading ? (
              <LoadingSkeleton count={5} />
            ) : chats.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p>No conversations yet</p>
              </div>
            ) : (
              chats.map((chat) => {
                const otherPerson = getOtherPerson(chat);
                const unreadCount =
                  user.role === 'Client'
                    ? chat.unreadCount?.client || 0
                    : chat.unreadCount?.worker || 0;

                return (
                  <div
                    key={chat._id}
                    onClick={() => setSelectedChat(chat)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition ${
                      selectedChat?._id === chat._id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          {otherPerson?.profilePicture ? (
                            <img
                              src={otherPerson.profilePicture}
                              alt={otherPerson.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <User className="w-5 h-5 text-gray-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{otherPerson?.name}</p>
                          {chat.appointment && (
                            <p className="text-xs text-gray-500">
                              Appointment #{chat.appointment._id?.slice(-6)}
                            </p>
                          )}
                        </div>
                      </div>
                      {unreadCount > 0 && (
                        <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 truncate">{chat.lastMessage || 'No messages yet'}</p>
                    {chat.lastMessageAt && (
                      <p className="text-xs text-gray-400 mt-1">{formatTime(chat.lastMessageAt)}</p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Messages */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow flex flex-col">
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    {getOtherPerson(selectedChat)?.profilePicture ? (
                      <img
                        src={getOtherPerson(selectedChat).profilePicture}
                        alt={getOtherPerson(selectedChat).name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {getOtherPerson(selectedChat)?.name}
                    </h3>
                    <p className="text-xs text-gray-500">{getOtherPerson(selectedChat)?.email}</p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg) => {
                      const isMe = msg.sender._id === user._id;
                      return (
                        <div
                          key={msg._id}
                          className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] p-3 rounded-lg ${
                              isMe
                                ? 'bg-blue-600 text-white rounded-br-none'
                                : 'bg-white text-gray-800 shadow rounded-bl-none'
                            }`}
                          >
                            <p className="text-sm">{msg.message}</p>
                            <p
                              className={`text-xs mt-1 ${
                                isMe ? 'text-blue-100' : 'text-gray-400'
                              }`}
                            >
                              {new Date(msg.createdAt).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                              {msg.isRead && isMe && ' • Read'}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t bg-white">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={sending || !newMessage.trim()}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <MessageSquare className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                <p className="text-lg">Select a conversation to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;


