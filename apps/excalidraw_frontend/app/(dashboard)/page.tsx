"use client";
import React from 'react';
import { 
  Pencil, 
  MousePointer2, 
  Share2, 
  Lock, 
  Shapes, 
  Github,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';

function Dashboard() {
    const router = useRouter();
    const { isSignin, signOut } = useAuth();
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-gradient-to-b from-cyan-200 to-white">
        <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Shapes className="w-8 h-8 text-cyan-600" />
            <span className="text-xl font-bold">DrawFlow</span>
          </div>
          <div className="flex items-center space-x-6">
            <Link href="#features" className="text-gray-600 hover:text-gray-900" aria-label="Features">Features</Link>
            {
              isSignin ? <button className={`text-gray-600 hover:text-gray-900`} aria-label="Sign Up"
                onClick={signOut}
              >Logout</button>
              : ""
            }
            <Link href="/signup" className={`text-gray-600 hover:text-gray-900 ${isSignin ? "hidden": ""}`} aria-label="Sign Up">Sign Up</Link>
            <Link href="/signin" className={`text-gray-600 hover:text-gray-900 ${isSignin ? "hidden": ""}`} aria-label="Sign In">Sign In</Link>
            <button className="bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-700 transition-colors"
            onClick={()=> {
                if(isSignin){
                    router.push("/canvas");
                } else {
                    router.push("/signin");
                }
            }}
            aria-label={isSignin ? "Open DrawFlow" : "Sign In to Open DrawFlow"}
            >
              Open DrawFlow
            </button>
          </div>
        </nav>

        <div className="container mx-auto px-6 py-20">
          <div className="flex flex-col items-center text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              The Virtual Whiteboard for Your Ideas
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl">
              Create beautiful hand-drawn diagrams, flowcharts, and illustrations with our intuitive drawing tool. Collaborate in real-time and share your creativity with the world.
            </p>
            <div className="flex space-x-4">
              <button className="bg-cyan-600 text-white px-6 py-3 rounded-lg hover:bg-cyan-700 transition-colors flex items-center"
                onClick={() => {
                    if(isSignin){
                        router.push("/canvas");
                    } else {
                        router.push("/signin");
                    }
                }}
                aria-label={isSignin ? "Start Drawing" : "Sign In to Start Drawing"}
              >
                Start Drawing <ArrowRight className="ml-2 w-5 h-5" />
              </button>
              <button className="border-2 border-cyan-600 text-cyan-600 px-6 py-3 rounded-lg hover:bg-cyan-50 transition-colors" aria-label="View Examples">
                View Examples
              </button>
            </div>
          </div>
        </div>
      </header>

      <section className="py-20 " id="features">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            <div className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <MousePointer2 className="w-12 h-12 text-cyan-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Intuitive Interface</h3>
              <p className="text-gray-600">Simple and easy-to-use drawing tools that feel natural and responsive.</p>
            </div>
            <div className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <Share2 className="w-12 h-12 text-cyan-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Real-time Collaboration</h3>
              <p className="text-gray-600">Work together with your team in real-time, no matter where they are.</p>
            </div>
            <div className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <Lock className="w-12 h-12 text-cyan-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Secure by Default</h3>
              <p className="text-gray-600">Your drawings are encrypted and secure. You control who can access them.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <h2 className="text-3xl font-bold mb-4">Create Beautiful Diagrams</h2>
              <p className="text-gray-600 mb-6">
                From simple sketches to complex diagrams, DrawFlow helps you visualize your ideas with style. Perfect for:
              </p>
              <ul className="space-y-3">
                {['Flowcharts', 'Architecture Diagrams', 'Mind Maps', 'UI Wireframes'].map((item) => (
                  <li key={item} className="flex items-center">
                    <Pencil className="w-5 h-5 text-cyan-600 mr-2" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="md:w-1/2">
              <img 
                src="https://images.unsplash.com/photo-1611224923853-80b023f02d71?auto=format&fit=crop&w=800&q=80" 
                alt="Example Diagram" 
                className="rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Shapes className="w-8 h-8 text-cyan-400" />
              <span className="text-xl font-bold">DrawFlow</span>
            </div>
            <div className="flex items-center space-x-4">
              <a href="#" className="hover:text-cyan-400 transition-colors" aria-label="GitHub">
                <Github className="w-6 h-6" />
              </a>
              <a href="#" className="hover:text-cyan-400 transition-colors" aria-label="Terms">Terms</a>
              <a href="#" className="hover:text-cyan-400 transition-colors" aria-label="Privacy">Privacy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Dashboard;
