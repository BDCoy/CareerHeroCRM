export interface Customer {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  status: 'lead' | 'prospect' | 'customer' | 'inactive';
  source: string;
  notes: string;
  createdat: string;
  updatedat: string;
  resumeurl?: string;
  resumedata?: ResumeData;
}

export interface ResumeData {
  skills: string[];
  experience: Experience[];
  education: Education[];
  summary: string;
}

export interface Experience {
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  description: string;
}

export interface Education {
  institution: string;
  degree: string;
  field: string;
  graduationDate: string;
}

export interface Communication {
  id: string;
  customerid: string;
  type: 'email' | 'sms' | 'whatsapp';
  content: string;
  sentat: string;
  status: 'sent' | 'delivered' | 'failed' | 'received';
  metadata?: {
    from?: string;
    to?: string;
    cc?: string[];
    bcc?: string[];
    replyTo?: string;
    template?: string;
    hasAttachments?: boolean;
    isRead?: boolean;
    isReply?: boolean;
    [key: string]: any;
  };
}