"use client";

import { useRouter } from "next/navigation";
import axios from "axios";
import React from "react";
import { HTTP_BACKEND } from "@/config";
import { useAuth } from "@/app/context/AuthContext";

export function AuthPage() {
    const router = useRouter();
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [name, setName] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');
    const { isSignin, signIn, signUp } = useAuth();
    

    const handlerfunction = async () => {
        console.log("handlerfunction");
        if(isSignin) {
            const res = await axios.post(`${HTTP_BACKEND}/signin`, {
                username: email,
                password
            })
            console.log("res",res.data);
            signIn(res.data.token);
            router.push("/");
        } else {
            const res = await axios.post(`${HTTP_BACKEND}/signup`, {
                username: email,
                name,
                password,
                confirmPassword
            })
            console.log("res",res.data);
            signUp();
            router.push("/signin");
        }
    }

    return (
        <div className="w-screen h-screen flex justify-center items-center bg-gradient-to-b from-cyan-50 to-white">
            <div className="w-80 flex flex-col gap-3 p-6 m-2 bg-cyan-50 rounded shadow-lg">
                <h1 className="mx-auto font-semibold text-2xl text-cyan-500 mb-4">{isSignin ? "Login" : "Sign Up"}</h1>
                <div>
                    <input className="w-full border p-2 rounded-md" type="text" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div>
                    <input className="w-full border p-2 rounded-md" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                    {
                        isSignin ? "" :
                        <div className="flex flex-col gap-2">
                            <input className="w-full border p-2 rounded-md" type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                            <input type="text" name="" id="" placeholder="Name" value={name} onChange={(e)=> setName(e.target.value)} className="w-full border p-2 rounded-md" />
                        </div>
                    }
                <div className="pt-2">
                    <button className="bg-cyan-600 p-2 rounded-md w-full text-white" onClick={handlerfunction}>{isSignin ? "Sign in" : "Sign up"}</button>
                </div>
            </div>
        </div>
    )
}
