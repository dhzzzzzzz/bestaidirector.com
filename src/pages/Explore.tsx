import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, SlidersHorizontal, LayoutGrid, List, Loader2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { ToolCard } from '@/components/tools/ToolCard';
import { ToolFilter, ActiveFilters, filterTools, filterGroups } from '@/components/tools/ToolFilter';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage, useCategoryName } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { AiTool, Category } from '@/types/database';
import { cn } from '@/lib/utils';

const ExplorePage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({});
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Fetch all tools
  const { data: tools, isLoading: toolsLoading } = useQuery({
    queryKey: ['all-tools-explore'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_tools')
        .select('*, categories(*)')
        .order('view_count', { ascending: false });

      if (error) throw error;
      return data as (AiTool & { categories: Category | null })[];
    },
  });

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as Category[];
    },
  });

  const handleFilterChange = (groupKey: string, optionKey: string | null) => {
    setActiveFilters(prev => ({ ...prev, [groupKey]: optionKey }));
  };

  // Apply all filters
  const filteredTools = useMemo(() => {
    let result = tools || [];

    // Apply category filter
    if (selectedCategory) {
      result = result.filter(tool => tool.categories?.slug === selectedCategory);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(tool => 
        tool.name.toLowerCase().includes(query) ||
        tool.description?.toLowerCase().includes(query) ||
        tool.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply tag-based filters
    result = filterTools(result, activeFilters);

    return result;
  }, [tools, selectedCategory, searchQuery, activeFilters]);

  // Get tag statistics
  const tagStats = useMemo(() => {
    if (!tools) return {};
    const stats: Record<string, number> = {};
    tools.forEach(tool => {
      tool.tags?.forEach(tag => {
        stats[tag] = (stats[tag] || 0) + 1;
      });
    });
    return stats;
  }, [tools]);

  // Get active filter summary
  const getActiveFilterSummary = () => {
    const summary: string[] = [];
    Object.entries(activeFilters).forEach(([groupKey, optionKey]) => {
      if (optionKey) {
        const group = filterGroups[groupKey];
        const option = group?.options.find(o => o.key === optionKey);
        if (option) {
          summary.push(option.label);
        }
      }
    });
    return summary;
  };

  return (
    <Layout>
      <div className="container py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <SlidersHorizontal className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{t('explore.badge')}</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            {t('explore.title')} <span className="text-primary">{t('explore.titleAccent')}</span>
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            {t('explore.desc', { count: tools?.length || 0 })}
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t('explore.placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 text-base rounded-xl border-2 focus:border-primary"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={() => setSearchQuery('')}
              >
                {t('explore.clear')}
              </Button>
            )}
          </div>
        </div>

        {/* Category Quick Filter */}
        {categories && (
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            <Button
              variant={selectedCategory === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(null)}
              className="rounded-full"
            >
              {t('explore.allCategories')}
            </Button>
            {categories.map(cat => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.slug ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(selectedCategory === cat.slug ? null : cat.slug)}
                className="rounded-full"
              >
                {categoryName(cat.slug, cat.name)}
              </Button>
            ))}
          </div>
        )}

        {/* Advanced Filter */}
        <div className="mb-6">
          <ToolFilter
            activeFilters={activeFilters}
            onFilterChange={handleFilterChange}
            filteredCount={filteredTools.length}
            totalCount={tools?.length}
            showAdvanced={true}
            tools={tools}
          />
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">
              {t('explore.results')}
            </h2>
            <Badge variant="secondary">
              {t('explore.count', { count: filteredTools.length })}
            </Badge>
            {getActiveFilterSummary().length > 0 && (
              <div className="hidden sm:flex items-center gap-1">
                {getActiveFilterSummary().slice(0, 3).map(label => (
                  <Badge key={label} variant="outline" className="text-xs">
                    {label}
                  </Badge>
                ))}
                {getActiveFilterSummary().length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{getActiveFilterSummary().length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Results Grid */}
        {toolsLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-xl" />
            ))}
          </div>
        ) : filteredTools.length > 0 ? (
          <div className={cn(
            "grid gap-4",
            viewMode === 'grid' 
              ? "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
              : "grid-cols-1 max-w-3xl"
          )}>
            {filteredTools.map((tool, index) => (
              <div
                key={tool.id}
                className="animate-fade-in"
                style={{ animationDelay: `${Math.min(index, 20) * 30}ms` }}
              >
                <ToolCard tool={tool} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Search className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{t('explore.noMatch')}</h3>
            <p className="text-muted-foreground mb-4">
              {t('explore.noMatchDesc')}
            </p>
            <Button onClick={() => {
              setSearchQuery('');
              setSelectedCategory(null);
              setActiveFilters({});
            }}>
              {t('explore.clearAll')}
            </Button>
          </div>
        )}

        {/* Popular Tags Section */}
        {!searchQuery && Object.keys(activeFilters).every(k => !activeFilters[k]) && (
          <div className="mt-12 pt-8 border-t">
            <h3 className="text-lg font-semibold mb-4">{t('explore.hotTags')}</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(tagStats)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 30)
                .map(([tag, count]) => (
                  <Button
                    key={tag}
                    variant="outline"
                    size="sm"
                    className="rounded-full text-xs"
                    onClick={() => setSearchQuery(tag)}
                  >
                    {tag}
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {count}
                    </Badge>
                  </Button>
                ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ExplorePage;