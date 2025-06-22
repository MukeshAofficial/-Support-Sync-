"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Folder, FileText, Loader2 } from "lucide-react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import ReactMarkdown from "react-markdown";

interface RepoData {
  structure: Record<string, any>;
  contents: Record<string, string>;
}

export default function RepoPage() {
  const params = useParams();
  const owner = params.owner as string;
  const repo = params.repo as string;
  const [repoData, setRepoData] = useState<RepoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<{ text: string; isUser: boolean; timestamp: Date }[]>(
    [
      {
        text: "Welcome! Select a file and ask me anything about it or your repo.",
        isUser: false,
        timestamp: new Date(),
      },
    ]
  );
  const [aiThinking, setAiThinking] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const theme = {
    background: "bg-white",
    text: "text-[#111827]",
    border: "border border-[#D1D5DB]",
    card: "bg-[#F9FAFB]",
    button: "bg-black text-white hover:bg-[#111827]",
    tableHeader: "bg-[#F9FAFB] text-[#111827]",
    tableRow: "hover:bg-[#F9FAFB]",
  };

  useEffect(() => {
    const fetchRepoData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/repo-data?owner=${owner}&repo=${repo}`);
        if (!response.ok) throw new Error("Failed to fetch repository data");
        const data = await response.json();
        setRepoData(data);
      } catch (error) {
        setRepoData(null);
      } finally {
        setLoading(false);
      }
    };
    if (owner && repo) fetchRepoData();
  }, [owner, repo]);

  const renderFileList = (structure: Record<string, any>, parentKey = "") => {
    if (!structure) return null;
    const files: JSX.Element[] = [];
    if (structure.root && parentKey === "") {
      structure.root.forEach((item: string, idx: number) => {
        files.push(
          <li
            key={item}
            className={`flex items-center py-1 px-2 rounded cursor-pointer ${theme.tableRow} ${selectedFile === item ? "bg-[#D1D5DB]" : ""}`}
            onClick={() => setSelectedFile(item)}
          >
            <FileText className="w-4 h-4 mr-2 text-gray-400" />
            <span className="text-sm truncate">{item.split("/").pop()}</span>
          </li>
        );
      });
    }
    Object.entries(structure)
      .filter(([key]) => key !== "root")
      .forEach(([key, value]) => {
        files.push(
          <li key={key} className="py-1">
            <div className="flex items-center px-2 py-1 rounded cursor-pointer text-gray-700 font-medium">
              <Folder className="w-4 h-4 mr-2 text-blue-400" />
              <span className="text-sm">{key.split("/").pop()}</span>
            </div>
            <ul className="ml-6 mt-1">{renderFileList(value as Record<string, any>, key)}</ul>
          </li>
        );
      });
    return files;
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    const userMessage = {
      text: chatInput,
      isUser: true,
      timestamp: new Date(),
    };
    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setAiThinking(true);
    try {
      const fileContent = selectedFile ? repoData?.contents[selectedFile] || "No content available" : "No file selected";
      const fileName = selectedFile ? selectedFile.split("/").pop() || selectedFile : "No file selected";
      const prompt = `User question: ${userMessage.text}\nCurrently viewing file: ${fileName}\nFile content:\n\n${fileContent}\n\nPlease provide a helpful, accurate response about this code. If the question is not related to the code, you can still answer general programming questions.`;
      const genAI = new GoogleGenerativeAI("AIzaSyA0iM1OhoL9-9wurMVqPEet7HSAV-_pFzs");
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt);
      const aiResponse = result.response.text();
      setChatMessages((prev) => [
        ...prev,
        {
          text: aiResponse,
          isUser: false,
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      setChatMessages((prev) => [
        ...prev,
        {
          text: "Sorry, I encountered an error processing your request. Please try again.",
          isUser: false,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setAiThinking(false);
    }
  };

  return (
    <div className={`min-h-screen ${theme.background} ${theme.text} p-0`}>
      <div className="flex h-screen">
        {/* Sidebar: File List */}
        <aside className={`w-1/5 min-w-[200px] max-w-sm h-full overflow-y-auto ${theme.card} ${theme.border} p-4`}>
          <h2 className="text-lg font-semibold mb-4">Files</h2>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="animate-spin text-gray-400 w-6 h-6" />
            </div>
          ) : repoData ? (
            <ul>{renderFileList(repoData.structure)}</ul>
          ) : (
            <div className="text-red-500">Failed to load repository data.</div>
          )}
        </aside>
        {/* Center: Chatbot UI */}
        <main className="flex-1 flex flex-col items-center justify-center h-full p-8">
          <div className={`w-full max-w-4xl flex flex-col h-[85vh] ${theme.card} ${theme.border} rounded-2xl shadow-xl transition-all duration-300`}>
            <h2 className="text-2xl font-bold mb-4 p-4 text-center bg-gradient-to-r from-[#F9FAFB] to-[#D1D5DB] rounded-t-2xl border-b border-[#D1D5DB]">AI Code Chat</h2>
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto rounded-lg p-4 mb-4 border border-[#D1D5DB] bg-white custom-scrollbar">
              <div className="space-y-6">
                {chatMessages.map((message, index) => (
                  <div key={index} className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}>
                    <div className={`p-4 rounded-xl max-w-[80%] shadow ${message.isUser ? "bg-black text-white" : "bg-[#F9FAFB] text-[#111827] border border-[#D1D5DB]"} transition-all duration-200`}>
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown components={{
                          strong: ({node, ...props}) => <strong className="font-bold text-black" {...props} />,
                          code: ({node, ...props}) => <code className="bg-gray-100 px-1 rounded text-xs" {...props} />,
                          pre: ({node, ...props}) => <pre className="bg-gray-100 p-2 rounded" {...props} />,
                          a: ({node, ...props}) => <a className="text-blue-600 underline" {...props} />,
                        }}>{message.text.replace(/\*\*/g, "")}</ReactMarkdown>
                      </div>
                      <div className={`text-xs mt-2 ${message.isUser ? "text-gray-300" : "text-gray-500"}`}>{message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                    </div>
                  </div>
                ))}
                {aiThinking && (
                  <div className="flex justify-start animate-pulse">
                    <div className="p-4 rounded-xl bg-[#F9FAFB] text-[#111827] border border-[#D1D5DB] flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin text-purple-400" />
                      <span className="text-sm font-medium">AI is thinking...</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2 mt-2 p-4 border-t border-[#D1D5DB] bg-[#F9FAFB] rounded-b-2xl">
              <Input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                className="flex-1 bg-white border-[#D1D5DB] text-[#111827] placeholder:text-gray-400 focus:border-black rounded-xl"
                placeholder="Ask about the selected file..."
                disabled={aiThinking}
              />
              <Button
                onClick={handleSendMessage}
                disabled={aiThinking}
                className={theme.button + " rounded-xl px-6 text-lg font-semibold shadow"}
              >
                {aiThinking ? <Loader2 className="h-5 w-5 animate-spin" /> : "Send"}
              </Button>
            </div>
          </div>
        </main>
        {/* Sidebar: File Preview */}
        <aside className={`w-1/5 min-w-[200px] max-w-sm h-full overflow-y-auto ${theme.card} ${theme.border} p-4`}>
          <h2 className="text-lg font-semibold mb-4">File Preview</h2>
          {selectedFile ? (
            <pre className="text-sm whitespace-pre-wrap bg-white p-4 rounded border border-[#D1D5DB] overflow-x-auto">
              {repoData?.contents[selectedFile] || "No content available"}
            </pre>
          ) : (
            <div className="text-gray-400">Select a file to preview its content.</div>
          )}
        </aside>
      </div>
    </div>
  );
}
