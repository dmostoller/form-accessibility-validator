interface FormFieldGroup {
  name: string;
  fields: HTMLElement[];
}

export const findFormGroups = (form: HTMLFormElement): FormFieldGroup[] => {
  const groups: FormFieldGroup[] = [];

  // Find explicit fieldsets
  form.querySelectorAll("fieldset").forEach((fieldset) => {
    groups.push({
      name: fieldset.querySelector("legend")?.textContent || "Unnamed group",
      fields: Array.from(fieldset.querySelectorAll("input, select, textarea")),
    });
  });

  // Find related fields by name patterns
  const ungroupedFields = Array.from(
    form.querySelectorAll("input, select, textarea"),
  ).filter((field) => !field.closest("fieldset"));

  const patterns = new Map<string, HTMLElement[]>();
  ungroupedFields.forEach((field) => {
    const name = field.getAttribute("name") || "";
    const base = name.replace(/\[\d*\]$/, "");
    if (base) {
      if (!patterns.has(base)) {
        patterns.set(base, []);
      }
      patterns.get(base)?.push(field as HTMLElement);
    }
  });

  patterns.forEach((fields, name) => {
    if (fields.length > 1) {
      groups.push({ name, fields });
    }
  });

  return groups;
};

export const validateFormControl = (
  element: HTMLElement,
): {
  hasLabel: boolean;
  hasAutocomplete: boolean;
  hasErrorMessage: boolean;
  hasErrorAssociation: boolean | undefined;
} => {
  const hasLabel =
    element.hasAttribute("aria-label") ||
    element.hasAttribute("aria-labelledby") ||
    !!element.querySelector("label");

  const hasAutocomplete =
    element.hasAttribute("autocomplete") &&
    ["name", "email", "tel", "address"].includes(
      element.getAttribute("autocomplete") || "",
    );

  const id = element.getAttribute("id");
  const hasErrorMessage = id
    ? !!document.querySelector(`[aria-errormessage="${id}"]`)
    : false;

  const hasErrorAssociation =
    element.getAttribute("aria-invalid") === "true" &&
    element.getAttribute("aria-describedby")?.includes("error");

  return {
    hasLabel,
    hasAutocomplete,
    hasErrorMessage,
    hasErrorAssociation,
  };
};
