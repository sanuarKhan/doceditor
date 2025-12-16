import { IProject, ISection } from "@/types";
import { saveAs } from "file-saver";
// @ts-expect-error html-to-docx is not typed
import HTMLtoDOCX from "html-to-docx";

/**
 * flattens the project document into a single HTML string
 */
export const generateDocumentHTML = (project: IProject): string => {
    let html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${project.document.title}</title>
      <style>
        body { font-family: 'Arial', sans-serif; line-height: 1.6; }
        h1 { color: #333; }
        h2 { color: #444; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
        .question { margin-bottom: 20px; }
        .question-title { font-weight: bold; margin-bottom: 5px; }
        .question-content { margin-left: 20px; }
      </style>
    </head>
    <body>
      <h1>${project.document.title}</h1>
      <p><strong>${project.document.subtitle || ""}</strong></p>
      <hr />
  `;

    const processSections = (sections: ISection[]) => {
        sections.forEach((section) => {
            if (section.type === "section") {
                html += `<h2>${section.title || section.number || "Section"}</h2>`;
                if (section.content) {
                    html += `<div>${section.content}</div>`;
                }
                if (section.children) {
                    processSections(section.children);
                }
            } else {
                // Question
                html += `<div class="question">`;
                html += `<div class="question-title">${section.number} ${section.title || ""
                    }</div>`;
                html += `<div class="question-content">${section.content || "(No Answer)"
                    }</div>`;
                html += `</div>`;

                // Questions can theoretically have children too
                if (section.children && section.children.length > 0) {
                    processSections(section.children);
                }
            }
        });
    };

    processSections(project.document.sections);

    html += `</body></html>`;
    return html;
};

export const exportToDocx = async (project: IProject) => {
    const htmlContent = generateDocumentHTML(project);

    const fileBuffer = await HTMLtoDOCX(htmlContent, null, {
        table: { row: { cantSplit: true } },
        footer: true,
        pageNumber: true,
    });

    const blob = new Blob([fileBuffer], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    saveAs(blob, `${project.projectName.replace(/\s+/g, "_")}_doc_editor.docx`);
};
