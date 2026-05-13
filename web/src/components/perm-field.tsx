/** Case à cocher + champ caché : envoi explicite true/false pour FormData. */
export function PermField({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-transparent px-1 py-1 text-sm transition hover:border-cabinet-border/80 hover:bg-white/60">
      <input type="hidden" name={name} value="false" />
      <input
        type="checkbox"
        name={name}
        value="true"
        defaultChecked={defaultChecked}
        className="h-4 w-4 rounded border-cabinet-border text-cabinet-primary focus:ring-cabinet-accent"
      />
      <span className="text-cabinet-text">{label}</span>
    </label>
  );
}
