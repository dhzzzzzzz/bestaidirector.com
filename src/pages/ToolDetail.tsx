import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ExternalLink, Star, Heart, ArrowLeft, MessageSquare, Globe, Eye, Calendar } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useTagTranslations } from '@/hooks/useTagTranslations';
import { useTranslatedDescription } from '@/hooks/useTranslatedTool';
import { useLanguage, useCategoryName } from '@/contexts/LanguageContext';
import { AiTool, Comment, Category } from '@/types/database';
import { useState, useRef } from 'react';
import { cn } from '@/lib/utils';

const ToolDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(5);
  const commentBoxRef = useRef<HTMLTextAreaElement>(null);
  const focusCommentBox = () => {
    commentBoxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    commentBoxRef.current?.focus({ preventScroll: true });
  };
  const { getDescription, getDetailedDescription, getName } = useTranslatedDescription();
  const { language, t } = useLanguage();
  const categoryName = useCategoryName();
  const dateLocale = language === 'zh' ? 'zh-CN' : language === 'ja' ? 'ja-JP' : language === 'ko' ? 'ko-KR' : 'en-US';
  const { translateTag } = useTagTranslations();

  const { data: tool, isLoading } = useQuery({
    queryKey: ['tool', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_tools')
        .select('*, categories(*)')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      
      // Increment view count
      if (data) {
        await supabase
          .from('ai_tools')
          .update({ view_count: (data.view_count || 0) + 1 })
          .eq('id', id);
      }

      return {
        ...data,
        category: data?.categories,
      } as AiTool & { category?: Category };
    },
  });

  const { data: comments } = useQuery({
    queryKey: ['tool-comments', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('tool_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const userIds = [...new Set((data || []).map((c: any) => c.user_id))];
      let profileMap: Record<string, { username: string }> = {};
      if (userIds.length) {
        const { data: profs } = await supabase
          .from('public_profiles' as any)
          .select('user_id, username, avatar_url')
          .in('user_id', userIds);
        profileMap = Object.fromEntries(
          ((profs as any[]) || []).map((p) => [p.user_id, p])
        );
      }

      return (data || []).map((c: any) => ({
        ...c,
        profile: profileMap[c.user_id] || { username: 'user' },
      })) as (Comment & { profile: { username: string } })[];
    },
  });


  const { data: isFavorited } = useQuery({
    queryKey: ['favorite', id, user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from('favorites')
        .select('id')
        .eq('tool_id', id)
        .eq('user_id', user.id)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user,
  });

  const toggleFavorite = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error(t('detail.loginFirst'));
      
      if (isFavorited) {
        await supabase
          .from('favorites')
          .delete()
          .eq('tool_id', id)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('favorites')
          .insert({ tool_id: id, user_id: user.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorite', id] });
      toast({
        title: isFavorited ? t('detail.favRemoved') : t('detail.favAdded'),
      });
    },
  });

  const submitComment = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error(t('detail.loginFirst'));
      if (!comment.trim()) throw new Error(t('detail.commentEmpty'));

      await supabase.from('comments').insert({
        tool_id: id,
        user_id: user.id,
        content: comment.trim(),
        rating,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tool-comments', id] });
      queryClient.invalidateQueries({ queryKey: ['tool', id] });
      setComment('');
      toast({ title: t('detail.commentSuccess') });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: t('detail.commentFailed'),
        description: error.message,
      });
    },
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-8">
          <Skeleton className="h-64 mb-8" />
          <Skeleton className="h-32" />
        </div>
      </Layout>
    );
  }

  if (!tool) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">{t('detail.notFound')}</h1>
          <Button asChild>
            <Link to="/">{t('detail.backHome')}</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('detail.backHome')}
          </Link>
        </Button>

        {/* Tool Header */}
        <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-accent/10 rounded-2xl p-8 mb-8 border">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Logo */}
            <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-2xl bg-background border-2 shadow-lg">
              {tool.logo_url ? (
                <img
                  src={tool.logo_url}
                  alt={getName(tool)}
                  className="h-20 w-20 rounded-xl object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <span className={cn(
                "text-5xl font-bold text-primary",
                tool.logo_url && "hidden"
              )}>
                {getName(tool).charAt(0)}
              </span>
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <h1 className="text-3xl font-bold">{getName(tool)}</h1>
                {tool.is_hot && (
                  <Badge variant="destructive" className="text-sm">🔥 {t('detail.hot')}</Badge>
                )}
                {tool.is_featured && (
                  <Badge className="text-sm">⭐ {t('detail.featured')}</Badge>
                )}
              </div>

              <p className="text-muted-foreground mb-4 max-w-2xl text-lg">
                {getDescription(tool)}
              </p>

              {/* Stats */}
              <div className="flex flex-wrap items-center gap-6 mb-5 text-sm">
                {tool.rating_count > 0 ? (
                  <div className="flex items-center gap-1.5">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold text-lg">{Number(tool.rating_avg).toFixed(1)}</span>
                    <span className="text-muted-foreground">
                      ({t('detail.reviews', { count: tool.rating_count })})
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={focusCommentBox}
                    className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Star className="h-5 w-5" />
                    <span>{t('detail.notRated')}</span>
                  </button>
                )}
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Eye className="h-4 w-4" />
                  <span>{t('detail.views', { count: tool.view_count || 0 })}</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{t('detail.added', { date: new Date(tool.created_at).toLocaleDateString(dateLocale) })}</span>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap items-center gap-2 mb-5">
                {tool.category && (
                  <Badge variant="secondary" className="text-sm">{categoryName(tool.category.slug, tool.category.name)}</Badge>
                )}
                {tool.tags?.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-sm">
                    {translateTag(tag)}
                  </Badge>
                ))}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                <Button size="lg" asChild className="gap-2">
                  <a href={tool.website_url} target="_blank" rel="noopener noreferrer">
                    <Globe className="h-5 w-5" />
                    {t('detail.visit')}
                    <ExternalLink className="h-4 w-4 ml-1" />
                  </a>
                </Button>
                <Button
                  size="lg"
                  variant={isFavorited ? 'secondary' : 'outline'}
                  onClick={() => toggleFavorite.mutate()}
                  disabled={!user}
                  className="gap-2"
                >
                  <Heart
                    className={cn('h-5 w-5', isFavorited && 'fill-current text-red-500')}
                  />
                  {isFavorited ? t('detail.favorited') : t('detail.favorite')}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Description */}
        {getDetailedDescription(tool) && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                {t('detail.details')}
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <div className="whitespace-pre-wrap leading-relaxed">
                {(getDetailedDescription(tool) || '').split('\n').map((line: string, index: number) => {
                  if (line.startsWith('## ')) {
                    return <h2 key={index} className="text-xl font-bold mt-6 mb-3 text-foreground">{line.replace('## ', '')}</h2>;
                  }
                  if (line.startsWith('### ')) {
                    return <h3 key={index} className="text-lg font-semibold mt-4 mb-2 text-foreground">{line.replace('### ', '')}</h3>;
                  }
                  if (line.startsWith('- **')) {
                    const match = line.match(/- \*\*(.+?)\*\*: (.+)/);
                    if (match) {
                      return (
                        <div key={index} className="flex items-start gap-2 my-1.5">
                          <span className="text-primary mt-1">•</span>
                          <span><strong className="text-foreground">{match[1]}</strong>: <span className="text-muted-foreground">{match[2]}</span></span>
                        </div>
                      );
                    }
                  }
                  if (line.startsWith('- ')) {
                    return (
                      <div key={index} className="flex items-start gap-2 my-1">
                        <span className="text-primary mt-1">•</span>
                        <span className="text-muted-foreground">{line.replace('- ', '')}</span>
                      </div>
                    );
                  }
                  if (line.trim() === '') return <div key={index} className="h-2" />;
                  return <p key={index} className="text-muted-foreground my-1">{line}</p>;
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Info Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t('detail.quickInfo')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Globe className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-sm text-muted-foreground">{t('detail.website')}</div>
                  <a 
                    href={tool.website_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm font-medium hover:text-primary truncate block max-w-[200px]"
                  >
                    {tool.website_url.replace(/^https?:\/\//, '').split('/')[0]}
                  </a>
                </div>
              </div>
              {tool.category && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="h-5 w-5 flex items-center justify-center text-primary">
                    {tool.category.icon || '📁'}
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">{t('detail.category')}</div>
                    <Link 
                      to={`/category/${tool.category.slug}`}
                      className="text-sm font-medium hover:text-primary"
                    >
                      {categoryName(tool.category.slug, tool.category.name)}
                    </Link>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Eye className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-sm text-muted-foreground">{t('detail.viewCount')}</div>
                  <div className="text-sm font-medium">{t('detail.times', { count: tool.view_count || 0 })}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comments Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {t('detail.comments', { count: comments?.length || 0 })}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Comment Form */}
            {user ? (
              <div className="space-y-4 pb-6 border-b">
                <div>
                  <p className="font-medium">{t('detail.shareExperience')}</p>
                  <p className="text-sm text-muted-foreground">{t('detail.reviewHint')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{t('detail.rating')}</span>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={cn(
                          'h-5 w-5 transition-colors',
                          star <= rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-muted-foreground'
                        )}
                      />
                    </button>
                  ))}
                </div>
                <Textarea
                  ref={commentBoxRef}
                  placeholder={t('detail.commentPlaceholder')}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => submitComment.mutate()}
                    disabled={submitComment.isPending}
                  >
                    {t('detail.submitComment')}
                  </Button>
                  <span className="text-xs text-muted-foreground">{t('detail.reviewEncourage')}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 border-b">
                <p className="text-muted-foreground mb-2">{t('detail.loginToComment')}</p>
                <Button asChild variant="outline">
                  <Link to="/login">{t('detail.goLogin')}</Link>
                </Button>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-4">
              {comments && comments.length > 0 ? (
                comments.map((c) => (
                  <div key={c.id} className="flex gap-4">
                    <Avatar>
                      <AvatarFallback>
                        {c.profile?.username?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">
                          {c.profile?.username || t('detail.anonymous')}
                        </span>
                        {c.rating && (
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={cn(
                                  'h-3 w-3',
                                  star <= c.rating!
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-muted'
                                )}
                              />
                            ))}
                          </div>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {new Date(c.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm">{c.content}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10">
                  <MessageSquare className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="font-medium mb-1">{t('detail.noComments')}</p>
                  <p className="text-sm text-muted-foreground mb-4">{t('detail.beFirstHint')}</p>
                  {user && (
                    <Button variant="outline" onClick={focusCommentBox}>
                      {t('detail.writeFirst')}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ToolDetail;
