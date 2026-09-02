import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'zh' | 'en' | 'ja' | 'ko';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const translations: Record<Language, Record<string, string>> = {
  zh: {
    'nav.explore': '探索',
    'nav.smartSearch': '智能推荐',
    'nav.login': '登录',
    'nav.register': '注册',
    'nav.profile': '个人中心',
    'nav.admin': '后台管理',
    'nav.logout': '退出登录',
    'search.placeholder': '搜索AI工具...',
    'brand.name': 'AI导航',

    'hero.badge': '发现 {count} 精选AI工具',
    'hero.h1': '探索 AI 工具的无限可能',
    'hero.desc': '汇集全网优质 AI 工具，覆盖对话、绘画、视频、音频、写作、编程等多个领域',
    'hero.placeholder': '搜索AI工具名称、功能或分类...',
    'hero.searchButton': '搜索',
    'hero.smartCta': '不知道选什么？试试 AI 智能推荐',
    'hero.popular': '热门：',
    'hero.stats.tools': 'AI工具',
    'hero.stats.categories': '分类',
    'hero.stats.daily': '每日更新',

    'hot.badge': '热门推荐',
    'hot.title': '最受欢迎的 AI 工具',
    'hot.desc': '精选用户评价最高、使用最多的AI工具，助你快速找到最适合的解决方案',
    'hot.prev': '上一页',
    'hot.next': '下一页',
    'hot.total': '共 {count} 个工具',
    'hot.empty': '该筛选条件下暂无热门工具',

    'cat.badge': '全部分类',
    'cat.title': '按分类浏览 AI 工具',
    'cat.desc': '覆盖对话、绘画、视频、音频、写作、编程等多个领域',
    'cat.viewMore': '查看更多',
    'cat.emptyTools': '该分类暂无工具',
    'cat.noData': '暂无分类数据',
    'cat.notFound': '分类不存在',
    'cat.notFoundDesc': '请检查链接是否正确',
    'cat.count': '共 {count} 个工具',
    'cat.emptyFilter': '该筛选条件下暂无工具，请尝试其他筛选',

    'oscar.badge': 'Oscar 排行榜',
    'oscar.title': 'AI 工具 Oscar 排名',
    'oscar.desc': '综合浏览量、评分和评价数等维度，为每个类别评选出最受欢迎的Top 3工具',
    'oscar.viewAll': '查看全部',
    'oscar.empty': '暂无排名数据',

    'news.title': 'AI 资讯',
    'news.live': '实时更新',
    'news.empty': '暂无新闻资讯',
    'news.more': '查看更多资讯',

    'card.hot': '热门',
    'card.featured': '⭐ 精选',

    'footer.tagline': '发现最好用的AI工具，提升您的工作效率',
    'footer.categories': '工具分类',
    'footer.quickLinks': '快速链接',
    'footer.home': '首页',
    'footer.submit': '提交工具',
    'footer.allCategories': '全部分类',
    'footer.feedback': '反馈建议',
    'footer.contact': '联系方式',

    'result.title': '搜索结果：',
    'result.count': '共找到 {count} 个结果',
    'result.notFound': '未找到相关工具',
    'result.notFoundDesc': '尝试更换筛选条件或使用不同的关键词',

    'explore.badge': '高级筛选',
    'explore.title': '探索',
    'explore.titleAccent': 'AI工具库',
    'explore.desc': '从 {count} 个AI工具中，通过多维度筛选找到最适合你的工具',
    'explore.placeholder': '搜索工具名称、描述或标签...',
    'explore.clear': '清除',
    'explore.allCategories': '全部分类',
    'explore.results': '搜索结果',
    'explore.count': '{count} 个工具',
    'explore.noMatch': '未找到匹配的工具',
    'explore.noMatchDesc': '尝试调整筛选条件或更换搜索关键词',
    'explore.clearAll': '清除所有筛选',
    'explore.hotTags': '热门标签',

    'auth.loginTitle': '登录',
    'auth.loginDesc': '登录您的账户以使用完整功能',
    'auth.email': '邮箱',
    'auth.password': '密码',
    'auth.noAccount': '还没有账户？',
    'auth.goRegister': '立即注册',

    'category.ai-chat': 'AI对话',
    'category.ai-image': 'AI绘画',
    'category.ai-video': 'AI视频',
    'category.ai-audio': 'AI音频',
    'category.ai-writing': 'AI写作',
    'category.ai-code': '代码生成',
    'category.ai-education': 'AI教育',
    'category.ai-music': 'AI音乐',
    'category.ai-health': 'AI健康',
    'category.ai-life': 'AI生活',
    'category.ai-finance': 'AI金融',
    'category.ai-business': 'AI商业',
    'category.ai-design': 'AI设计',
    'category.ai-architecture': 'AI建筑',
    'category.ai-agent': 'AI Agent',
    'category.ai-other': '其他',
  },
  en: {
    'nav.explore': 'Explore',
    'nav.smartSearch': 'Smart Search',
    'nav.login': 'Login',
    'nav.register': 'Sign Up',
    'nav.profile': 'Profile',
    'nav.admin': 'Admin',
    'nav.logout': 'Logout',
    'search.placeholder': 'Search AI tools...',
    'brand.name': 'AI Directory',

    'hero.badge': 'Discover {count} curated AI tools',
    'hero.h1': 'Explore the Possibilities of AI Tools',
    'hero.desc': 'A curated collection of AI tools for chat, art, video, audio, writing, coding and more',
    'hero.placeholder': 'Search tools by name, feature or category...',
    'hero.searchButton': 'Search',
    'hero.smartCta': 'Not sure what to pick? Try AI recommendations',
    'hero.popular': 'Popular:',
    'hero.stats.tools': 'AI Tools',
    'hero.stats.categories': 'Categories',
    'hero.stats.daily': 'Daily Updates',

    'hot.badge': 'Trending',
    'hot.title': 'Most Popular AI Tools',
    'hot.desc': 'Top-rated and most-used AI tools, hand-picked to help you find the right solution fast',
    'hot.prev': 'Previous',
    'hot.next': 'Next',
    'hot.total': '{count} tools',
    'hot.empty': 'No tools match the current filters',

    'cat.badge': 'All Categories',
    'cat.title': 'Browse AI Tools by Category',
    'cat.desc': 'Covering chat, art, video, audio, writing, coding and many more fields',
    'cat.viewMore': 'View more',
    'cat.emptyTools': 'No tools in this category yet',
    'cat.noData': 'No categories available',
    'cat.notFound': 'Category not found',
    'cat.notFoundDesc': 'Please check that the link is correct',
    'cat.count': '{count} tools',
    'cat.emptyFilter': 'No tools match these filters, try different ones',

    'oscar.badge': 'Oscar Rankings',
    'oscar.title': 'AI Tools Oscar Rankings',
    'oscar.desc': 'Top 3 tools per category, scored by views, ratings and number of reviews',
    'oscar.viewAll': 'View all',
    'oscar.empty': 'No ranking data',

    'news.title': 'AI News',
    'news.live': 'Live',
    'news.empty': 'No news yet',
    'news.more': 'More news',

    'card.hot': 'Hot',
    'card.featured': '⭐ Featured',

    'footer.tagline': 'Discover the best AI tools and boost your productivity',
    'footer.categories': 'Categories',
    'footer.quickLinks': 'Quick Links',
    'footer.home': 'Home',
    'footer.submit': 'Submit a Tool',
    'footer.allCategories': 'All Categories',
    'footer.feedback': 'Feedback',
    'footer.contact': 'Contact',

    'result.title': 'Results for: ',
    'result.count': '{count} results found',
    'result.notFound': 'No matching tools found',
    'result.notFoundDesc': 'Try different filters or another keyword',

    'explore.badge': 'Advanced Filters',
    'explore.title': 'Explore the',
    'explore.titleAccent': 'AI Tool Library',
    'explore.desc': 'Filter across {count} AI tools to find the perfect fit',
    'explore.placeholder': 'Search by name, description or tag...',
    'explore.clear': 'Clear',
    'explore.allCategories': 'All Categories',
    'explore.results': 'Results',
    'explore.count': '{count} tools',
    'explore.noMatch': 'No matching tools',
    'explore.noMatchDesc': 'Try adjusting the filters or changing your keyword',
    'explore.clearAll': 'Clear all filters',
    'explore.hotTags': 'Popular Tags',

    'auth.loginTitle': 'Login',
    'auth.loginDesc': 'Sign in to your account to unlock all features',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.noAccount': "Don't have an account?",
    'auth.goRegister': 'Sign up now',

    'category.ai-chat': 'AI Chat',
    'category.ai-image': 'AI Image',
    'category.ai-video': 'AI Video',
    'category.ai-audio': 'AI Audio',
    'category.ai-writing': 'AI Writing',
    'category.ai-code': 'Code Generation',
    'category.ai-education': 'AI Education',
    'category.ai-music': 'AI Music',
    'category.ai-health': 'AI Health',
    'category.ai-life': 'AI Lifestyle',
    'category.ai-finance': 'AI Finance',
    'category.ai-business': 'AI Business',
    'category.ai-design': 'AI Design',
    'category.ai-architecture': 'AI Architecture',
    'category.ai-agent': 'AI Agent',
    'category.ai-other': 'Other',
  },
  ja: {
    'nav.explore': '探索',
    'nav.smartSearch': 'スマート検索',
    'nav.login': 'ログイン',
    'nav.register': '登録',
    'nav.profile': 'プロフィール',
    'nav.admin': '管理画面',
    'nav.logout': 'ログアウト',
    'search.placeholder': 'AIツールを検索...',
    'brand.name': 'AIナビ',

    'hero.badge': '{count} の厳選AIツールを掲載',
    'hero.h1': 'AIツールの無限の可能性を探索',
    'hero.desc': '対話・画像・動画・音声・ライティング・コーディングなど、優れたAIツールを網羅',
    'hero.placeholder': 'ツール名・機能・カテゴリで検索...',
    'hero.searchButton': '検索',
    'hero.smartCta': '迷ったら？AIスマートおすすめを試す',
    'hero.popular': '人気：',
    'hero.stats.tools': 'AIツール',
    'hero.stats.categories': 'カテゴリ',
    'hero.stats.daily': '毎日更新',

    'hot.badge': '人気のおすすめ',
    'hot.title': '最も人気のAIツール',
    'hot.desc': '評価が高く、利用の多いAIツールを厳選しました',
    'hot.prev': '前へ',
    'hot.next': '次へ',
    'hot.total': '全 {count} 件',
    'hot.empty': 'この条件に一致するツールはありません',

    'cat.badge': '全カテゴリ',
    'cat.title': 'カテゴリ別にAIツールを見る',
    'cat.desc': '対話・画像・動画・音声・ライティング・コーディングなど',
    'cat.viewMore': 'もっと見る',
    'cat.emptyTools': 'このカテゴリにはまだツールがありません',
    'cat.noData': 'カテゴリがありません',
    'cat.notFound': 'カテゴリが存在しません',
    'cat.notFoundDesc': 'リンクをご確認ください',
    'cat.count': '全 {count} 件',
    'cat.emptyFilter': 'この条件に一致するツールはありません',

    'oscar.badge': 'Oscar ランキング',
    'oscar.title': 'AIツール Oscar ランキング',
    'oscar.desc': '閲覧数・評価・レビュー数からカテゴリ別トップ3を選出',
    'oscar.viewAll': 'すべて見る',
    'oscar.empty': 'ランキングデータがありません',

    'news.title': 'AIニュース',
    'news.live': 'リアルタイム',
    'news.empty': 'ニュースはありません',
    'news.more': 'もっと見る',

    'card.hot': '人気',
    'card.featured': '⭐ 厳選',

    'footer.tagline': '最適なAIツールを見つけて生産性を高めましょう',
    'footer.categories': 'カテゴリ',
    'footer.quickLinks': 'クイックリンク',
    'footer.home': 'ホーム',
    'footer.submit': 'ツールを投稿',
    'footer.allCategories': '全カテゴリ',
    'footer.feedback': 'フィードバック',
    'footer.contact': 'お問い合わせ',

    'result.title': '検索結果：',
    'result.count': '{count} 件の結果',
    'result.notFound': '該当するツールが見つかりません',
    'result.notFoundDesc': '条件やキーワードを変えてお試しください',

    'explore.badge': '詳細フィルター',
    'explore.title': '探索',
    'explore.titleAccent': 'AIツールライブラリ',
    'explore.desc': '{count} 件のAIツールから最適なものを絞り込み',
    'explore.placeholder': '名前・説明・タグで検索...',
    'explore.clear': 'クリア',
    'explore.allCategories': '全カテゴリ',
    'explore.results': '検索結果',
    'explore.count': '{count} 件',
    'explore.noMatch': '一致するツールがありません',
    'explore.noMatchDesc': '条件やキーワードを調整してください',
    'explore.clearAll': 'すべてのフィルターをクリア',
    'explore.hotTags': '人気のタグ',

    'auth.loginTitle': 'ログイン',
    'auth.loginDesc': 'アカウントにログインしてすべての機能を利用',
    'auth.email': 'メールアドレス',
    'auth.password': 'パスワード',
    'auth.noAccount': 'アカウントをお持ちでないですか？',
    'auth.goRegister': '今すぐ登録',

    'category.ai-chat': 'AI対話',
    'category.ai-image': 'AI画像',
    'category.ai-video': 'AI動画',
    'category.ai-audio': 'AI音声',
    'category.ai-writing': 'AIライティング',
    'category.ai-code': 'コード生成',
    'category.ai-education': 'AI教育',
    'category.ai-music': 'AI音楽',
    'category.ai-health': 'AIヘルス',
    'category.ai-life': 'AI生活',
    'category.ai-finance': 'AI金融',
    'category.ai-business': 'AIビジネス',
    'category.ai-design': 'AIデザイン',
    'category.ai-architecture': 'AI建築',
    'category.ai-agent': 'AIエージェント',
    'category.ai-other': 'その他',
  },
  ko: {
    'nav.explore': '탐색',
    'nav.smartSearch': '스마트 검색',
    'nav.login': '로그인',
    'nav.register': '회원가입',
    'nav.profile': '프로필',
    'nav.admin': '관리자',
    'nav.logout': '로그아웃',
    'search.placeholder': 'AI 도구 검색...',
    'brand.name': 'AI 내비',

    'hero.badge': '{count} 개의 엄선된 AI 도구',
    'hero.h1': 'AI 도구의 무한한 가능성을 탐색하세요',
    'hero.desc': '대화, 이미지, 영상, 오디오, 글쓰기, 코딩 등 다양한 분야의 우수한 AI 도구 모음',
    'hero.placeholder': '도구 이름, 기능 또는 카테고리 검색...',
    'hero.searchButton': '검색',
    'hero.smartCta': '무엇을 고를지 모르겠다면? AI 추천을 사용해 보세요',
    'hero.popular': '인기:',
    'hero.stats.tools': 'AI 도구',
    'hero.stats.categories': '카테고리',
    'hero.stats.daily': '매일 업데이트',

    'hot.badge': '인기 추천',
    'hot.title': '가장 인기 있는 AI 도구',
    'hot.desc': '평점이 높고 사용량이 많은 AI 도구를 엄선했습니다',
    'hot.prev': '이전',
    'hot.next': '다음',
    'hot.total': '총 {count} 개',
    'hot.empty': '현재 조건에 맞는 도구가 없습니다',

    'cat.badge': '전체 카테고리',
    'cat.title': '카테고리별 AI 도구 보기',
    'cat.desc': '대화, 이미지, 영상, 오디오, 글쓰기, 코딩 등',
    'cat.viewMore': '더 보기',
    'cat.emptyTools': '이 카테고리에는 아직 도구가 없습니다',
    'cat.noData': '카테고리 데이터가 없습니다',
    'cat.notFound': '카테고리를 찾을 수 없습니다',
    'cat.notFoundDesc': '링크가 올바른지 확인해 주세요',
    'cat.count': '총 {count} 개',
    'cat.emptyFilter': '조건에 맞는 도구가 없습니다. 다른 필터를 시도하세요',

    'oscar.badge': 'Oscar 랭킹',
    'oscar.title': 'AI 도구 Oscar 랭킹',
    'oscar.desc': '조회수, 평점, 리뷰 수를 종합해 카테고리별 Top 3를 선정',
    'oscar.viewAll': '전체 보기',
    'oscar.empty': '랭킹 데이터가 없습니다',

    'news.title': 'AI 뉴스',
    'news.live': '실시간',
    'news.empty': '뉴스가 없습니다',
    'news.more': '뉴스 더 보기',

    'card.hot': '인기',
    'card.featured': '⭐ 추천',

    'footer.tagline': '최고의 AI 도구를 찾아 생산성을 높이세요',
    'footer.categories': '카테고리',
    'footer.quickLinks': '바로가기',
    'footer.home': '홈',
    'footer.submit': '도구 제출',
    'footer.allCategories': '전체 카테고리',
    'footer.feedback': '피드백',
    'footer.contact': '연락처',

    'result.title': '검색 결과: ',
    'result.count': '총 {count} 개의 결과',
    'result.notFound': '관련 도구를 찾을 수 없습니다',
    'result.notFoundDesc': '다른 조건이나 키워드를 시도해 보세요',

    'explore.badge': '고급 필터',
    'explore.title': '탐색',
    'explore.titleAccent': 'AI 도구 라이브러리',
    'explore.desc': '{count} 개의 AI 도구에서 가장 알맞은 도구를 찾아보세요',
    'explore.placeholder': '이름, 설명 또는 태그 검색...',
    'explore.clear': '지우기',
    'explore.allCategories': '전체 카테고리',
    'explore.results': '검색 결과',
    'explore.count': '{count} 개',
    'explore.noMatch': '일치하는 도구가 없습니다',
    'explore.noMatchDesc': '필터나 검색어를 조정해 보세요',
    'explore.clearAll': '모든 필터 지우기',
    'explore.hotTags': '인기 태그',

    'auth.loginTitle': '로그인',
    'auth.loginDesc': '계정에 로그인하고 모든 기능을 사용하세요',
    'auth.email': '이메일',
    'auth.password': '비밀번호',
    'auth.noAccount': '계정이 없으신가요?',
    'auth.goRegister': '지금 가입하기',

    'category.ai-chat': 'AI 대화',
    'category.ai-image': 'AI 이미지',
    'category.ai-video': 'AI 영상',
    'category.ai-audio': 'AI 오디오',
    'category.ai-writing': 'AI 글쓰기',
    'category.ai-code': '코드 생성',
    'category.ai-education': 'AI 교육',
    'category.ai-music': 'AI 음악',
    'category.ai-health': 'AI 헬스',
    'category.ai-life': 'AI 라이프',
    'category.ai-finance': 'AI 금융',
    'category.ai-business': 'AI 비즈니스',
    'category.ai-design': 'AI 디자인',
    'category.ai-architecture': 'AI 건축',
    'category.ai-agent': 'AI 에이전트',
    'category.ai-other': '기타',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'zh';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    let value = translations[language][key] ?? translations.zh[key] ?? key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        value = value.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      }
    }
    return value;
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

/** Localized category name by slug, falling back to the DB name (Chinese). */
export const useCategoryName = () => {
  const { t, language } = useLanguage();
  return (slug: string, fallback: string) => {
    if (language === 'zh') return fallback;
    const key = `category.${slug}`;
    const value = t(key);
    return value === key ? fallback : value;
  };
};
