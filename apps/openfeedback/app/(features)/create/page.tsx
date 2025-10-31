"use client";

import * as React from "react";
import CreateBuilder from "./components/CreateBuilder";
import { Toaster } from "@/lib/genui-sonner";

export default function CreatePage() {
  return (
    <>
    <Toaster richColors />

    <CreateBuilder />
    </>
  
  );
}


