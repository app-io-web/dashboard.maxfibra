// src/pages/PasswordsPage.tsx
// src/pages/PasswordsPage.tsx
import { useEffect, useState } from "react";
import { api } from "../lib/api";

import { PasswordFormModal } from "../components/passwords/PasswordFormModal";
import type { PasswordFormValues } from "../components/passwords/PasswordFormModal";

import { PasswordRow } from "../components/passwords/PasswordRow";

export type ApiPassword = {
  id: string;
  auth_empresa_id: string | null;
  auth_user_id: string;
  nome: string | null;
  email: string | null;
  url: string | null;
  anotacao: string | null;
  senha_status: string | null; // "[ENCRYPTED]" ou null
  created_at: string;
  updated_at: string;
};

type RevealedPasswordResponse = {
  password: {
    id: string;
    senha: string; // já decriptada pelo pgp_sym_decrypt
  };
};

export function PasswordsPage() {
  const [items, setItems] = useState<ApiPassword[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [visibleId, setVisibleId] = useState<string | null>(null);
  const [revealedPasswords, setRevealedPasswords] = useState<
    Record<string, string>
  >({});
  const [revealLoadingId, setRevealLoadingId] = useState<string | null>(null);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createMessage, setCreateMessage] = useState<string | null>(null);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<ApiPassword | null>(null);
  const [editMessage, setEditMessage] = useState<string | null>(null);
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);


  async function loadPasswords() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ passwords: ApiPassword[] }>("/passwords");
      setItems(res.data.passwords);
    } catch (err: any) {
      console.error("Erro ao carregar passwords:", err);
      setError("Não foi possível carregar as senhas.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPasswords();
  }, []);

  async function handleToggleVisible(id: string) {
    if (visibleId === id) {
      setVisibleId(null);
      return;
    }

    if (revealedPasswords[id]) {
      setVisibleId(id);
      return;
    }

    try {
      setRevealLoadingId(id);
      const res = await api.get<RevealedPasswordResponse>(
        `/passwords/${id}/reveal`
      );

      const senha = res.data.password.senha;

      setRevealedPasswords((prev) => ({
        ...prev,
        [id]: senha,
      }));
      setVisibleId(id);
    } catch (err: any) {
      console.error("Erro ao revelar senha:", err);
      alert("Erro ao revelar a senha. Verifique permissões e logs.");
    } finally {
      setRevealLoadingId(null);
    }
  }

  function handleCopy(id: string) {
    const value = revealedPasswords[id];
    if (!value) return;
    navigator.clipboard
      .writeText(value)
      .then(() => {
        alert("Senha copiada para a área de transferência.");
      })
      .catch(() => {
        alert("Não foi possível copiar a senha.");
      });
  }

  // CREATE
  async function handleCreateSubmit(values: PasswordFormValues) {
    setCreateLoading(true);
    setCreateMessage(null);
    try {
      await api.post("/passwords", {
        nome: values.nome || null,
        email: values.email || null,
        url: values.url || null,
        senha: values.senha, // obrigatório
        anotacao: values.anotacao || null,
      });

      setCreateMessage("Senha cadastrada com sucesso.");
      setCreateModalOpen(false);
      await loadPasswords();
    } catch (err: any) {
      console.error("Erro ao criar senha:", err);
      setCreateMessage("Erro ao criar senha. Veja o console/backend para detalhes.");
    } finally {
      setCreateLoading(false);
    }
  }

  // EDIT
  function openEditModal(item: ApiPassword) {
    setEditingItem(item);
    setEditMessage(null);
    setEditModalOpen(true);
  }

  async function handleEditSubmit(values: PasswordFormValues) {
    if (!editingItem) return;

    setEditLoading(true);
    setEditMessage(null);

    try {
      const payload: any = {
        nome: values.nome || null,
        email: values.email || null,
        url: values.url || null,
        anotacao: values.anotacao || null,
      };

      // só manda senha se quiser realmente trocar
      if (values.senha.trim() !== "") {
        payload.senha = values.senha;
      }

      await api.put(`/passwords/${editingItem.id}`, payload);

      setEditMessage("Senha atualizada com sucesso.");
      setEditModalOpen(false);
      setEditingItem(null);
      await loadPasswords();
    } catch (err: any) {
      console.error("Erro ao atualizar senha:", err);
      setEditMessage("Erro ao atualizar senha. Veja logs para detalhes.");
    } finally {
      setEditLoading(false);
    }
  }

  async function handleDelete(id: string) {
  setDeleteMessage(null);
  try {
    await api.delete(`/passwords/${id}`);

    // limpa visibilidade e cache da senha revelada
    setItems((prev) => prev.filter((p) => p.id !== id));
    setRevealedPasswords((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    if (visibleId === id) {
      setVisibleId(null);
    }

    setDeleteMessage("Senha removida com sucesso.");
  } catch (err: any) {
    console.error("Erro ao deletar senha:", err);
    setDeleteMessage("Erro ao remover senha. Veja logs para detalhes.");
  }
}


  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">
            Cofre de senhas
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Central de credenciais sensíveis da operação. Tudo vem de{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">
              /passwords
            </code>{" "}
            com criptografia forte no backend.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setCreateMessage(null);
            setCreateModalOpen(true);
          }}
          className="inline-flex items-center rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white shadow-sm hover:bg-emerald-700"
        >
          + Adicionar nova senha
        </button>
      </header>

      {createMessage && (
        <p className="text-xs text-slate-500">{createMessage}</p>
      )}
      {editMessage && (
        <p className="text-xs text-slate-500">{editMessage}</p>
      )}
      {deleteMessage && (
        <p className="text-xs text-slate-500">{deleteMessage}</p>
      )}


      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm overflow-x-auto">
        {loading ? (
          <p className="text-sm text-slate-500">Carregando senhas...</p>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-slate-500">
            Nenhuma senha cadastrada ainda.
          </p>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold text-slate-600 uppercase">
                <th className="px-3 py-2">Nome</th>
                <th className="px-3 py-2">Usuário</th>
                <th className="px-3 py-2">URL</th>
                <th className="px-3 py-2">Senha</th>
                <th className="px-3 py-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <PasswordRow
                  key={item.id}
                  item={item}
                  revealedPassword={revealedPasswords[item.id]}
                  isVisible={visibleId === item.id}
                  revealLoading={revealLoadingId === item.id}
                  onToggleVisible={() => handleToggleVisible(item.id)}
                  onCopy={() => handleCopy(item.id)}
                  onEdit={() => openEditModal(item)}
                  onDelete={() => handleDelete(item.id)}   // <-- AQUI
                />
              ))}
            </tbody>
          </table>
        )}

        <p className="mt-3 text-xs text-slate-400">
          Segurança: senha é sempre criptografada no banco via{" "}
          <code className="bg-slate-100 rounded px-1 text-[10px]">
            pgp_sym_encrypt
          </code>{" "}
          com a chave{" "}
          <code className="bg-slate-100 rounded px-1 text-[10px]">
            CENTRAL_ENCRYPTION_KEY
          </code>
          . Nada de logar senha em texto puro em lugar nenhum.
        </p>
      </div>

      {/* Modal de criação */}
      <PasswordFormModal
        open={createModalOpen}
        mode="create"
        loading={createLoading}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateSubmit}
      />

      {/* Modal de edição */}
      <PasswordFormModal
        open={editModalOpen}
        mode="edit"
        loading={editLoading}
        initialValues={
          editingItem
            ? {
                nome: editingItem.nome ?? "",
                email: editingItem.email ?? "",
                url: editingItem.url ?? "",
                anotacao: editingItem.anotacao ?? "",
              }
            : undefined
        }
        onClose={() => {
          setEditModalOpen(false);
          setEditingItem(null);
        }}
        onSubmit={handleEditSubmit}
      />
    </div>
  );
}
