import React, { useState } from 'react';
import { extractMarkdownCodeBlockContent, buildUserConceptPayload } from './utils/promptRules';

export default function PromptGenerator() {
  const [concept, setConcept] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!concept.trim()) return;
    setLoading(true);
    
    try {
      const payload = buildUserConceptPayload(concept, {});
      const response = await fetch('/api/generate-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concept, sceneSettings: {}, payload }) // يمكن تمرير إعدادات المشهد هنا
      });
      
      const data = await response.json();
      // استخراج البرومبت فقط بدون حشو
      const cleanPrompt = extractMarkdownCodeBlockContent(data.result);
      setGeneratedPrompt(cleanPrompt);
    } catch (error) {
      console.error('Generation Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedPrompt);
  };

  return (
    <div dir="rtl" className="p-6 max-w-3xl mx-auto font-sans">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">مولّد برومبتات السيلفي المرجعي</h1>
      
      <div className="mb-6">
        <label className="block font-bold mb-2 text-gray-700">فكرة المشهد المختصرة:</label>
        <textarea 
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
          rows={3}
          value={concept}
          onChange={(e) => setConcept(e.target.value)}
          placeholder="اكتب فكرتك هنا (مثال: سيلفي في مقهى شعبي بالرياض وقت الغروب)..."
        />
      </div>

      <button 
        onClick={handleGenerate}
        disabled={loading || !concept.trim()}
        className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2 rounded-lg disabled:opacity-50 transition-colors"
      >
        {loading ? 'جاري التوليد...' : 'توليد البرومبت'}
      </button>

      {generatedPrompt && (
        <div className="mt-8 border border-gray-200 p-5 bg-gray-50 rounded-lg">
          <h2 className="font-bold mb-3 text-gray-800">البرومبت النهائي (جاهز للنسخ):</h2>
          <textarea 
            readOnly
            dir="ltr"
            className="w-full p-4 border rounded-lg bg-white text-left font-mono text-sm resize-none focus:outline-none"
            rows={8}
            value={generatedPrompt}
          />
          <button 
            onClick={handleCopy}
            className="mt-4 flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-2 rounded-lg transition-colors"
          >
            <span>نسخ البرومبت</span>
          </button>
        </div>
      )}
    </div>
  );
}
