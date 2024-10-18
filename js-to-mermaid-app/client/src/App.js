import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import mermaid from 'mermaid';
import { UnControlled as CodeMirror } from 'react-codemirror2';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/material-darker.css';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/htmlmixed/htmlmixed';
import 'codemirror/mode/css/css';
import './styles.css';

const App = () => {
  const [code, setCode] = useState('');
  const [htmlCode, setHtmlCode] = useState('');
  const [cssCode, setCssCode] = useState('');
  const [mermaidCode, setMermaidCode] = useState('');
  const [llmInput, setLlmInput] = useState('');

  const jsEditorRef = useRef(null);
  const htmlEditorRef = useRef(null);
  const cssEditorRef = useRef(null);

  useEffect(() => {
    if (mermaidCode) {
      mermaid.initialize({ startOnLoad: true });
      try {
        mermaid.contentLoaded();
      } catch (error) {
        console.error("Error rendering Mermaid diagram:", error);
      }
    }
  }, [mermaidCode]);

  const handleSubmit = async () => {
    console.log("Submit button clicked.");
    console.log("User code:", code);
    console.log("User HTML:", htmlCode);
    console.log("User CSS:", cssCode);

    if (!code || !htmlCode || !cssCode) {
      console.error("All code sections must be provided.");
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/generate-flowchart', { code, htmlCode, cssCode });
      console.log("Response from server:", response);
      setMermaidCode(response.data.mermaid);
    } catch (error) {
      console.error('Error generating flowchart:', error);
    }
  };

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

const setDefaultCode = () => {
    setCode(` 
`);
    setHtmlCode(`
<div id='two'></div>
<div id='three'></div>
<div id='four'></div>


<div id='six'></div> 
<div id='seven'></div>
<div id='eight'></div>`);
    setCssCode(`#one{
  position: absolute;
  top: 25%;
  left: 25%;
  height: 50%;
  width: 50%;
  border-style: solid;
  border-width: 5px;
  background: rgba(0,0,0,0);
 transform: scale(1);
	animation: pulse 5.11s infinite, rotationA  5.11s infinite; 
}

#two{
  position: absolute;
  top: 25%;
  left: 25%;
  height: 50%;
  width: 50%;
  border-style: solid;
  border-width: 5px;
  background: rgba(0,0,255,.1);
  transform: scale(1);
	animation: pulse 10.213s infinite, rotationA 10.213s infinite; 
}

#three{
  position: absolute;
  top: 25%;
  left: 25%;
  height: 50%;
  width: 50%;
  border-style: solid;
  border-width: 5px;
  background: rgba(0,255,0,0.1);
  transform: scale(1);
  
    animation: rotationA 9.125s infinite, pulse 9.125s infinite; 
}

#four{
  position: absolute;
  top: 25%;
  left: 25%;
  height: 50%;
  width: 50%;
  border-style: solid;
  border-width: 5px;
  background: rgba(255,0,0,0.1);
  
  animation: pulse 13s infinite; 
  animation: rotationA 15s infinite, pusle 15s infinite; 
}


#five{
  position: absolute;
  
  height: 100%;
  width: 100%;
  border-style: solid;
  border-width: 5px;
  background: rgba(0,0,0,0);
 transform: scale(1);
	animation: pulse 5.231s infinite, rotationA  5.231s infinite; 
}

#six{
  position: absolute;
  
  height: 100%;
  width: 100%;
  border-style: solid;
  border-width: 5px;
  background: rgba(0,0,255,.1);
  transform: scale(1);
	animation: pulse 10s infinite, rotationA 10s infinite; 
}

#seven{
  position: absolute;
  height: 100%;
  width: 100%;
  border-style: solid;
  border-width: 5px;
  background: rgba(0,255,0,0.1);
  transform: scale(1);  
    animation: rotationA 9s infinite, pulse 9s infinite; 
}

#eight{
  position: absolute;
  ;
  height: 100%;
  width: 100%;
  border-style: solid;
  border-width: 5px;
  background: rgba(255,0,0,0.1);  
  animation: rotationA 15s infinite, pusle 15s infinite; 
}


@keyframes pulse {
	0% {
		transform: scale(2);
	
	}

	70% {
		transform: scale(1);
	
	}

	100% {
		transform: scale(2);
	
	}
}


@keyframes rotationA {
	50% {transform: rotate(180deg);
    
  }

}`);
  };


  return (
    <div className="app-container">
      <h1>Creative Coding to Flowchart Generator</h1>
      <div className="input-container">
        <CodeMirror
          value={code}
          options={{
            mode: 'javascript',
            theme: 'material-darker',
            lineNumbers: true
          }}
          onChange={(editor, data, value) => setCode(value)}
          ref={jsEditorRef}
        />
        <CodeMirror
          value={htmlCode}
          options={{
            mode: 'htmlmixed',
            theme: 'material-darker',
            lineNumbers: true
          }}
          onChange={(editor, data, value) => setHtmlCode(value)}
          ref={htmlEditorRef}
        />
        <CodeMirror
          value={cssCode}
          options={{
            mode: 'css',
            theme: 'material-darker',
            lineNumbers: true
          }}
          onChange={(editor, data, value) => setCssCode(value)}
          ref={cssEditorRef}
        />
        <button onClick={handleSubmit}>Generate Flowchart</button>
        <button onClick={handlePreview}>Preview</button>
        <button onClick={setDefaultCode}>Load Default Code</button>
      </div>
      <div className="output-container">
        <h2>Flowchart Preview</h2>
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