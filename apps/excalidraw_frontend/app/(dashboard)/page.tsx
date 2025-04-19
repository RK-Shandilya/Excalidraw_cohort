"use client";
import React from 'react';
import { 
  MousePointer2, 
  Shapes, 
  Github,
  ArrowRight,
  Sparkles,
  Users,
  Shield,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';

function Dashboard() {
    const router = useRouter();
    const { isSignin, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-gradient-to-br from-cyan-50 to-white via-90% relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-cyan-400 mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-40 right-32 w-64 h-64 rounded-full bg-blue-400 mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-20 left-1/2 w-64 h-64 rounded-full bg-indigo-400 mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <nav className="container mx-auto px-6 py-6 flex justify-between items-center relative z-10">
          <div className="flex items-center space-x-3">
            <Shapes className="w-8 h-8 text-cyan-600" />
            <span className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">DrawFlow</span>
          </div>
          <div className="flex items-center space-x-8">
            <Link href="#features" className="text-gray-600 hover:text-cyan-600 transition-colors font-medium" aria-label="Features">Features</Link>
            {isSignin ? (
              <button className="text-gray-600 hover:text-cyan-600 transition-colors font-medium" onClick={signOut} aria-label="Logout">
                Logout
              </button>
            ) : (
              <>
                <Link href="/signup" className="text-gray-600 hover:text-cyan-600 transition-colors font-medium" aria-label="Sign Up">Sign Up</Link>
                <Link href="/signin" className="text-gray-600 hover:text-cyan-600 transition-colors font-medium" aria-label="Sign In">Sign In</Link>
              </>
            )}
            <button 
              className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-6 py-2.5 rounded-xl hover:shadow-lg transition-all duration-300 shadow-md flex items-center"
              onClick={() => router.push(isSignin ? "/canvas" : "/signin")}
              aria-label={isSignin ? "Open DrawFlow" : "Sign In to Open DrawFlow"}
            >
              {isSignin ? "Launch App" : "Get Started"}
              <ArrowRight className="ml-2 w-4 h-4" />
            </button>
          </div>
        </nav>

        <div className="container mx-auto px-6 py-24 relative z-10">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center bg-cyan-100 text-cyan-800 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4 mr-2" />
              Now with real-time collaboration
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Visualize Your <span className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">Ideas</span> Together
            </h1>
            <p className="text-xl text-gray-600 mb-10 max-w-2xl">
              The most intuitive virtual whiteboard for teams to sketch, diagram, and collaborate in real-time.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-8 py-4 rounded-xl hover:shadow-lg transition-all duration-300 shadow-md flex items-center justify-center font-medium"
                onClick={() => router.push(isSignin ? "/canvas" : "/signin")}
                aria-label={isSignin ? "Start Drawing" : "Sign In to Start Drawing"}
              >
                Start Drawing <ArrowRight className="ml-3 w-5 h-5" />
              </button>
              <button className="border-2 border-gray-200 text-gray-700 px-8 py-4 rounded-xl hover:border-cyan-400 hover:text-cyan-600 transition-colors flex items-center justify-center font-medium" aria-label="View Examples">
                See Live Demo
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="py-12 bg-gray-50">
        <div className="container mx-auto px-6">
          <p className="text-center text-gray-500 mb-8">Trusted by teams at</p>
          <div className="flex flex-wrap justify-center gap-12 opacity-70">
            {['Google', 'Microsoft', 'Airbnb', 'Spotify', 'Netflix'].map((company) => (
              <div key={company} className="text-2xl font-bold text-gray-700">{company}</div>
            ))}
          </div>
        </div>
      </div>

      <section className="py-20" id="features">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Powerful Features</h2>
            <p className="text-xl text-gray-600">Everything you need to bring your ideas to life</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <MousePointer2 className="w-10 h-10 text-cyan-600" />,
                title: "Intuitive Interface",
                description: "Natural drawing experience with tools that feel just like pen and paper."
              },
              {
                icon: <Users className="w-10 h-10 text-cyan-600" />,
                title: "Real-time Collaboration",
                description: "Work simultaneously with your team, no matter where they are located."
              },
              {
                icon: <Shield className="w-10 h-10 text-cyan-600" />,
                title: "Enterprise Security",
                description: "End-to-end encryption and permission controls for your peace of mind."
              },
            ].map((feature, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                <div className="w-14 h-14 flex items-center justify-center bg-cyan-50 rounded-xl mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-br from-gray-50 to-cyan-50">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="lg:w-1/2">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Create Without Limits</h2>
              <p className="text-xl text-gray-600 mb-8">
                From simple sketches to complex diagrams, DrawFlow adapts to your creative workflow with powerful tools and an infinite canvas.
              </p>
              <ul className="space-y-4">
                {[
                  "Infinite zoomable canvas",
                  "Customizable shapes",
                  "Keyboard shortcuts",
                  "Dark mode"
                ].map((item, index) => (
                  <li key={index} className="flex items-center">
                    <div className="w-6 h-6 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center mr-3">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="lg:w-1/2 relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
                <video src='/Demo2.mov' autoPlay={true} controls={true} muted className='w-full h-auto'></video>
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <Shapes className="w-8 h-8 text-cyan-400" />
                <span className="text-2xl font-bold">DrawFlow</span>
              </div>
              <p className="text-gray-400 mb-6">The visual collaboration platform for every team.</p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="Twitter">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="GitHub">
                  <Github className="w-5 h-5" />
                </a>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Product</h3>
              <ul className="space-y-3">
                {['Features', 'Pricing', 'Templates', 'Integrations', 'Changelog'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Resources</h3>
              <ul className="space-y-3">
                {['Documentation', 'Community', 'Webinars', 'Blog', 'Support'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-3">
                {['About', 'Careers', 'Privacy', 'Terms', 'Contact'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>© {new Date().getFullYear()} DrawFlow. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Dashboard;