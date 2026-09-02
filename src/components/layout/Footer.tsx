import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

const categorySlugs = [
  'ai-chat',
  'ai-image',
  'ai-writing',
  'ai-video',
  'ai-audio',
  'ai-code',
  'ai-education',
  'ai-music',
  'ai-health',
  'ai-life',
  'ai-finance',
  'ai-business',
  'ai-design',
];

export const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="border-t bg-muted/50">
      <div className="container py-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-5">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <span className="text-lg font-bold text-primary-foreground">AI</span>
              </div>
              <span className="text-xl font-bold">{t('brand.name')}</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              {t('footer.tagline')}
            </p>
          </div>

          {/* Categories */}
          <div className="space-y-4 md:col-span-2">
            <h3 className="text-sm font-semibold">{t('footer.categories')}</h3>
            <ul className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm text-muted-foreground">
              {categorySlugs.map((slug) => (
                <li key={slug}>
                  <Link to={`/category/${slug}`} className="hover:text-foreground transition-colors">
                    {t(`category.${slug}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">{t('footer.quickLinks')}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/" className="hover:text-foreground transition-colors">
                  {t('footer.home')}
                </Link>
              </li>
              <li>
                <Link to="/submit" className="hover:text-foreground transition-colors">
                  {t('footer.submit')}
                </Link>
              </li>
              <li>
                <Link to="/explore" className="hover:text-foreground transition-colors">
                  {t('footer.allCategories')}
                </Link>
              </li>
              <li>
                <a href="mailto:jd2005@bu.edu" className="hover:text-foreground transition-colors">
                  {t('footer.feedback')}
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">{t('footer.contact')}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <span>📧</span>
                <a href="mailto:jd2005@bu.edu" className="hover:text-foreground transition-colors">
                  jd2005@bu.edu
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} {t('brand.name')}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
