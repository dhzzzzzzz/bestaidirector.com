import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

type TagRow = { tag: string; en: string | null; ja: string | null; ko: string | null };

/**
 * Returns a translator for Chinese tags stored in the database.
 * Falls back to the original tag when no translation exists.
 */
export const useTagTranslations = () => {
  const { language } = useLanguage();

  const { data } = useQuery({
    queryKey: ['tag-translations'],
    enabled: language !== 'zh',
    staleTime: 1000 * 60 * 60,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tag_translations')
        .select('tag, en, ja, ko');
      if (error) throw error;
      const map: Record<string, TagRow> = {};
      (data as TagRow[] | null)?.forEach((row) => {
        map[row.tag] = row;
      });
      return map;
    },
  });

  const translateTag = (tag: string): string => {
    if (language === 'zh') return tag;
    const row = data?.[tag];
    return (row && (row as any)[language]) || tag;
  };

  return { translateTag };
};
