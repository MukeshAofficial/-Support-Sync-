"use client"

import { useEffect, useRef, useState } from "react"
import { Brain, Phone, Upload, Bot, MessageSquare, BarChart3 } from "lucide-react"
import { useRouter } from "next/navigation"

export default function Features() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 },
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const features = [
    {
      icon: Brain,
      title: "AI Customer Support",
      description: "Upload knowledge base",
      details: [
        "Instantly deploy chat and voice bots",
        "Set personality, fallback handoff, and learning mode",
        "24/7 automated customer assistance",
      ],
      onClick: () => router.push("/bot"),
    },
    {
      icon: Phone,
      title: "AI Outreach Automation",
      description: "Upload Google Sheets with lead details",
      details: [
        "Match rows with predefined message templates",
        "Automatically call or message leads",
        "Track engagement and conversion rates",
      ],
      onClick: () => router.push("/outreach"),
    },
  ]

  return (
    <section id="features" ref={sectionRef} className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Powerful Features for Growing Startups</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Everything you need to automate customer support and outreach in one platform
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {features.map((feature, index) => (
            <div
              key={index}
              onClick={feature.onClick}
              className={`cursor-pointer bg-gray-50 rounded-2xl p-8 hover:shadow-lg transition-all duration-300 ${
                isVisible ? "animate-slide-up" : "opacity-0"
              }`}
              style={{ animationDelay: `${index * 200}ms` }}
            >
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mr-4">
                  <feature.icon className="text-white" size={24} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{feature.title}</h3>
              </div>

              <p className="text-gray-600 mb-6 text-lg">{feature.description}</p>

              <ul className="space-y-3">
                {feature.details.map((detail, detailIndex) => (
                  <li key={detailIndex} className="flex items-start">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span className="text-gray-700">{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Additional Feature Icons */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { icon: Upload, label: "Easy Upload" },
            { icon: Bot, label: "Smart Bots" },
            { icon: MessageSquare, label: "Multi-Channel" },
            { icon: BarChart3, label: "Analytics" },
          ].map((item, index) => (
            <div
              key={index}
              className={`text-center p-6 rounded-xl hover:bg-gray-50 transition-colors ${
                isVisible ? "animate-fade-in" : "opacity-0"
              }`}
              style={{ animationDelay: `${(index + 2) * 100}ms` }}
            >
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <item.icon className="text-blue-600" size={28} />
              </div>
              <h4 className="font-semibold text-gray-900">{item.label}</h4>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
