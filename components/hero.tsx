"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowRight, Play } from "lucide-react"

export default function Hero() {
  const [typedText, setTypedText] = useState("")
  const fullText = "AI-powered support and outreach — all in one platform."

  useEffect(() => {
    let index = 0
    const timer = setInterval(() => {
      if (index < fullText.length) {
        setTypedText(fullText.slice(0, index + 1))
        index++
      } else {
        clearInterval(timer)
      }
    }, 50)

    return () => clearInterval(timer)
  }, [])

  return (
    <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8 animate-fade-in">
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Supercharge Your Startup with{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AI Automation
              </span>
            </h1>

            <div className="text-xl text-gray-600 h-8">
              {typedText}
              <span className="animate-pulse">|</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center px-8 py-4 bg-black text-white rounded-xl hover:bg-gray-800 transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Get Started Free
                <ArrowRight className="ml-2" size={20} />
              </Link>
              <button className="inline-flex items-center justify-center px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:border-gray-400 transition-all duration-200 hover:scale-105">
                <Play className="mr-2" size={20} />
                View Features
              </button>
            </div>

            <div className="flex items-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                No credit card required
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                Setup in 5 minutes
              </div>
            </div>
          </div>

          {/* Right Content - Abstract Animation */}
          <div className="relative">
            <div className="relative w-full h-96 bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-400/20"></div>

              {/* Floating Elements */}
              <div className="absolute top-8 left-8 w-16 h-16 bg-blue-500 rounded-2xl animate-float opacity-80"></div>
              <div className="absolute top-20 right-12 w-12 h-12 bg-purple-500 rounded-full animate-float-delayed opacity-70"></div>
              <div className="absolute bottom-16 left-16 w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-400 rounded-3xl animate-float-slow opacity-60"></div>
              <div className="absolute bottom-8 right-8 w-8 h-8 bg-blue-600 rounded-lg animate-pulse"></div>

              {/* Grid Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="grid grid-cols-8 grid-rows-8 h-full w-full">
                  {Array.from({ length: 64 }).map((_, i) => (
                    <div key={i} className="border border-gray-400"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
