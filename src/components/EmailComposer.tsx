import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Send, Paperclip, X, FileText, Image, File } from "lucide-react";
import {
  EmailTemplate,
  getEmailTemplates,
  processTemplate,
} from "../lib/emailService";
import { Communication } from "../types";
import EmailTemplateSelector from "./EmailTemplateSelector";

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
  const [templates, setTemplates] = useState<
    Array<{
      id: string;
      name: string;
      subject: string;
      body: string;
      type: EmailTemplate;
    }>
  >([]);
  const [showTemplates, setShowTemplates] = useState(false);

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
    // Load email templates
    const loadTemplates = async () => {
      try {
        const fetchedTemplates = await getEmailTemplates();
        setTemplates(fetchedTemplates);
      } catch (error) {
        console.error("Error loading email templates:", error);
      }
    };

    loadTemplates();
  }, []);

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

  const applyTemplate = (template: any) => {
    // Process template with customer data
    const processedSubject = processTemplate(template.subject, {
      firstName: customerName.split(" ")[0],
      lastName: customerName.split(" ").slice(1).join(" "),
      projectName: "Your Project",
      invoiceNumber: `INV-${Math.floor(Math.random() * 10000)}`,
      date: new Date().toLocaleDateString(),
    });

    const processedBody = processTemplate(template.body, {
      firstName: customerName.split(" ")[0],
      lastName: customerName.split(" ").slice(1).join(" "),
      projectName: "Your Project",
      projectScope: "Full service package",
      timeline: "4 weeks",
      price: "$2,500",
      invoiceNumber: `INV-${Math.floor(Math.random() * 10000)}`,
      invoiceDate: new Date().toLocaleDateString(),
      dueDate: new Date(
        Date.now() + 14 * 24 * 60 * 60 * 1000
      ).toLocaleDateString(),
      amount: "$2,500",
      bankDetails: "Bank: Example Bank, Account: 1234567890",
      senderName: "Your Name",
      nextStep1: "Schedule a follow-up call",
      nextStep2: "Review the proposal",
      nextStep3: "Make a decision by next week",
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
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

          <EmailTemplateSelector onSelectTemplate={applyTemplate} />
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
    </form>
  );
};

export default EmailComposer;
