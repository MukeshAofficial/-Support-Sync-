"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Loader2 } from "lucide-react"

interface GeneratedContent {
  title: string
  content: string
  keyBenefits: string[]
  seoAnalysis: {
    keywordDensity: string
    readability: string
  }
}

export default function SmartContentCreator() {
  const [contentType, setContentType] = useState("Blog Post")
  const [topic, setTopic] = useState("")
  const [targetAudience, setTargetAudience] = useState("")
  const [contentLength, setContentLength] = useState("")
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const contentTypes = ["Blog Post", "Email Newsletter", "Social Media", "Landing Page"]
  const audiences = ["Startup Founders", "Marketers", "Developers", "Executives"]
  const lengths = ["Short (200-400 words)", "Medium (500-800 words)", "Long (1000+ words)"]

  const handleGenerate = async () => {
    if (!topic || !targetAudience || !contentLength) {
      alert("Please fill in all fields")
      return
    }

    setIsGenerating(true)

    try {
      const response = await fetch("/api/generate-content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contentType,
          topic,
          targetAudience,
          contentLength,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate content")
      }

      const data = await response.json()
      setGeneratedContent(data)
    } catch (error) {
      console.error("Error generating content:", error)
      alert("Failed to generate content. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRegenerate = () => {
    handleGenerate()
  }

  const handleUseContent = () => {
    if (generatedContent) {
      navigator.clipboard.writeText(generatedContent.content)
      alert("Content copied to clipboard!")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-6xl p-6 flex flex-col items-center justify-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-center justify-center">
          {/* Left Panel - Form */}
          <div className="space-y-6 w-full max-w-lg mx-auto">
            <div>
              <h1 className="text-3xl font-bold text-[#111827] mb-2">Smart Content Creator</h1>
              <p className="text-gray-600">
                Our AI understands your brand voice and industry to generate engaging, original content that resonates
                with your audience.
              </p>
            </div>
            <div className="space-y-6">
              {/* Content Type */}
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-3">Content type:</label>
                <div className="flex flex-wrap gap-2">
                  {contentTypes.map((type) => (
                    <Button
                      key={type}
                      variant={contentType === type ? "default" : "outline"}
                      onClick={() => setContentType(type)}
                      className={
                        contentType === type
                          ? "bg-black text-white hover:bg-[#111827] border border-black"
                          : "bg-white text-[#111827] border border-[#D1D5DB] hover:bg-[#F9FAFB]"
                      }
                    >
                      {type}
                    </Button>
                  ))}
                </div>
              </div>
              {/* Topic */}
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-3">Topic:</label>
                <Input
                  placeholder="The Benefits of AI for Small Businesses"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="border-[#D1D5DB] focus:border-black focus:ring-black bg-white text-[#111827]"
                />
              </div>
              {/* Target Audience */}
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-3">Target audience:</label>
                <div className="flex flex-wrap gap-2">
                  {audiences.map((audience) => (
                    <Button
                      key={audience}
                      variant={targetAudience === audience ? "default" : "outline"}
                      onClick={() => setTargetAudience(audience)}
                      className={
                        targetAudience === audience
                          ? "bg-black text-white hover:bg-[#111827] border border-black"
                          : "bg-white text-[#111827] border border-[#D1D5DB] hover:bg-[#F9FAFB]"
                      }
                    >
                      {audience}
                    </Button>
                  ))}
                </div>
              </div>
              {/* Content Length */}
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-3">Content length:</label>
                <Select value={contentLength} onValueChange={setContentLength}>
                  <SelectTrigger className="border-[#D1D5DB] focus:border-black focus:ring-black bg-white text-[#111827]">
                    <SelectValue placeholder="Select length" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-[#D1D5DB]">
                    {lengths.map((length) => (
                      <SelectItem key={length} value={length} className="text-[#111827] hover:bg-[#F9FAFB]">
                        {length}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full bg-black hover:bg-[#111827] text-white py-3 text-lg font-medium rounded-xl"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Content"
                )}
              </Button>
            </div>
          </div>
          {/* Right Panel - Generated Content */}
          <div className="space-y-6 w-full max-w-lg mx-auto">
            {generatedContent ? (
              <Card className="border border-[#D1D5DB] bg-white max-h-[80vh] overflow-y-auto">
                <CardHeader className="border-b border-[#F9FAFB]">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#F9FAFB] rounded-lg">
                      <FileText className="w-5 h-5 text-black" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-[#111827]">Blog Content Generator</CardTitle>
                      <p className="text-sm text-gray-600">Live AI content creation</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Generated Content */}
                  <div>
                    <h2 className="text-xl font-bold text-[#111827] mb-4">{generatedContent.title}</h2>
                    <div className="prose prose-gray max-w-none">
                      <div className="whitespace-pre-wrap text-[#111827] leading-relaxed">
                        {generatedContent.content}
                      </div>
                    </div>
                  </div>
                  {/* Key Benefits */}
                  {generatedContent.keyBenefits && generatedContent.keyBenefits.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-[#111827] mb-3">Key Benefits of AI Implementation</h3>
                      <ul className="space-y-2">
                        {generatedContent.keyBenefits.map((benefit, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 bg-[#D1D5DB] rounded-full mt-2 flex-shrink-0"></span>
                            <span className="text-[#111827]">{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {/* SEO Analysis */}
                  <div className="border-t border-[#F9FAFB] pt-6">
                    <h3 className="text-lg font-semibold text-[#111827] mb-3">SEO Analysis</h3>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Keyword density:</span>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          {generatedContent.seoAnalysis.keywordDensity}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Readability:</span>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          {generatedContent.seoAnalysis.readability}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={handleRegenerate}
                      disabled={isGenerating}
                      className="border-[#D1D5DB] text-[#111827] hover:bg-[#F9FAFB]"
                    >
                      Regenerate
                    </Button>
                    <Button onClick={handleUseContent} className="bg-black hover:bg-[#111827] text-white">
                      Use This Content
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border border-[#D1D5DB] border-dashed bg-white">
                <CardContent className="p-12 text-center">
                  <FileText className="w-12 h-12 text-[#D1D5DB] mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-[#111827] mb-2">Ready to create content</h3>
                  <p className="text-gray-600">
                    Fill out the form and click "Generate Content" to see your AI-generated content here.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
