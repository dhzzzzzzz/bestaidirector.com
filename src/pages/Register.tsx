import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextParam = searchParams.get('next');
  const redirectTo = nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/';
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: t('auth.pwdMismatch'),
        description: t('auth.pwdMismatchDesc'),
      });
      return;
    }

    if (password.length < 6) {
      toast({
        variant: 'destructive',
        title: t('auth.pwdShort'),
        description: t('auth.pwdShortDesc'),
      });
      return;
    }

    setLoading(true);

    const { error } = await signUp(email, password, redirectTo);

    if (error) {
      toast({
        variant: 'destructive',
        title: t('auth.registerFailed'),
        description: error.message,
      });
    } else {
      toast({
        title: t('auth.registerSuccess'),
        description: t('auth.welcome'),
      });
      navigate(redirectTo);
    }

    setLoading(false);
  };

  return (
    <Layout>
      <div className="container flex items-center justify-center py-16">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t('auth.registerTitle')}</CardTitle>
            <CardDescription>{t('auth.registerDesc')}</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t('auth.password')}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t('auth.confirmPassword')}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('auth.registerBtn')}
              </Button>
              <p className="text-sm text-muted-foreground">
                {t('auth.haveAccount')}{' '}
                <Link to="/login" className="text-primary hover:underline">
                  {t('auth.goLogin')}
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </Layout>
  );
};

export default Register;
