"use client";
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

const Room = () => {
    const router = useRouter();
    const [roomId, setRoomId] = useState("");

    return (
        <div className="min-h-screen bg-[url('/bg.webp')] flex flex-col items-center justify-center bg-cover bg-center bg-no-repeat bg-fixed overflow-y-hidden">
            <div className="mb-8 animate-pulse">
                <div className="inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full shadow-lg">
                    <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                    <span className="text-white font-medium text-sm">LIVE COLLABORATION</span>
                </div>
            </div>

            <div className="flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                    <div className="p-8 space-y-6">
                        <div className="text-center">
                            <h1 className="text-3xl font-bold text-gray-800 mb-2">
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 via-cyan-800 to-cyan-950">
                                    Join Canvas Room
                                </span>
                            </h1>
                            <p className="text-gray-500">Enter your room ID to start collaborating</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label htmlFor="roomId" className="block text-sm font-medium text-gray-700 mb-1">
                                    Room ID
                                </label>
                                <input 
                                    id="roomId"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-all"
                                    type="text" 
                                    placeholder="Enter Room ID"
                                    value={roomId}
                                    onChange={(e) => setRoomId(e.target.value)}
                                />
                            </div>

                            <button 
                                className="w-full py-3.5 px-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-medium rounded-xl transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                                onClick={() => router.push(`/canvas/${roomId}`)}
                                disabled={!roomId.trim()}
                            >
                                Join Room
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Room;