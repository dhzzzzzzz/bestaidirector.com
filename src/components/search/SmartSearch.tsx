import { useState } from 'react';
import { Sparkles, Send, Loader2, Bot, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ToolCard } from '@/components/tools/ToolCard';
import { supabase } from '@/integrations/supabase/client';
import { AiTool } from '@/types/database';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useToolsCount, formatToolsCount } from '@/hooks/useToolsCount';
import { useLanguage } from '@/contexts/LanguageContext';

interface RecommendedTool extends AiTool {
  recommendation_reason?: string;
  category_name?: string;
}

interface SmartSearchResult {
  recommendations: RecommendedTool[];
  summary: string;
  query: string;
  error?: string;
}

export const SmartSearch = () => {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SmartSearchResult | null>(null);
  const { data: toolsCount } = useToolsCount();
  const formattedCount = formatToolsCount(toolsCount);

  const exampleQueries = [t('smart.ex1'), t('smart.ex2'), t('smart.ex3'), t('smart.ex4')];

  const handleSearch = async () => {
    if (!query.trim()) {
      toast.error(t('smart.emptyInput'));
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('ai-recommend', {
        body: { query: query.trim() },
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setResult(data);
    } catch (error) {
      console.error('Smart search error:', error);
      toast.error(t('smart.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleExampleClick = (example: string) => {
    setQuery(example);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <div className="w-full">
      {/* Input Section */}
      <div className="relative">
        <div className="flex items-start gap-3 p-4 rounded-2xl border bg-card/50 backdrop-blur-sm shadow-lg">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <Bot className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <Textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('smart.placeholder')}
              className="min-h-[80px] resize-none border-0 p-0 focus-visible:ring-0 bg-transparent text-base"
              disabled={isLoading}
            />
            <div className="flex items-center justify-between mt-3">
              <p className="text-xs text-muted-foreground">
                {t('smart.hint')}
              </p>
              <Button
                onClick={handleSearch}
                disabled={isLoading || !query.trim()}
                className="gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('smart.analyzing')}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    {t('smart.submit')}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Example Queries */}
        {!result && !isLoading && (
          <div className="mt-4">
            <p className="text-sm text-muted-foreground mb-2">💡 {t('smart.examples')}</p>
            <div className="flex flex-wrap gap-2">
              {exampleQueries.map((example, index) => (
                <button
                  key={index}
                  onClick={() => handleExampleClick(example)}
                  className={cn(
                    "px-3 py-1.5 text-sm rounded-full border transition-all",
                    "hover:bg-primary/10 hover:border-primary/30 hover:text-primary",
                    "bg-muted/50"
                  )}
                >
                  {example.length > 25 ? example.slice(0, 25) + '...' : example}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="mt-8 flex flex-col items-center justify-center py-12">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary animate-ping" />
          </div>
          <p className="mt-4 text-muted-foreground">{t('smart.loading')}</p>
          <p className="text-sm text-muted-foreground/60">{t('smart.loadingDesc', { count: formattedCount })}</p>
        </div>
      )}

      {/* Results Section */}
      {result && result.recommendations.length > 0 && (
        <div className="mt-8 animate-fade-in">
          {/* Summary */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 mb-6">
            <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">
                {t('smart.found', { count: result.recommendations.length })}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {result.summary}
              </p>
            </div>
          </div>

          {/* Recommendations Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {result.recommendations.map((tool, index) => (
              <div
                key={tool.id}
                className="relative animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Recommendation Badge */}
                <div className="absolute -top-2 -left-2 z-10 flex items-center gap-1 px-2 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium shadow-lg">
                  <Sparkles className="h-3 w-3" />
                  {t('smart.rec', { index: index + 1 })}
                </div>
                
                <div className="pt-2">
                  <ToolCard tool={tool} />
                </div>

                {/* Recommendation Reason */}
                {tool.recommendation_reason && (
                  <div className="mt-2 px-3 py-2 rounded-lg bg-muted/50 border border-muted">
                    <p className="text-xs text-muted-foreground flex items-start gap-1">
                      <ArrowRight className="h-3 w-3 mt-0.5 flex-shrink-0 text-primary" />
                      {tool.recommendation_reason}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Search Again Button */}
          <div className="mt-8 text-center">
            <Button
              variant="outline"
              onClick={() => {
                setResult(null);
                setQuery('');
              }}
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              {t('smart.retry')}
            </Button>
          </div>
        </div>
      )}

      {/* No Results */}
      {result && result.recommendations.length === 0 && (
        <div className="mt-8 text-center py-12">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Bot className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">
            {result.error || t('smart.noResult')}
          </p>
          <Button
            variant="outline"
            onClick={() => setResult(null)}
            className="mt-4"
          >
            {t('smart.searchAgain')}
          </Button>
        </div>
      )}
    </div>
  );
};