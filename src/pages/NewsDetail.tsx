import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ExternalLink, Star, Flame, Calendar } from 'lucide-react';
import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const TXT = {
  zh: { back: '返回首页', source: '阅读原文', notFound: '新闻不存在', rate: '你觉得这篇报道怎么样？', ratings: '人评分', none: '还没有人评价，来做第一个吧', placeholder: '说说你对这篇报道的看法…', submit: '发布评价', login: '登录后即可评分和评论', loginBtn: '去登录', ok: '评价已发布', fail: '发布失败', empty: '请填写评论内容', reviews: '读者评价', user: '用户' },
  en: { back: 'Back to home', source: 'Read original', notFound: 'News not found', rate: 'What do you think of this story?', ratings: 'ratings', none: 'No ratings yet — be the first', placeholder: 'Share your thoughts on this story…', submit: 'Post review', login: 'Sign in to rate and comment', loginBtn: 'Sign in', ok: 'Review posted', fail: 'Failed to post', empty: 'Please write a comment', reviews: 'Reader reviews', user: 'user_' },
  ja: { back: 'ホームへ戻る', source: '元記事を読む', notFound: 'ニュースが見つかりません', rate: 'この記事をどう思いますか？', ratings: '件の評価', none: 'まだ評価がありません。最初の評価をどうぞ', placeholder: 'この記事への感想を書いてください…', submit: '評価を投稿', login: 'ログインすると評価・コメントできます', loginBtn: 'ログイン', ok: '投稿しました', fail: '投稿に失敗しました', empty: 'コメントを入力してください', reviews: '読者の評価', user: 'ユーザー' },
  ko: { back: '홈으로', source: '원문 보기', notFound: '뉴스를 찾을 수 없습니다', rate: '이 기사 어떠셨나요?', ratings: '명 평가', none: '아직 평가가 없습니다. 첫 평가를 남겨주세요', placeholder: '이 기사에 대한 의견을 남겨주세요…', submit: '평가 등록', login: '로그인하면 평가와 댓글을 남길 수 있습니다', loginBtn: '로그인', ok: '등록되었습니다', fail: '등록 실패', empty: '댓글을 입력해주세요', reviews: '독자 평가', user: '사용자' },
};

export default function NewsDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { language } = useLanguage();
  const tx = TXT[language as keyof typeof TXT] || TXT.en;
  const { toast } = useToast();
  const qc = useQueryClient();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const dateLocale = language === 'zh' ? 'zh-CN' : language === 'ja' ? 'ja-JP' : language === 'ko' ? 'ko-KR' : 'en-US';

  const { data: news, isLoading } = useQuery({
    queryKey: ['news', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('ai_news').select('*').eq('id', id!).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: comments } = useQuery({
    queryKey: ['news-comments', id],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)('get_news_comments', { _news_id: id });
      if (error) throw error;
      return (data || []) as { id: string; content: string; rating: number; created_at: string; author_name: string | null }[];
    },
  });

  const submit = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error(tx.login);
      if (!comment.trim()) throw new Error(tx.empty);
      const { error } = await supabase.from('news_comments').insert({ news_id: id!, user_id: user.id, content: comment.trim(), rating });
      if (error) throw error;
    },
    onSuccess: () => {
      setComment('');
      qc.invalidateQueries({ queryKey: ['news-comments', id] });
      qc.invalidateQueries({ queryKey: ['news', id] });
      toast({ title: tx.ok });
    },
    onError: (e: Error) => toast({ variant: 'destructive', title: tx.fail, description: e.message }),
  });

  const loc = (f: 'title' | 'summary' | 'source') =>
    language === 'zh' ? (news as any)?.[f] : (news as any)?.[`${f}_${language}`] || (news as any)?.[f];
  const displayName = (n: string | null) => {
    const name = n || 'user_';
    return /^user_/.test(name) ? tx.user + name.replace(/^user_/, '') : name;
  };

  if (isLoading) return <Layout><div className="container py-8"><Skeleton className="h-64" /></div></Layout>;
  if (!news) return (
    <Layout><div className="container py-16 text-center">
      <h1 className="text-2xl font-bold mb-4">{tx.notFound}</h1>
      <Button asChild><Link to="/">{tx.back}</Link></Button>
    </div></Layout>
  );

  const count = news.rating_count || 0;

  return (
    <Layout>
      <article className="container max-w-3xl py-8">
        <Button variant="ghost" asChild className="mb-6 -ml-3">
          <Link to="/"><ArrowLeft className="mr-2 h-4 w-4" />{tx.back}</Link>
        </Button>

        <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
          {news.is_hot && <Flame className="h-4 w-4 text-destructive" />}
          {loc('source') && <span className="text-primary">{loc('source')}</span>}
          <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{new Date(news.published_at).toLocaleDateString(dateLocale)}</span>
        </div>
        <h1 className="text-3xl font-bold leading-tight mb-4">{loc('title')}</h1>

        <div className="flex items-center gap-2 mb-6">
          <Star className={cn('h-5 w-5', count ? 'fill-primary text-primary' : 'text-muted-foreground')} />
          {count ? (
            <span className="font-semibold">{Number(news.rating_avg).toFixed(1)} <span className="text-muted-foreground font-normal text-sm">· {count} {tx.ratings}</span></span>
          ) : <span className="text-sm text-muted-foreground">{tx.none}</span>}
        </div>

        {loc('summary') && <p className="text-lg leading-relaxed text-foreground/90 mb-6">{loc('summary')}</p>}
        {news.source_url && (
          <Button asChild variant="outline">
            <a href={news.source_url} target="_blank" rel="noopener noreferrer">{tx.source}<ExternalLink className="ml-2 h-4 w-4" /></a>
          </Button>
        )}

        <section className="mt-12 pt-8 border-t">
          <h2 className="text-xl font-semibold mb-4">{tx.reviews} <span className="text-muted-foreground font-normal">({comments?.length || 0})</span></h2>

          {user ? (
            <div className="mb-8 space-y-3">
              <p className="text-sm font-medium">{tx.rate}</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} type="button" onClick={() => setRating(s)} aria-label={`${s}`}>
                    <Star className={cn('h-6 w-6 transition-colors', s <= rating ? 'fill-primary text-primary' : 'text-muted-foreground')} />
                  </button>
                ))}
              </div>
              <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder={tx.placeholder} maxLength={2000} rows={3} />
              <Button onClick={() => submit.mutate()} disabled={submit.isPending}>{tx.submit}</Button>
            </div>
          ) : (
            <div className="mb-8 flex items-center justify-between gap-4 py-4 border-y">
              <p className="text-sm text-muted-foreground">{tx.login}</p>
              <Button asChild size="sm"><Link to={`/login?next=${encodeURIComponent(`/news/${id}`)}`}>{tx.loginBtn}</Link></Button>
            </div>
          )}

          <ul className="divide-y">
            {comments?.map((c) => (
              <li key={c.id} className="py-4 flex gap-3">
                <Avatar className="h-8 w-8"><AvatarFallback>{displayName(c.author_name).slice(0, 1).toUpperCase()}</AvatarFallback></Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">{displayName(c.author_name)}</span>
                    <span className="flex">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={cn('h-3 w-3', i < c.rating ? 'fill-primary text-primary' : 'text-muted-foreground/40')} />)}</span>
                    <span className="text-muted-foreground text-xs">{new Date(c.created_at).toLocaleDateString(dateLocale)}</span>
                  </div>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{c.content}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </article>
    </Layout>
  );
}
