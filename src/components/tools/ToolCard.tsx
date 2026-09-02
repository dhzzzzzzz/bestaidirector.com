import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Star, Heart, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AiTool } from '@/types/database';
import { cn } from '@/lib/utils';
import { useTranslatedDescription } from '@/hooks/useTranslatedTool';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTagTranslations } from '@/hooks/useTagTranslations';

interface ToolCardProps {
  tool: AiTool;
  showFavorite?: boolean;
  isFavorited?: boolean;
  onToggleFavorite?: () => void;
}

export const ToolCard = ({
  tool,
  showFavorite = false,
  isFavorited = false,
  onToggleFavorite,
}: ToolCardProps) => {
  const { t } = useLanguage();
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const { getDescription, getName } = useTranslatedDescription();
  const { translateTag } = useTagTranslations();

  return (
    <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5 border-border/60 bg-card">
      <CardContent className="relative p-5">
        <div className="flex items-start gap-4">
          {/* Logo Container */}
          <Link to={`/tool/${tool.id}`} className="shrink-0">
            <div className={cn(
              "relative flex h-16 w-16 items-center justify-center rounded-2xl transition-transform duration-300",
              "bg-muted/40 group-hover:scale-105"
            )}>
              {tool.logo_url && !imgError ? (
                <>
                  {!imgLoaded && (
                    <div className="absolute inset-3 rounded-xl bg-muted animate-pulse" />
                  )}
                  <img
                    src={tool.logo_url}
                    alt={getName(tool)}
                    loading="lazy"
                    decoding="async"
                    className={cn(
                      "h-10 w-10 rounded-xl object-contain transition-all duration-300",
                      imgLoaded ? "opacity-100" : "opacity-0"
                    )}
                    onLoad={() => setImgLoaded(true)}
                    onError={() => setImgError(true)}
                  />
                </>
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                  <span className="text-lg font-bold text-primary-foreground">
                    {getName(tool).charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </Link>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                to={`/tool/${tool.id}`}
                className="font-semibold text-foreground hover:text-primary transition-colors truncate text-base"
              >
                {getName(tool)}
              </Link>
              {tool.is_hot && (
                <Badge variant="outline" className="shrink-0 text-xs px-1.5 py-0 h-5 font-normal border-primary/40 text-primary bg-primary/5">
                  <Sparkles className="h-3 w-3 mr-0.5" />
                  {t('card.hot')}
                </Badge>
              )}
              {tool.is_featured && (
                <Badge variant="outline" className="shrink-0 text-xs px-1.5 py-0 h-5 font-normal border-border text-muted-foreground">
                  {t('card.featured')}
                </Badge>
              )}
            </div>

            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {getDescription(tool)}
            </p>

            {/* Rating & Tags */}
            <div className="flex items-center gap-2 flex-wrap pt-1">
              {tool.rating_count > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="h-3.5 w-3.5 fill-foreground text-foreground" />
                  <span className="font-medium text-foreground">
                    {Number(tool.rating_avg).toFixed(1)}
                  </span>
                  <span className="text-muted-foreground">
                    ({tool.rating_count})
                  </span>
                </div>
              )}
              {tool.tags?.slice(0, 2).map((tag) => (
                <Badge 
                  key={tag} 
                  variant="secondary" 
                  className="text-xs px-2 py-0.5 bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  {translateTag(tag)}
                </Badge>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 shrink-0">
            <Button 
              size="sm" 
              variant="outline" 
              asChild
              className="h-9 w-9 p-0 rounded-xl border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all"
            >
              <a href={tool.website_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
            {showFavorite && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onToggleFavorite}
                className={cn(
                  "h-9 w-9 p-0 rounded-xl transition-all",
                  isFavorited 
                    ? 'text-red-500 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50' 
                    : 'hover:bg-muted'
                )}
              >
                <Heart className={cn('h-4 w-4 transition-transform', isFavorited && 'fill-current scale-110')} />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
