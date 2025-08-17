import React from "react";
import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";
import { convertFileSrc } from "@tauri-apps/api/core";

/** Strongly-typed props for the `code` renderer */
type CodeProps = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLElement>,
  HTMLElement
> & {
  inline?: boolean;          // <-- the missing prop
  node?: any;                // react-markdown passes this too
};

function Img({
  src = "",
  alt = "",
  ...rest
}: React.ImgHTMLAttributes<HTMLImageElement>) {
  try {
    const isAbs = src.startsWith("/") || /^[A-Za-z]:\\/.test(src) || src.startsWith("file:");
    const finalSrc = isAbs ? convertFileSrc(src) : src;
    return <img src={finalSrc} alt={alt} {...rest} />;
  } catch {
    return <img src={src} alt={alt} {...rest} />;
  }
}

const components: Components = {
  code(props) {
    const { inline, className, children, ...rest } = props as CodeProps; // cast to our type
    if (inline) {
      return (
        <code className={className} {...rest}>
          {children}
        </code>
      );
    }
    return (
      <pre className="overflow-x-auto rounded-md bg-muted p-3">
        <code className={className} {...rest}>
          {children}
        </code>
      </pre>
    );
  },
  img: (p) => <Img {...(p as any)} />,
};

export default function MarkdownViewer({ markdown }: { markdown: string }) {
  return (
    <div className="prose max-w-none dark:prose-invert">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeHighlight]}
        components={components}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
