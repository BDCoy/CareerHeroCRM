import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, MessageSquare, Webhook } from 'lucide-react';
import WebhookSetupGuide from '../components/WebhookSetupGuide';

const WebhookSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'email' | 'sms' | 'whatsapp'>('email');
  
  return (
    <div>
      <div className="mb-6">
        <Link to="/settings" className="inline-flex items-center text-indigo-600 hover:text-indigo-900">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Settings
        </Link>
      </div>
      
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Webhook Configuration</h1>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
        <div className="px-4 py-5 sm:px-6 border-b">
          <div className="flex items-center">
            <Webhook className="h-5 w-5 text-indigo-500 mr-2" />
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Webhook Settings
            </h3>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Configure webhooks to automatically process incoming emails, SMS, and WhatsApp messages
          </p>
        </div>
        
        <div className="flex flex-wrap border-b overflow-x-auto">
          <button
            className={`py-3 px-4 whitespace-nowrap flex items-center ${activeTab === 'email' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('email')}
          >
            <Mail className="h-4 w-4 mr-2" />
            Email Webhooks
          </button>
          <button
            className={`py-3 px-4 whitespace-nowrap flex items-center ${activeTab === 'sms' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('sms')}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            SMS Webhooks
          </button>
          <button
            className={`py-3 px-4 whitespace-nowrap flex items-center ${activeTab === 'whatsapp' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('whatsapp')}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-4 w-4 mr-2" 
              viewBox="0 0 24 24" 
              fill="currentColor"
              style={{ color: activeTab === 'whatsapp' ? '#4f46e5' : '#6b7280' }}
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            WhatsApp Webhooks
          </button>
        </div>
        
        <div className="p-6">
          <WebhookSetupGuide type={activeTab} />
        </div>
      </div>
      
      <div className="bg-indigo-50 p-4 rounded-md border border-indigo-200 mb-6">
        <h4 className="text-md font-medium text-indigo-800 mb-2">What are webhooks?</h4>
        <p className="text-sm text-indigo-700 mb-2">
          Webhooks are automated messages sent from apps when something happens. They're HTTP callbacks that are triggered by specific events in a source system and sent to a destination system, often with a payload of data.
        </p>
        <p className="text-sm text-indigo-700">
          In this CRM, webhooks allow you to automatically:
        </p>
        <ul className="list-disc ml-5 text-sm text-indigo-700 mt-2 space-y-1">
          <li>Process incoming emails with resume attachments to create new customer records</li>
          <li>Receive and respond to SMS messages from customers</li>
          <li>Receive and respond to WhatsApp messages from customers</li>
        </ul>
      </div>
      
      <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
        <h4 className="text-md font-medium text-yellow-800 mb-2">Testing Webhooks Locally</h4>
        <p className="text-sm text-yellow-700 mb-2">
          To test webhooks during development, you'll need to expose your local server to the internet. We recommend using ngrok:
        </p>
        <ol className="list-decimal ml-5 text-sm text-yellow-700 space-y-1">
          <li>Install ngrok: <code>npm install -g ngrok</code></li>
          <li>Start your local server (e.g., <code>npm run dev</code>)</li>
          <li>In a new terminal, run: <code>ngrok http 3000</code> (replace 3000 with your server port)</li>
          <li>Use the ngrok URL (e.g., <code>https://a1b2c3d4.ngrok.io</code>) as your webhook URL</li>
        </ol>
        <p className="text-sm text-yellow-700 mt-2">
          Note: ngrok URLs change each time you restart ngrok unless you have a paid account.
        </p>
      </div>
    </div>
  );
};

export default WebhookSettings;