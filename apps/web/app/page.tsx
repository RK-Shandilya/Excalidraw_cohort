"use client"
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [roomId, setRoomId] = useState("");
  const router = useRouter();

  return (
    <div className="flex w-screen h-screen items-center justify-center">
      <input value={roomId} onChange={(e)=> {
        setRoomId(e.target.value)
      }} type="text" placeholder="Room id" />
      <button onClick={() => {
        router.push(`/room/${roomId}`)
      }}>Join Room</button>
    </div>
  );
}

