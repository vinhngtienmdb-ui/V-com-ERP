import React, { createContext, useContext, useState, useEffect } from 'react';
import { safeLocalStorage } from '../lib/storage';

type Theme = 'light' | 'dark' | 'nature';
type Language = 'vi' | 'en';
type PrimaryColor = 'indigo' | 'blue' | 'emerald' | 'rose' | 'amber' | 'slate' | 'vcomm';
type BorderRadius = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'none' | 'vcomm';
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
 layoutEditable: boolean;
 setLayoutEditable: (editable: boolean) => void;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
 const [theme, setTheme] = useState<Theme>(() => {
 return (safeLocalStorage.getItem('app_theme') as Theme) || 'light';
 });
 
 const [language, setLanguage] = useState<Language>(() => {
 return (safeLocalStorage.getItem('app_language') as Language) || 'vi';
 });

 const [primaryColor, setPrimaryColor] = useState<PrimaryColor>(() => {
 return (safeLocalStorage.getItem('app_primary_color') as PrimaryColor) || 'vcomm';
 });

 const [borderRadius, setBorderRadius] = useState<BorderRadius>(() => {
 return (safeLocalStorage.getItem('app_border_radius') as BorderRadius) || 'vcomm';
 });

 const [holidayTheme, setHolidayTheme] = useState<HolidayTheme>(() => {
 return (safeLocalStorage.getItem('app_holiday_theme') as HolidayTheme) || 'none';
 });

 const [layoutEditable, setLayoutEditable] = useState<boolean>(() => {
 return safeLocalStorage.getItem('app_layout_editable') === 'true';
 });

 useEffect(() => {
 safeLocalStorage.setItem('app_theme', theme);
 document.documentElement.setAttribute('data-theme', theme);
 }, [theme]);

 useEffect(() => {
 safeLocalStorage.setItem('app_language', language);
 }, [language]);

 useEffect(() => {
 safeLocalStorage.setItem('app_primary_color', primaryColor);
 document.documentElement.setAttribute('data-primary-color', primaryColor);
 }, [primaryColor]);

 useEffect(() => {
 safeLocalStorage.setItem('app_border_radius', borderRadius);
 document.documentElement.setAttribute('data-border-radius', borderRadius);
 }, [borderRadius]);

 useEffect(() => {
 safeLocalStorage.setItem('app_holiday_theme', holidayTheme);
 document.documentElement.setAttribute('data-holiday-theme', holidayTheme);
 }, [holidayTheme]);

 useEffect(() => {
 safeLocalStorage.setItem('app_layout_editable', String(layoutEditable));
 }, [layoutEditable]);

 return (
 <PreferencesContext.Provider value={{
  theme, setTheme,
  language, setLanguage,
  primaryColor, setPrimaryColor,
  borderRadius, setBorderRadius,
  holidayTheme, setHolidayTheme,
  layoutEditable, setLayoutEditable
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
