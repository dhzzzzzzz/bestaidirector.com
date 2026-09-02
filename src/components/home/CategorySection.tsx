import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ChevronRight, Layers, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ToolCard } from '@/components/tools/ToolCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Category, AiTool } from '@/types/database';
import { useLanguage, useCategoryName } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

// 分类图标映射
const categoryIcons: Record<string, string> = {
  'ai-chat': '💬',
  'ai-image': '🎨',
  'ai-video': '🎬',
  'ai-audio': '🎵',
  'ai-writing': '✍️',
  'ai-code': '💻',
  'ai-education': '📚',
  'ai-music': '🎼',
  'ai-health': '🏥',
  'ai-life': '🏠',
  'ai-finance': '💰',
  'ai-business': '📊',
  'ai-architecture': '🏗️',
  'ai-design': '🎯',
  'ai-agent': '🤖',
  'ai-other': '🔧',
};

// Unified neutral styling — single accent across all categories
const neutralCategoryStyle = {
  bg: 'bg-muted/50',
  border: 'border-border',
  text: 'text-foreground',
};

interface CategoryWithTools extends Category {
  tools: AiTool[];
}

export const CategorySection = () => {
  const { t } = useLanguage();
  const categoryName = useCategoryName();

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories-with-tools'],
    queryFn: async () => {
      const { data: categoriesData, error: catError } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (catError) throw catError;

      const categoriesWithTools: CategoryWithTools[] = await Promise.all(
        (categoriesData as Category[]).map(async (category) => {
          const { data: tools } = await supabase
            .from('ai_tools')
            .select('*')
            .eq('category_id', category.id)
            .order('is_featured', { ascending: false })
            .order('view_count', { ascending: false })
            .limit(12);

          return {
            ...category,
            tools: (tools as AiTool[]) || [],
          };
        })
      );

      return categoriesWithTools;
    },
  });

  if (isLoading) {
    return (
      <section className="py-16">
        <div className="container space-y-16">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center gap-3 mb-6">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <div>
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, j) => (
                  <Skeleton key={j} className="h-36 rounded-xl" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <section className="py-16">
        <div className="container flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <Layers className="h-10 w-10 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">{t('cat.noData')}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 border-t border-border/60">
      <div className="container">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-border bg-muted/40 mb-4">
            <Layers className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">{t('cat.badge')}</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight mb-2 text-foreground">
            {t('cat.title')}
          </h2>
          <p className="text-muted-foreground max-w-lg">
            {t('cat.desc')}
          </p>
        </div>

        {/* Categories */}
        <div className="space-y-16">
          {categories.map((category, categoryIndex) => {
            const colors = neutralCategoryStyle;

            return (
              <div
                key={category.id}
                className="animate-fade-in"
                style={{ animationDelay: `${categoryIndex * 100}ms` }}
              >
                {/* Category Header */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/60">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-xl text-2xl",
                      colors.bg,
                      "border",
                      colors.border
                    )}>
                      {categoryIcons[category.slug] || '📁'}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">
                        {categoryName(category.slug, category.name)}
                      </h3>
                      {category.description && (
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {category.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" asChild className="group text-muted-foreground hover:text-primary">
                    <Link to={`/category/${category.slug}`}>
                      {t('cat.viewMore')}
                      <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </div>

                {/* Tools Grid */}
                {category.tools.length > 0 ? (
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {category.tools.map((tool, toolIndex) => (
                      <div
                        key={tool.id}
                        className="animate-fade-in"
                        style={{ animationDelay: `${(categoryIndex * 100) + (toolIndex * 30)}ms` }}
                      >
                        <ToolCard tool={tool} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 rounded-xl border border-dashed border-border">
                    <span className="text-4xl mb-2">{categoryIcons[category.slug] || '📁'}</span>
                    <p className="text-muted-foreground">{t('cat.emptyTools')}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
