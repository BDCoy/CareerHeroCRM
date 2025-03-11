import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Send, Smile, RefreshCw, Image as ImageIcon, Mic, Video, File } from 'lucide-react';
import { useCustomerStore } from '../store/customerStore';
import { useCommunicationStore } from '../store/communicationStore';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import EmojiPicker from 'emoji-picker-react';
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';
import { processTemplate } from '../lib/templateProcessor';

const MessageMedia: React.FC<{ metadata: any }> = ({ metadata }) => {
  const { message_type, media_link, content } = metadata;

  switch (message_type) {
    case 'image':
      return (
        <div className="mb-2">
          <Zoom>
            <img 
              src={media_link} 
              alt="Sent image" 
              className="max-w-full rounded-lg cursor-zoom-in"
              style={{ maxHeight: '300px' }}
            />
          </Zoom>
        </div>
      );
    case 'video':
      return (
        <div className="mb-2">
          <video 
            src={media_link} 
            controls 
            className="max-w-full rounded-lg"
            style={{ maxHeight: '300px' }}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      );
    case 'audio':
      return (
        <div className="mb-2">
          <audio src={media_link} controls className="w-full">
            Your browser does not support the audio element.
          </audio>
        </div>
      );
    case 'document':
      return (
        <div className="mb-2">
          <a 
            href={media_link} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            <File className="h-5 w-5 mr-2" />
            <span className="text-sm text-blue-600 underline">Download document</span>
          </a>
        </div>
      );
    default:
      return null;
  }
};

const CustomerCommunication: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { selectedCustomer, loading: customerLoading, error: customerError, fetchCustomer } = useCustomerStore();
  const { communications, loading: communicationsLoading, fetchCommunications } = useCommunicationStore();
  
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [filteredTemplates, setFilteredTemplates] = useState<any[]>([]);
  const [templateCategory, setTemplateCategory] = useState<string | null>(null);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (id) {
      fetchCustomer(id);
      fetchCommunications(id);
    }
    loadTemplates();
  }, [id, fetchCustomer, fetchCommunications]);
  
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [communications]);
  
  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Failed to load message templates');
    }
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMessage = e.target.value;
    setMessage(newMessage);

    if (newMessage.startsWith('/')) {
      const category = newMessage.slice(1);
      const matchingTemplates = templates.filter(t => t.category.toLowerCase() === category.toLowerCase());
      setFilteredTemplates(matchingTemplates);
      setTemplateCategory(category);
      setShowTemplates(true);
    } else {
      setShowTemplates(false);
      setTemplateCategory(null);
    }
  };
  
  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('send-whatsapp', {
        body: {
          number: selectedCustomer?.phone,
          message: message,
          customerId: id
        }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.message || 'Failed to send message');
      }

      fetchCommunications(id!);
      
      toast.success('Message sent successfully!');
      setMessage('');
      setShowEmojiPicker(false);
      setShowTemplates(false);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message: ' + (error as Error).message);
    }
  };
  
  const handleEmojiSelect = (emojiData: any) => {
    setMessage(prev => prev + emojiData.emoji);
  };

  const handleTemplateSelect = (template: any) => {
    if (!selectedCustomer) return;
    
    // Process template with customer data
    const processedContent = processTemplate(template.content, selectedCustomer);
    setMessage(processedContent);
    setShowTemplates(false);
    setTemplateCategory(null);
  };

  const handleRefresh = async () => {
    if (!id) return;
    setIsRefreshing(true);
    try {
      await fetchCommunications(id);
      toast.success('Messages refreshed');
    } catch (error) {
      console.error('Error refreshing messages:', error);
      toast.error('Failed to refresh messages');
    } finally {
      setIsRefreshing(false);
    }
  };
  
  if (customerLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  
  if (customerError || !selectedCustomer) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <h3 className="text-lg font-medium text-red-800">Error</h3>
        <p className="mt-2 text-sm text-red-700">{customerError || 'Customer not found'}</p>
        <div className="mt-4">
          <Link to="/dashboard" className="text-red-700 hover:text-red-600 font-medium">
            &larr; Back to customers
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-screen flex flex-col">
      <div className="flex-none">
        <div className="mb-6">
          <Link to={`/dashboard/customers/${id}`} className="inline-flex items-center text-indigo-600 hover:text-indigo-900">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to customer details
          </Link>
        </div>
        
        <div className="bg-emerald-500 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-emerald-500 font-semibold">
                {selectedCustomer.firstname[0]}{selectedCustomer.lastname[0]}
              </div>
              <div className="ml-3">
                <h2 className="font-medium">{selectedCustomer.firstname} {selectedCustomer.lastname}</h2>
                <p className="text-sm opacity-90">{selectedCustomer.phone}</p>
              </div>
            </div>
            <button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 text-white hover:bg-emerald-600 rounded-full transition-colors"
            >
              <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>
      
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 bg-gray-100"
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%239C92AC' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat'
        }}
      >
        {communications
          .filter(comm => comm.type === 'whatsapp')
          .sort((a, b) => new Date(a.sentat).getTime() - new Date(b.sentat).getTime())
          .map((comm) => (
            <div
              key={comm.id}
              className={`mb-4 flex ${comm.status === 'sent' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`rounded-lg px-4 py-2 max-w-[70%] break-words ${
                  comm.status === 'sent'
                    ? 'bg-emerald-100 text-gray-800'
                    : 'bg-white text-gray-800'
                }`}
              >
                {comm.metadata?.message_type && comm.metadata?.media_link && (
                  <MessageMedia metadata={comm.metadata} />
                )}
                
                {comm.content && <p>{comm.content}</p>}
                
                <p className="text-xs text-gray-500 mt-1">
                  {format(new Date(comm.sentat), 'HH:mm')}
                  {comm.status === 'sent' && (
                    <span className="ml-1 text-emerald-500">✓✓</span>
                  )}
                </p>
              </div>
            </div>
          ))}
      </div>
      
      <div className="flex-none bg-gray-50 border-t">
        <div className="p-4 flex items-end space-x-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={message}
              onChange={handleMessageChange}
              placeholder="Type a message or /category for templates"
              className="w-full rounded-full pl-4 pr-12 py-2 border-gray-300 focus:border-emerald-500 focus:ring focus:ring-emerald-200"
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="absolute right-4 bottom-2 text-gray-500 hover:text-gray-700"
            >
              <Smile className="h-6 w-6" />
            </button>
            
            {showEmojiPicker && (
              <div className="absolute bottom-12 right-0">
                <EmojiPicker onEmojiClick={handleEmojiSelect} />
              </div>
            )}

            {showTemplates && templateCategory && (
              <div className="absolute bottom-12 left-0 w-96 bg-white rounded-lg shadow-lg border border-gray-200">
                <div className="p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {templateCategory.charAt(0).toUpperCase() + templateCategory.slice(1)} Templates
                  </h3>
                  {filteredTemplates.length > 0 ? (
                    <div className="space-y-2">
                      {filteredTemplates.map((template) => (
                        <button
                          key={template.id}
                          onClick={() => handleTemplateSelect(template)}
                          className="w-full text-left p-3 rounded bg-gray-50 hover:bg-gray-100"
                        >
                          <p className="font-medium">{template.name}</p>
                          <p className="text-sm text-gray-500 truncate">{template.content}</p>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No templates found for this category</p>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <button
            onClick={handleSendMessage}
            disabled={!message.trim()}
            className="bg-emerald-500 text-white rounded-full p-2 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerCommunication;