"use client";
import { useRouter } from 'next/navigation';
import React from 'react'

const Room = () => {
    const router = useRouter();
    const [roomId, setRoomId] = React.useState('');
  return (
    <div className='flex justify-center items-center w-screen h-screen bg-gradient-to-b from-cyan-50 to-white'>
      <div className='w-80 flex flex-col gap-2 justify-center items-center shadow-lg rounded-lg p-4 m-4 '>
        <input className=' p-2 rounded-md' type="text" placeholder='roomId'
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
        />
        <button className='bg-cyan-600 text-white px-4 py-1 rounded-lg hover:bg-cyan-700 transition-colors'
        onClick={() => {
            router.push(`/canvas/${roomId}`);
        }}
        >
            Join Room
        </button>
      </div>
    </div>
  )
}

export default Room
