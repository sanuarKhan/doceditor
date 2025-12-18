
import pdf from 'pdf-parse';

/**
 * Parses a PDF buffer and returns the text content.
 * @param {Buffer} dataBuffer - The PDF data buffer.
 * @returns {Promise<string>} - The extracted text.
 */
async function parsePDF(dataBuffer) {
    try {
        const data = await pdf(dataBuffer);

        // Basic cleaning: You might want to enhance this based on "special characters" issues.
        // pdf-parse usually handles standard encoding well.
        // If specific artifacts appear, regex replacement can go here.
        let text = data.text;

        // Example cleanups (optional, can be expanded):
        // text = text.replace(/\s+/g, ' ').trim(); 

        return text;
    } catch (error) {
        throw new Error(`PDF Parsing internal error: ${error.message}`);
    }
}

export default parsePDF;
