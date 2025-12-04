📊 DDQ Analyzer: Gemini-Powered Document Structuring Tool

The DDQ Analyzer is a cutting-edge web application designed to automate the painful process of structuring large Due Diligence Questionnaire (DDQ) documents. By leveraging the advanced multimodal capabilities of Google's Gemini 2.5 Pro, this tool extracts, categorizes, and persists the complex nested structure (Sections and Questions) of uploaded documents, providing an interactive interface for manual review and correction.

Built using the latest Next.js 14+ patterns, the application ensures high performance, reliability, and an excellent developer experience by utilizing Server Actions for all complex backend mutations.

✨ Core Features

AI-Powered Structured Extraction: Uses the Gemini API with strict JSON Schema generation to accurately identify and extract Sections (S) and Questions (Q) from uploaded PDF documents.

Next.js Server Actions: Utilizes a modern, performant architecture where file upload, AI analysis, and database writes are handled by non-blocking, asynchronous server functions.

Interactive Categorization: Provides a client-side interface built with Shadcn UI where users can quickly review the AI's classification and edit the category of any item to Section, Question, or Deselect.

Real-time Persistence: Data is stored in MongoDB and updated in real-time, ensuring persistence and readiness for future workflow integrations.

Scalability Focus: Architecture designed to handle the heavy processing load of PDF-to-image conversion (required for multimodal analysis) by isolating the work from the main web request (via the conceptual worker service described in the previous response).

🚀 Technology Stack

Component

Technology

Role

Frontend Framework

Next.js 14+ (App Router)

Full-stack framework for React rendering and routing.

Backend / API

Next.js Server Actions

Handles form submission, file upload, and database mutations.

AI/LLM

Google Gemini 2.5 Pro

Multimodal analysis and structured data extraction from documents.

Database

MongoDB (mongoose)

Persistent storage for project metadata and extracted items.

File Storage

Vercel Blob

High-performance, secure storage for the original DDQ files.

UI Library

Shadcn UI / Tailwind CSS

Accessible, custom component library for a clean, modern interface.

🛠️ Getting Started

Follow these steps to set up and run the DDQ Analyzer locally.

1. Prerequisites

You must have the following installed:

Node.js (v18+)

MongoDB Atlas Account (or local instance)

2. Installation

Clone the repository and install dependencies:

git clone <repository-url> ddq-analyzer
cd ddq-analyzer
npm install

3. Environment Configuration

Create a file named .env.local in the root of your project and populate it with your credentials:

# MongoDB Atlas Connection String

MONGO_URI="mongodb+srv://<user>:<password>@<cluster-url>/ddq-db?retryWrites=true&w=majority"

# Google Gemini API Key

GEMINI_API_KEY="AIzaSy..."

# Vercel Blob Read/Write Token for file storage (Obtained from Vercel/Blob dashboard)

BLOB*READ_WRITE_TOKEN="vercel_blob_rw*..."

4. Running the Application

Start the Next.js development server:

npm run dev

The application will be accessible at http://localhost:3000.

⚠️ Important Scaling Note

Due to the computational intensity of processing large PDF files (especially converting pages to images for multimodal analysis), the createProjectAction is designed to be non-blocking.

In a production environment, the AI analysis phase should be moved to a dedicated job queue or worker service (e.g., using Redis, AWS SQS, or a separate Vercel function) to prevent the primary HTTP request from timing out. This ensures that the user is immediately redirected to the project page (/projects/[projectId]) while the analysis runs in the background.
