import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark' | 'nature';
type Language = 'vi' | 'en';

interface PreferencesContextType {
 theme: Theme;
 setTheme: (theme: Theme) => void;
 language: Language;
 setLanguage: (lang: Language) => void;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
 const [theme, setTheme] = useState<Theme>(() => {
 return (localStorage.getItem('app_theme') as Theme) || 'light';
 });
 
 const [language, setLanguage] = useState<Language>(() => {
 return (localStorage.getItem('app_language') as Language) || 'vi';
 });

 useEffect(() => {
 localStorage.setItem('app_theme', theme);
 document.documentElement.setAttribute('data-theme', theme);
 }, [theme]);

 useEffect(() => {
 localStorage.setItem('app_language', language);
 }, [language]);

 return (
 <PreferencesContext.Provider value={{ theme, setTheme, language, setLanguage }}>
 {children}
 </PreferencesContext.Provider>
 );
}

export function usePreferences() {
 const context = useContext(PreferencesContext);
 if (!context) {
 throw new Error('usePreferences must be used within a PreferencesProvider');
 }
 return context;
}
