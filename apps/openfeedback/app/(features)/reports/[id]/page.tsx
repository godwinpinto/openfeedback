"use client";

import * as React from "react";
import { useParams } from "next/navigation";

export default function ReportPage() {
  const params = useParams();
  const id = params.id as string;

  return (
    <div className="relative min-h-screen pt-16 pb-24">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Report {id}</h1>
          <p className="text-muted-foreground">Viewing report details for ID: {id}</p>
        </div>
      </div>
    </div>
  );
}

