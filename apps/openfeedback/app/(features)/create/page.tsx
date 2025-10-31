"use client";

import * as React from "react";
import CreateBuilder from "./components/CreateBuilder";
import { AssistantProvider } from "voiceable";

export default function CreatePage() {
  return (
  <AssistantProvider>
    <CreateBuilder />
    </AssistantProvider>
  );
}


