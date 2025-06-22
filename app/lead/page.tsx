"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { GoogleGenerativeAI } from "@google/generative-ai";

interface Lead {
  name: string
  linkedin: string
  company: string
  analysis?: string
  loading?: boolean
  error?: string | null
}

export default function LeadAnalyzerPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [fileName, setFileName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [customPrompt, setCustomPrompt] = useState<string>("")

  // Minimal light theme
  const theme = {
    background: "bg-white",
    text: "text-[#111827]",
    border: "border border-[#D1D5DB]",
    card: "bg-[#F9FAFB]",
    button: "bg-black text-white hover:bg-[#111827]",
    buttonOutline: "border border-black text-black hover:bg-[#F9FAFB]",
    tableHeader: "bg-[#F9FAFB] text-[#111827]",
    tableRow: "hover:bg-[#F9FAFB]",
  }

  const parseCSV = (text: string): Lead[] => {
    const lines = text.split("\n").filter((line) => line.trim())
    if (lines.length === 0) return []
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/"/g, ""))
    const nameIndex = headers.findIndex((h) => h.includes("name"))
    const linkedinIndex = headers.findIndex((h) => h.includes("linkedin"))
    const companyIndex = headers.findIndex((h) => h.includes("company"))
    return lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim().replace(/"/g, ""))
      return {
        name: nameIndex >= 0 ? values[nameIndex] || "N/A" : values[0] || "N/A",
        linkedin: linkedinIndex >= 0 ? values[linkedinIndex] || "N/A" : values[1] || "N/A",
        company: companyIndex >= 0 ? values[companyIndex] || "N/A" : values[2] || "N/A",
      }
    })
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setIsLoading(true)
    setError(null)
    setFileName(file.name)
    try {
      const text = await file.text()
      const parsedLeads = parseCSV(text)
      if (parsedLeads.length === 0) {
        setError("No valid lead data found. Please ensure your file has Name, LinkedIn URL, and Company columns.")
        return
      }
      setLeads(parsedLeads)
    } catch (err) {
      setError("Error reading file. Please make sure it's a valid CSV file.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnalyze = async (index: number) => {
    const lead = leads[index]
    if (!lead.linkedin || !lead.linkedin.includes("linkedin.com")) {
      updateLead(index, { error: "Invalid LinkedIn URL" })
      return
    }
    updateLead(index, { loading: true, error: null, analysis: undefined })
    try {
      // --- LinkedIn API fetch ---
      const API_KEY = 'e2e03befacmsh4187222c1fc0e47p1f0efbjsn4f5964cc54cd'
      const url = `https://linkedin-data-api.p.rapidapi.com/get-profile-data-by-url?url=${encodeURIComponent(lead.linkedin)}`
      const options = {
        method: 'GET',
        headers: {
          'x-rapidapi-key': API_KEY,
          'x-rapidapi-host': 'linkedin-data-api.p.rapidapi.com'
        }
      }
      const response = await fetch(url, options)
      if (!response.ok) {
        const text = await response.text()
        throw new Error(`API request failed: ${text.substring(0, 100)}...`)
      }
      const data = await response.json()
      // --- Gemini Analysis ---
      const profileSummary = JSON.stringify({
        name: lead.name,
        company: lead.company,
        ...data
      })
      const defaultPrompt = `You are an expert sales AI. Analyze the following LinkedIn profile as a potential lead for a B2B AI SaaS product. Assess if this person or their company is related to the AI domain, their likely interest in AI solutions, and whether they might require our product. Give a short justification and a score out of 100 for product fit.\n\nProfile data: ${profileSummary}`;
      const prompt = customPrompt
        ? `${customPrompt}\n\nProfile data: ${profileSummary}`
        : defaultPrompt;
      // @ts-ignore
      const genAI = new GoogleGenerativeAI("AIzaSyA0iM1OhoL9-9wurMVqPEet7HSAV-_pFzs")
      // @ts-ignore
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt)
      updateLead(index, { analysis: result.response.text() })
    } catch (error) {
      updateLead(index, { error: error instanceof Error ? error.message : "Unknown error" })
    } finally {
      updateLead(index, { loading: false })
    }
  }

  const updateLead = (index: number, changes: Partial<Lead>) => {
    setLeads((prev) => prev.map((l, i) => (i === index ? { ...l, ...changes } : l)))
  }

  return (
    <div className={`min-h-screen ${theme.background} ${theme.text} p-6`}>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2 pt-8">
          <h1 className="text-3xl font-bold">Analyze Your Lead Profiles</h1>
          <p className="text-lg text-[#6B7280]">Upload a CSV of leads (Name, LinkedIn URL, Company) and analyze each profile instantly.</p>
        </div>
        <div className={`rounded-xl p-6 ${theme.card} ${theme.border} max-w-2xl mx-auto`}>
          <label className="block mb-2 font-medium">Upload CSV File</label>
          <Input type="file" accept=".csv" onChange={handleFileUpload} className="mb-4" />
          <label className="block mb-2 font-medium mt-4">Custom Prompt (Optional)</label>
          <Input
            type="text"
            placeholder="e.g. Is this profile related to AI and likely to need my product?"
            value={customPrompt}
            onChange={e => setCustomPrompt(e.target.value)}
            className="mb-4"
          />
          {fileName && <div className="text-sm text-[#6B7280] mb-2">📄 {fileName}</div>}
          {error && <div className="text-red-500 mb-2">{error}</div>}
          {isLoading && <div className="text-[#6B7280]">Processing file...</div>}
        </div>
        {leads.length > 0 && (
          <div className={`rounded-xl p-6 ${theme.card} ${theme.border} max-w-4xl mx-auto`}>
            <h2 className="text-xl font-semibold mb-4">Lead Directory</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full border text-sm">
                <thead>
                  <tr className={theme.tableHeader}>
                    <th className="px-4 py-2 border">Name</th>
                    <th className="px-4 py-2 border">LinkedIn URL</th>
                    <th className="px-4 py-2 border">Company</th>
                    <th className="px-4 py-2 border">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead, i) => (
                    <React.Fragment key={i}>
                      <tr className={theme.tableRow}>
                        <td className="px-4 py-2 border font-medium">{lead.name}</td>
                        <td className="px-4 py-2 border">
                          <a href={lead.linkedin} target="_blank" rel="noopener noreferrer" className="underline text-blue-600">{lead.linkedin}</a>
                        </td>
                        <td className="px-4 py-2 border">{lead.company}</td>
                        <td className="px-4 py-2 border">
                          <Button
                            className={theme.button}
                            size="sm"
                            disabled={lead.loading}
                            onClick={() => handleAnalyze(i)}
                          >
                            {lead.loading ? "Analyzing..." : "Analyze"}
                          </Button>
                        </td>
                      </tr>
                      {lead.analysis && (
                        <tr>
                          <td colSpan={4} className="px-4 py-2 border bg-white text-[#111827]">
                            <div className="p-4 rounded-lg border border-[#D1D5DB] bg-[#F9FAFB]">
                              <div className="font-semibold mb-2">Analysis Report:</div>
                              {/* Render as plain text, preserve whitespace, and strip markdown if present */}
                              <div className="whitespace-pre-line text-sm" style={{fontFamily: 'inherit'}}>
                                {lead.analysis.replace(/\*\*|__|`|\*/g, "")}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                      {lead.error && (
                        <tr>
                          <td colSpan={4} className="px-4 py-2 border bg-white text-red-600">
                            <div className="p-4 rounded-lg border border-red-200 bg-red-50">
                              <div className="font-semibold mb-2">Error:</div>
                              <div className="whitespace-pre-line text-sm">{lead.error}</div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
