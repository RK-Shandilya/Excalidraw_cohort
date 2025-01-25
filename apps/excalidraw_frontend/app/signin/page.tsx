"use client";
import axios from 'axios';
import React from 'react';
import { HTTP_BACKEND } from '@/config';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

const SignIn = () => {
    const router = useRouter();
    const { signIn } = useAuth();
    const [formData, setFormData] = React.useState({
        email: '',
        password: '',
    })

    const handleSubmit = async(e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await axios.post(`${HTTP_BACKEND}/signin`, formData);
            console.log(response.data);
            if(response.data.token) {
                signIn(response.data.token);
                router.push('/canvas');
            }
        } catch (error) {
            console.log(error);
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }
  return (
    <div className='w-screen h-screen bg-gradient-to-b from-cyan-200 to-white flex flex-col items-center space-y-4 justify-center'>  
        <div className=' w-80 bg-cyan-100 p-6 rounded-lg shadow-lg border border-cyan-300'>
            <form onSubmit={handleSubmit} className='w-full text-cyan-800'>
                <div className='flex flex-col space-y-4 justify-center'>
                    <h1 className=' text-xl font-semibold text-cyan-500 mx-auto mb-3'>Welcome to DrawFlow</h1>
                    <div className='flex flex-col space-y-1'>
                        <label htmlFor="email" className='text-sm'>Email Address</label>
                        <input onChange={handleChange} type="email" placeholder='Enter email address' name="email" id="email" className='w-full rounded-sm p-2 border-b border-cyan-300 placeholder:text-sm'/>
                    </div>
                    <div className='flex flex-col space-y-1'>
                        <label htmlFor="password" className='text-sm'>Password</label>
                        <input onChange={handleChange} type="password" placeholder='Create password' name="password" id="password" className='w-full rounded-sm p-2 border-b border-cyan-300 placeholder:text-sm'/>
                    </div>
                    <div>
                        <button type="submit" className='w-full bg-cyan-400 text-cyan-50 p-2 rounded-sm hover:bg-cyan-500'>Sign In</button>
                    </div>
                </div>
            </form>
        </div>
    </div>
  )
}

export default SignIn
