import { AppShell } from './modules/ui/layout/AppShell';
import { LocaleProvider } from './hooks/useLocale';

export default function App() {
  return (
    <LocaleProvider>
      <AppShell />
    </LocaleProvider>
  );
}
