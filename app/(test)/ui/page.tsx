"use client";
import { useEffect, useRef, useState } from "react";
function page() {
  const [text, setText] = useState("");
  const textareaRef = useRef(null);

  // Auto-resize function
  const autoResize = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = textarea.scrollHeight + "px";
    }
  };

  useEffect(() => {
    autoResize();
  }, [text]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Auto-Expanding Textarea
          </h1>
          <p className="text-slate-600">
            The textarea grows automatically as you type more content
          </p>
        </div>

        {/* Example 1: Simple Auto-Expand */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Simple Auto-Expand
          </label>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none overflow-hidden transition-all"
            placeholder="Start typing... The textarea will expand automatically!"
            rows="3"
          />
          <div className="mt-2 text-sm text-slate-500">
            Characters: {text.length}
          </div>
        </div>
      </div>
    </div>
  );
}

export default page;
