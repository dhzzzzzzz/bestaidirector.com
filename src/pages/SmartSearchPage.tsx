import { Layout } from '@/components/layout/Layout';
import { SmartSearch } from '@/components/search/SmartSearch';
import { Sparkles, Bot, Zap, Brain } from 'lucide-react';
import { useToolsCount, formatToolsCount } from '@/hooks/useToolsCount';
import { useLanguage } from '@/contexts/LanguageContext';

const SmartSearchPage = () => {
  const { t } = useLanguage();
  const { data: toolsCount } = useToolsCount();
  const formattedCount = formatToolsCount(toolsCount);
  return (
    <Layout>
      <div className="relative min-h-[calc(100vh-200px)] overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute top-40 right-20 w-96 h-96 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl" />
        </div>

        <div className="container relative z-10 py-12">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20 mb-6">
              <Sparkles className="h-4 w-4 text-primary animate-pulse" />
              <span className="text-sm font-medium bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                {t('smart.badge')}
              </span>
              <Brain className="h-4 w-4 text-purple-500" />
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
              {t('smart.title1')}
              <span className="bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
                {t('smart.title2')}
              </span>
            </h1>

            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {t('smart.desc', { count: formattedCount })}
            </p>

            {/* Features */}
            <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 text-sm">
                <Bot className="h-4 w-4 text-primary" />
                <span>{t('smart.f1')}</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 text-sm">
                <Zap className="h-4 w-4 text-amber-500" />
                <span>{t('smart.f2')}</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 text-sm">
                <Sparkles className="h-4 w-4 text-purple-500" />
                <span>{t('smart.f3')}</span>
              </div>
            </div>
          </div>

          {/* Smart Search Component */}
          <div className="max-w-4xl mx-auto">
            <SmartSearch />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SmartSearchPage;