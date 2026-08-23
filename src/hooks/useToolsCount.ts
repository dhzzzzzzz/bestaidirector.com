import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const FALLBACK_COUNT = 4000;

export const useToolsCount = () => {
  return useQuery({
    queryKey: ['tools-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('ai_tools')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      return count || FALLBACK_COUNT;
    },
    placeholderData: FALLBACK_COUNT,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
};

export const formatToolsCount = (count: number | undefined): string => {
  const value = count && count > 0 ? count : FALLBACK_COUNT;
  if (value >= 1000) {
    return `${Math.floor(value / 100) * 100}+`;
  }
  return `${value}+`;
};
