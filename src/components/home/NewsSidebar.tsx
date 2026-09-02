import { useQuery } from '@tanstack/react-query';
import { Newspaper, ExternalLink, Flame, Clock, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useLanguage } from '@/contexts/LanguageContext';

interface AiNews {
  id: string;
  title: string;
  summary: string | null;
  source: string | null;
  source_url: string | null;
  image_url: string | null;
  published_at: string;
  is_hot: boolean;
  created_at: string;
}

export const NewsSidebar = () => {
  const { t } = useLanguage();

  const { data: news, isLoading } = useQuery({
    queryKey: ['ai-news'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_news')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(15);

      if (error) throw error;
      return data as AiNews[];
    },
    refetchInterval: 5 * 60 * 1000, // 每5分钟刷新一次
  });

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { 
        addSuffix: true, 
        locale: zhCN 
      });
    } catch {
      return '刚刚';
    }
  };

  if (isLoading) {
    return (
      <div className="sticky top-20 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-5 w-24" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-2 py-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (!news || news.length === 0) {
    return (
      <div className="sticky top-20">
        <div className="flex items-center gap-2 mb-4">
          <Newspaper className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">{t('news.title')}</h3>
        </div>
        <p className="text-sm text-muted-foreground text-center py-8">
          {t('news.empty')}
        </p>
      </div>
    );
  }

  return (
    <div className="sticky top-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          <Newspaper className="h-5 w-5 text-primary" />
          <h3 className="font-bold text-lg">{t('news.title')}</h3>
        </div>
        <Badge variant="secondary" className="text-xs">
          <Clock className="h-3 w-3 mr-1" />
          {t('news.live')}
        </Badge>
      </div>

      {/* News List */}
      <ScrollArea className="h-[calc(100vh-200px)] pr-3">
        <ul className="divide-y divide-border/40">
          {news.map((item) => (
            <li key={item.id}>
              <a
                href={item.source_url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "group block py-3 transition-colors",
                  item.is_hot && "pl-3 -ml-3 border-l-2 border-destructive/60"
                )}
              >
                {/* Title */}
                <div className="flex items-start gap-2 mb-1.5">
                  {item.is_hot && (
                    <Flame className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                  )}
                  <h4 className={cn(
                    "text-sm font-medium leading-snug line-clamp-2 group-hover:text-primary transition-colors",
                    item.is_hot && "text-destructive"
                  )}>
                    {item.title}
                  </h4>
                </div>

                {/* Summary */}
                {item.summary && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-1.5">
                    {item.summary}
                  </p>
                )}

                {/* Meta */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    {item.source && (
                      <span className="text-primary/70">{item.source}</span>
                    )}
                    <span>{formatTime(item.published_at)}</span>
                  </div>
                  <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </a>
            </li>
          ))}
        </ul>
      </ScrollArea>

      {/* View More Link */}
      <div className="mt-4 pt-3 border-t border-border/40">
        <button className="w-full flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors py-2">
          {t('news.more')}
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
