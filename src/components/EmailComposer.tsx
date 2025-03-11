import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Send, Paperclip, X, FileText, Image, File, BookTemplate as Templates } from "lucide-react";
import { supabase } from "../lib/supabase";
import { Communication } from "../types";
import { processTemplate } from "../lib/templateProcessor";

interface EmailComposerProps {
  customerEmail: string;
  customerName: string;
  onSendEmail: (
    to: string,
    subject: string,
    body: string,
    attachments?: File[],
    cc?: string[],
    bcc?: string[]
  ) => Promise<void>;
  replyToEmail?: Communication;
  onCancel?: () => void;
}

interface EmailFormData {
  to: string;
  cc: string;
  bcc: string;
  subject: string;
  body: string;
}

interface Template {
  id: string;
  name: string;
  content: string;
  category: string;
}

const EmailComposer: React.FC<EmailComposerProps> = ({
  customerEmail,
  customerName,
  onSendEmail,
  replyToEmail,
  onCancel,
}) => {
  const [isSending, setIsSending] = useState(false);
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EmailFormData>({
    defaultValues: {
      to: customerEmail,
      cc: "",
      bcc: "",
      subject: replyToEmail
        ? `Re: ${parseEmailContent(replyToEmail.content).subject}`
        : "",
      body: replyToEmail ? generateReplyBody(replyToEmail) : "",
    },
  });

  // Watch form values for validation
  const toValue = watch("to");
  const subjectValue = watch("subject");
  const bodyValue = watch("body");

  useEffect(() => {
    loadTemplates();
  }, []);

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
    }
  };

  // Parse email content to get subject and body
  function parseEmailContent(content: string) {
    const subjectMatch = content.match(/Subject: (.*?)(?:\n|$)/);
    const subject = subjectMatch ? subjectMatch[1] : "No Subject";

    const bodyStart = content.indexOf("\n\n");
    const body = bodyStart !== -1 ? content.substring(bodyStart + 2) : content;

    return { subject, body };
  }

  // Generate reply body with quoted original message
  function generateReplyBody(email: Communication) {
    const { body } = parseEmailContent(email.content);
    const sender = email.metadata?.from || "Unknown Sender";
    const date = new Date(email.sentat).toLocaleString();

    return `\n\n\nOn ${date}, ${sender} wrote:\n\n> ${body
      .split("\n")
      .join("\n> ")}`;
  }

  const onSubmit = async (data: EmailFormData) => {
    setIsSending(true);
    try {
      // Process CC and BCC fields
      const cc = data.cc
        ? data.cc.split(",").map((email) => email.trim())
        : undefined;
      const bcc = data.bcc
        ? data.bcc.split(",").map((email) => email.trim())
        : undefined;

      await onSendEmail(data.to, data.subject, data.body, attachments, cc, bcc);

      // Reset form if not canceled
      if (!onCancel) {
        setValue("subject", "");
        setValue("body", "");
        setAttachments([]);
      } else {
        onCancel();
      }
    } catch (error) {
      console.error("Failed to send email:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments((prev) => [...prev, ...newFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTemplateSelect = (template: Template) => {
    // Process template with customer data
    const processedSubject = processTemplate(template.name, {
      firstname: customerName.split(" ")[0],
      lastname: customerName.split(" ")[1] || "",
      email: customerEmail,
    });

    const processedBody = processTemplate(template.content, {
      firstname: customerName.split(" ")[0],
      lastname: customerName.split(" ")[1] || "",
      email: customerEmail,
    });

    setValue("subject", processedSubject);
    setValue("body", processedBody);
    setShowTemplates(false);
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) {
      return <Image className="h-4 w-4 text-blue-500" />;
    } else if (file.type.includes("pdf")) {
      return <FileText className="h-4 w-4 text-red-500" />;
    } else if (file.type.includes("word") || file.type.includes("document")) {
      return <FileText className="h-4 w-4 text-blue-500" />;
    } else {
      return <File className="h-4 w-4 text-gray-500" />;
    }
  };

  // Filter templates based on search and category
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = Array.from(new Set(templates.map(t => t.category)));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <div className="flex justify-between">
          <label
            htmlFor="to"
            className="block text-sm font-medium text-gray-700"
          >
            To
          </label>
          <button
            type="button"
            className="text-xs text-indigo-600 hover:text-indigo-800"
            onClick={() => setShowCcBcc(!showCcBcc)}
          >
            {showCcBcc ? "Hide CC/BCC" : "Show CC/BCC"}
          </button>
        </div>
        <input
          id="to"
          type="text"
          {...register("to", { required: "Recipient email is required" })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
        {errors.to && (
          <p className="mt-1 text-sm text-red-600">{errors.to.message}</p>
        )}
      </div>

      {showCcBcc && (
        <>
          <div>
            <label
              htmlFor="cc"
              className="block text-sm font-medium text-gray-700"
            >
              CC
            </label>
            <input
              id="cc"
              type="text"
              {...register("cc")}
              placeholder="Separate multiple emails with commas"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="bcc"
              className="block text-sm font-medium text-gray-700"
            >
              BCC
            </label>
            <input
              id="bcc"
              type="text"
              {...register("bcc")}
              placeholder="Separate multiple emails with commas"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        </>
      )}

      <div>
        <label
          htmlFor="subject"
          className="block text-sm font-medium text-gray-700"
        >
          Subject
        </label>
        <input
          id="subject"
          type="text"
          {...register("subject", { required: "Subject is required" })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
        {errors.subject && (
          <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="body"
          className="block text-sm font-medium text-gray-700"
        >
          Message
        </label>
        <textarea
          id="body"
          rows={10}
          {...register("body", { required: "Message is required" })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
        {errors.body && (
          <p className="mt-1 text-sm text-red-600">{errors.body.message}</p>
        )}
      </div>

      {/* Attachments */}
      {attachments.length > 0 && (
        <div className="border border-gray-200 rounded-md p-3">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Attachments
          </h4>
          <ul className="space-y-2">
            {attachments.map((file, index) => (
              <li
                key={index}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center">
                  {getFileIcon(file)}
                  <span className="ml-2 truncate max-w-[150px] sm:max-w-full">
                    {file.name}
                  </span>
                  <span className="ml-2 text-xs text-gray-500">
                    ({(file.size / 1024).toFixed(0)} KB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeAttachment(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
        <div className="flex flex-wrap gap-2">
          <div>
            <input
              type="file"
              id="file-upload"
              multiple
              onChange={handleFileChange}
              className="sr-only"
            />
            <label
              htmlFor="file-upload"
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer"
            >
              <Paperclip className="h-4 w-4 mr-2" />
              Attach Files
            </label>
          </div>

          <button
            type="button"
            onClick={() => setShowTemplates(true)}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Templates className="h-4 w-4 mr-2" />
            Templates
          </button>
        </div>

        <div className="flex space-x-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
          )}

          <button
            type="submit"
            disabled={isSending || !toValue || !subjectValue || !bodyValue}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 w-full sm:w-auto"
          >
            <Send className="h-4 w-4 mr-2" />
            {isSending ? "Sending..." : "Send Email"}
          </button>
        </div>
      </div>

      {/* Template Selection Dialog */}
      {showTemplates && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  type="button"
                  className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  onClick={() => setShowTemplates(false)}
                >
                  <span className="sr-only">Close</span>
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Select Template
                  </h3>

                  <div className="mt-4">
                    <input
                      type="text"
                      placeholder="Search templates..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedCategory(null)}
                      className={`px-2 py-1 rounded text-sm ${
                        !selectedCategory
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      All
                    </button>
                    {categories.map(category => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => setSelectedCategory(category)}
                        className={`px-2 py-1 rounded text-sm ${
                          selectedCategory === category
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>

                  <div className="mt-4 max-h-96 overflow-y-auto">
                    <div className="space-y-2">
                      {filteredTemplates.map((template) => (
                        <button
                          key={template.id}
                          type="button"
                          onClick={() => handleTemplateSelect(template)}
                          className="w-full text-left p-3 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          <h4 className="text-sm font-medium text-gray-900">
                            {template.name}
                          </h4>
                          <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                            {template.content}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};

export default EmailComposer;