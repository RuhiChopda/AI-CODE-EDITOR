import React, { useState, useEffect } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";
import { dracula } from "@uiw/codemirror-theme-dracula";
import axios from "axios";
import { database, ref, set, onValue } from "./firebaseConfig";

const CodeEditor = () => {
  const [code, setCode] = useState("// Start coding...");
  const [output, setOutput] = useState("");
  const [language, setLanguage] = useState("javascript");

  // Sync code with Firebase (Real-Time Collaboration)
  useEffect(() => {
    const codeRef = ref(database, "sharedCode");
    onValue(codeRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setCode(data);
    });
  }, []);

  // Handle Code Change
  const handleChange = (value) => {
    setCode(value);
    set(ref(database, "sharedCode"), value);
  };

  // Function to get AI Auto-Completion from OpenAI API
  const getAICompletion = async () => {
    try {
      const response = await axios.post(
        "https://api.openai.com/v1/completions",
        {
          model: "gpt-3.5-turbo",
          prompt: `Complete this code:\n${code}`,
          max_tokens: 50,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );
      setCode(code + "\n" + response.data.choices[0].text);
    } catch (error) {
      console.error("Error fetching AI completion:", error);
    }
  };

  // Function to execute JavaScript code
  const runCode = () => {
    try {
      let result = eval(code);
      setOutput(result ? result.toString() : "No output");
    } catch (error) {
      setOutput("Error: " + error.message);
    }
  };

  return (
    <div style={{ padding: "20px", backgroundColor: "#282c34", color: "white", minHeight: "100vh" }}>
      <h2>📝 Code Editor with AI Auto-Completion</h2>

      {/* Language Selector */}
      <select onChange={(e) => setLanguage(e.target.value)} value={language}>
        <option value="javascript">JavaScript</option>
        <option value="python">Python</option>
        <option value="java">Java</option>
        <option value="cpp">C++</option>
      </select>

      {/* Code Editor */}
      <CodeMirror
        value={code}
        height="300px"
        extensions={[language === "javascript" ? javascript() : language === "python" ? python() : language === "java" ? java() : cpp()]}
        theme={dracula}
        onChange={handleChange}
      />

      {/* Buttons */}
      <button onClick={getAICompletion} style={{ margin: "10px", padding: "8px", backgroundColor: "#4CAF50", color: "white" }}>
        ✨ AI Auto-Complete
      </button>
      <button onClick={runCode} style={{ margin: "10px", padding: "8px", backgroundColor: "#2196F3", color: "white" }}>
        ▶ Run Code
      </button>

      {/* Output Box */}
      <div style={{ marginTop: "20px", padding: "10px", backgroundColor: "#444", minHeight: "50px" }}>
        <h3>🖥 Output:</h3>
        <pre>{output}</pre>
      </div>
    </div>
  );
};

export default CodeEditor;