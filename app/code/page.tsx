"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";

export default function CodeHome() {
  const [githubUrl, setGithubUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const theme = {
    background: "bg-white",
    text: "text-[#111827]",
    border: "border border-[#D1D5DB]",
    card: "bg-[#F9FAFB]",
    button: "bg-black text-white hover:bg-[#111827]",
  };

  function parseGithubUrl(url: string): { owner: string; repo: string } | null {
    try {
      const match = url.match(/github.com\/(.+?)\/(.+?)(?:\/.+)?$/);
      if (!match) return null;
      return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
    } catch {
      return null;
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = parseGithubUrl(githubUrl.trim());
    if (!parsed) {
      setError("Please enter a valid GitHub repository URL.");
      return;
    }
    router.push(`/repo/${parsed.owner}/${parsed.repo}`);
  };

  return (
    <div className={`min-h-screen flex items-center justify-center ${theme.background} ${theme.text} p-4`}>
      <div className={`w-full max-w-xl rounded-2xl shadow-xl p-8 ${theme.card} ${theme.border}`}>
        <div className="flex flex-col items-center mb-8">
          <Github className="w-12 h-12 text-black mb-2" />
          <h1 className="text-3xl font-bold mb-2">Understand Your Codebase</h1>
          <p className="text-lg text-gray-500 text-center">Paste a public GitHub repository URL below to start chatting with your code.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="url"
            placeholder="https://github.com/owner/repo"
            value={githubUrl}
            onChange={e => setGithubUrl(e.target.value)}
            className="h-14 text-lg bg-white border-[#D1D5DB] rounded-xl"
            required
          />
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <Button type="submit" className={`w-full h-14 text-lg font-bold rounded-xl ${theme.button}`}>Analyze & Chat</Button>
        </form>
      </div>
    </div>
  );
}
