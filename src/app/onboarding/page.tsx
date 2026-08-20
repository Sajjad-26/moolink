'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast, Toaster } from '@/components/ui/toast';
import { updateProfile } from '@/app/dashboard/actions';
import { Loader2, Sparkles, User, FileText, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    display_name: '',
    bio: '',
    avatar_url: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.display_name || !formData.bio) {
      toast.add({ title: 'Missing fields', description: 'Please fill in all required fields.', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      data.append('username', formData.username);
      data.append('display_name', formData.display_name);
      data.append('bio', formData.bio);
      if (formData.avatar_url) data.append('avatar_url', formData.avatar_url);

      const result = await updateProfile(data);
      if (result.error) {
        toast.add({ title: 'Error', description: result.error, type: 'error' });
      } else {
        toast.add({ title: 'Profile completed!', type: 'success' });
        router.push('/dashboard');
      }
    } catch (err: any) {
      toast.add({ title: 'Error', description: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen cow-patch-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-amber-900/10">
        <div className="p-8 space-y-8">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-amber-100 text-amber-700 mb-2">
              <Sparkles className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Welcome to MooLink</h1>
            <p className="text-muted-foreground text-sm">Let's set up your profile to get started.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center gap-1.5">
                <User className="w-4 h-4 text-amber-600" /> Username <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">moolink.xyz/</span>
                <Input
                  required
                  placeholder="yourname"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="pl-[100px] font-bold"
                  maxLength={20}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center gap-1.5">
                <User className="w-4 h-4 text-amber-600" /> Display Name <span className="text-red-500">*</span>
              </label>
              <Input
                required
                placeholder="e.g. John Doe"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-amber-600" /> Bio <span className="text-red-500">*</span>
              </label>
              <Textarea
                required
                placeholder="Tell your audience a bit about yourself..."
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="resize-none h-20"
                maxLength={150}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-amber-600" /> Profile Picture URL (Optional)
              </label>
              <Input
                placeholder="https://example.com/avatar.jpg"
                type="url"
                value={formData.avatar_url}
                onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
              />
            </div>

            <Button type="submit" className="w-full h-12 text-base font-bold bg-amber-700 hover:bg-amber-800" disabled={loading}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Continue'}
            </Button>
          </form>
        </div>
      </div>
      <Toaster />
    </div>
  );
}
