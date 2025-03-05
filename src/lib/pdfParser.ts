import * as pdfjs from 'pdfjs-dist';

// Set the worker source to use a CDN version that matches our package version
const PDFJS_VERSION = '3.11.174';
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`;

/**
 * Extract text from a PDF file
 * @param file The PDF file to extract text from
 * @returns A promise that resolves to the extracted text
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    // Read the file as an ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Load the PDF document
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    // Get the total number of pages
    const numPages = pdf.numPages;
    
    // Extract text from each page
    let fullText = '';
    
    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      // Concatenate the text items
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      fullText += pageText + '\n\n';
    }
    
    return fullText;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

/**
 * Extract text from a file based on its type
 * @param file The file to extract text from
 * @returns A promise that resolves to the extracted text
 */
export async function extractTextFromFile(file: File): Promise<string> {
  try {
    // Handle different file types
    if (file.type === 'application/pdf') {
      return await extractTextFromPDF(file);
    } else if (file.type === 'text/plain') {
      // For text files, just read the text
      return await file.text();
    } else if (
      file.type === 'application/msword' || 
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      // For Word documents, we'd need a specialized library
      // For now, return a message indicating this limitation
      return "Word document text extraction is not supported in the browser. Please upload a PDF or text file for better results.";
    } else {
      // For unsupported file types
      return `Unsupported file type: ${file.type}. Please upload a PDF or text file.`;
    }
  } catch (error) {
    console.error('Error extracting text from file:', error);
    throw new Error(`Failed to extract text from ${file.type} file`);
  }
}

/**
 * Fallback method to extract text from a PDF file using a simple approach
 * This is used when the PDF.js extraction fails
 * @param file The PDF file to extract text from
 * @returns A promise that resolves to the extracted text
 */
export async function fallbackExtractTextFromPDF(file: File): Promise<string> {
  try {
    // Read the file as text directly
    // This won't work well for all PDFs but might catch some text
    const text = await file.text();
    
    // Clean up the text by removing non-printable characters
    const cleanedText = text.replace(/[^\x20-\x7E\n\r\t]/g, ' ')
                           .replace(/\s+/g, ' ')
                           .trim();
    
    return cleanedText || "Could not extract text from this PDF. Please try a different file format.";
  } catch (error) {
    console.error('Error in fallback PDF text extraction:', error);
    return "Failed to extract text from PDF using fallback method.";
  }
}