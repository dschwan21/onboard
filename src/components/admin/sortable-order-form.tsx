"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type SortableItem = {
  id: string;
  label: string;
  detail?: string | null;
  href?: string;
  actionLabel?: string;
};

type SortableOrderFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  emptyLabel: string;
  hiddenFields: Record<string, string>;
  items: SortableItem[];
};

function moveItem<T>(items: T[], from: number, to: number) {
  const nextItems = [...items];
  const [moved] = nextItems.splice(from, 1);
  nextItems.splice(to, 0, moved);
  return nextItems;
}

export function SortableOrderForm({
  action,
  emptyLabel,
  hiddenFields,
  items: initialItems
}: SortableOrderFormProps) {
  const [items, setItems] = useState(initialItems);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const orderedIdsRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setItems(initialItems);
    setIsSaving(false);
  }, [initialItems]);

  function commit(nextItems: SortableItem[]) {
    if (!orderedIdsRef.current || !formRef.current) {
      return;
    }

    setItems(nextItems);
    setIsSaving(true);
    orderedIdsRef.current.value = nextItems.map((item) => item.id).join(",");
    formRef.current.requestSubmit();
  }

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <form action={action} ref={formRef} className="space-y-3">
      {Object.entries(hiddenFields).map(([key, value]) => (
        <input key={key} name={key} type="hidden" value={value} />
      ))}
      <input
        defaultValue={items.map((item) => item.id).join(",")}
        name="orderedIds"
        ref={orderedIdsRef}
        type="hidden"
      />
      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={item.id}
            className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
              draggedId === item.id ? "border-primary bg-secondary" : "border-border bg-card"
            }`}
          >
            <button
              className="flex min-w-0 flex-1 items-center justify-between text-left"
              draggable
              onDragOver={(event) => {
                event.preventDefault();
              }}
              onDragStart={() => {
                setDraggedId(item.id);
              }}
              onDrop={(event) => {
                event.preventDefault();
                const sourceIndex = items.findIndex((entry) => entry.id === draggedId);

                if (sourceIndex === -1 || sourceIndex === index) {
                  setDraggedId(null);
                  return;
                }

                commit(moveItem(items, sourceIndex, index));
                setDraggedId(null);
              }}
              onDragEnd={() => {
                setDraggedId(null);
              }}
              type="button"
            >
              <span className="min-w-0">
                <span className="block font-medium">{item.label}</span>
                {item.detail ? (
                  <span className="block truncate text-sm text-muted-foreground">{item.detail}</span>
                ) : null}
              </span>
              <span className="shrink-0 text-xs uppercase tracking-[0.15em] text-muted-foreground">
                Drag
              </span>
            </button>
            {item.href ? (
              <Link
                className="ml-4 shrink-0 text-sm font-medium text-primary hover:underline"
                href={item.href}
              >
                {item.actionLabel ?? "Open"}
              </Link>
            ) : null}
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Drag items into a new order. Changes save automatically.
        {isSaving ? " Saving..." : ""}
      </p>
    </form>
  );
}
