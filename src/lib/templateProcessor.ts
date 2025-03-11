import { format } from 'date-fns';
import { Customer } from '../types';

export function processTemplate(template: string, customer: Customer): string {
  return template.replace(/\{([^}]+)\}/g, (match, key) => {
    switch (key) {
      case 'firstname':
        return customer.firstname;
      case 'lastname':
        return customer.lastname;
      case 'email':
        return customer.email;
      case 'phone':
        return customer.phone;
      case 'status':
        return customer.status;
      case 'source':
        return customer.source || '';
      case 'notes':
        return customer.notes || '';
      case 'createdat':
        return format(new Date(customer.createdat), 'PPP');
      case 'updatedat':
        return format(new Date(customer.updatedat), 'PPP');
      default:
        return match; // Return original if variable not found
    }
  });
}