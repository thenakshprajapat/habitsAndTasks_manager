import { ThemeProvider } from './context/ThemeContext';
import { DataProvider } from './context/DataContext';
import { AppContent } from './AppContent';

export default function App() {
  return (
    <ThemeProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </ThemeProvider>
  );
}
