import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Mail,
  Inbox,
  Send,
  Archive,
  Trash2,
  Plus,
  FileText,
  Settings as SettingsIcon,
} from "lucide-react";
import { useCustomerStore } from "../store/customerStore";
import EmailInbox from "../components/EmailInbox";
import EmailComposer from "../components/EmailComposer";
import EmailDebugger from "../components/EmailDebugger";
import { sendEmail } from "../lib/api";
import { Communication } from "../types";
import toast from "react-hot-toast";

const EmailCenter: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { customers, selectedCustomer, fetchCustomers, fetchCustomer } =
    useCustomerStore();
  const [activeTab, setActiveTab] = useState<
    "inbox" | "compose" | "sent" | "archived" | "trash" | "debug"
  >("inbox");
  const [isComposing, setIsComposing] = useState(false);
  const [replyToEmail, setReplyToEmail] = useState<Communication | undefined>(
    undefined
  );
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetchCustomers();
    if (id) {
      fetchCustomer(id);
    }
  }, [id, fetchCustomers, fetchCustomer]);

  const handleSendEmail = async (
    to: string,
    subject: string,
    body: string,
    attachments?: File[],
    cc?: string[],
    bcc?: string[]
  ) => {
    if (isSending) return;

    setIsSending(true);
    try {
      const customerId = id || "general";

      // Convert attachments to base64 if they exist
      let emailAttachments;
      if (attachments && attachments.length > 0) {
        emailAttachments = await Promise.all(
          attachments.map(async (file) => {
            const base64 = await convertFileToBase64(file);
            return {
              filename: file.name,
              content: base64,
              contentType: file.type,
            };
          })
        );
      }
      console.log(customerId);
      await sendEmail(to, subject, body, emailAttachments, cc, bcc, customerId);

      toast.success("Email sent successfully");
      setIsComposing(false);
      setReplyToEmail(undefined);

      // If we're in the inbox, refresh it
      if (activeTab === "inbox") {
        setActiveTab("sent");
        setTimeout(() => setActiveTab("inbox"), 100);
      }
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error("Failed to send email");
    } finally {
      setIsSending(false);
    }
  };

  const handleReply = (email: Communication) => {
    setReplyToEmail(email);
    setIsComposing(true);
  };

  const getCustomerName = () => {
    if (id && selectedCustomer) {
      return `${selectedCustomer.firstname} ${selectedCustomer.lastname}`;
    }
    return "";
  };

  const getCustomerEmail = () => {
    if (id && selectedCustomer) {
      return selectedCustomer.email;
    }
    return "";
  };

  // Helper function to convert File to base64
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
        } else {
          reject(new Error("Failed to convert file to base64"));
        }
      };
      reader.onerror = () => {
        reject(reader.error);
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <div>
      <div className="mb-6">
        <Link
          to={id ? `/dashboard/customers/${id}` : "/dashboard/communications"}
          className="inline-flex items-center text-indigo-600 hover:text-indigo-900"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          {id ? "Back to customer details" : "Back to communications"}
        </Link>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              {id
                ? `Email Communication with ${getCustomerName()}`
                : "Email Center"}
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              {id
                ? `Manage all email communications with ${getCustomerName()}`
                : "Manage all email communications"}
            </p>
          </div>

          <div className="flex space-x-2">
            <Link
              to="/dashboard/email/parser"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <FileText className="h-4 w-4 mr-2" />
              Email Parser
            </Link>

            <Link
              to="/dashboard/settings"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <SettingsIcon className="h-4 w-4 mr-2" />
              Settings
            </Link>

            <button
              onClick={() => {
                setIsComposing(true);
                setReplyToEmail(undefined);
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Compose Email
            </button>
          </div>
        </div>

        {isComposing ? (
          <div className="p-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">
              {replyToEmail ? "Reply to Email" : "Compose New Email"}
            </h4>
            <EmailComposer
              customerEmail={replyToEmail?.metadata?.from || getCustomerEmail()}
              customerName={getCustomerName()}
              onSendEmail={handleSendEmail}
              replyToEmail={replyToEmail}
              onCancel={() => {
                setIsComposing(false);
                setReplyToEmail(undefined);
              }}
              isSending={isSending}
            />
          </div>
        ) : (
          <>
            <div className="border-b border-gray-200 overflow-x-auto">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab("inbox")}
                  className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                    activeTab === "inbox"
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center">
                    <Inbox className="h-4 w-4 mr-2" />
                    <span>Inbox</span>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab("sent")}
                  className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                    activeTab === "sent"
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center">
                    <Send className="h-4 w-4 mr-2" />
                    <span>Sent</span>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab("archived")}
                  className={`py-4 px-6 text-center border-b-2  font-medium text-sm ${
                    activeTab === "archived"
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center">
                    <Archive className="h-4 w-4 mr-2" />
                    <span>Archived</span>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab("trash")}
                  className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                    activeTab === "trash"
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center">
                    <Trash2 className="h-4 w-4 mr-2" />
                    <span>Trash</span>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab("debug")}
                  className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                    activeTab === "debug"
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center">
                    <SettingsIcon className="h-4 w-4 mr-2" />
                    <span>Debug</span>
                  </div>
                </button>
              </nav>
            </div>

            <div className="p-6">
              {activeTab === "inbox" && (
                <EmailInbox customerId={id} onReply={handleReply} />
              )}

              {activeTab === "sent" && (
                <div className="text-center py-12">
                  <Mail className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    Sent emails
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    View all emails you've sent to customers.
                  </p>
                </div>
              )}

              {activeTab === "archived" && (
                <div className="text-center py-12">
                  <Archive className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    Archived emails
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    View all archived emails.
                  </p>
                </div>
              )}

              {activeTab === "trash" && (
                <div className="text-center py-12">
                  <Trash2 className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    Trash
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    View deleted emails.
                  </p>
                </div>
              )}

              {activeTab === "debug" && <EmailDebugger customerId={id} />}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EmailCenter;
