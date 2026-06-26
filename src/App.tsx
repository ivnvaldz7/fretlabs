import { AppShell } from './modules/ui/layout/AppShell';
import { LocaleProvider } from './hooks/useLocale';
import { ThemeProvider } from './hooks/useTheme';

export default function App() {
  return (
    <LocaleProvider>
      <ThemeProvider>
        <AppShell />
      </ThemeProvider>
    </LocaleProvider>
  );
}
