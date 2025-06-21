"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Upload,
  Users,
  Building,
  Phone,
  FileSpreadsheet,
  Trash2,
  Moon,
  Sun,
  MessageSquare,
  Play,
  Activity,
  CheckCircle,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Contact {
  name: string
  phone: string
  company: string
}

interface MessageTemplate {
  id: string
  name: string
  subject: string
  content: string
  description: string
}

const messageTemplates: MessageTemplate[] = [
  {
    id: "demo-invitation",
    name: "Demo Invitation",
    subject: "Personalized Demo Invitation",
    content:
      "Hi {name}, I hope you're doing well at {company}. I'd like to invite you to a personalized demo of our AI support platform. When would be a good time for you?",
    description: "Invite prospects to a product demonstration",
  },
  {
    id: "follow-up",
    name: "Follow Up",
    subject: "Following Up on Our Conversation",
    content:
      "Hi {name}, I wanted to follow up on our previous conversation about {company}'s growth challenges. Have you had a chance to consider how our solution could help streamline your operations?",
    description: "Follow up with prospects after initial contact",
  },
  {
    id: "partnership",
    name: "Partnership Proposal",
    subject: "Strategic Partnership Opportunity",
    content:
      "Hello {name}, I believe there's a great synergy between our companies. I'd love to discuss a potential partnership that could benefit both {company} and our growing startup ecosystem.",
    description: "Propose strategic partnerships with other companies",
  },
  {
    id: "investor-pitch",
    name: "Investor Pitch",
    subject: "Investment Opportunity",
    content:
      "Hi {name}, I hope this message finds you well. I'm reaching out because I believe our startup aligns perfectly with {company}'s investment thesis. Would you be interested in learning about our growth trajectory and funding round?",
    description: "Reach out to potential investors",
  },
  {
    id: "customer-success",
    name: "Customer Success Check-in",
    subject: "How's Everything Going?",
    content:
      "Hi {name}, I wanted to check in and see how the implementation is going at {company}. Are you seeing the results you expected? Is there anything our team can do to help you maximize your ROI?",
    description: "Check in with existing customers",
  },
]

export default function ContactUploader() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [customMessage, setCustomMessage] = useState<string>("")
  const [isOutreachActive, setIsOutreachActive] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("import")

  // Auto-progress tabs based on completion
  useEffect(() => {
    if (contacts.length > 0 && activeTab === "import") {
      setActiveTab("template")
    }
  }, [contacts, activeTab])

  useEffect(() => {
    if (selectedTemplate && activeTab === "template") {
      // Don't auto-progress to outreach, let user manually go there
    }
  }, [selectedTemplate, activeTab])

  const parseCSV = (text: string): Contact[] => {
    const lines = text.split("\n").filter((line) => line.trim())
    if (lines.length === 0) return []

    // Get header row to identify columns
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/"/g, ""))
    const dataLines = lines.slice(1)

    // Find column indices
    const nameIndex = headers.findIndex((h) => h.includes("name"))
    const phoneIndex = headers.findIndex((h) => h.includes("phone") || h.includes("mobile") || h.includes("number"))
    const companyIndex = headers.findIndex(
      (h) => h.includes("company") || h.includes("organization") || h.includes("org"),
    )

    return dataLines
      .map((line) => {
        const values = line.split(",").map((val) => val.trim().replace(/"/g, ""))
        return {
          name: nameIndex >= 0 ? values[nameIndex] || "N/A" : values[0] || "N/A",
          phone: phoneIndex >= 0 ? values[phoneIndex] || "N/A" : values[1] || "N/A",
          company: companyIndex >= 0 ? values[companyIndex] || "N/A" : values[2] || "N/A",
        }
      })
      .filter((contact) => {
        // Filter out invalid contacts
        const hasValidName = contact.name !== "N/A" && contact.name.length > 0 && !contact.name.match(/^\d+$/)
        const hasValidPhone = contact.phone !== "N/A" && contact.phone.length > 0
        const hasValidCompany = contact.company !== "N/A" && contact.company.length > 0
        return hasValidName || hasValidPhone || hasValidCompany
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
      const parsedContacts = parseCSV(text)

      if (parsedContacts.length === 0) {
        setError(
          "No valid contact data found in the file. Please ensure your file has Name, Phone, and Company columns.",
        )
        return
      }

      setContacts(parsedContacts)
    } catch (err) {
      setError("Error reading file. Please make sure it's a valid CSV file.")
    } finally {
      setIsLoading(false)
    }
  }

  const clearData = () => {
    setContacts([])
    setFileName(null)
    setError(null)
    setSelectedTemplate("")
    setCustomMessage("")
    setIsOutreachActive(false)
    setActiveTab("import")
  }

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
  }

  const getSelectedTemplate = () => {
    return messageTemplates.find((template) => template.id === selectedTemplate)
  }

  const getPreviewMessage = () => {
    const template = getSelectedTemplate()
    if (!template || contacts.length === 0) return ""

    // Find a contact with a valid name (not a phone number)
    const sampleContact =
      contacts.find((contact) => contact.name !== "N/A" && contact.name.length > 0 && !contact.name.match(/^\d+$/)) ||
      contacts[0]

    return template.content.replace(/{name}/g, sampleContact.name).replace(/{company}/g, sampleContact.company)
  }

  const handleStartOutreach = () => {
    if (!selectedTemplate || contacts.length === 0) return
    setIsOutreachActive(true)
    setActiveTab("status")
  }

  const themeClasses = {
    background: isDarkMode ? "bg-gray-900" : "bg-white",
    cardBackground: isDarkMode ? "bg-gray-800" : "bg-white",
    text: isDarkMode ? "text-white" : "text-gray-900",
    textSecondary: isDarkMode ? "text-gray-300" : "text-gray-600",
    textMuted: isDarkMode ? "text-gray-400" : "text-gray-500",
    border: isDarkMode ? "border-gray-700" : "border-gray-200",
    hoverBg: isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50",
    accentBg: isDarkMode ? "bg-gray-700" : "bg-gray-50",
    buttonPrimary: isDarkMode ? "bg-white text-black hover:bg-gray-200" : "bg-black text-white hover:bg-gray-800",
    buttonSecondary: isDarkMode
      ? "bg-gray-700 text-white hover:bg-gray-600"
      : "bg-gray-100 text-gray-900 hover:bg-gray-200",
  }

  const getTabStatus = (tab: string) => {
    switch (tab) {
      case "import":
        return contacts.length > 0 ? "completed" : "active"
      case "template":
        return selectedTemplate ? "completed" : contacts.length > 0 ? "active" : "disabled"
      case "outreach":
        return isOutreachActive ? "completed" : selectedTemplate ? "active" : "disabled"
      case "status":
        return isOutreachActive ? "active" : "disabled"
      default:
        return "disabled"
    }
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${themeClasses.background} p-4`}>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header with Theme Toggle */}
        <div className="text-center space-y-4 pt-8 relative">
          <Button
            onClick={toggleTheme}
            variant="outline"
            size="sm"
            className={`absolute top-0 right-0 ${themeClasses.border} ${themeClasses.hoverBg}`}
          >
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <div className="flex items-center justify-center gap-2">
            <FileSpreadsheet className={`h-8 w-8 ${isDarkMode ? "text-white" : "text-black"}`} />
            <h1 className={`text-4xl font-bold ${themeClasses.text}`}>Contact Importer</h1>
          </div>
          <p className={`text-lg ${themeClasses.textSecondary} max-w-2xl mx-auto`}>
            Upload your Google Sheets CSV file with contact information and manage your outreach campaign
          </p>
        </div>

        {/* Main Tabs Interface */}
        <div className="max-w-5xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className={`grid w-full grid-cols-4 ${themeClasses.cardBackground} ${themeClasses.border}`}>
              <TabsTrigger
                value="import"
                className={`flex items-center gap-2 ${themeClasses.text}`}
                disabled={getTabStatus("import") === "disabled"}
              >
                {getTabStatus("import") === "completed" ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                Import
              </TabsTrigger>
              <TabsTrigger
                value="template"
                className={`flex items-center gap-2 ${themeClasses.text}`}
                disabled={getTabStatus("template") === "disabled"}
              >
                {getTabStatus("template") === "completed" ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <MessageSquare className="h-4 w-4" />
                )}
                Template
              </TabsTrigger>
              <TabsTrigger
                value="outreach"
                className={`flex items-center gap-2 ${themeClasses.text}`}
                disabled={getTabStatus("outreach") === "disabled"}
              >
                {getTabStatus("outreach") === "completed" ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                Outreach
              </TabsTrigger>
              <TabsTrigger
                value="status"
                className={`flex items-center gap-2 ${themeClasses.text}`}
                disabled={getTabStatus("status") === "disabled"}
              >
                <Activity className="h-4 w-4" />
                Status
              </TabsTrigger>
            </TabsList>

            {/* Tab Content */}
            <div className="mt-6">
              {/* Import Tab */}
              <TabsContent value="import" className="space-y-6">
                <Card className={`${themeClasses.cardBackground} ${themeClasses.border}`}>
                  <CardHeader>
                    <CardTitle className={`flex items-center gap-2 ${themeClasses.text}`}>
                      <Upload className="h-5 w-5" />
                      Upload Contact File
                    </CardTitle>
                    <CardDescription className={themeClasses.textSecondary}>
                      Upload a CSV file with columns: Name, Phone Number, Company Name
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="file-upload" className={themeClasses.text}>
                        Choose CSV File
                      </Label>
                      <Input
                        id="file-upload"
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={handleFileUpload}
                        disabled={isLoading}
                        className={`cursor-pointer ${themeClasses.border} ${themeClasses.cardBackground} ${themeClasses.text}`}
                      />
                    </div>

                    {fileName && (
                      <div
                        className={`flex items-center justify-between p-3 rounded-lg ${themeClasses.accentBg} ${themeClasses.border}`}
                      >
                        <span className={`text-sm ${themeClasses.text}`}>📄 {fileName}</span>
                        <Button variant="ghost" size="sm" onClick={clearData} className={themeClasses.hoverBg}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    {error && (
                      <Alert variant="destructive" className={isDarkMode ? "bg-red-900 border-red-700" : ""}>
                        <AlertDescription className={isDarkMode ? "text-red-200" : ""}>{error}</AlertDescription>
                      </Alert>
                    )}

                    {isLoading && (
                      <div className="text-center py-4">
                        <div
                          className={`animate-spin rounded-full h-8 w-8 border-b-2 mx-auto ${isDarkMode ? "border-white" : "border-black"}`}
                        ></div>
                        <p className={`text-sm ${themeClasses.textSecondary} mt-2`}>Processing your file...</p>
                      </div>
                    )}

                    {contacts.length > 0 && (
                      <div className="space-y-6">
                        {/* Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Card className={`${themeClasses.cardBackground} ${themeClasses.border}`}>
                            <CardContent className="flex items-center gap-4 p-4">
                              <Users className={`h-6 w-6 ${isDarkMode ? "text-blue-400" : "text-blue-600"}`} />
                              <div>
                                <p className={`text-xl font-bold ${themeClasses.text}`}>{contacts.length}</p>
                                <p className={`text-xs ${themeClasses.textSecondary}`}>Total Contacts</p>
                              </div>
                            </CardContent>
                          </Card>
                          <Card className={`${themeClasses.cardBackground} ${themeClasses.border}`}>
                            <CardContent className="flex items-center gap-4 p-4">
                              <Building className={`h-6 w-6 ${isDarkMode ? "text-green-400" : "text-green-600"}`} />
                              <div>
                                <p className={`text-xl font-bold ${themeClasses.text}`}>
                                  {new Set(contacts.map((c) => c.company).filter((c) => c !== "N/A")).size}
                                </p>
                                <p className={`text-xs ${themeClasses.textSecondary}`}>Companies</p>
                              </div>
                            </CardContent>
                          </Card>
                          <Card className={`${themeClasses.cardBackground} ${themeClasses.border}`}>
                            <CardContent className="flex items-center gap-4 p-4">
                              <Phone className={`h-6 w-6 ${isDarkMode ? "text-purple-400" : "text-purple-600"}`} />
                              <div>
                                <p className={`text-xl font-bold ${themeClasses.text}`}>
                                  {contacts.filter((c) => c.phone !== "N/A").length}
                                </p>
                                <p className={`text-xs ${themeClasses.textSecondary}`}>Phone Numbers</p>
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Contacts Grid */}
                        <div>
                          <h2 className={`text-2xl font-bold text-center mb-6 ${themeClasses.text}`}>
                            Contact Directory
                          </h2>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {contacts.map((contact, index) => (
                              <Card
                                key={index}
                                className={`${themeClasses.cardBackground} ${themeClasses.border} hover:shadow-lg transition-all duration-200 ${themeClasses.hoverBg}`}
                              >
                                <CardContent className="p-6">
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                      <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${isDarkMode ? "bg-gradient-to-r from-gray-600 to-gray-700" : "bg-gradient-to-r from-gray-800 to-black"}`}
                                      >
                                        {contact.name.charAt(0).toUpperCase()}
                                      </div>
                                      <div>
                                        <h3 className={`font-semibold text-lg ${themeClasses.text}`}>{contact.name}</h3>
                                      </div>
                                    </div>

                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2 text-sm">
                                        <Phone className={`h-4 w-4 ${themeClasses.textMuted}`} />
                                        <span className={`font-mono ${themeClasses.text}`}>{contact.phone}</span>
                                      </div>

                                      <div className="flex items-center gap-2 text-sm">
                                        <Building className={`h-4 w-4 ${themeClasses.textMuted}`} />
                                        <Badge
                                          variant="secondary"
                                          className={`text-xs ${isDarkMode ? "bg-gray-700 text-gray-200" : "bg-gray-100 text-gray-800"}`}
                                        >
                                          {contact.company}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>

                        <div className="text-center">
                          <Button onClick={() => setActiveTab("template")} className={themeClasses.buttonPrimary}>
                            Continue to Template Selection
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Template Tab */}
              <TabsContent value="template" className="space-y-6">
                <Card className={`${themeClasses.cardBackground} ${themeClasses.border}`}>
                  <CardHeader>
                    <CardTitle className={`flex items-center gap-2 ${themeClasses.text}`}>
                      <MessageSquare className="h-5 w-5" />
                      Select Message Template
                    </CardTitle>
                    <CardDescription className={themeClasses.textSecondary}>
                      Choose a predefined message template for your outreach
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label className={themeClasses.text}>Message Template</Label>
                      <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                        <SelectTrigger
                          className={`${themeClasses.border} ${themeClasses.cardBackground} ${themeClasses.text}`}
                        >
                          <SelectValue placeholder="Choose a template..." />
                        </SelectTrigger>
                        <SelectContent className={`${themeClasses.cardBackground} ${themeClasses.border}`}>
                          {messageTemplates.map((template) => (
                            <SelectItem
                              key={template.id}
                              value={template.id}
                              className={`${themeClasses.text} ${themeClasses.hoverBg}`}
                            >
                              <div>
                                <div className="font-medium">{template.name}</div>
                                <div className={`text-xs ${themeClasses.textMuted}`}>{template.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedTemplate && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className={themeClasses.text}>Template Preview</Label>
                          <div className={`p-4 rounded-lg ${themeClasses.accentBg} ${themeClasses.border}`}>
                            <p className={`text-sm ${themeClasses.text} whitespace-pre-wrap`}>
                              {getSelectedTemplate()?.content}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className={themeClasses.text}>Preview Message</Label>
                          <div className={`p-4 rounded-lg ${themeClasses.accentBg} ${themeClasses.border}`}>
                            <p className={`text-sm ${themeClasses.text} whitespace-pre-wrap`}>{getPreviewMessage()}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label className={themeClasses.text}>Custom Message (Optional)</Label>
                      <Textarea
                        placeholder="Add any custom message or modifications..."
                        value={customMessage}
                        onChange={(e) => setCustomMessage(e.target.value)}
                        className={`${themeClasses.border} ${themeClasses.cardBackground} ${themeClasses.text}`}
                        rows={3}
                      />
                    </div>

                    {selectedTemplate && (
                      <div className="text-center">
                        <Button onClick={() => setActiveTab("outreach")} className={themeClasses.buttonPrimary}>
                          Continue to Outreach
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Outreach Tab */}
              <TabsContent value="outreach" className="space-y-6">
                <Card className={`${themeClasses.cardBackground} ${themeClasses.border}`}>
                  <CardHeader>
                    <CardTitle className={`flex items-center gap-2 ${themeClasses.text}`}>
                      <Play className="h-5 w-5" />
                      Initiate Outreach
                    </CardTitle>
                    <CardDescription className={themeClasses.textSecondary}>
                      Start the automated call sequence
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className={`p-4 rounded-lg ${themeClasses.accentBg} ${themeClasses.border}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`font-medium ${themeClasses.text}`}>Campaign Summary</span>
                        <Badge className={themeClasses.buttonPrimary}>{contacts.length} contacts</Badge>
                      </div>
                      <p className={`text-sm ${themeClasses.textSecondary}`}>Template: {getSelectedTemplate()?.name}</p>
                    </div>

                    <Button
                      onClick={handleStartOutreach}
                      disabled={isOutreachActive}
                      className={`w-full ${themeClasses.buttonPrimary}`}
                    >
                      {isOutreachActive ? (
                        <>
                          <Activity className="h-4 w-4 mr-2 animate-pulse" />
                          Campaign Active
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Start Outreach Campaign
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Status Tab */}
              <TabsContent value="status" className="space-y-6">
                <Card className={`${themeClasses.cardBackground} ${themeClasses.border}`}>
                  <CardHeader>
                    <CardTitle className={`flex items-center gap-2 ${themeClasses.text}`}>
                      <Activity className="h-5 w-5" />
                      Call Transcripts & Status
                    </CardTitle>
                    <CardDescription className={themeClasses.textSecondary}>
                      Real-time updates on your outreach campaign
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-center py-8 ${themeClasses.accentBg} rounded-lg ${themeClasses.border}`}>
                      <Activity className={`h-12 w-12 mx-auto mb-4 ${themeClasses.textMuted} animate-pulse`} />
                      <p className={`${themeClasses.text} font-medium mb-2`}>Campaign in Progress</p>
                      <p className={`text-sm ${themeClasses.textSecondary}`}>
                        Call transcripts and status updates will appear here as the campaign runs.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
