import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { ToolCard } from '@/components/tools/ToolCard';
import { Skeleton } from '@/components/ui/skeleton';
import { ToolFilter, ActiveFilters, filterTools } from '@/components/tools/ToolFilter';
import { useLanguage, useCategoryName, useCategoryDescription } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Category as CategoryType, AiTool } from '@/types/database';

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
  'ai-design': '🎯',
  'ai-architecture': '🏗️',
  'ai-agent': '🤖',
  'ai-other': '🔧',
};

const Category = () => {
  const { t } = useLanguage();
  const categoryName = useCategoryName();
  const categoryDesc = useCategoryDescription();

  const { slug } = useParams<{ slug: string }>();
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({
    access: null,
    pricing: null,
    features: null,
  });

  const { data: category, isLoading: categoryLoading } = useQuery({
    queryKey: ['category', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (error) throw error;
      return data as CategoryType | null;
    },
  });

  const { data: tools, isLoading: toolsLoading } = useQuery({
    queryKey: ['category-tools', category?.id],
    queryFn: async () => {
      if (!category) return [];

      const { data, error } = await supabase
        .from('ai_tools')
        .select('*')
        .eq('category_id', category.id)
        .order('is_featured', { ascending: false })
        .order('view_count', { ascending: false });

      if (error) throw error;
      return data as AiTool[];
    },
    enabled: !!category,
  });

  const handleFilterChange = (groupKey: string, optionKey: string | null) => {
    setActiveFilters(prev => ({ ...prev, [groupKey]: optionKey }));
  };

  const filteredTools = filterTools(tools, activeFilters);
  const isLoading = categoryLoading || toolsLoading;

  return (
    <Layout>
      <div className="container py-8">
        {isLoading ? (
          <>
            <Skeleton className="h-10 w-64 mb-6" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          </>
        ) : category ? (
          <>
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">{categoryIcons[category.slug] || '📁'}</span>
              <div>
                <h1 className="text-2xl font-bold">{categoryName(category.slug, category.name)}</h1>
                {categoryDesc(category.slug, category.description) && (
                  <p className="text-muted-foreground">{categoryDesc(category.slug, category.description)}</p>
                )}
              </div>
            </div>

            {/* Filter Section */}
            <div className="mb-6">
              <ToolFilter
                activeFilters={activeFilters}
                onFilterChange={handleFilterChange}
                filteredCount={filteredTools.length}
                totalCount={tools?.length}
              />
            </div>

            {filteredTools.length > 0 ? (
              <>
                <p className="text-muted-foreground mb-6">
                  {t('cat.count', { count: filteredTools.length })}
                </p>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredTools.map((tool) => (
                    <ToolCard key={tool.id} tool={tool} />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                {t('cat.emptyFilter')}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <h2 className="text-xl font-semibold mb-2">{t('cat.notFound')}</h2>
            <p className="text-muted-foreground">{t('cat.notFoundDesc')}</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Category;
