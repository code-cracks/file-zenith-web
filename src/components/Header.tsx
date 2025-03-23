'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Github, Menu } from 'lucide-react';

import ThemeButton from './ThemeButton';

import { tools } from '@/utils/constant';

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<number | null>(null);

  const toggleSection = (index: number) => {
    setExpandedSection(expandedSection === index ? null : index);
  };

  return (
    <>
      <header className="w-full bg-gradient-to-r from-gray-900 to-gray-800 text-white border-b border-gray-800/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto">
          <div className="flex items-center h-11">
            {/* Left: Logo */}
            <div className="flex items-center ml-2">
              <Link
                href="/"
                className="flex items-center transition-transform hover:scale-105 cursor-pointer"
              >
                <span className="bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent text-base font-bold">
                  ❤️ PDF
                </span>
              </Link>
            </div>

            {/* Center: Navigation */}
            <div className="flex-1 flex items-center justify-center -mx-1">
              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center">
                {tools.map((item, index) => (
                  <div key={index} className="relative group px-1">
                    <button className="flex items-center px-2 py-1 rounded hover:bg-white/10 transition-all duration-200 ease-in-out cursor-pointer">
                      <item.icon className="w-4 h-4 mr-1.5" />
                      <span className="font-medium text-sm">{item.title}</span>
                      <ChevronDown className="w-4 h-4 ml-0.5 transform group-hover:rotate-180 transition-transform duration-200" />
                    </button>
                    <div className="absolute left-0 mt-0.5 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-in-out">
                      <div className="py-1 bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-xl border border-gray-700/50">
                        {item.children.map((child, childIndex) => (
                          <Link
                            key={childIndex}
                            href={child.href}
                            className="block w-full px-3 py-1 text-sm hover:bg-white/10 transition-colors duration-150 cursor-pointer"
                          >
                            {child.title}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Github, Theme Button and Mobile Menu */}
            <div className="flex items-center space-x-1 mr-2">
              <Link
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded hover:bg-white/10 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white/20 cursor-pointer"
                aria-label="GitHub repository"
              >
                <Github className="w-4 h-4" />
              </Link>
              <ThemeButton />
              {/* Mobile Navigation Button */}
              <div className="md:hidden">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-1.5 rounded hover:bg-white/10 transition-all duration-200 ease-in-out cursor-pointer"
                  aria-label="Toggle menu"
                >
                  <Menu className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div
        className={`md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        {/* Mobile Menu Panel */}
        <div
          className={`fixed inset-y-0 right-0 w-72 bg-gray-900 shadow-xl transition-transform duration-300 ease-in-out ${
            isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col h-full">
            <div className="px-4 py-3 border-b border-gray-800">
              <span className="text-sm font-medium">所有工具</span>
            </div>
            <nav className="flex-1 overflow-y-auto py-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
              <div className="space-y-2">
                {tools.map((section, index) => (
                  <div key={index} className="border-b border-gray-800/50 last:border-b-0">
                    <button
                      onClick={() => toggleSection(index)}
                      className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-gray-200 hover:bg-white/5 cursor-pointer"
                    >
                      <div className="flex items-center">
                        <section.icon className="w-4 h-4 mr-2" />
                        {section.title}
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          expandedSection === index ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    <div
                      className={`overflow-hidden transition-all duration-200 ease-in-out ${
                        expandedSection === index ? 'max-h-[500px]' : 'max-h-0'
                      }`}
                    >
                      <div className="py-2 space-y-1">
                        {section.children.map((item, itemIndex) => (
                          <Link
                            key={itemIndex}
                            href={item.href}
                            className="flex items-center px-8 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 cursor-pointer"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            {item.title}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </nav>
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;
