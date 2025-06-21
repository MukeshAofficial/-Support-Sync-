"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Upload, MessageCircle, Settings, Database, Send, FileText, Trash2, Download, Mic } from "lucide-react"
import { useRouter } from "next/navigation"

export default function AISupportAssistant() {
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [botSettings, setBotSettings] = useState({
    name: "Support Assistant",
    personality: "Friendly",
    systemPrompt: "You are a helpful customer support assistant for our SaaS product...",
    handoffThreshold: "3",
    collectFeedback: true,
    learningMode: false,
  })
  const [uploading, setUploading] = useState(false)
  const [chatLoading, setChatLoading] = useState(false)
  const [chatDisabled, setChatDisabled] = useState(false)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("upload")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const knowledgeBaseFiles = [
    { name: "Product FAQ.pdf", date: "2024-01-15", size: "2.3 MB" },
    { name: "User Manual.txt", date: "2024-01-14", size: "1.1 MB" },
    { name: "Support Guidelines.csv", date: "2024-01-13", size: "856 KB" },
  ]

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return
    setUploading(true)
    setError("")
    const formData = new FormData()
    formData.append("file", files[0])
    try {
      const res = await fetch("http://localhost:5000/api/upload", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (data.success) {
        setChatDisabled(false)
        setActiveTab("test")
        setTimeout(() => setError(""), 2000)
        setError("Knowledge base uploaded successfully! Redirecting to chatbot...")
      } else {
        setError(data.error || "Upload failed")
      }
    } catch (e) {
      setError("Upload failed")
    }
    setUploading(false)
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return
    setChatLoading(true)
    setError("")
    const userMsg = { id: Date.now(), text: newMessage, sender: "user" }
    setMessages((msgs) => [...msgs, userMsg])
    setNewMessage("")
    try {
      const res = await fetch("http://localhost:5000/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userMsg.text }),
      })
      const data = await res.json()
      setMessages((msgs) => [
        ...msgs,
        { id: Date.now() + 1, text: data.answer || "No answer.", sender: "bot" },
      ])
    } catch (e) {
      setMessages((msgs) => [
        ...msgs,
        { id: Date.now() + 1, text: "Error contacting bot.", sender: "bot" },
      ])
    }
    setChatLoading(false)
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar */}
      <aside className="w-20 bg-gray-900 text-white flex flex-col items-center py-8 space-y-8 min-h-screen">
        <button
          className="flex flex-col items-center focus:outline-none hover:text-blue-400"
          title="Text Bot"
          onClick={() => router.push('/bot')}
        >
          <MessageCircle className="w-7 h-7 mb-1" />
          <span className="text-xs">Text</span>
        </button>
        <button
          className="flex flex-col items-center focus:outline-none hover:text-blue-400"
          title="Voice Bot"
          onClick={() => router.push('/voice')}
        >
          <Mic className="w-7 h-7 mb-1" />
          <span className="text-xs">Voice</span>
        </button>
      </aside>
      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-6xl mx-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">AI-Powered Support Assistant</h1>
            <p className="text-gray-600">Build and manage your intelligent customer support bot</p>
          </div>
          {error && <div className={`mb-4 ${error.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>{error}</div>}
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8 bg-gray-50 p-1">
              <TabsTrigger
                value="upload"
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-gray-900"
              >
                <Upload className="w-4 h-4" />
                Upload Knowledge Base
              </TabsTrigger>
              <TabsTrigger
                value="test"
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-gray-900"
              >
                <MessageCircle className="w-4 h-4" />
                Test Chatbot
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-gray-900"
              >
                <Settings className="w-4 h-4" />
                Bot Settings
              </TabsTrigger>
              <TabsTrigger
                value="manage"
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-gray-900"
              >
                <Database className="w-4 h-4" />
                Manage Knowledge Base
              </TabsTrigger>
            </TabsList>
            {/* Upload Knowledge Base Tab */}
            <TabsContent value="upload">
              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <Upload className="w-5 h-5" />
                    Upload Knowledge Base
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Upload PDF, TXT, or CSV files to train your support bot
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-gray-400 transition-colors">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Drag and drop files here, or click to browse</p>
                    <div className="space-y-4">
                      <Input
                        type="file"
                        multiple={false}
                        accept=".pdf,.txt,.csv"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                        ref={fileInputRef}
                      />
                      <Label htmlFor="file-upload">
                        <Button
                          variant="outline"
                          className="bg-white text-gray-900 border-gray-300 hover:bg-gray-50"
                          asChild
                          disabled={uploading}
                        >
                          <span>{uploading ? "Uploading..." : "Choose File"}</span>
                        </Button>
                      </Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            {/* Test Chatbot Tab */}
            <TabsContent value="test">
              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <MessageCircle className="w-5 h-5" />
                    Test Chatbot
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Test your support bot with real conversations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Chat Messages */}
                    <div className="bg-gray-50 rounded-lg p-4 h-96 overflow-y-auto space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.sender === "user"
                                ? "bg-gray-900 text-white"
                                : "bg-white text-gray-900 border border-gray-200"
                            }`}
                          >
                            {message.text}
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Message Input */}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                        className="flex-1 border-gray-300 focus:border-gray-900"
                        disabled={chatDisabled || chatLoading}
                      />
                      <Button onClick={handleSendMessage} className="bg-gray-900 text-white hover:bg-gray-800" disabled={chatDisabled || chatLoading}>
                        {chatLoading ? <span>...</span> : <Send className="w-4 h-4" />}
                      </Button>
                    </div>
                    {chatDisabled && <div className="text-sm text-gray-500">Please upload a knowledge base to enable chat.</div>}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            {/* Bot Settings Tab */}
            <TabsContent value="settings">
              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <Settings className="w-5 h-5" />
                    Bot Settings
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Configure your support bot's behavior and personality
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="bot-name" className="text-gray-900">
                        Bot Name
                      </Label>
                      <Input
                        id="bot-name"
                        value={botSettings.name}
                        onChange={(e) => setBotSettings({ ...botSettings, name: e.target.value })}
                        className="border-gray-300 focus:border-gray-900"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="personality" className="text-gray-900">
                        Bot Personality
                      </Label>
                      <Select
                        value={botSettings.personality}
                        onValueChange={(value) => setBotSettings({ ...botSettings, personality: value })}
                      >
                        <SelectTrigger className="border-gray-300 focus:border-gray-900">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Friendly">Friendly</SelectItem>
                          <SelectItem value="Professional">Professional</SelectItem>
                          <SelectItem value="Casual">Casual</SelectItem>
                          <SelectItem value="Formal">Formal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="system-prompt" className="text-gray-900">
                      System Prompt
                    </Label>
                    <Textarea
                      id="system-prompt"
                      value={botSettings.systemPrompt}
                      onChange={(e) => setBotSettings({ ...botSettings, systemPrompt: e.target.value })}
                      className="min-h-24 border-gray-300 focus:border-gray-900"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="handoff-threshold" className="text-gray-900">
                      Human Handoff Threshold
                    </Label>
                    <Select
                      value={botSettings.handoffThreshold}
                      onValueChange={(value) => setBotSettings({ ...botSettings, handoffThreshold: value })}
                    >
                      <SelectTrigger className="border-gray-300 focus:border-gray-900">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                        <SelectItem value="4">4</SelectItem>
                        <SelectItem value="5">5</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-gray-900">Collect User Feedback</Label>
                      <p className="text-sm text-gray-600">Allow users to rate bot responses</p>
                    </div>
                    <Switch
                      checked={botSettings.collectFeedback}
                      onCheckedChange={(checked) => setBotSettings({ ...botSettings, collectFeedback: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-gray-900">Learning Mode</Label>
                      <p className="text-sm text-gray-600">Continuously improve from conversations</p>
                    </div>
                    <Switch
                      checked={botSettings.learningMode}
                      onCheckedChange={(checked) => setBotSettings({ ...botSettings, learningMode: checked })}
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button className="bg-gray-900 text-white hover:bg-gray-800">Save Settings</Button>
                    <Button variant="outline" className="bg-white text-gray-900 border-gray-300 hover:bg-gray-50">
                      Reset to Defaults
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            {/* Manage Knowledge Base Tab */}
            <TabsContent value="manage">
              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <Database className="w-5 h-5" />
                    Manage Knowledge Base
                  </CardTitle>
                  <CardDescription className="text-gray-600">View and manage your uploaded documents</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {knowledgeBaseFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-8 h-8 text-gray-400" />
                          <div>
                            <h3 className="font-medium text-gray-900">{file.name}</h3>
                            <p className="text-sm text-gray-600">
                              {file.date} • {file.size}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-white text-gray-900 border-gray-300 hover:bg-gray-50"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-white text-red-600 border-gray-300 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
