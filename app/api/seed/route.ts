// import { NextResponse } from "next/server";
// import connectDB from "@/lib/db";
// import Project from "@/models/Project";

// export async function GET() {
//     try {
//         await connectDB();
//         const project = await Project.create({
//             projectName: "Seeded Project",
//             clientName: "Seeded Client",
//             assetClass: "Venture Capital",
//             sourceFileName: "dummy.pdf",
//             document: {
//                 title: "Seeded Document",
//                 subtitle: "Generated for Verification",
//                 sections: [
//                     {
//                         id: "sec-1",
//                         type: "section",
//                         title: "Executive Summary",
//                         number: "1.0",
//                         content: "<p>This is a <strong>seeded</strong> section with some <em>rich text</em>.</p>",
//                         expanded: true,
//                         children: [],
//                     },
//                     {
//                         id: "sec-2",
//                         type: "section",
//                         title: "Investment Thesis",
//                         number: "2.0",
//                         content: "",
//                         expanded: true,
//                         children: [
//                             {
//                                 id: "q-1",
//                                 type: "question",
//                                 number: "2.1",
//                                 title: "Market Size",
//                                 content: "The market is huge.",
//                                 children: []
//                             }
//                         ],
//                     },
//                 ],
//             },
//         });
//         return NextResponse.json({ id: project._id });
//     } catch (err: any) {
//         return NextResponse.json({ error: err.message }, { status: 500 });
//     }
// }
