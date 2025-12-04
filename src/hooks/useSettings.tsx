import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Settings {
  companyTitle: string;
  companySlogan: string;
  logoUrl: string;
}

interface SettingsContextType {
  settings: Settings;
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const defaultSettings: Settings = {
  companyTitle: "Delivery App",
  companySlogan: "O melhor da cidade",
  logoUrl: "",
};

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("settings")
          .select("key, value")
          .in("key", ["company_title", "company_slogan", "logo_url"]);

        if (error) throw error;

        if (data) {
          const newSettings = { ...defaultSettings };
          const titleSetting = data.find(s => s.key === 'company_title');
          const sloganSetting = data.find(s => s.key === 'company_slogan');
          const logoSetting = data.find(s => s.key === 'logo_url');

          if (titleSetting?.value) newSettings.companyTitle = titleSetting.value;
          if (sloganSetting?.value) newSettings.companySlogan = sloganSetting.value;
          if (logoSetting?.value) newSettings.logoUrl = logoSetting.value;
          
          setSettings(newSettings);
        }
      } catch (error) {
        console.error("Error loading company settings:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}