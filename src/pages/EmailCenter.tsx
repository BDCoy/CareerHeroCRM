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
  Eye,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useCustomerStore } from "../store/customerStore";
import { useCommunicationStore } from "../store/communicationStore";
import EmailInbox from "../components/EmailInbox";
import EmailComposer from "../components/EmailComposer";
import EmailDebugger from "../components/EmailDebugger";
import { sendEmail } from "../lib/api";
import { Communication } from "../types";
import { format } from "date-fns";
import toast from "react-hot-toast";

const ITEMS_PER_PAGE = 10;

const EmailCenter: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { selectedCustomer, fetchCustomer } = useCustomerStore();
  const { fetchCommunicationsByStatus, softDeleteCommunication } = useCommunicationStore();
  
  const [activeTab, setActiveTab] = useState<
    "inbox" | "compose" | "sent" | "archived" | "trash" | "debug"
  >("inbox");
  const [isComposing, setIsComposing] = useState(false);
  const [replyToEmail, setReplyToEmail] = useState<Communication | undefined>(undefined);
  const [isSending, setIsSending] = useState(false);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [communicationToDelete, setCommunicationToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchCustomer(id);
    }
    loadCommunications();
  }, [id, fetchCustomer, activeTab]);

  const loadCommunications = async () => {
    setLoading(true);
    try {
      let status = '';
      switch (activeTab) {
        case 'sent':
          status = 'sent';
          break;
        case 'archived':
          status = 'archived';
          break;
        case 'trash':
          status = 'deleted';
          break;
        default:
          status = 'received';
      }
      
      const data = await fetchCommunicationsByStatus(status);
      setCommunications(data);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error loading communications:', error);
      toast.error('Failed to load communications');
    } finally {
      setLoading(false);
    }
  };

  const openDeleteDialog = (commId: string) => {
    setCommunicationToDelete(commId);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setCommunicationToDelete(null);
    setIsDeleteDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!communicationToDelete) return;

    try {
      await softDeleteCommunication(communicationToDelete);
      await loadCommunications();
      toast.success('Communication moved to trash');
      closeDeleteDialog();
    } catch (error) {
      console.error('Error deleting communication:', error);
      toast.error('Failed to delete communication');
    }
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

  const totalPages = Math.ceil(communications.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedCommunications = communications.slice(startIndex, endIndex);

  const renderPagination = () => {
    if (communications.length <= ITEMS_PER_PAGE) return null;

    return (
      <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
              <span className="font-medium">
                {Math.min(endIndex, communications.length)}
              </span>{" "}
              of <span className="font-medium">{communications.length}</span> results
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                <span className="sr-only">Previous</span>
                <ChevronLeft className="h-5 w-5" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                    page === currentPage
                      ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                <span className="sr-only">Next</span>
                <ChevronRight className="h-5 w-5" />
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  const renderCommunicationsList = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      );
    }

    if (communications.length === 0) {
      return (
        <div className="text-center py-12">
          <Mail className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No {activeTab} messages
          </h3>
        </div>
      );
    }

    return (
      <>
        <div className="divide-y divide-gray-200">
          {paginatedCommunications.map((comm) => (
            <div key={comm.id} className="p-4 hover:bg-gray-50">
              <div className="flex justify-between items-start">
                <div className="flex items-start">
                  <Mail className="h-5 w-5 text-gray-400 mt-1" />
                  <div className="ml-3">
                    <div className="flex items-center">
                      <span className="font-medium text-gray-900">
                        {comm.metadata?.from || 'Unknown Sender'}
                      </span>
                      <span className="mx-2 text-gray-400">•</span>
                      <span className="text-sm text-gray-500">
                        {format(new Date(comm.sentat), 'MMM d, yyyy h:mm a')}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-900">
                      {comm.content}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Link
                    to={`/dashboard/communications/${comm.id}`}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <Eye className="h-5 w-5" />
                  </Link>
                  {/* Only show delete button if not in trash tab */}
                  {activeTab !== 'trash' && (
                    <button
                      onClick={() => openDeleteDialog(comm.id)}
                      className="text-red-400 hover:text-red-500"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        {renderPagination()}
      </>
    );
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
                ? `Email Communication with ${selectedCustomer?.firstname} ${selectedCustomer?.lastname}`
                : "Email Center"}
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              {id
                ? `Manage all email communications with ${selectedCustomer?.firstname} ${selectedCustomer?.lastname}`
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
              customerEmail={replyToEmail?.metadata?.from || selectedCustomer?.email || ''}
              customerName={selectedCustomer ? `${selectedCustomer.firstname} ${selectedCustomer.lastname}` : ''}
              onSendEmail={handleSendEmail}
              replyToEmail={replyToEmail}
              onCancel={() => {
                setIsComposing(false);
                setReplyToEmail(undefined);
              }}
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
                  className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
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
              {activeTab === "debug" ? (
                <EmailDebugger customerId={id} />
              ) : (
                renderCommunicationsList()
              )}
            </div>
          </>
        )}
      </div>

      {isDeleteDialogOpen && (
        <div className="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                  <AlertCircle className="h-6 w-6 text-red-600" aria-hidden="true" />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                    Delete Communication
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to delete this communication? This action will move it to the trash and can be undone from there.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleDelete}
                >
                  Delete
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                  onClick={closeDeleteDialog}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailCenter;