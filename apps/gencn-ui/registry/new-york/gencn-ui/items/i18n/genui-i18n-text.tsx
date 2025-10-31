"use client";
import * as React from "react";
import { Languages } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { translateOnce } from "@/registry/new-york/gencn-ui/items/shared/lib/translator";
import { detectLanguages } from "@/registry/new-york/gencn-ui/items/shared/lib/language-detector";
import { Button } from "@/components/ui/button";

export type I18nTextShowOption = "inline-auto" | "inline-manual" | "on-hover";

export interface GenUII18nTextProps {
  text: string;
  language: string;
  showOption: I18nTextShowOption;
}

export function GenUII18nText({ text, language, showOption }: GenUII18nTextProps) {
  const [translatedText, setTranslatedText] = React.useState<string | null>(null);
  const [isShowingTranslated, setIsShowingTranslated] = React.useState<boolean>(showOption === "inline-auto");
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const abortRef = React.useRef<AbortController | null>(null);

  React.useEffect(() => {
    setTranslatedText(null);
    setIsShowingTranslated(showOption === "inline-auto");
    setError(null);
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, [text, language, showOption]);

  const ensureTranslation = React.useCallback(async () => {
    if (translatedText !== null) return translatedText;
    setIsLoading(true);
    setError(null);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      let sourceLanguage: string | undefined = undefined;
      try {
        const detected = await detectLanguages(text);
        if (Array.isArray(detected) && detected.length > 0) {
          sourceLanguage = (detected[0] as any).detectedLanguage as string;
        }
      } catch {}
      const result = await translateOnce(text, { sourceLanguage, targetLanguage: language, signal: controller.signal });
      setTranslatedText(result);
      return result;
    } catch (e) {
      const msg = (e as Error).message || "Failed to translate";
      setError(msg);
      return null;
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [text, language, translatedText]);

  React.useEffect(() => {
    if (showOption === "inline-auto") {
      void ensureTranslation().then((res) => {
        if (res !== null) setIsShowingTranslated(true);
      });
    }
  }, [showOption, ensureTranslation]);

  if (showOption === "on-hover") {
    return (
      <Tooltip onOpenChange={(open) => { if (open) void ensureTranslation(); }}>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center cursor-help underline decoration-dashed decoration-1 underline-offset-4">{text}</span>
        </TooltipTrigger>
        <TooltipContent>
          {/* {error ? `Error: ${error}` : (translatedText ?? (isLoading ? "Translating…" : ""))} */}
          {translatedText ?? (isLoading ? "Translating…" : "")}
        </TooltipContent>
      </Tooltip>
    );
  }

  const content = isShowingTranslated ? (translatedText ?? (isLoading ? "Translating…" : text)) : text;

  return (
    <span className="inline-flex items-center">
      <span>{content}</span>
      {showOption === "inline-manual" && (
        <Button
        variant="outline"
          aria-label={isShowingTranslated ? "Show original" : "Translate"}
          className="ml-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs shadow hover:opacity-90 disabled:opacity-60"
          onClick={async () => {
            if (!isShowingTranslated) {
              const res = await ensureTranslation();
              if (res !== null) setIsShowingTranslated(true);
            } else {
              setIsShowingTranslated(false);
            }
          }}
          disabled={isLoading && !isShowingTranslated}
        >
          <Languages className="h-4 w-4" />
        </Button>
      )}
      {/* {error && <span className="ml-2 text-xs text-destructive">{error}</span>} */}
    </span>
  );
}


