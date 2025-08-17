import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../../api";
import type { DocDetail } from "../../types";
import MarkdownViewer from "@/components/markdown-viewer";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { open } from "@tauri-apps/plugin-dialog";
import { readFile } from "@tauri-apps/plugin-fs";

export function DocEditor() {
  const { id } = useParams<{ id: string }>();
  const [doc, setDoc] = useState<DocDetail | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [status, setStatus] = useState("draft");
  const [body, setBody] = useState("");

  useEffect(() => {
    if (!id) return;
    api.getDoc(id).then((d) => {
      setDoc(d);
      setTitle(d.title);
      setSlug(d.slug || "");
      setStatus(String(d.status));
      setBody(d.body_md);
    });
  }, [id]);

  // debounced autosave
  useEffect(() => {
    if (!doc) return;
    const h = setTimeout(() => {
      api.updateDocBody(doc.id, body).catch(console.error);
    }, 600);
    return () => clearTimeout(h);
  }, [body, doc]);

  function u8ToBase64(u8: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < u8.length; i++) bin += String.fromCharCode(u8[i]);
  return btoa(bin);
}

  async function saveMeta() {
    if (!doc) return;
    await api.updateDocMeta({ id: doc.id, title, slug, status });
    setDoc(await api.getDoc(doc.id));
  }

async function insertImage() {
  if (!doc) return;

  const file = await open({
    multiple: false,
    filters: [{ name: "Images", extensions: ["png","jpg","jpeg","webp","gif","svg"] }],
  });
  if (!file || Array.isArray(file)) return;

  const path = file as string;
  const bytes = await readFile(path);          // <-- v2 API
  const b64 = u8ToBase64(bytes);               // <-- convert
  const savedPath = await api.saveDocAttachment({
    doc_id: doc.id,
    filename: path.split(/[\\/]/).pop() || "image",
    bytes_base64: b64,
  });

  setBody(prev => `${prev}\n\n![](${savedPath})\n`);
}

  if (!doc) return <div className="text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{doc.title}</h2>
        <div className="flex gap-2">
          <Button asChild variant="secondary"><Link to="/docs">Back</Link></Button>
          <Button onClick={insertImage}>Insert image</Button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Meta</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Slug</Label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Input value={status} onChange={(e) => setStatus(e.target.value)} placeholder="draft | in_review | published" />
          </div>
          <div className="md:col-span-3 flex justify-end">
            <Button onClick={saveMeta}>Save</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="h-[70vh] flex flex-col">
          <CardHeader><CardTitle className="text-base">Markdown</CardTitle></CardHeader>
          <CardContent className="flex-1">
            <Textarea className="h-full min-h-[50vh] font-mono text-sm" value={body} onChange={(e) => setBody(e.target.value)} />
          </CardContent>
        </Card>

        <Card className="h-[70vh] overflow-hidden">
          <CardHeader><CardTitle className="text-base">Preview</CardTitle></CardHeader>
          <CardContent className="h-full overflow-auto">
            <MarkdownViewer markdown={body} />
          </CardContent>
        </Card>
      </div>

      <Separator />
    </div>
  );
}
