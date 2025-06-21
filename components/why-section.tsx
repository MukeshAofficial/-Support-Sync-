"use client"

import { useEffect, useRef, useState } from "react"
import { Code, Rocket, DollarSign, BarChart } from "lucide-react"

export default function WhySection() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)

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

  const reasons = [
    {
      icon: Code,
      title: "No code setup",
      description: "Get started without any technical expertise",
    },
    {
      icon: Rocket,
      title: "Built for early-stage startups",
      description: "Designed specifically for growing businesses",
    },
    {
      icon: DollarSign,
      title: "Affordable, scalable, developer-friendly",
      description: "Pricing that grows with your business",
    },
    {
      icon: BarChart,
      title: "Built-in analytics and feedback system",
      description: "Track performance and improve continuously",
    },
  ]

  return (
    <section ref={sectionRef} className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Support Sync?</h2>
          <p className="text-xl text-gray-600">Built by founders, for founders</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {reasons.map((reason, index) => (
            <div
              key={index}
              className={`text-center p-6 bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 ${
                isVisible ? "animate-slide-up" : "opacity-0"
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <reason.icon className="text-white" size={28} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{reason.title}</h3>
              <p className="text-gray-600 text-sm">{reason.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
