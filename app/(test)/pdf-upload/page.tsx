"use client"
import { UploadButton } from '@/utils/uploadthing'
import React from 'react'

export default function PDFUpload() {
    return (
        <div className="flex items-center justify-center h-screen">
            <UploadButton
                endpoint="fileUploader"
                onClientUploadComplete={(res) => {

                    console.log("Files: ", res);
                    alert("Upload Completed");
                }}
                onUploadError={(error: Error) => {

                    alert(`ERROR! ${error.message}`);
                }}
            />
        </div>
    )
}
