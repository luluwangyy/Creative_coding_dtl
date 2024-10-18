 
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import mermaid from 'mermaid';
import './styles.css';  
const App = () => {
  const [code, setCode] = useState(''); 
  const [htmlCode, setHtmlCode] = useState(''); 
  const [cssCode, setCssCode] = useState(''); 
  const [mermaidCode, setMermaidCode] = useState(''); // State for Mermaid syntax
  const [llmInput, setLlmInput] = useState('');

 
  useEffect(() => {
    if (mermaidCode) {
      mermaid.initialize({ startOnLoad: true });
      try {
        mermaid.contentLoaded(); //   after setting mermaidCode
      } catch (error) {
        console.error("Error rendering Mermaid diagram:", error);
      }
    }
  }, [mermaidCode]);

  //  submission
  const handleSubmit = async () => {
    console.log("Submit button clicked."); 
    console.log("User code:", code);  
    console.log("User HTML:", htmlCode);
    console.log("User CSS:", cssCode);

    if (!code || !htmlCode || !cssCode) {
        console.error("All code sections must be provided."); // Log  
        return;
    }

    try {
        //   with all code sections
        const response = await axios.post('http://localhost:5000/generate-flowchart', { code, htmlCode, cssCode });
        console.log("Response from server:", response); // Log the entire response

        // Extract the Mermaid syntax  
        setMermaidCode(response.data.mermaid);
    } catch (error) {
        console.error('Error generating flowchart:', error); // Log any errors
    }
  };

  // Handle preview functionality
  const handlePreview = () => {
    const previewFrame = document.getElementById('preview-frame');
    const doc = previewFrame.contentDocument || previewFrame.contentWindow.document;
    doc.open();
    doc.write(`
      <html>
        <head>
          <style>${cssCode}</style>
        </head>
        <body>
          ${htmlCode}
          <script>${code}</script>
        </body>
      </html>
    `);
    doc.close();
  };

  // Handle LLM chat submission
  const handleLLMChat = async () => {
    try {
      console.log('Sending request to server:', { llmInput, code, htmlCode, cssCode });
      const response = await axios.post('http://localhost:5000/llm-chat', {
        llmInput,
        code,
        htmlCode,
        cssCode
      });
      
      console.log('Received response from server:', response.data);
  
      if (response.data.updatedCode) {
        console.log('Updated code:', response.data.updatedCode);
        setCode(response.data.updatedCode.js || code);
        setHtmlCode(response.data.updatedCode.html || htmlCode);
        setCssCode(response.data.updatedCode.css || cssCode);
      }
    } catch (error) {
      console.error('Error communicating with LLM:', error);
    }
  };

  //   app UI
  return (
    <div className="app-container">
      <h1>Creative Coding to Flowchart Generator</h1>
      <div className="input-container">
        <textarea
          placeholder="Paste your JavaScript code here..."
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <textarea
          placeholder="Paste your HTML code here..."
          value={htmlCode}
          onChange={(e) => setHtmlCode(e.target.value)}
        />
        <textarea
          placeholder="Paste your CSS code here..."
          value={cssCode}
          onChange={(e) => setCssCode(e.target.value)}
        />
        <button onClick={handleSubmit}>Generate Flowchart</button>
        <button onClick={handlePreview}>Preview</button>
      </div>
      <div className="output-container">
        <h2>Flowchart Preview</h2>
        {/* Display the Mermaid chart if available */}
        {mermaidCode ? (
          <div className="mermaid">{mermaidCode}</div>
        ) : (
          <p>No flowchart available yet. Please paste your JavaScript code and click "Generate Flowchart".</p>
        )}
      </div>
      <iframe id="preview-frame" style={{ width: '100%', height: '400px', border: '1px solid #ddd' }}></iframe>
      <textarea
        placeholder="Ask LLM to help with your code..."
        value={llmInput}
        onChange={(e) => setLlmInput(e.target.value)}
      />
      <button onClick={handleLLMChat}>Submit to LLM</button>
    </div>
  );
};

export default App;
