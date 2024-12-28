import { useSettings } from "../context/SettingsContext";

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings();

  const handleRuleToggle = async (ruleId: string) => {
    const newSettings = {
      ...settings,
      rules: settings.rules.map((rule) =>
        rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule,
      ),
    };
    await updateSettings(newSettings);
  };

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Validator Settings</h1>
      <form className="mb-4">
        <div role="group" aria-labelledby="filter-group">
          <span id="filter-group" className="text-lg font-semibold block mb-2">
            Result Filtering
          </span>
          <label htmlFor="severity-filter" className="flex items-center gap-2">
            <span>Severity Level:</span>
            <select
              id="severity-filter"
              value={settings.display.severityFilter}
              onChange={async (e) => {
                const newSettings = {
                  ...settings,
                  display: {
                    ...settings.display,
                    severityFilter: e.target.value as
                      | "all"
                      | "critical"
                      | "major"
                      | "minor",
                  },
                };
                await updateSettings(newSettings);
              }}
              className="px-6 py-1.5"
              aria-label="Select severity filter level"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical Only</option>
              <option value="major">Major Only</option>
              <option value="minor">Minor Only</option>
            </select>
          </label>
        </div>

        {/* Rules Section */}
        <section className="mb-8" aria-labelledby="validation-rules">
          <h2 id="validation-rules" className="text-xl font-semibold mb-4">
            Validation Rules
          </h2>
          <div role="group" aria-label="Validation rule toggles">
            {settings.rules.map((rule) => (
              <div key={rule.id} className="flex items-center gap-4 mb-4">
                <label
                  htmlFor={`rule-${rule.id}`}
                  className="flex items-center gap-2"
                >
                  <input
                    id={`rule-${rule.id}`}
                    type="checkbox"
                    checked={rule.enabled}
                    onChange={() => handleRuleToggle(rule.id)}
                    aria-describedby={`rule-desc-${rule.id}`}
                  />
                  <span>{rule.name}</span>
                </label>
              </div>
            ))}
          </div>
        </section>

        {/* Display Settings Section */}
        <section aria-labelledby="display-settings">
          <h2 id="display-settings" className="text-xl font-semibold mb-4">
            Display Settings
          </h2>
          <div role="group" aria-label="Display preferences">
            {Object.entries(settings.display)
              .filter(([key]) => key !== "severityFilter")
              .map(([key, value]) => (
                <div key={key} className="mb-4">
                  <label
                    htmlFor={`display-${key}`}
                    className="flex items-center gap-2"
                  >
                    <input
                      id={`display-${key}`}
                      type="checkbox"
                      checked={value as boolean}
                      onChange={async () => {
                        const newSettings = {
                          ...settings,
                          display: {
                            ...settings.display,
                            [key]: !value,
                          },
                        };
                        await updateSettings(newSettings);
                      }}
                    />
                    <span>{key.replace(/([A-Z])/g, " $1").toLowerCase()}</span>
                  </label>
                </div>
              ))}
          </div>
        </section>
      </form>
    </main>
  );
}
