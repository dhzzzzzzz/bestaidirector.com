import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Flame, TrendingUp, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ToolCard } from '@/components/tools/ToolCard';
import { Skeleton } from '@/components/ui/skeleton';
import { ToolFilter, ActiveFilters, filterGroups } from '@/components/tools/ToolFilter';
import { AiTool } from '@/types/database';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

const ITEMS_PER_PAGE = 12;

// Build Supabase filter query based on active filters
const buildFilterQuery = (activeFilters: ActiveFilters) => {
  const conditions: string[] = [];

  for (const [groupKey, optionKey] of Object.entries(activeFilters)) {
    if (!optionKey) continue;
    const group = filterGroups[groupKey];
    const option = group?.options.find(o => o.key === optionKey);
    if (!option) continue;

    if (optionKey === 'no-vpn') {
      // Exclude tools with VPN-related tags
      conditions.push('no-vpn');
    } else if (option.tags.length > 0) {
      conditions.push(option.tags.join(','));
    }
  }
  return conditions;
};

export const HotTools = () => {
  const { t } = useLanguage();

  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({
    access: null,
    pricing: null,
    features: null,
  });
  const [currentPage, setCurrentPage] = useState(1);

  // Serialize filters for query key
  const filterKey = useMemo(() => JSON.stringify(activeFilters), [activeFilters]);

  // Server-side filtered + paginated query
  const { data, isLoading } = useQuery({
    queryKey: ['hot-tools', filterKey, currentPage],
    queryFn: async () => {
      const selectFields =
        'id,name,description,description_en,description_ja,description_ko,website_url,logo_url,category_id,is_featured,is_hot,view_count,rating_avg,rating_count,tags,created_at,updated_at';

      // First get total count with filters
      let countQuery = supabase
        .from('ai_tools')
        .select('id', { count: 'exact', head: true });

      let dataQuery = supabase
        .from('ai_tools')
        .select(selectFields)
        .order('view_count', { ascending: false });

      // Apply tag-based filters using Supabase's array overlap
      const hasNoVpn = activeFilters.access === 'no-vpn';
      const hasVpnRequired = activeFilters.access === 'vpn-required';

      // For tag-based filters, we filter on the client after fetching a reasonable set
      // But we can use textSearch or contains for specific tags
      for (const [groupKey, optionKey] of Object.entries(activeFilters)) {
        if (!optionKey || groupKey === 'access') continue;
        const group = filterGroups[groupKey];
        const option = group?.options.find(o => o.key === optionKey);
        if (!option || option.tags.length === 0) continue;

        // Use overlaps for array column matching
        dataQuery = dataQuery.overlaps('tags', option.tags);
        countQuery = countQuery.overlaps('tags', option.tags);
      }

      if (hasVpnRequired) {
        dataQuery = dataQuery.overlaps('tags', ['需要梯子']);
        countQuery = countQuery.overlaps('tags', ['需要梯子']);
      }

      // For no-vpn, we need to fetch more and filter client-side since Supabase doesn't support "not contains" directly
      // We'll fetch a larger batch and filter
      if (hasNoVpn) {
        const offset = 0;
        const limit = 500; // Fetch enough to fill pages
        const { data: allData, error, count } = await dataQuery.range(offset, offset + limit - 1);
        if (error) throw error;

        const filtered = (allData || []).filter((tool: any) => {
          const tags = (tool.tags || []).map((t: string) => t.toLowerCase());
          return !tags.some((t: string) => t.includes('需要梯子') || t.includes('vpn') || t.includes('梯子'));
        }) as AiTool[];

        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return {
          tools: filtered.slice(start, start + ITEMS_PER_PAGE),
          totalCount: filtered.length,
        };
      }

      // Get count
      const { count } = await countQuery;

      // Get paginated data
      const offset = (currentPage - 1) * ITEMS_PER_PAGE;
      const { data: tools, error } = await dataQuery.range(offset, offset + ITEMS_PER_PAGE - 1);
      if (error) throw error;

      return {
        tools: (tools || []) as AiTool[],
        totalCount: count || 0,
      };
    },
    staleTime: 1000 * 60 * 2,
  });

  // Separate query for filter counts (lightweight, only counts)
  const { data: filterCountTools } = useQuery({
    queryKey: ['filter-count-tools'],
    queryFn: async () => {
      // Only fetch tags column for counting - much lighter
      const { data, error } = await supabase
        .from('ai_tools')
        .select('tags')
        .limit(4000);
      if (error) throw error;
      return data as { tags: string[] | null }[];
    },
    staleTime: 1000 * 60 * 10,
  });

  const handleFilterChange = useCallback((groupKey: string, optionKey: string | null) => {
    setActiveFilters(prev => ({ ...prev, [groupKey]: optionKey }));
    setCurrentPage(1);
  }, []);

  const visibleTools = data?.tools || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    document.getElementById('hot-tools-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('ellipsis');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('ellipsis');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <section id="hot-tools-section" className="relative py-16">
      <div className="relative">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-border bg-muted/40 mb-4">
            <Flame className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">{t('hot.badge')}</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight mb-2 text-foreground">
            {t('hot.title')}
          </h2>
          <p className="text-muted-foreground max-w-lg">
            {t('hot.desc')}
          </p>
        </div>

        {/* Filter Section */}
        <div className="max-w-4xl mx-auto mb-8">
          <ToolFilter
            activeFilters={activeFilters}
            onFilterChange={handleFilterChange}
            filteredCount={totalCount}
            totalCount={filterCountTools?.length}
            tools={filterCountTools as any}
          />
        </div>

        {/* Tools Grid */}
        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
              <div
                key={i}
                className={cn("animate-pulse", i < 4 ? "animate-fade-in" : "")}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <Skeleton className="h-36 rounded-xl" />
              </div>
            ))}
          </div>
        ) : visibleTools.length > 0 ? (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visibleTools.map((tool, index) => (
                <div
                  key={tool.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <ToolCard tool={tool} />
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="h-9 px-3"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1">{t('hot.prev')}</span>
                </Button>

                <div className="flex items-center gap-1">
                  {getPageNumbers().map((page, idx) =>
                    page === 'ellipsis' ? (
                      <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground">...</span>
                    ) : (
                      <Button
                        key={page}
                        variant={currentPage === page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => goToPage(page)}
                        className={cn(
                          "h-9 w-9 p-0",
                          currentPage === page && "bg-primary text-primary-foreground"
                        )}
                      >
                        {page}
                      </Button>
                    )
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="h-9 px-3"
                >
                  <span className="hidden sm:inline mr-1">{t('hot.next')}</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>

                <span className="text-sm text-muted-foreground ml-2 hidden sm:inline">
                  {t('hot.total', { count: totalCount })}
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <Sparkles className="h-10 w-10 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              {t('hot.empty')}
            </p>
          </div>
        )}
      </div>
    </section>
  );
};
