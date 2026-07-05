'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Brain, ArrowRight, Mail, Lock, User, Loader2, Check, MailCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth';

const signupSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type SignupForm = z.infer<typeof signupSchema>;

const benefits = ['Unlimited AI-powered memory search', 'Interactive knowledge graph', 'Smart insights', 'Goal tracking'];

export default function SignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const { setUser } = useAuthStore();

  const { register, handleSubmit, formState: { errors } } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupForm) => {
    setIsLoading(true);
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: { data: { full_name: data.fullName } },
      });

      if (error) {
        // Handle specific Supabase errors
        if (error.message.includes('already registered')) {
          throw new Error('An account with this email already exists. Try logging in instead.');
        }
        throw error;
      }

      // If session exists, email confirmation is disabled - log user in directly
      if (authData.session) {
        // Fetch the profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user?.id)
          .single();

        if (profileData) {
          setUser(profileData);
        }
        toast.success('Account created successfully!');
        router.push('/dashboard');
      } else {
        // Email confirmation required - show success message
        setUserEmail(data.email);
        setEmailSent(true);
        toast.success('Check your email to confirm your account');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Signup failed';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary/20 via-background to-blue-500/20 items-center justify-center p-8">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="max-w-md">
          <Link href="/" className="flex items-center gap-2 mb-8">
            <Brain className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold gradient-text">LifeOS</span>
          </Link>
          <h2 className="text-3xl font-bold mb-4">Build Your Perfect Memory</h2>
          <p className="text-muted-foreground mb-8">Start your journey to never forgetting anything again.</p>
          <div className="space-y-4">
            {benefits.map((benefit, i) => (
              <motion.div key={benefit} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center"><Check className="w-4 h-4 text-primary" /></div>
                <span className="text-sm">{benefit}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <Link href="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <Brain className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold gradient-text">LifeOS</span>
          </Link>

          {emailSent ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <MailCheck className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Check your email</h2>
              <p className="text-muted-foreground mb-4">
                We've sent a confirmation link to<br />
                <span className="text-foreground font-medium">{userEmail}</span>
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                Click the link in the email to activate your account.
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => setEmailSent(false)}>
                  Use different email
                </Button>
                <Link href="/login">
                  <Button>Go to Sign In</Button>
                </Link>
              </div>
            </motion.div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Create your account</h1>
                <p className="text-muted-foreground">Start building your permanent memory today</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input {...register('fullName')} type="text" placeholder="John Doe" className="pl-10" />
                  </div>
                  {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input {...register('email')} type="email" placeholder="you@example.com" className="pl-10" />
                  </div>
                  {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input {...register('password')} type="password" placeholder="Create a password" className="pl-10" />
                  </div>
                  {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input {...register('confirmPassword')} type="password" placeholder="Confirm your password" className="pl-10" />
                  </div>
                  {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <ArrowRight className="w-5 h-5 mr-2" />}
                  Create Account
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground mt-6">
                Already have an account? <Link href="/login" className="text-primary hover:underline font-medium">Sign in</Link>
              </p>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
