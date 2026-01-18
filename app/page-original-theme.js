'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

/**
 * ZENZHUB-INSPIRED HOMEPAGE
 * Recreates the dark, minimalist, builder-focused design of zenzhub.tech
 * Features: Hero section, feature blocks, quotes, CTAs, and footer
 */

export default function Application PortalHome() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    
    // Intersection Observer for scroll animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in-up');
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('.scroll-reveal').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-zenDark text-white">
      
      {/* ===================================
          HERO SECTION - "Stop asking. Start becoming."
          Mirrors Application Portal's bold, centered hero
          =================================== */}
      <section className="hero-section relative overflow-hidden grid-pattern">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-zenDark via-zenDarkSecondary to-zenDark opacity-90"></div>
        
        <div className={`relative z-10 space-y-8 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* Small label - "SHIP FAST BUILD PUBLIC" */}
          <div className="badge-label animate-glow">
            SHIP FAST • BUILD PUBLIC • AI + YOU
          </div>

          {/* Main headline */}
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-black tracking-tight">
            Stop asking.
            <br />
            <span className="gradient-text">Start becoming.</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-zenTextSecondary max-w-3xl mx-auto leading-relaxed">
            Use AI to <span className="text-zenAccent font-semibold">automate the busywork</span>. 
            Change the system. Make things nicer.
          </p>

          {/* Tagline */}
          <p className="text-lg text-zenTextMuted max-w-2xl mx-auto">
            We don't follow broken rules — we build new ones. For builders, founders, 
            designers, coders who refuse to settle.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
            <Link href="https://www.linkedin.com/company/103313540" target="_blank" className="btn-primary">
              Start Shipping →
            </Link>
            <Link href="https://www.linkedin.com/company/103313540" target="_blank" className="btn-secondary">
              Join the Community
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-zenAccent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* ===================================
          SECTION: "Automate the noise"
          Feature introduction section
          =================================== */}
      <section className="section scroll-reveal">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="mb-4">Automate the noise.</h2>
            <h2 className="gradient-text">Build what matters.</h2>
          </div>
        </div>
      </section>

      {/* ===================================
          FEATURE BLOCKS
          Three key features from Application Portal
          =================================== */}
      <section className="section bg-zenDarkSecondary">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-8">
            
            {/* Feature 1: AI-Powered Systems */}
            <div className="form-card scroll-reveal delay-100">
              <div className="space-y-6">
                <div className="w-12 h-12 bg-zenAccent/10 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-zenAccent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                
                <h3>AI-Powered Systems</h3>
                
                <p className="text-zenTextSecondary">
                  <span className="text-white font-semibold">Automate the busywork.</span><br />
                  Focus on what matters.
                </p>
                
                <p className="text-sm text-zenTextMuted">
                  Let AI handle the repetitive tasks while you build something meaningful.
                </p>

                <div className="pt-4 border-t border-zenTextMuted/20">
                  <div className="badge-label text-xs">
                    3 hrs saved/week
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 2: Make Things Nicer */}
            <div className="form-card scroll-reveal delay-200">
              <div className="space-y-6">
                <div className="w-12 h-12 bg-zenGreen/10 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-zenGreen" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                
                <h3>Make Things Nicer</h3>
                
                <p className="text-zenTextSecondary">
                  <span className="text-white font-semibold">Every tool should be</span><br />
                  beautiful and useful.
                </p>
                
                <p className="text-sm text-zenTextMuted">
                  We build systems that make your life simpler, smoother, better.
                </p>

                <div className="pt-4 border-t border-zenTextMuted/20">
                  <div className="badge-label text-xs">
                    NETWORK ACTIVE
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 3: Change The System */}
            <div className="form-card scroll-reveal delay-300">
              <div className="space-y-6">
                <div className="w-12 h-12 bg-zenPurple/10 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-zenPurple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                
                <h3>Change The System</h3>
                
                <p className="text-zenTextSecondary">
                  <span className="text-white font-semibold">The old way is broken.</span><br />
                  Build a better one.
                </p>
                
                <p className="text-sm text-zenTextMuted">
                  Use AI to create tools that make everything nicer, simpler, better.
                </p>

                <div className="pt-4 border-t border-zenTextMuted/20">
                  <div className="badge-label text-xs">
                    75% COMPLETE
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ===================================
          QUOTES SECTION
          Philosophical quotes like on Application Portal
          =================================== */}
      <section className="section scroll-reveal">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="mb-6">AI changes everything.</h2>
            <h3 className="text-zenAccent">Use it to build better.</h3>
          </div>

          <div className="max-w-4xl mx-auto space-y-12">
            {/* Quote 1 */}
            <div className="quote-block scroll-reveal delay-100">
              <p className="mb-4">
                "The mind is everything. What you think, you become."
              </p>
              <p className="text-base text-zenTextMuted not-italic">— Buddha</p>
            </div>

            {/* Quote 2 */}
            <div className="quote-block scroll-reveal delay-200">
              <p className="mb-4">
                "Simplicity is the ultimate sophistication."
              </p>
              <p className="text-base text-zenTextMuted not-italic">— Leonardo da Vinci</p>
            </div>

            {/* Quote 3 */}
            <div className="quote-block scroll-reveal delay-300">
              <p className="mb-4">
                "By believing passionately in something that doesn't exist, you create it."
              </p>
              <p className="text-base text-zenTextMuted not-italic">— Nikos Kazantzakis</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================
          CTA SECTION
          "Stop working hard. Start working smart."
          =================================== */}
      <section className="section bg-zenDarkSecondary scroll-reveal">
        <div className="container">
          <div className="text-center space-y-8">
            <div className="badge-label mx-auto">
              AI + AUTOMATION + YOU
            </div>

            <h2 className="text-5xl md:text-6xl font-black">
              Stop working hard.
              <br />
              <span className="gradient-text">Start working smart.</span>
            </h2>

            <p className="text-xl text-zenTextSecondary max-w-2xl mx-auto">
              We invite builders who want to fix what's broken and create something better.
            </p>

            <div className="pt-8">
              <Link href="https://www.linkedin.com/company/103313540" target="_blank" className="btn-primary text-xl px-12 py-5">
                Start Shipping
              </Link>
            </div>

            <div className="pt-8">
              <div className="badge-label">
                HOURS AUTOMATED: +48 THIS WEEK
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================
          FINAL MESSAGE SECTION
          "You don't need another course"
          =================================== */}
      <section className="section scroll-reveal">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="badge-label mx-auto mb-8">
              STOP THINKING • START BUILDING
            </div>

            <h2 className="text-4xl md:text-5xl font-bold leading-tight">
              You don't need another course.
            </h2>

            <p className="text-2xl text-zenTextSecondary">
              You need <span className="text-zenAccent font-semibold">action</span>. 
              You don't need more followers. 
              You need <span className="text-zenAccent font-semibold">focus</span>.
            </p>

            <p className="text-xl text-white font-semibold pt-4">
              Build something. That's the only answer.
            </p>
          </div>
        </div>
      </section>

      {/* ===================================
          FOOTER
          Social links and copyright
          =================================== */}
      <footer className="border-t border-zenTextMuted/20 py-12 bg-zenDarkSecondary">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Brand info */}
            <div className="space-y-4">
              <h4 className="text-2xl font-bold">Application Portal</h4>
              <p className="text-zenTextSecondary">
                AI changes everything.<br />
                Use it to build better.
              </p>
              <p className="text-sm text-zenTextMuted">
                Automate the busywork. Change how systems work. Make things nicer. 
                That's what we're building here.
              </p>
            </div>

            {/* Social links */}
            <div className="space-y-4 md:text-right">
              <p className="text-sm font-semibold text-zenTextSecondary uppercase tracking-wide">
                Connect
              </p>
              <div className="flex gap-4 md:justify-end">
                <Link 
                  href="https://www.linkedin.com/company/103313540" 
                  target="_blank"
                  className="flex items-center gap-2 text-zenAccent hover:text-zenAccentHover transition-colors"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  LinkedIn
                </Link>
                <Link 
                  href="https://www.instagram.com/zenz.hub/" 
                  target="_blank"
                  className="flex items-center gap-2 text-zenAccent hover:text-zenAccentHover transition-colors"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  Instagram
                </Link>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-zenTextMuted/20 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-zenTextMuted">
              © 2026 Application Portal
            </p>
            <p className="text-xs text-zenTextMuted uppercase tracking-wider font-mono">
              FOR THOSE WHO BUILD, NOT CONSUME.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
