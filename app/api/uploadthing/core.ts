import { createUploadthing, type FileRouter } from "uploadthing/next";


const f = createUploadthing();

export const ourFileRouter = {
    // Define as many FileRoutes as you like, each with a unique routeSlug
    fileUploader: f({
        pdf: {
            maxFileSize: "256MB",
        },
    })
    .onUploadComplete(async ({  file }) => {
            console.log("file url", file.ufsUrl);

        }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;