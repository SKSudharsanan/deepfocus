import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { api } from "../../api";
import type { DocDetail } from "../../types";
import MarkdownViewer from "@/components/markdown-viewer";
import { convertFileSrc } from "@tauri-apps/api/core";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

function fmt(v?: string | null) {
  if (!v) return "—";
  try { return new Date(v).toLocaleString(); } catch { return v; }
}

export function DocView() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const [doc, setDoc] = useState<DocDetail | null>(null);

  useEffect(() => {
    if (!id) return;
    api.getDoc(id).then(setDoc).catch(console.error);
  }, [id]);

  if (!doc) return <div className="text-sm text-muted-foreground">Loading…</div>;

  const coverSrc =
    doc.cover_path && (doc.cover_path.startsWith("/") || /^[A-Za-z]:\\/.test(doc.cover_path) || doc.cover_path.startsWith("file:"))
      ? convertFileSrc(doc.cover_path)
      : (doc.cover_path || "");

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <h2 className="truncate text-xl font-semibold">{doc.title}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{String(doc.status)}</Badge>
            {doc.slug ? <Badge variant="outline">/{doc.slug}</Badge> : null}
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="secondary"><Link to="/docs">Back</Link></Button>
          <Button asChild><Link to={`/docs/${doc.id}/edit`}>Edit</Link></Button>
        </div>
      </div>

      {/* Meta */}
      <Card>
        <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1">
            <Label>Project</Label>
            <div className="text-sm">{doc.project_id}</div>
          </div>
          <div className="space-y-1">
            <Label>Created</Label>
            <div className="text-sm">{fmt(doc.created_at)}</div>
          </div>
          <div className="space-y-1">
            <Label>Updated</Label>
            <div className="text-sm">{fmt(doc.updated_at)}</div>
          </div>
        </CardContent>
      </Card>

      {/* Cover */}
      {doc.cover_path ? (
        <Card>
          <CardContent className="p-0">
            <img
              src={coverSrc}
              alt="Cover"
              className="h-56 w-full rounded-md object-cover"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            />
          </CardContent>
        </Card>
      ) : null}

      {/* Content */}
      <Card>
        <CardHeader><CardTitle className="text-base">Content</CardTitle></CardHeader>
        <CardContent>
          <div className="prose max-w-none dark:prose-invert">
            <MarkdownViewer markdown={doc.body_md} />
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Optional: quick actions */}
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={() => nav(-1)}>Close</Button>
        <Button asChild><Link to={`/docs/${doc.id}/edit`}>Edit Document</Link></Button>
      </div>
    </div>
  );
}
