// src/pages/ShortcutsPage.tsx
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { ApiShortcut } from "../types/shortcut";
import { EmpresaSelector } from "../components/shortcuts/EmpresaSelector";
import { ShortcutCard } from "../components/shortcuts/ShortcutCard";
import { ShortcutFormModal } from "../components/shortcuts/ShortcutFormModal";

export function ShortcutsPage() {
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [shortcuts, setShortcuts] = useState<ApiShortcut[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingShortcut, setEditingShortcut] = useState<ApiShortcut | null>(
    null
  );

  const [shortcutToDelete, setShortcutToDelete] = useState<ApiShortcut | null>(
    null
  );
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function loadShortcuts(currentEmpresaId: string | null) {
    if (!currentEmpresaId) return;
    setLoading(true);
    setError(null);

    try {
      const res = await api.get("/shortcuts", {
        params: { empresaId: currentEmpresaId },
      });
      setShortcuts(res.data.shortcuts || []);
    } catch (err: any) {
      console.error("Erro ao carregar atalhos:", err);
      const msg =
        err?.response?.data?.error || "Erro ao carregar lista de atalhos.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (empresaId) {
      loadShortcuts(empresaId);
    }
  }, [empresaId]);

  function handleShortcutCreated(newShortcut: ApiShortcut) {
    setShortcuts((prev) => [newShortcut, ...prev]);
  }

  function handleShortcutUpdated(updated: ApiShortcut) {
    setShortcuts((prev) =>
      prev.map((s) => (s.id === updated.id ? updated : s))
    );
  }

  async function handleConfirmDelete() {
    if (!shortcutToDelete) return;
    setDeleting(true);
    setDeleteError(null);

    try {
      await api.delete(`/shortcuts/${shortcutToDelete.id}`);
      setShortcuts((prev) =>
        prev.filter((s) => s.id !== shortcutToDelete.id)
      );
      setShortcutToDelete(null);
    } catch (err: any) {
      console.error("Erro ao excluir atalho:", err);
      const msg =
        err?.response?.data?.error || "Erro ao excluir atalho. Tente novamente.";
      setDeleteError(msg);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">
            Atalhos rápidos
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Links de acesso rápido pros sistemas da empresa, globais, por
            empresa ou só seus.
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <EmpresaSelector value={empresaId} onChange={setEmpresaId} />
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 rounded-md bg-sky-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-sky-700"
          >
            <span className="text-base leading-none">+</span>
            Novo atalho
          </button>
        </div>
      </header>

      {error && (
        <div className="rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="h-4 w-4 animate-spin rounded-full border border-slate-300 border-t-transparent" />
          Carregando atalhos...
        </div>
      )}

      {!loading && !shortcuts.length && empresaId && !error && (
        <p className="text-sm text-slate-500">
          Nenhum atalho cadastrado para essa empresa ainda.
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {shortcuts.map((shortcut) => (
          <ShortcutCard
            key={shortcut.id}
            shortcut={shortcut}
            onEdit={(s) => setEditingShortcut(s)}
            onDelete={(s) => setShortcutToDelete(s)}
          />
        ))}
      </div>

      <p className="text-xs text-slate-400">
        Depois dá pra filtrar por tipo (global, empresa, privado) e por cargo,
        inclusive.
      </p>

      {/* Modal de criar */}
      <ShortcutFormModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        empresaId={empresaId}
        onCreated={handleShortcutCreated}
      />

      {/* Modal de editar */}
      {editingShortcut && (
        <ShortcutFormModal
          open={!!editingShortcut}
          onClose={() => setEditingShortcut(null)}
          empresaId={empresaId}
          shortcutToEdit={editingShortcut}
          onUpdated={handleShortcutUpdated}
        />
      )}

      {/* Modal de confirmação de delete */}
      {shortcutToDelete && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl p-4">
            <h3 className="text-sm font-semibold text-slate-900">
              Confirmar exclusão
            </h3>
            <p className="mt-2 text-xs text-slate-600">
              Tem certeza que deseja excluir o atalho{" "}
              <span className="font-semibold">
                {shortcutToDelete.titulo || shortcutToDelete.url}
              </span>
              ? Essa ação não poderá ser desfeita.
            </p>

            {deleteError && (
              <div className="mt-2 rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-700">
                {deleteError}
              </div>
            )}

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setShortcutToDelete(null)}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="inline-flex items-center gap-2 rounded-md bg-rose-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-rose-700 disabled:opacity-60"
              >
                {deleting && (
                  <span className="h-3 w-3 animate-spin rounded-full border border-white/60 border-t-transparent" />
                )}
                Excluir atalho
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
