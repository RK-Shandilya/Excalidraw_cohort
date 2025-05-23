"use client";
import axios from 'axios';
import React from 'react';
import { HTTP_BACKEND } from '@/config';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-hot-toast';
import {signInSchema, SignInFormValues} from "@repo/common/types";

const SignIn = () => {
  const router = useRouter();
  const { signIn } = useAuth();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema)
  });

  const onSubmit: SubmitHandler<SignInFormValues> = async (data) => {
    setIsSubmitting(true);
    try {
      const response = await axios.post(`${HTTP_BACKEND}/signin`, {
        email: data.email.trim(),
        password: data.password
      });
      
      if (response.data.token) {
        toast.success('Signed in successfully!');
        signIn(response.data.token);
        reset();
        router.push('/canvas');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Invalid email or password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[url('/bg.webp')] flex justify-center flex-col gap-2 bg-cover bg-center bg-no-repeat bg-fixed overflow-y-hidden">
        <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-extrabold">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 via-cyan-800 to-cyan-950">
                    DrawFlow
                </span>
            </h1>
            <h2 className="text-cyan-900 text-md text-center">Sign in to your account</h2>
        </div>
        <div className="flex justify-center p-4">
          <div className="w-full max-w-md">
            <div className="bg-cyan-50 p-8 rounded-2xl shadow-2xl border border-cyan-400">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                          Email Address
                      </label>
                      <input
                          {...register('email')}
                          type="email"
                          id="email"
                          placeholder="your@email.com"
                          className={`w-full px-4 py-3 rounded-lg border ${errors.email ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-cyan-500'} focus:outline-none focus:ring-2`}
                      />
                      {errors.email && (
                          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                          Password
                      </label>
                      <input
                          {...register('password')}
                          type="password"
                          id="password"
                          placeholder="••••••••"
                          className={`w-full px-4 py-3 rounded-lg border ${errors.password ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-cyan-500'} focus:outline-none focus:ring-2`}
                      />
                      {errors.password && (
                          <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`w-full py-3 px-4 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-lg transition duration-200 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                      {isSubmitting ? (
                          <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Signing in...
                          </span>
                      ) : 'Sign In'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                      Don&apos;t have an account?{' '}
                      <button
                        onClick={() => router.push('/signup')}
                        className="text-cyan-600 hover:text-cyan-700 font-medium"
                      >
                        Sign up
                      </button>
                    </p>
                </div>
            </div>
          </div>
        </div>
    </div>
  );
};

export default SignIn;