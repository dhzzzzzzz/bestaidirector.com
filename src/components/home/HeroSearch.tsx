import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Sparkles, Zap, Bot, Brain, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToolsCount, formatToolsCount } from '@/hooks/useToolsCount';
import { useLanguage } from '@/contexts/LanguageContext';

export const HeroSearch = () => {
  const { t, language } = useLanguage();
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const navigate = useNavigate();
  const { data: toolsCount } = useToolsCount();
  const formattedCount = formatToolsCount(toolsCount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const popularSearches = [
    { name: 'ChatGPT', icon: '💬' },
    { name: language === 'zh' ? '文心一言' : 'ERNIE Bot', icon: '🤖' },
    { name: 'Midjourney', icon: '🎨' },
    { name: 'Claude', icon: '🧠' },
    { name: 'Stable Diffusion', icon: '🖼️' },
  ];

  return (
    <div className="relative bg-background py-20 md:py-28 border-b border-border/60">
      <div className="container relative">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-muted/40 mb-6 animate-fade-in">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">{t('hero.badge', { count: formattedCount })}</span>
          </div>

          {/* Main heading — solid color, no gradient */}
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl mb-6 text-foreground animate-fade-in" style={{ animationDelay: '100ms' }}>
            {t('hero.h1')}
          </h1>

          <p className="mt-4 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '200ms' }}>
            {t('hero.desc')}
          </p>

          {/* Search Form */}
          <form onSubmit={handleSubmit} className="mt-10 animate-fade-in" style={{ animationDelay: '300ms' }}>
            <div className={cn(
              "relative flex gap-2 mx-auto max-w-2xl p-1.5 rounded-xl transition-colors",
              "bg-card border",
              isFocused ? "border-primary" : "border-border"
            )}>
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder={t('hero.placeholder')}
                  className="h-12 pl-12 pr-4 text-base border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                />
              </div>
              <Button type="submit" size="lg" className="h-12 px-6 rounded-lg">
                <Search className="h-4 w-4 mr-2" />
                {t('hero.searchButton')}
              </Button>
            </div>
          </form>

          {/* Smart Search CTA */}
          <div className="mt-5 animate-fade-in" style={{ animationDelay: '350ms' }}>
            <Link to="/smart-search">
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-primary group">
                <Brain className="h-4 w-4" />
                <span>{t('hero.smartCta')}</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>

          {/* Popular Searches */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2 animate-fade-in" style={{ animationDelay: '400ms' }}>
            <span className="text-sm text-muted-foreground flex items-center gap-1.5 mr-1">
              <Bot className="h-4 w-4" />
              {t('hero.popular')}
            </span>
            {popularSearches.map((item) => (
              <Button
                key={item.name}
                variant="outline"
                size="sm"
                onClick={() => navigate(`/search?q=${encodeURIComponent(item.name)}`)}
                className="rounded-full px-3 h-8 text-xs font-normal text-muted-foreground hover:text-foreground"
              >
                <span className="mr-1">{item.icon}</span>
                {item.name}
              </Button>
            ))}
          </div>

          {/* Stats */}
          <div className="mt-14 grid grid-cols-3 gap-8 max-w-lg mx-auto animate-fade-in" style={{ animationDelay: '600ms' }}>
            {[
              { label: t('hero.stats.tools'), value: formattedCount },
              { label: t('hero.stats.categories'), value: '13+' },
              { label: t('hero.stats.daily'), value: '20+' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-foreground tabular-nums">
                  {stat.value}
                </div>
                <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
