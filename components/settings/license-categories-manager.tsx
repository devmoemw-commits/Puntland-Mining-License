"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createLicenseCategory,
  setLicenseCategoryActive,
  updateLicenseCategory,
} from "@/lib/actions/license-categories.action";
import type { LicenseCategoryRecord } from "@/lib/data/get-license-categories";

type Props = {
  categories: LicenseCategoryRecord[];
  canManage: boolean;
};

const EMPTY_FORM = {
  name: "",
  description: "",
  new_license_fee: "",
  renewal_fee: "",
  sort_order: "0",
  is_active: true,
  is_free: false, // false = Paid (default)
};

type FormState = typeof EMPTY_FORM;

export function LicenseCategoriesManager({ categories, canManage }: Props) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);

    const payload = {
      name: form.name,
      description: form.description || undefined,
      // Free categories submit zero fees so validation never blocks on empty fees.
      new_license_fee: form.is_free ? "0" : form.new_license_fee,
      renewal_fee: form.is_free ? "0" : form.renewal_fee,
      is_free: form.is_free,
      sort_order: Number(form.sort_order || 0),
      is_active: form.is_active,
    };

    const result = editingId
      ? await updateLicenseCategory({ id: editingId, ...payload })
      : await createLicenseCategory(payload);

    setPending(false);

    if (result?.serverError || result?.validationErrors) {
      toast.error("Could not save category. Check the fee values.");
      return;
    }
    if (result?.data && "error" in result.data && result.data.error) {
      toast.error(String(result.data.error));
      return;
    }

    toast.success(editingId ? "Category updated" : "Category created");
    resetForm();
  }

  function startEdit(item: LicenseCategoryRecord) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      description: item.description ?? "",
      new_license_fee: item.new_license_fee,
      renewal_fee: item.renewal_fee,
      sort_order: String(item.sort_order),
      is_active: item.is_active,
      is_free: item.is_free,
    });
  }

  async function onToggleActive(item: LicenseCategoryRecord) {
    const result = await setLicenseCategoryActive({
      id: item.id,
      is_active: !item.is_active,
    });
    if (result?.serverError || result?.validationErrors) {
      toast.error("Could not update category.");
      return;
    }
    if (result?.data && "error" in result.data && result.data.error) {
      toast.error(String(result.data.error));
      return;
    }
    toast.success(item.is_active ? "Category deactivated" : "Category activated");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>
            {editingId ? "Edit license category" : "Add license category"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {canManage ? (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Category name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="e.g. Large Scale Mining"
                  disabled={pending}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, description: e.target.value }))
                  }
                  disabled={pending}
                />
              </div>

              {/* Pricing: Paid (default) or Free */}
              <div className="space-y-2">
                <Label>Pricing</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="pricing"
                      className="h-4 w-4"
                      checked={!form.is_free}
                      onChange={() => setForm((p) => ({ ...p, is_free: false }))}
                      disabled={pending}
                    />
                    <span>Paid</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="pricing"
                      className="h-4 w-4"
                      checked={form.is_free}
                      onChange={() => setForm((p) => ({ ...p, is_free: true }))}
                      disabled={pending}
                    />
                    <span>Free (no payment required)</span>
                  </label>
                </div>
                {form.is_free && (
                  <p className="text-xs text-muted-foreground">
                    Licenses in this category will be recorded as <strong>Free</strong> — no fee is charged.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new_license_fee">New License fee (USD)</Label>
                  <Input
                    id="new_license_fee"
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.is_free ? "" : form.new_license_fee}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, new_license_fee: e.target.value }))
                    }
                    placeholder={form.is_free ? "Free" : "0"}
                    disabled={pending || form.is_free}
                    required={!form.is_free}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="renewal_fee">Renewal fee (USD)</Label>
                  <Input
                    id="renewal_fee"
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.is_free ? "" : form.renewal_fee}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, renewal_fee: e.target.value }))
                    }
                    placeholder={form.is_free ? "Free" : "0"}
                    disabled={pending || form.is_free}
                    required={!form.is_free}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sort_order">Sort order</Label>
                  <Input
                    id="sort_order"
                    type="number"
                    min={0}
                    value={form.sort_order}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, sort_order: e.target.value }))
                    }
                    disabled={pending}
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={form.is_active}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, is_active: e.target.checked }))
                      }
                      disabled={pending}
                    />
                    <span>Active (shown in application forms)</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={pending}>
                  {pending ? "Saving..." : editingId ? "Update" : "Add category"}
                </Button>
                {editingId && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    disabled={pending}
                  >
                    Cancel edit
                  </Button>
                )}
              </div>
            </form>
          ) : (
            <p className="text-sm text-muted-foreground">
              You can view license categories but cannot manage them.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>License categories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No categories defined yet.
            </p>
          ) : (
            categories.map((item) => (
              <div key={item.id} className="rounded border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="flex items-center gap-2 font-medium">
                      {item.name}
                      {item.is_free ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                          Free
                        </span>
                      ) : (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                          Paid
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.is_free
                        ? "No payment required"
                        : `New: $${item.new_license_fee} · Renewal: $${item.renewal_fee}`}
                    </p>
                  </div>
                  <span
                    className={`text-xs ${
                      item.is_active
                        ? "text-green-600"
                        : "text-muted-foreground"
                    }`}
                  >
                    {item.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                {item.description && (
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                )}
                {canManage && (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => startEdit(item)}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant={item.is_active ? "destructive" : "secondary"}
                      size="sm"
                      onClick={() => onToggleActive(item)}
                    >
                      {item.is_active ? "Deactivate" : "Activate"}
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
