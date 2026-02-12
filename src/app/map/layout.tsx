// app/map/layout.tsx
import React from "react";
import "../css/map.css";

export default function MapLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="map-page">
      {children}
    </div>
  );
}