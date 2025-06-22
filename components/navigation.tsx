"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Menu, X, ChevronDown } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
    }
    getUser()
    const { data: listener } = supabase.auth.onAuthStateChange(() => getUser())
    return () => { listener?.subscription.unsubscribe() }
  }, [])

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled ? "bg-white/95 backdrop-blur-sm shadow-sm" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold text-gray-900">
            Support Sync
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">
              Features
            </Link>
            {/* Tools Dropdown */}
            <div className="relative group">
              <button className="flex items-center text-gray-600 hover:text-gray-900 transition-colors px-2 py-2 rounded-lg hover:bg-gray-50">
                Tools <ChevronDown className="w-4 h-4 ml-1" />
              </button>
              <div className="absolute left-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 group-hover:visible invisible transition-all z-50">
                <div className="py-2">
                  <Link href="/bot" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">AI Customer Support</Link>
                  <Link href="/outreach" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">AI Outreach Automation</Link>
                  <Link href="/lead" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">Analyze Your Leads</Link>
                  <Link href="/code" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">Understand Your Code</Link>
                  <Link href="/content" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">Content Generator</Link>
                  {/* Add more tools/features here as needed */}
                </div>
              </div>
            </div>
            <Link href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">
              Pricing
            </Link>
            <Link href="#docs" className="text-gray-600 hover:text-gray-900 transition-colors">
              Docs
            </Link>
            <Link href="#blog" className="text-gray-600 hover:text-gray-900 transition-colors">
              Blog
            </Link>
          </div>

          {/* Desktop Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-gray-700 font-semibold">{user.user_metadata?.name || user.email}</span>
                <button
                  onClick={async () => { await supabase.auth.signOut(); window.location.reload(); }}
                  className="text-gray-600 hover:text-gray-900 transition-colors px-4 py-2 rounded-lg hover:bg-gray-50"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/signin"
                  className="text-gray-600 hover:text-gray-900 transition-colors px-4 py-2 rounded-lg hover:bg-gray-50"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link href="#features" className="block px-3 py-2 text-gray-600 hover:text-gray-900">
                Features
              </Link>
              {/* Tools Dropdown for Mobile */}
              <div className="border-t pt-2">
                <div className="font-semibold text-gray-700 mb-1">Tools</div>
                <Link href="/bot" className="block px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">AI Customer Support</Link>
                <Link href="/outreach" className="block px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">AI Outreach Automation</Link>
                <Link href="/lead" className="block px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">Analyze Your Leads</Link>
                <Link href="/code" className="block px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">Understand Your Code</Link>
                <Link href="/content" className="block px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">Content Generator</Link>
              </div>
              <Link href="#pricing" className="block px-3 py-2 text-gray-600 hover:text-gray-900">
                Pricing
              </Link>
              <Link href="#docs" className="block px-3 py-2 text-gray-600 hover:text-gray-900">
                Docs
              </Link>
              <Link href="#blog" className="block px-3 py-2 text-gray-600 hover:text-gray-900">
                Blog
              </Link>
              <div className="pt-4 pb-2 space-y-2">
                {user ? (
                  <>
                    <span className="block w-full text-center px-3 py-2 text-gray-700 font-semibold">{user.user_metadata?.name || user.email}</span>
                    <button
                      onClick={async () => { await supabase.auth.signOut(); window.location.reload(); }}
                      className="block w-full text-center px-3 py-2 text-gray-600 hover:text-gray-900 border rounded-lg"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/signin"
                      className="block w-full text-center px-3 py-2 text-gray-600 hover:text-gray-900 border rounded-lg"
                    >
                      Login
                    </Link>
                    <Link
                      href="/signup"
                      className="block w-full text-center px-3 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
