import { useEffect, useState } from "react";
import { invoke } from "@pc-nexus/bridge";
import { NxContent, NxHeader, NxLayout, NxText } from "@pc-nexus/react";

export function App() {
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    invoke<string, string>("greeting", "Nexus")
      .then((res) => setResult(res))
      .catch((err: Error) => setResult(`Error: ${err}`));
  }, []);

  return (
    <NxLayout>
      <NxHeader title="Page Title" divided={true} />
      <NxContent className="px-5">
        <NxText size="large" className="mt-3">
          {result}
        </NxText>
      </NxContent>
    </NxLayout>
  );
}
