import React from "react";
import CatalogClient from "./CatalogClient";

export default function CatalogPage() {
  return (
    <React.Suspense fallback={null}>
      <CatalogClient />
    </React.Suspense>
  );
}
