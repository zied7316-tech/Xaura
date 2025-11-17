import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import chatService from '../../services/chatService';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import { MessageSquare, Send, User } from 'lucide-react';

const ChatPage = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [chats, setChats] = useState([]);
  const [expandedChatId, setExpandedChatId] = useState(null);
  const [chatMessages, setChatMessages] = useState({}); // Store messages for each chat
  const [newMessages, setNewMessages] = useState({}); // Store new message input for each chat
  const [sending, setSending] = useState({}); // Track sending state per chat
  const [loading, setLoading] = useState(true);
  const messageEndRefs = useRef({}); // Refs for scrolling to bottom of each chat

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

  const fetchChatById = async (chatId) => {
    try {
      const data = await chatService.getChat(chatId);
      if (data.data) {
        // Add to chats list if not already there
        setChats(prev => {
          const exists = prev.find(c => c._id === chatId);
          if (!exists) {
            return [...prev, data.data];
          }
          return prev;
        });
        // Expand this chat
        setExpandedChatId(chatId);
        // Load messages for this chat
        fetchMessages(chatId);
      }
    } catch (error) {
      console.error('Error fetching chat:', error);
      toast.error('Chat not found');
    }
  };

  useEffect(() => {
    fetchChats();
  }, []);

  // Auto-expand chat from URL parameter
  useEffect(() => {
    const chatId = searchParams.get('chatId');
    if (chatId) {
      if (chats.length > 0) {
        const chat = chats.find(c => c._id === chatId);
        if (chat) {
          setExpandedChatId(chatId);
          fetchMessages(chatId);
        } else {
          // Chat not in list yet, fetch it directly
          fetchChatById(chatId);
        }
      } else if (!loading) {
        // Chats loaded but not found, fetch it directly
        fetchChatById(chatId);
      }
    }
  }, [searchParams, chats, loading]);

  // Auto-scroll to bottom when messages are loaded or chat is expanded
  useEffect(() => {
    if (expandedChatId && chatMessages[expandedChatId]) {
      const ref = messageEndRefs.current[expandedChatId];
      if (ref) {
        setTimeout(() => {
          ref.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }, 100);
      }
    }
  }, [expandedChatId, chatMessages]);

  const fetchMessages = async (chatId, forceRefresh = false) => {
    // Don't fetch if already loaded (unless force refresh)
    if (chatMessages[chatId] && !forceRefresh) return;
    
    try {
      const data = await chatService.getChatMessages(chatId);
      setChatMessages(prev => ({
        ...prev,
        [chatId]: data.data
      }));
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const handleToggleChat = (chatId) => {
    if (expandedChatId === chatId) {
      // Collapse
      setExpandedChatId(null);
    } else {
      // Expand
      setExpandedChatId(chatId);
      // Load messages if not already loaded
      if (!chatMessages[chatId]) {
        fetchMessages(chatId);
      }
    }
  };

  const handleSendMessage = async (chatId) => {
    const message = newMessages[chatId]?.trim();
    if (!message) return;

    try {
      setSending(prev => ({ ...prev, [chatId]: true }));
      await chatService.sendMessage(chatId, message);
      setNewMessages(prev => ({ ...prev, [chatId]: '' }));
      // Refresh messages
      await fetchMessages(chatId, true);
      // Update chat list with new last message
      fetchChats();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(prev => ({ ...prev, [chatId]: false }));
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
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Messages</h1>
        <p className="text-gray-600 mt-2">
          {user.role === 'Client'
            ? 'Chat with your service providers'
            : 'Chat with your clients'}
        </p>
      </div>

      <div className="space-y-4">
        {loading ? (
          <LoadingSkeleton count={3} />
        ) : chats.length === 0 ? (
          <div className="p-12 text-center text-gray-500 bg-white rounded-lg shadow">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-lg">No conversations yet</p>
            <p className="text-sm mt-2">Start a conversation from your appointments</p>
          </div>
        ) : (
          chats.map((chat) => {
            const otherPerson = getOtherPerson(chat);
            const unreadCount =
              user.role === 'Client'
                ? chat.unreadCount?.client || 0
                : chat.unreadCount?.worker || 0;
            const isExpanded = expandedChatId === chat._id;
            const messages = chatMessages[chat._id] || [];
            const newMessage = newMessages[chat._id] || '';
            const isSending = sending[chat._id] || false;

            return (
              <div
                key={chat._id}
                className={`bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 ${
                  isExpanded ? 'shadow-lg ring-2 ring-primary-200' : 'hover:shadow-lg'
                }`}
              >
                {/* Chat Header - Clickable */}
                <div
                  onClick={() => handleToggleChat(chat._id)}
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                        {otherPerson?.profilePicture ? (
                          <img
                            src={otherPerson.profilePicture}
                            alt={otherPerson.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-6 h-6 text-primary-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-800 truncate">{otherPerson?.name}</p>
                          {unreadCount > 0 && (
                            <span className="bg-primary-600 text-white text-xs px-2 py-0.5 rounded-full flex-shrink-0">
                              {unreadCount}
                            </span>
                          )}
                        </div>
                        {chat.appointment && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            Appointment #{chat.appointment._id?.slice(-6)}
                          </p>
                        )}
                        <p className="text-sm text-gray-600 truncate mt-1">
                          {chat.lastMessage || 'No messages yet'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      {chat.lastMessageAt && (
                        <p className="text-xs text-gray-400 whitespace-nowrap">
                          {formatTime(chat.lastMessageAt)}
                        </p>
                      )}
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Expanded Chat Messages */}
                {isExpanded && (
                  <div className="border-t border-gray-100">
                    {/* Messages Area */}
                    <div className="h-[400px] p-4 overflow-y-auto bg-gradient-to-b from-gray-50 to-gray-100">
                      {messages.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                          <p>No messages yet. Start the conversation!</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {messages.map((msg, index) => {
                            // Determine if this message is from the current user
                            // Handle both populated sender object and string ID
                            const senderId = msg.sender?._id || msg.sender || msg.senderId;
                            const currentUserId = user._id || user.id;
                            const isMe = String(senderId) === String(currentUserId);
                            return (
                              <div
                                key={msg._id}
                                className={`flex items-end gap-2 ${
                                  isMe ? 'justify-end' : 'justify-start'
                                }`}
                                style={{
                                  animation: `slideInMessage 0.3s ease-out ${index * 0.05}s both`
                                }}
                              >
                                {/* Avatar for received messages (only show on left for other person) */}
                                {!isMe && (
                                  <div className="w-8 h-8 rounded-full bg-primary-200 flex items-center justify-center flex-shrink-0 mb-1">
                                    {otherPerson?.profilePicture ? (
                                      <img
                                        src={otherPerson.profilePicture}
                                        alt={otherPerson.name}
                                        className="w-8 h-8 rounded-full object-cover"
                                      />
                                    ) : (
                                      <User className="w-4 h-4 text-primary-600" />
                                    )}
                                  </div>
                                )}
                                
                                {/* Message bubble */}
                                <div
                                  className={`max-w-[70%] sm:max-w-[75%] p-3 rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md ${
                                    isMe
                                      ? 'bg-gradient-to-br from-primary-600 to-primary-700 text-white rounded-tr-sm'
                                      : 'bg-white text-gray-800 rounded-tl-sm border border-gray-100'
                                  }`}
                                >
                                  <p className="text-sm leading-relaxed break-words">{msg.message}</p>
                                  <div className={`flex items-center gap-1 mt-1.5 ${
                                    isMe ? 'justify-end' : 'justify-start'
                                  }`}>
                                    <p
                                      className={`text-xs ${
                                        isMe ? 'text-primary-100' : 'text-gray-400'
                                      }`}
                                    >
                                      {new Date(msg.createdAt).toLocaleTimeString('en-US', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </p>
                                    {msg.isRead && isMe && (
                                      <span className="text-primary-100 text-xs">✓✓</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          {/* Scroll anchor */}
                          <div ref={(el) => (messageEndRefs.current[chat._id] = el)} />
                        </div>
                      )}
                    </div>

                    {/* Message Input */}
                    <div className="p-4 border-t bg-white">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Type a message..."
                          className="flex-1 p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                          value={newMessage}
                          onChange={(e) =>
                            setNewMessages(prev => ({ ...prev, [chat._id]: e.target.value }))
                          }
                          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(chat._id)}
                        />
                        <button
                          onClick={() => handleSendMessage(chat._id)}
                          disabled={isSending || !newMessage.trim()}
                          className="px-6 py-3 bg-gradient-to-br from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center"
                        >
                          <Send className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ChatPage;


