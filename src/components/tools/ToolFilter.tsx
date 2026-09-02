import { useState, useMemo } from 'react';
import { 
  Filter, Globe, Shield, DollarSign, Gift, Sparkles, Code, Building2,
  MessageSquare, Image, Video, Music, FileText, Mic, Heart, Briefcase,
  GraduationCap, Palette, Wallet, Home, ChevronDown, ChevronUp, X,
  Zap, Users, Bot, Languages, Smartphone, Monitor, Search as SearchIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AiTool } from '@/types/database';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useLanguage } from '@/contexts/LanguageContext';

export type FilterOption = {
  key: string;
  label: string;
  icon: React.ReactNode;
  tags: string[];
  activeClass?: string;
};

export type FilterGroup = {
  label: string;
  icon?: React.ReactNode;
  options: FilterOption[];
  multiSelect?: boolean;
};

export const filterGroups: Record<string, FilterGroup> = {
  access: {
    label: '访问方式',
    icon: <Globe className="h-4 w-4" />,
    options: [
      { 
        key: 'no-vpn', 
        label: '国内直连', 
        icon: <Globe className="h-3.5 w-3.5" />,
        tags: [],
        activeClass: 'bg-green-600 hover:bg-green-700'
      },
      { 
        key: 'vpn-required', 
        label: '需要梯子', 
        icon: <Shield className="h-3.5 w-3.5" />,
        tags: ['需要梯子'],
        activeClass: 'bg-orange-600 hover:bg-orange-700'
      },
    ]
  },
  pricing: {
    label: '价格',
    icon: <DollarSign className="h-4 w-4" />,
    options: [
      { 
        key: 'free', 
        label: '完全免费', 
        icon: <Gift className="h-3.5 w-3.5" />,
        tags: ['免费'],
        activeClass: 'bg-emerald-600 hover:bg-emerald-700'
      },
      { 
        key: 'freemium', 
        label: '免费额度', 
        icon: <Zap className="h-3.5 w-3.5" />,
        tags: ['免费额度'],
        activeClass: 'bg-teal-600 hover:bg-teal-700'
      },
      { 
        key: 'paid', 
        label: '付费', 
        icon: <DollarSign className="h-3.5 w-3.5" />,
        tags: ['付费'],
        activeClass: 'bg-blue-600 hover:bg-blue-700'
      },
    ]
  },
  category: {
    label: '分类',
    icon: <Palette className="h-4 w-4" />,
    options: [
      { key: 'chat', label: '对话', icon: <MessageSquare className="h-3.5 w-3.5" />, tags: ['对话', '聊天', '会话'], activeClass: 'bg-blue-600 hover:bg-blue-700' },
      { key: 'image', label: '绘画', icon: <Image className="h-3.5 w-3.5" />, tags: ['绘画', '图像', '照片', '修图', '抠图'], activeClass: 'bg-purple-600 hover:bg-purple-700' },
      { key: 'video', label: '视频', icon: <Video className="h-3.5 w-3.5" />, tags: ['视频', '视频生成', '剪辑', '短视频'], activeClass: 'bg-red-600 hover:bg-red-700' },
      { key: 'audio', label: '音频', icon: <Mic className="h-3.5 w-3.5" />, tags: ['音频', '语音', '配音', '降噪', '录音'], activeClass: 'bg-amber-600 hover:bg-amber-700' },
      { key: 'music', label: '音乐', icon: <Music className="h-3.5 w-3.5" />, tags: ['音乐', '歌曲', '作曲', '歌声', '混音'], activeClass: 'bg-pink-600 hover:bg-pink-700' },
      { key: 'writing', label: '写作', icon: <FileText className="h-3.5 w-3.5" />, tags: ['写作', '文案', '润色', '文章', '文档'], activeClass: 'bg-indigo-600 hover:bg-indigo-700' },
      { key: 'code', label: '编程', icon: <Code className="h-3.5 w-3.5" />, tags: ['代码', '编程', '开发', '前端', '后端'], activeClass: 'bg-cyan-600 hover:bg-cyan-700' },
    ]
  },
  features: {
    label: '特性',
    icon: <Sparkles className="h-4 w-4" />,
    options: [
      { key: 'opensource', label: '开源', icon: <Code className="h-3.5 w-3.5" />, tags: ['开源'], activeClass: 'bg-purple-600 hover:bg-purple-700' },
      { key: 'chinese', label: '国产', icon: <Sparkles className="h-3.5 w-3.5" />, tags: ['国产'], activeClass: 'bg-red-600 hover:bg-red-700' },
      { key: 'chinese-friendly', label: '中文友好', icon: <Languages className="h-3.5 w-3.5" />, tags: ['中文', '多语言'], activeClass: 'bg-rose-600 hover:bg-rose-700' },
      { key: 'enterprise', label: '企业版', icon: <Building2 className="h-3.5 w-3.5" />, tags: ['企业', '企业版', 'B2B'], activeClass: 'bg-slate-600 hover:bg-slate-700' },
      { key: 'api', label: 'API接口', icon: <Zap className="h-3.5 w-3.5" />, tags: ['API'], activeClass: 'bg-yellow-600 hover:bg-yellow-700' },
      { key: 'multimodal', label: '多模态', icon: <Bot className="h-3.5 w-3.5" />, tags: ['多模态', '多模型'], activeClass: 'bg-violet-600 hover:bg-violet-700' },
    ]
  },
  usecase: {
    label: '应用场景',
    icon: <Briefcase className="h-4 w-4" />,
    options: [
      { key: 'marketing', label: '营销', icon: <Briefcase className="h-3.5 w-3.5" />, tags: ['营销', 'SEO', '销售', '广告', '电商'], activeClass: 'bg-orange-600 hover:bg-orange-700' },
      { key: 'education', label: '教育', icon: <GraduationCap className="h-3.5 w-3.5" />, tags: ['教育', '学习', '辅导', 'K12', '学生', '教学'], activeClass: 'bg-teal-600 hover:bg-teal-700' },
      { key: 'design', label: '设计', icon: <Palette className="h-3.5 w-3.5" />, tags: ['设计', 'UI', 'Logo', '3D', '动画'], activeClass: 'bg-fuchsia-600 hover:bg-fuchsia-700' },
      { key: 'productivity', label: '效率', icon: <Zap className="h-3.5 w-3.5" />, tags: ['效率', '自动化', '协作', '办公', '工作流'], activeClass: 'bg-lime-600 hover:bg-lime-700' },
      { key: 'research', label: '研究', icon: <SearchIcon className="h-3.5 w-3.5" />, tags: ['研究', '学术', '论文', '文献', '摘要'], activeClass: 'bg-sky-600 hover:bg-sky-700' },
      { key: 'health', label: '健康', icon: <Heart className="h-3.5 w-3.5" />, tags: ['健康', '医疗', '健身', '心理', '诊断'], activeClass: 'bg-rose-600 hover:bg-rose-700' },
      { key: 'finance', label: '金融', icon: <Wallet className="h-3.5 w-3.5" />, tags: ['金融', '股票', '投资', '理财', '风控'], activeClass: 'bg-emerald-600 hover:bg-emerald-700' },
    ]
  },
  platform: {
    label: '平台',
    icon: <Monitor className="h-4 w-4" />,
    options: [
      { key: 'web', label: '网页版', icon: <Monitor className="h-3.5 w-3.5" />, tags: ['网站', '在线', '浏览器', '网页'], activeClass: 'bg-blue-600 hover:bg-blue-700' },
      { key: 'mobile', label: '移动端', icon: <Smartphone className="h-3.5 w-3.5" />, tags: ['手机', '苹果', 'Mac', 'iOS', '移动'], activeClass: 'bg-green-600 hover:bg-green-700' },
      { key: 'plugin', label: '插件', icon: <Zap className="h-3.5 w-3.5" />, tags: ['插件', 'Chrome', 'VSCode', '浏览器'], activeClass: 'bg-purple-600 hover:bg-purple-700' },
    ]
  },
  provider: {
    label: '厂商',
    icon: <Building2 className="h-4 w-4" />,
    options: [
      { key: 'openai', label: 'OpenAI', icon: <Bot className="h-3.5 w-3.5" />, tags: ['OpenAI', 'GPT', 'DALLE'], activeClass: 'bg-emerald-600 hover:bg-emerald-700' },
      { key: 'google', label: 'Google', icon: <Bot className="h-3.5 w-3.5" />, tags: ['Google'], activeClass: 'bg-blue-600 hover:bg-blue-700' },
      { key: 'meta', label: 'Meta', icon: <Bot className="h-3.5 w-3.5" />, tags: ['Meta', 'Llama'], activeClass: 'bg-sky-600 hover:bg-sky-700' },
      { key: 'microsoft', label: '微软', icon: <Bot className="h-3.5 w-3.5" />, tags: ['微软', 'Office'], activeClass: 'bg-cyan-600 hover:bg-cyan-700' },
      { key: 'baidu', label: '百度', icon: <Bot className="h-3.5 w-3.5" />, tags: ['百度'], activeClass: 'bg-blue-600 hover:bg-blue-700' },
      { key: 'alibaba', label: '阿里', icon: <Bot className="h-3.5 w-3.5" />, tags: ['阿里'], activeClass: 'bg-orange-600 hover:bg-orange-700' },
      { key: 'tencent', label: '腾讯', icon: <Bot className="h-3.5 w-3.5" />, tags: ['腾讯'], activeClass: 'bg-blue-600 hover:bg-blue-700' },
      { key: 'bytedance', label: '字节', icon: <Bot className="h-3.5 w-3.5" />, tags: ['字节', '抖音'], activeClass: 'bg-slate-600 hover:bg-slate-700' },
      { key: 'xunfei', label: '讯飞', icon: <Bot className="h-3.5 w-3.5" />, tags: ['讯飞'], activeClass: 'bg-indigo-600 hover:bg-indigo-700' },
    ]
  }
};

// 基础筛选组（始终显示）
const basicGroups = ['access', 'pricing', 'features'];
// 高级筛选组（可展开）
const advancedGroups = ['category', 'usecase', 'platform', 'provider'];

export type ActiveFilters = {
  [groupKey: string]: string | null;
};

interface ToolFilterProps {
  activeFilters: ActiveFilters;
  onFilterChange: (groupKey: string, optionKey: string | null) => void;
  filteredCount?: number;
  totalCount?: number;
  compact?: boolean;
  showAdvanced?: boolean;
  tools?: AiTool[]; // Pass all tools to calculate counts per filter option
}

// Helper to check if a single tool matches a specific filter option
const toolMatchesOption = (tool: AiTool, groupKey: string, optionKey: string): boolean => {
  const toolTags = (tool.tags || []).map(t => t.toLowerCase());
  const group = filterGroups[groupKey];
  const option = group?.options.find(o => o.key === optionKey);
  if (!option) return false;

  // Special handling for "no-vpn"
  if (optionKey === 'no-vpn') {
    const needsVpn = toolTags.some(t => t.includes('需要梯子') || t.includes('vpn') || t.includes('梯子'));
    return !needsVpn;
  }

  // For other filters
  return option.tags.some(filterTag => {
    const lowerFilterTag = filterTag.toLowerCase();
    return toolTags.some(toolTag =>
      toolTag.includes(lowerFilterTag) || lowerFilterTag.includes(toolTag)
    );
  });
};

export const ToolFilter = ({ 
  activeFilters, 
  onFilterChange, 
  filteredCount,
  totalCount,
  compact = false,
  showAdvanced = true,
  tools
}: ToolFilterProps) => {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);
  
  const hasActiveFilters = Object.values(activeFilters).some(v => v !== null);
  const activeCount = Object.values(activeFilters).filter(v => v !== null).length;

  // Memoized counts for each filter option (cached until tools array changes)
  const optionCounts = useMemo(() => {
    if (!tools || tools.length === 0) return {};
    const counts: Record<string, Record<string, number>> = {};
    for (const groupKey of Object.keys(filterGroups)) {
      counts[groupKey] = {};
      for (const option of filterGroups[groupKey].options) {
        counts[groupKey][option.key] = tools.filter(t => toolMatchesOption(t, groupKey, option.key)).length;
      }
    }
    return counts;
  }, [tools]);

  const clearAllFilters = () => {
    Object.keys(filterGroups).forEach(groupKey => {
      onFilterChange(groupKey, null);
    });
  };

  const renderFilterGroup = (groupKey: string, group: FilterGroup) => {
    const groupCounts = optionCounts[groupKey] || {};
    return (
      <div key={groupKey} className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs text-muted-foreground hidden sm:inline-flex items-center gap-1">
          {group.icon}
          {t(`filter.group.${groupKey}`)}:
        </span>
        <div className="flex gap-1 flex-wrap">
          {group.options.map((option) => {
            const isActive = activeFilters[groupKey] === option.key;
            const count = groupCounts[option.key];
            return (
              <Button
                key={option.key}
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                onClick={() => onFilterChange(groupKey, isActive ? null : option.key)}
                className={cn(
                  "h-7 text-xs gap-1 px-2",
                  isActive && option.activeClass
                )}
              >
                {option.icon}
                <span className="hidden sm:inline">{t(`filter.opt.${option.key}`)}</span>
                {count !== undefined && (
                  <Badge variant={isActive ? 'secondary' : 'outline'} className="ml-0.5 h-4 min-w-[1.25rem] px-1 text-[10px] font-medium">
                    {count}
                  </Badge>
                )}
              </Button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={cn(
      "space-y-3 p-4 bg-muted/50 rounded-xl border",
      compact && "p-3"
    )}>
      {/* Header with filter icon and stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Filter className="h-4 w-4 text-primary" />
          <span>{t('filter.title')}</span>
          {activeCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {t('filter.conditions', { count: activeCount })}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <>
              <Badge variant="outline" className="text-xs font-medium">
                {filteredCount !== undefined ? t('filter.found', { count: filteredCount }) : t('filter.filtered')}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground gap-1"
              >
                <X className="h-3 w-3" />
                {t('filter.clearAll')}
              </Button>
            </>
          )}
        </div>
      </div>
      
      {/* Basic filters - always visible */}
      <div className="flex flex-wrap gap-4">
        {basicGroups.map(groupKey => {
          const group = filterGroups[groupKey];
          return renderFilterGroup(groupKey, group);
        })}
      </div>

      {/* Advanced filters - collapsible */}
      {showAdvanced && (
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground w-full justify-center border border-dashed"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-3.5 w-3.5" />
                  {t('filter.collapse')}
                </>
              ) : (
                <>
                  <ChevronDown className="h-3.5 w-3.5" />
                  {t('filter.expand')}
                </>
              )}
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="space-y-3 pt-3">
            <div className="grid gap-3 sm:grid-cols-2">
              {advancedGroups.map(groupKey => {
                const group = filterGroups[groupKey];
                return (
                  <div key={groupKey} className="p-3 bg-background/50 rounded-lg border border-border/50">
                    <div className="flex items-center gap-1.5 mb-2 text-xs font-medium text-muted-foreground">
                      {group.icon}
                      {t(`filter.group.${groupKey}`)}
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {group.options.map((option) => {
                        const isActive = activeFilters[groupKey] === option.key;
                        const count = (optionCounts[groupKey] || {})[option.key];
                        return (
                          <Button
                            key={option.key}
                            variant={isActive ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => onFilterChange(groupKey, isActive ? null : option.key)}
                            className={cn(
                              "h-6 text-xs gap-1 px-2",
                              isActive && option.activeClass
                            )}
                          >
                            {option.icon}
                            {t(`filter.opt.${option.key}`)}
                            {count !== undefined && (
                              <Badge variant={isActive ? 'secondary' : 'outline'} className="ml-0.5 h-4 min-w-[1.25rem] px-1 text-[10px] font-medium">
                                {count}
                              </Badge>
                            )}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
};

// Helper function to filter tools based on active filters
export const filterTools = <T extends { tags?: string[] | null }>(
  tools: T[] | undefined,
  activeFilters: ActiveFilters
): T[] => {
  if (!tools) return [];
  
  return tools.filter((tool) => {
    const toolTags = (tool.tags || []).map(t => t.toLowerCase());
    
    // Check each filter group
    for (const [groupKey, optionKey] of Object.entries(activeFilters)) {
      if (!optionKey) continue;
      
      const group = filterGroups[groupKey as keyof typeof filterGroups];
      const option = group?.options.find(o => o.key === optionKey);
      
      if (!option) continue;
      
      // Special handling for "no-vpn" filter - show tools WITHOUT '需要梯子' tag
      if (optionKey === 'no-vpn') {
        const needsVpn = toolTags.some(t => t.includes('需要梯子') || t.includes('vpn') || t.includes('梯子'));
        if (needsVpn) return false;
        continue;
      }
      
      // For other filters, check if any of the option's tags match (case-insensitive, partial match)
      const hasMatchingTag = option.tags.some(filterTag => {
        const lowerFilterTag = filterTag.toLowerCase();
        return toolTags.some(toolTag => 
          toolTag.includes(lowerFilterTag) || lowerFilterTag.includes(toolTag)
        );
      });
      if (!hasMatchingTag) return false;
    }
    
    return true;
  });
};