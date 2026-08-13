import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lg/supabase";

type Folder = { id: string; name: string; parent_id: string | null; created_at: string };
type Batch = { id: string; name: string; cls: string | null; sec: string | null; status: string | null };
type Material = { id: string; title?: string; name?: string; folder_id: string | null; batch_id?: string | null; storage_path?: string | null; file_size?: number | null; mime_type?: string | null; created_at: string };

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const ACCEPT = ".pdf,.ppt,.pptx,.doc,.docx,.png,.jpg,.jpeg";

function bytes(n: number | null | undefined) {
  if (!n) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function MaterialsDrive() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [files, setFiles] = useState<Material[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [current, setCurrent] = useState<Folder | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [newFolder, setNewFolder] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [rename, setRename] = useState<Folder | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    const [folderResult, materialResult, batchResult] = await Promise.all([
      supabase.from("material_folders").select("id,name,parent_id,created_at").order("name"),
      supabase.from("materials").select("id,title,name,folder_id,batch_id,storage_path,file_size,mime_type,created_at").order("created_at", { ascending: false }),
      supabase.from("batches").select("id,name,cls,sec,status").order("name"),
    ]);

    const errors: string[] = [];

    // Folders are the primary Study Materials workspace. Keep them independent
    // from material/batch failures so one secondary request can never blank Drive.
    if (folderResult.error) errors.push(`Folders: ${folderResult.error.message}`);
    else setFolders(folderResult.data || []);

    if (materialResult.error) errors.push(`Files: ${materialResult.error.message}`);
    else setFiles(materialResult.data || []);

    if (batchResult.error) errors.push(`Batches: ${batchResult.error.message}`);
    else setBatches((batchResult.data || []).filter((x) => !x.status || x.status === "active"));

    if (folderResult.data && current && !folderResult.data.some((folder) => folder.id === current.id)) {
      setCurrent(null);
    }

    setError(errors.join(" • "));
    setLoading(false);
  }, [current]);

  useEffect(() => {
    void load();
  }, [load]);

  const visibleFolders = useMemo(
    () => folders.filter((f) => f.parent_id === (current?.id ?? null)),
    [folders, current],
  );
  const visibleFiles = useMemo(
    () => files.filter((f) => f.folder_id === (current?.id ?? null)),
    [files, current],
  );
  const breadcrumbs = useMemo(() => {
    const out: Folder[] = [];
    let id = current?.id;
    while (id) {
      const folder = folders.find((x) => x.id === id);
      if (!folder) break;
      out.unshift(folder);
      id = folder.parent_id ?? undefined;
    }
    return out;
  }, [current, folders]);

  async function createFolder() {
    const name = folderName.trim();
    if (!name) return;
    setBusy(true);
    setError("");
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        setError("Your administrator session has expired. Please sign in again.");
        return;
      }
      const { error: e } = await supabase.from("material_folders").insert({
        name,
        parent_id: current?.id ?? null,
        created_by: authData.user.id,
      });
      if (e) setError(e.message);
      else {
        setFolderName("");
        setNewFolder(false);
        await load();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to create the folder.");
    } finally {
      setBusy(false);
    }
  }

  async function renameFolder() {
    if (!rename || !renameValue.trim()) return;
    setBusy(true);
    setError("");
    try {
      const { error: e } = await supabase
        .from("material_folders")
        .update({ name: renameValue.trim() })
        .eq("id", rename.id);
      if (e) setError(e.message);
      else {
        setRename(null);
        await load();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to rename the folder.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteFolder(folder: Folder) {
    if (!window.confirm(`Delete “${folder.name}” and everything inside it?`)) return;
    setBusy(true);
    setError("");
    try {
      const { data: allFolders, error: folderReadError } = await supabase
        .from("material_folders")
        .select("id,parent_id");
      if (folderReadError) {
        setError(folderReadError.message);
        return;
      }

      const ids = new Set<string>([folder.id]);
      let changed = true;
      while (changed) {
        changed = false;
        for (const f of allFolders || []) {
          if (f.parent_id && ids.has(f.parent_id) && !ids.has(f.id)) {
            ids.add(f.id);
            changed = true;
          }
        }
      }

      const targets = files.filter((f) => f.folder_id && ids.has(f.folder_id));
      const paths = targets.map((f) => f.storage_path).filter(Boolean) as string[];
      if (paths.length) {
        const { error: storageError } = await supabase.storage.from("materials").remove(paths);
        if (storageError) {
          setError(storageError.message);
          return;
        }
      }

      const { error: materialError } = await supabase
        .from("materials")
        .delete()
        .in("folder_id", [...ids]);
      if (materialError) {
        setError(materialError.message);
        return;
      }

      const { error: folderError } = await supabase
        .from("material_folders")
        .delete()
        .in("id", [...ids]);
      if (folderError) setError(folderError.message);
      else {
        if (current && ids.has(current.id)) setCurrent(null);
        await load();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to delete the folder.");
    } finally {
      setBusy(false);
    }
  }

  async function upload(file: File) {
    if (file.size > MAX_FILE_SIZE) {
      setError("File is larger than the 50 MB limit.");
      return;
    }
    if (!selectedBatchId) {
      setError("Select a batch before uploading so the correct students and parents receive the notification.");
      return;
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${crypto.randomUUID()}.${ext}`;
    setBusy(true);
    setError("");

    try {
      const { error: up } = await supabase.storage
        .from("materials")
        .upload(path, file, { upsert: false, contentType: file.type || undefined });
      if (up) {
        setError(up.message);
        return;
      }

      const { error: ins } = await supabase.from("materials").insert({
        title: safe,
        name: safe,
        folder_id: current?.id ?? null,
        batch_id: selectedBatchId,
        storage_path: path,
        file_size: file.size,
        mime_type: file.type || null,
      });
      if (ins) {
        await supabase.storage.from("materials").remove([path]);
        setError(ins.message);
      } else {
        await load();
      }
    } catch (e) {
      await supabase.storage.from("materials").remove([path]).catch(() => undefined);
      setError(e instanceof Error ? e.message : "Unable to upload the material.");
    } finally {
      setBusy(false);
    }
  }

  async function download(file: Material) {
    if (!file.storage_path) {
      setError("This material does not have a stored file yet.");
      return;
    }
    try {
      const { data, error: e } = await supabase.storage.from("materials").download(file.storage_path);
      if (e) {
        setError(e.message);
        return;
      }
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name || file.title || "material";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to download the material.");
    }
  }

  async function deleteFile(file: Material) {
    if (!window.confirm(`Delete “${file.name || file.title}”?`)) return;
    setBusy(true);
    setError("");
    try {
      if (file.storage_path) {
        const { error: storageError } = await supabase.storage
          .from("materials")
          .remove([file.storage_path]);
        if (storageError) {
          setError(storageError.message);
          return;
        }
      }
      const { error: e } = await supabase.from("materials").delete().eq("id", file.id);
      if (e) setError(e.message);
      else await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to delete the material.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="drive-wrap"
      style={{ minHeight: "100%", padding: 28, fontFamily: "Poppins,system-ui,sans-serif", color: "#0F1B3D" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 18 }}>
        <div>
          <h2 style={{ margin: 0 }}>📚 Study Materials</h2>
          <p style={{ margin: "5px 0 0", color: "#64748B", fontSize: 13 }}>
            Organize notes, PDFs and presentations like Google Drive. Maximum file size: 50 MB.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <select value={selectedBatchId} onChange={(e) => setSelectedBatchId(e.target.value)} disabled={busy} aria-label="Target batch" style={batchSelect}>
            <option value="">Select batch</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}{b.cls || b.sec ? ` — ${[b.cls, b.sec].filter(Boolean).join("-")}` : ""}
              </option>
            ))}
          </select>
          <button type="button" disabled={busy} onClick={() => setNewFolder(true)} style={btn}>📁 New Folder</button>
          <label style={{ ...btn, cursor: busy ? "wait" : "pointer", opacity: busy ? 0.6 : 1 }}>
            ⬆ Upload
            <input hidden disabled={busy} type="file" accept={ACCEPT} onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); e.currentTarget.value = ""; }} />
          </label>
          <button type="button" disabled={busy} onClick={() => void load()} style={btn}>↻</button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap", marginBottom: 14, fontSize: 13 }}>
        <button type="button" onClick={() => setCurrent(null)} style={crumb}>My Drive</button>
        {breadcrumbs.map((f) => (
          <span key={f.id}> / <button type="button" onClick={() => setCurrent(f)} style={crumb}>{f.name}</button></span>
        ))}
      </div>

      {error && (
        <div style={{ background: "#FEF2F2", color: "#B91C1C", border: "1px solid #FECACA", padding: 12, borderRadius: 12, marginBottom: 14 }}>
          {error}
        </div>
      )}

      <div className="drive-grid" style={grid}>
        {loading ? (
          <div style={empty}>Loading…</div>
        ) : (
          <>
            {visibleFolders.map((f) => (
              <div key={f.id} style={item} onDoubleClick={() => setCurrent(f)}>
                <button type="button" onClick={() => setCurrent(f)} style={icon}>📁</button>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <b style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis" }}>{f.name}</b>
                  <span style={meta}>Folder</span>
                </div>
                <button type="button" title="Rename" disabled={busy} onClick={() => { setRename(f); setRenameValue(f.name); }} style={more}>✎</button>
                <button type="button" title="Delete" disabled={busy} onClick={() => void deleteFolder(f)} style={more}>🗑</button>
              </div>
            ))}
            {visibleFiles.map((f) => (
              <div key={f.id} style={item}>
                <div style={{ ...icon, fontSize: 26 }}>{f.mime_type?.includes("powerpoint") ? "📊" : f.mime_type?.includes("pdf") ? "📄" : "📎"}</div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <b style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name || f.title || "Untitled"}</b>
                  <span style={meta}>{bytes(f.file_size)}</span>
                </div>
                <button type="button" title="Download" disabled={busy} onClick={() => void download(f)} style={more}>⬇</button>
                <button type="button" title="Delete" disabled={busy} onClick={() => void deleteFile(f)} style={more}>🗑</button>
              </div>
            ))}
            {!visibleFolders.length && !visibleFiles.length && (
              <div style={{ ...empty, gridColumn: "1/-1" }}>
                This folder is empty. Create a folder or upload a file.
              </div>
            )}
          </>
        )}
      </div>

      {newFolder && (
        <div style={overlay}>
          <div style={dialog}>
            <h3 style={{ marginTop: 0 }}>New Folder</h3>
            <input autoFocus value={folderName} onChange={(e) => setFolderName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void createFolder(); }} placeholder="Folder name" style={input} />
            <div style={dialogActions}>
              <button type="button" onClick={() => setNewFolder(false)} style={cancel}>Cancel</button>
              <button type="button" disabled={busy} onClick={() => void createFolder()} style={btn}>Create</button>
            </div>
          </div>
        </div>
      )}

      {rename && (
        <div style={overlay}>
          <div style={dialog}>
            <h3 style={{ marginTop: 0 }}>Rename Folder</h3>
            <input autoFocus value={renameValue} onChange={(e) => setRenameValue(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void renameFolder(); }} style={input} />
            <div style={dialogActions}>
              <button type="button" onClick={() => setRename(null)} style={cancel}>Cancel</button>
              <button type="button" disabled={busy} onClick={() => void renameFolder()} style={btn}>Save</button>
            </div>
          </div>
        </div>
      )}

      <style>{`@media(max-width:650px){.drive-grid{grid-template-columns:1fr!important}.drive-wrap{padding:16px!important}}`}</style>
    </div>
  );
}

const btn: React.CSSProperties = { border: 0, borderRadius: 11, padding: "10px 14px", background: "#4361EE", color: "#fff", fontWeight: 750 };
const batchSelect: React.CSSProperties = { border: "1px solid #CBD5E1", borderRadius: 11, padding: "10px 12px", background: "#fff", color: "#0F1B3D", fontWeight: 650, minWidth: 170 };
const crumb: React.CSSProperties = { border: 0, background: "transparent", color: "#4361EE", fontWeight: 700, cursor: "pointer", padding: 2 };
const more: React.CSSProperties = { border: 0, background: "transparent", cursor: "pointer", padding: 7, borderRadius: 8 };
const icon: React.CSSProperties = { border: 0, background: "transparent", cursor: "pointer", fontSize: 30, padding: 0 };
const meta: React.CSSProperties = { color: "#94A3B8", fontSize: 11 };
const item: React.CSSProperties = { display: "flex", alignItems: "center", gap: 10, padding: 14, background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, boxShadow: "0 4px 18px rgba(15,27,61,.06)" };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 12 };
const empty: React.CSSProperties = { padding: 50, textAlign: "center", color: "#64748B", background: "#fff", border: "1px dashed #CBD5E1", borderRadius: 16 };
const overlay: React.CSSProperties = { position: "fixed", inset: 0, zIndex: 100, background: "rgba(15,27,61,.45)", display: "grid", placeItems: "center", padding: 16 };
const dialog: React.CSSProperties = { width: "min(430px,100%)", background: "#fff", borderRadius: 20, padding: 24, boxShadow: "0 24px 70px rgba(15,27,61,.25)" };
const input: React.CSSProperties = { width: "100%", boxSizing: "border-box", border: "1px solid #CBD5E1", borderRadius: 11, padding: "12px 13px", outline: "none" };
const cancel: React.CSSProperties = { border: "1px solid #CBD5E1", borderRadius: 11, padding: "10px 14px", background: "#fff" };
const dialogActions: React.CSSProperties = { display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 };
