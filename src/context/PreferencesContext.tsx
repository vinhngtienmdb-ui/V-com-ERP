import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark' | 'nature';
type Language = 'vi' | 'en';
type PrimaryColor = 'indigo' | 'blue' | 'emerald' | 'rose' | 'amber' | 'slate';
type BorderRadius = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'none';
type HolidayTheme = 'none' | 'tet' | 'christmas' | 'mid-autumn' | 'halloween';

interface PreferencesContextType {
 theme: Theme;
 setTheme: (theme: Theme) => void;
 language: Language;
 setLanguage: (lang: Language) => void;
 primaryColor: PrimaryColor;
 setPrimaryColor: (color: PrimaryColor) => void;
 borderRadius: BorderRadius;
 setBorderRadius: (radius: BorderRadius) => void;
 holidayTheme: HolidayTheme;
 setHolidayTheme: (theme: HolidayTheme) => void;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
 const [theme, setTheme] = useState<Theme>(() => {
 return (localStorage.getItem('app_theme') as Theme) || 'light';
 });
 
 const [language, setLanguage] = useState<Language>(() => {
 return (localStorage.getItem('app_language') as Language) || 'vi';
 });

 const [primaryColor, setPrimaryColor] = useState<PrimaryColor>(() => {
 return (localStorage.getItem('app_primary_color') as PrimaryColor) || 'indigo';
 });

 const [borderRadius, setBorderRadius] = useState<BorderRadius>(() => {
 return (localStorage.getItem('app_border_radius') as BorderRadius) || 'lg'; // default to lg for slight curve
 });

 const [holidayTheme, setHolidayTheme] = useState<HolidayTheme>(() => {
 return (localStorage.getItem('app_holiday_theme') as HolidayTheme) || 'none';
 });

 useEffect(() => {
 localStorage.setItem('app_theme', theme);
 document.documentElement.setAttribute('data-theme', theme);
 }, [theme]);

 useEffect(() => {
 localStorage.setItem('app_language', language);
 }, [language]);

 useEffect(() => {
 localStorage.setItem('app_primary_color', primaryColor);
 document.documentElement.setAttribute('data-primary-color', primaryColor);
 }, [primaryColor]);

 useEffect(() => {
 localStorage.setItem('app_border_radius', borderRadius);
 document.documentElement.setAttribute('data-border-radius', borderRadius);
 }, [borderRadius]);

 useEffect(() => {
 localStorage.setItem('app_holiday_theme', holidayTheme);
 document.documentElement.setAttribute('data-holiday-theme', holidayTheme);
 }, [holidayTheme]);

 return (
 <PreferencesContext.Provider value={{
  theme, setTheme,
  language, setLanguage,
  primaryColor, setPrimaryColor,
  borderRadius, setBorderRadius,
  holidayTheme, setHolidayTheme
 }}>
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
