import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search as SearchIcon } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { ToolCard } from '@/components/tools/ToolCard';
import { Skeleton } from '@/components/ui/skeleton';
import { ToolFilter, ActiveFilters, filterTools } from '@/components/tools/ToolFilter';
import { supabase } from '@/integrations/supabase/client';
import { AiTool } from '@/types/database';
import { useLanguage } from '@/contexts/LanguageContext';

// Sanitize search query to prevent SQL injection
const sanitizeSearchQuery = (query: string): string => {
  return query
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_')
    .replace(/\\/g, '\\\\');
};

const Search = () => {
  const { t } = useLanguage();

  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({
    access: null,
    pricing: null,
    features: null,
  });

  const { data: tools, isLoading } = useQuery({
    queryKey: ['search', query],
    queryFn: async () => {
      if (!query.trim()) return [];

      const sanitizedQuery = sanitizeSearchQuery(query.trim());
      const { data, error } = await supabase
        .from('ai_tools')
        .select('*')
        .or(`name.ilike.%${sanitizedQuery}%,name_en.ilike.%${sanitizedQuery}%,name_ja.ilike.%${sanitizedQuery}%,name_ko.ilike.%${sanitizedQuery}%,description.ilike.%${sanitizedQuery}%,description_en.ilike.%${sanitizedQuery}%,description_ja.ilike.%${sanitizedQuery}%,description_ko.ilike.%${sanitizedQuery}%`)
        .order('view_count', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as AiTool[];
    },
    enabled: !!query.trim(),
  });

  const handleFilterChange = (groupKey: string, optionKey: string | null) => {
    setActiveFilters(prev => ({ ...prev, [groupKey]: optionKey }));
  };

  const filteredTools = filterTools(tools, activeFilters);

  return (
    <Layout>
      <div className="container py-8">
        <div className="flex items-center gap-2 mb-6">
          <SearchIcon className="h-6 w-6" />
          <h1 className="text-2xl font-bold">
            {t('result.title')}<span className="text-primary">{query}</span>
          </h1>
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

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : filteredTools.length > 0 ? (
          <>
            <p className="text-muted-foreground mb-6">
              {t('result.count', { count: filteredTools.length })}
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredTools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <SearchIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">{t('result.notFound')}</h2>
            <p className="text-muted-foreground">
              {t('result.notFoundDesc')}
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Search;
