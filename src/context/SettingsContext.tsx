import { createContext, useContext, useState, useEffect } from "react";
import { Settings } from "../types/settingsTypes";
import {
  loadSettings,
  defaultSettings,
  saveSettings,
} from "../utils/settingsStorage";

const SettingsContext = createContext<{
  settings: Settings;
  updateSettings: (newSettings: Settings) => Promise<void>;
}>({
  settings: defaultSettings,
  updateSettings: async () => {},
});

export const SettingsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  useEffect(() => {
    loadSettings().then(setSettings);
  }, []);

  const updateSettings = async (newSettings: Settings) => {
    await saveSettings(newSettings);
    setSettings(newSettings);
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
