import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { Layout } from '@/components/layout/Layout';
import { ToolCard } from '@/components/tools/ToolCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Heart, MessageSquare, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { AiTool, Comment } from '@/types/database';
import { Navigate } from 'react-router-dom';

const Profile = () => {
  const { t } = useLanguage();
  const { user, loading: authLoading } = useAuth();

  const { data: favorites, isLoading: favoritesLoading } = useQuery({
    queryKey: ['user-favorites', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('favorites')
        .select('*, ai_tools(*)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data.map((f: any) => ({
        ...f,
        tool: f.ai_tools,
      })) as { id: string; tool: AiTool }[];
    },
    enabled: !!user,
  });

  const { data: comments, isLoading: commentsLoading } = useQuery({
    queryKey: ['user-comments', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comments')
        .select('*, ai_tools(*)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data.map((c: any) => ({
        ...c,
        tool: c.ai_tools,
      })) as (Comment & { tool: AiTool })[];
    },
    enabled: !!user,
  });

  if (authLoading) {
    return (
      <Layout>
        <div className="container py-8">
          <Skeleton className="h-64" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Layout>
      <div className="container py-8">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="flex items-center gap-6 py-8">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="text-2xl">
                {user.email?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">{user.email}</h1>
              <p className="text-muted-foreground">
                {t('profile.joined', { date: new Date(user.created_at).toLocaleDateString() })}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="favorites">
          <TabsList className="mb-6">
            <TabsTrigger value="favorites" className="gap-2">
              <Heart className="h-4 w-4" />
              {t('profile.favorites', { count: favorites?.length || 0 })}
            </TabsTrigger>
            <TabsTrigger value="comments" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              {t('profile.comments', { count: comments?.length || 0 })}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="favorites">
            {favoritesLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
            ) : favorites && favorites.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {favorites.map((f) => (
                  <ToolCard key={f.id} tool={f.tool} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t('profile.noFavorites')}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="comments">
            {commentsLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
            ) : comments && comments.length > 0 ? (
              <div className="space-y-4">
                {comments.map((c) => (
                  <Card key={c.id}>
                    <CardContent className="py-4">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                          <span className="font-bold text-primary">
                            {c.tool?.name?.charAt(0) || '?'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{c.tool?.name}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {c.content}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(c.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t('profile.noComments')}</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Profile;
