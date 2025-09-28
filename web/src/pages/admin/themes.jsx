import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { THEMES } from '@/lib/themes';
import { useTheme } from '@/context/ThemeContext';

export default function AdminThemesPage() {
  const { themeKey, setThemeKey } = useTheme();
  const themeEntries = useMemo(() => Object.entries(THEMES), []);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Theme library</h1>
          <p className="text-sm text-muted-foreground">Preview marketplace storefront themes and switch instantly.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {themeEntries.map(([key, theme]) => (
          <Card key={key} className={`overflow-hidden border transition ${themeKey === key ? 'ring-2 ring-primary' : ''}`}>
            <div
              className="h-32 w-full bg-cover bg-center"
              style={{ backgroundImage: `url(${theme.hero.background})` }}
            />
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">{theme.name}</CardTitle>
              <p className="text-xs text-muted-foreground">{theme.description}</p>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                {theme.highlights?.map((item) => (
                  <span key={item} className="rounded-full bg-secondary px-2 py-1 text-secondary-foreground">
                    {item}
                  </span>
                ))}
              </div>
              <Button onClick={() => setThemeKey(key)} disabled={themeKey === key}>
                {themeKey === key ? 'Active theme' : 'Activate theme'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
