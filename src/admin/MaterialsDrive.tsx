import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lg/supabase";

type Folder = { id: string; name: string; parent_id: string | null; created_at: string };
type Batch = { id: string; name: string; cls: string | null; sec: string | null; status: string | null };
type Material = { id: string; title?: string; name?: string; folder_id: string | null; batch_id?: string | null; storage_path?: string | null; file_size?: number | null; mime_type?: string | null; created_at: string; subject?: string | null; cls?: string | null; sec?: string | null };

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const ACCEPT = ".pdf,.ppt,.pptx,.doc,.docx,.png,.jpg,.jpeg";
const SUBJECTS_BY_CLASS: Record<string, string[]> = {
  "9": ["Science", "English", "Maths", "Social Studies"],
  "10": ["Science", "English", "Maths", "Social Studies"],
  "11": ["Accountancy", "Business Studies", "Economics", "Applied Mathematics", "Informatics Practices", "Entrepreneurship", "Physical Education"],
  "12": ["Accountancy", "Business Studies", "Economics", "Applied Mathematics", "Informatics Practices", "Entrepreneurship", "Physical Education"],
};

function bytes(n: number | null | undefined) {
  if (!n) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function className(batch: Batch | undefined) {
  if (!batch) return "";
  return String(batch.cls || batch.name || "").trim();
}

function sectionName(batch: Batch | undefined) {
  return String(batch?.sec || "").trim();
}

function sameText(a: unknown, b: unknown) {
  return String(a ?? "").trim().toLowerCase() === String(b ?? "").trim().toLowerCase();
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

  const selectedBatch = useMemo(() => batches.find((b) => b.id === selectedBatchId), [batches, selectedBatchId]);
  const currentChildren = useMemo(() => folders.filter((f) => f.parent_id === (current?.id ?? null)), [folders, current]);
  const currentFiles = useMemo(() => files.filter((f) => f.folder_id === (current?.id ?? null)), [files, current]);
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

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    const [folderResult, materialResult, batchResult] = await Promise.all([
      supabase.from("material_folders").select("id,name,parent_id,created_at").order("name"),
      supabase.from("materials").select("id,title,name,folder_id,batch_id,storage_path,file_size,mime_type,created_at,subject,cls,sec").order("created_at", { ascending: false }),
      supabase.from("batches").select("id,name,cls,sec,status").order("name"),
    ]);

    const errors: string[] = [];
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

  async function ensureFolder(name: string, parentId: string | null) {
    const wanted = name.trim();
    if (!wanted) throw new Error("Folder name is required.");

    const existing = folders.find((f) => f.parent_id === parentId && sameText(f.name, wanted));
    if (existing) return existing;

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) throw new Error("Your administrator session has expired. Please sign in again.");

    const { data, error: insertError } = await supabase
      .from("material_folders")
      .insert({ name: wanted, parent_id: parentId, created_by: authData.user.id })
      .select("id,name,parent_id,created_at")
      .single();
    if (insertError) throw insertError;
    return data as Folder;
  }

  async function openBatchWorkspace(batchId: string) {
    const batch = batches.find((b) => b.id === batchId);
    if (!batch) {
      setError("Select a valid batch first.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const classLabel = className(batch) || batch.name;
      const sectionLabel = sectionName(batch);
      const classFolder = await ensureFolder(classLabel, null);
      const sectionFolder = sectionLabel ? await ensureFolder(`Section ${sectionLabel}`, classFolder.id) : classFolder;
      const subjectFolders = SUBJECTS_BY_CLASS[classLabel] || [];
      for (const subject of subjectFolders) {
        await ensureFolder(subject, sectionFolder.id);
      }
      await load();
      setCurrent(sectionFolder);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to prepare the class workspace.");
    } finally {
      setBusy(false);
    }
  }

  async function createFolder() {
    const name = folderName.trim();
    if (!name) return;
    setBusy(true);
    setError("");
    try {
      await ensureFolder(name, current?.id ?? null);
      setFolderName("");
      setNewFolder(false);
      await load();
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
      setError("Select a batch before uploading so the correct students and parents receive the material.");
      return;
    }
    const batch = selectedBatch;
    if (!batch) {
      setError("Select a valid batch before uploading.");
      return;
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${crypto.randomUUID()}.${ext}`;
    setBusy(true);
    setError("");

    try {
      const classLabel = className(batch) || batch.name;
      const sectionLabel = sectionName(batch);
      const classFolder = await ensureFolder(classLabel, null);
      const sectionFolder = sectionLabel ? await ensureFolder(`Section ${sectionLabel}`, classFolder.id) : classFolder;
      const subject = current && current.parent_id === sectionFolder.id ? current.name : "";
      if (!subject) {
        await load();
        setCurrent(sectionFolder);
        setError("Open a subject folder before uploading a material.");
        return;
      }

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
        cls: batch.cls || null,
        sec: batch.sec || null,
        subject,
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

  const atSubject = Boolean(current && current.parent_id && folders.some((f) => f.id === current.parent_id && f.parent_id));

  return (
    <div
      className="drive-wrap"
      style={{ minHeight: "100%", padding: 28, fontFamily: "Poppins,system-ui,sans-serif", color: "#0F1B3D" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 18 }}>
        <div>
          <h2 style={{ margin: 0 }}>📚 Study Materials</h2>
          <p style={{ margin: "5px 0 0", color: "#64748B", fontSize: 13 }}>
            Class → section → subject folders keep every material in the right place.
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
          <button type="button" disabled={busy || !selectedBatchId} onClick={() => void openBatchWorkspace(selectedBatchId)} style={{ ...btn, opacity: selectedBatchId ? 1 : 0.55 }}>
            ✨ Open Class
          </button>
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

      {selectedBatch && (
        <div style={hint}>
          <b>{className(selectedBatch) || selectedBatch.name}</b>{sectionName(selectedBatch) ? ` · Section ${sectionName(selectedBatch)}` : ""}
          {atSubject ? <span style={{ marginLeft: 8, color: "#16A34A" }}>• Ready to upload into <b>{current?.name}</b></span> : <span style={{ marginLeft: 8, color: "#92400E" }}>• Open a subject folder to upload</span>}
        </div>
      )}

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
            {currentChildren.map((f) => (
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
            {currentFiles.map((f) => (
              <div key={f.id} style={item}>
                <div style={{ ...icon, fontSize: 26 }}>{f.mime_type?.includes("powerpoint") ? "📊" : f.mime_type?.includes("pdf") ? "📄" : "📎"}</div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <b style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name || f.title || "Untitled"}</b>
                  <span style={meta}>{f.subject ? `${f.subject} · ` : ""}{bytes(f.file_size)}</span>
                </div>
                <button type="button" title="Download" disabled={busy} onClick={() => void download(f)} style={more}>⬇</button>
                <button type="button" title="Delete" disabled={busy} onClick={() => void deleteFile(f)} style={more}>🗑</button>
              </div>
            ))}
            {!currentChildren.length && !currentFiles.length && (
              <div style={{ ...empty, gridColumn: "1/-1" }}>
                {current ? "This folder is empty." : "Choose a batch and open its class workspace to see Class → Section → Subject folders."}
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
const hint: React.CSSProperties = { background: "#EEF2FF", border: "1px solid #C7D2FE", color: "#3730A3", borderRadius: 14, padding: "10px 12px", marginBottom: 14, fontSize: 12 };
const item: React.CSSProperties = { display: "flex", alignItems: "center", gap: 10, padding: 14, background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, boxShadow: "0 4px 18px rgba(15,27,61,.06)" };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 12 };
const empty: React.CSSProperties = { padding: 50, textAlign: "center", color: "#64748B", background: "#fff", border: "1px dashed #CBD5E1", borderRadius: 16 };
const overlay: React.CSSProperties = { position: "fixed", inset: 0, zIndex: 100, background: "rgba(15,27,61,.45)", display: "grid", placeItems: "center", padding: 16 };
const dialog: React.CSSProperties = { width: "min(430px,100%)", background: "#fff", borderRadius: 20, padding: 24, boxShadow: "0 24px 70px rgba(15,27,61,.25)" };
const input: React.CSSProperties = { width: "100%", boxSizing: "border-box", border: "1px solid #CBD5E1", borderRadius: 11, padding: "12px 13px", outline: "none" };
const cancel: React.CSSProperties = { border: "1px solid #CBD5E1", borderRadius: 11, padding: "10px 14px", background: "#fff" };
const dialogActions: React.CSSProperties = { display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 };