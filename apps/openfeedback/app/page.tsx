"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { GenUII18nText } from "@/components/genui-i18n-text";
import { GenUITextarea } from "@/components/genui-textarea";
import { AIInput } from "@/components/genui-input";
import { AISONNER_TONES, aiToast, Toaster } from "@/lib/genui-sonner";
import { AISummarizerProvider, AISummarizerText, GenUISummarizerContent } from "@/components/genui-summarize-block";
import { GenUIHumanVerification } from "@/components/genui-human-verification";

export default function Home() {
  const [tone, setTone] = React.useState<string>("friendly");
  const [demoLang, setDemoLang] = React.useState<string>('fr');

  const randomMessages = [
    "Your changes have been saved.",
    "Profile updated successfully.",
    "Something just happened!",
    "Download complete.",
    "New message received.",
    "Action executed.",
  ];

  const triggerToast = () => {
    const msg = randomMessages[Math.floor(Math.random() * randomMessages.length)];
    aiToast(msg, { tone: tone as any });
  };
  return (
    <div className="flex min-h-screen items-center justify-center bg-background font-sans">
      <main className="flex min-h-screen w-full max-w-4xl flex-col items-center justify-center py-32 px-16 bg-card">
        <Toaster richColors />
        <div className="w-full space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-4">
              Chrome AI Feedback Demo
            </h1>
            <p className="text-muted-foreground">
              Test the Chrome Summarizer API with our voiceable package
            </p>
          </div>
          <div className="w-full flex items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2 text-foreground">Toast tone</label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger className="w-full bg-background text-foreground border rounded-md px-3 py-2">
                  <SelectValue placeholder="Select tone" />
                </SelectTrigger>
                <SelectContent>
                  {AISONNER_TONES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={triggerToast}>Trigger AI Toast</Button>
          </div>
          <GenUITextarea
            className="w-full"
            placeholder="Type here..."
            features={["compose", "improve", "fix-grammar", "translate", "inline-suggest"]}
            translateTargets={["en", "fr", "es", "de", "hi", "ja", "zh-CN"]}
            translateLanguageMap={{
              en: 'English',
              fr: 'French',
              es: 'Spanish',
              de: 'German',
              hi: 'Hindi',
              ja: 'Japanese',
              'zh-CN': 'Chinese (Simplified)'
            }}
            placeholderPrompt="Describe what you want"
            writerOptions={{
              tone: 'neutral',
              format: 'markdown',
              length: 'medium',
              sharedContext: 'General-purpose writing for the user in English.',
              expectedInputLanguages: ['en'],
              expectedContextLanguages: ['en'],
              outputLanguage: 'en',
            }}
            onAccept={(text) => console.log('Accepted AI text:', text)}
            onAIError={(e) => console.error('AI error:', e)}
          />
          {/* AIInput (single-line) demo */}
          <AIInput
            className="w-full"
            placeholder="Type here..."
            features={["compose", "improve", "fix-grammar", "translate", "auto-suggest"]}
            translateTargets={["en", "fr", "es", "de", "hi", "ja", "zh-CN"]}
            translateLanguageMap={{
              en: 'English',
              fr: 'French',
              es: 'Spanish',
              de: 'German',
              hi: 'Hindi',
              ja: 'Japanese',
              'zh-CN': 'Chinese (Simplified)'
            }}
            placeholderPrompt="Describe what you want"
            writerOptions={{
              tone: 'neutral',
              format: 'markdown',
              length: 'medium',
              sharedContext: 'General-purpose writing for the user in English.',
              expectedInputLanguages: ['en'],
              expectedContextLanguages: ['en'],
              outputLanguage: 'en',
            }}
            onAccept={(text) => console.log('Accepted AI input:', text)}
            onAIError={(e) => console.error('AI input error:', e)}
          />
          
          {/* <SummarizeComponent 
            className="w-full"
            placeholder="Enter any text you'd like to summarize. Try pasting a long article, document, or any content you want to understand better..."
            summaryType="key-points"
            summaryLength="medium"
            summaryFormat="markdown"
            enableStreaming={false}
            sharedContext=""
          /> */}

          {/* AISummarizer Demo */}
          <div className="pt-4 text-foreground">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">AISummarizer Demo</CardTitle>
              </CardHeader>
              <AISummarizerProvider displayMode="static" type="tldr" length="medium" format="plain-text">
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>This demo collects multiple text snippets below and summarizes them together.</p>
                    <p>Click the button to generate a concise set of key points.</p>
                  </div>

                  <GenUISummarizerContent title="TL;DR" />

                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="min-w-20 text-xs text-muted-foreground">Snippet 1</span>
                      <AISummarizerText
                        as="p"
                        text="At dawns of a new day, the lighthouse stood quiet above the harbor, its lantern cold after a night of roaring wind. Jonas, the keeper, stepped out to survey the damage: shingles scattered like cards, gulls wheeling over restless water, and a fishing skiff nudged crooked against the pier. He had weathered worse storms, but this one felt personal—like the sea had tried to write its name across the village and almost succeeded."
                      />
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="min-w-20 text-xs text-muted-foreground">Snippet 2</span>
                      <AISummarizerText
                        as="p"
                        text="By noon, neighbors emerged with hammers and rope, trading quiet jokes as they worked. Children gathered fallen branches into neat, proud piles. The baker handed out warm rolls, the kind with sugar that stuck to your fingers, and Jonas shared a thermos of coffee that tasted faintly of smoke. They repaired what they could and tied bright cloth to broken posts so boats would see the hazards at dusk."
                      />
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="min-w-20 text-xs text-muted-foreground">Snippet 3</span>
                      <AISummarizerText
                        as="p"
                        text="When the supply boat finally rounded the point, its horn low and steady, a cheer rose along the seawall. The lantern would burn again that night, Jonas promised, and the sea—though still swollen and sullen—seemed to accept the truce. In the hush that followed, he climbed the spiral stairs, each step echoing with the small, ordinary courage that keeps a town alive."
                      />
                    </div>
                  </div>
                </CardContent>
              </AISummarizerProvider>
            </Card>
          </div>

           <div className="pt-4 text-foreground">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">GenUII18nText Demo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 items-end">
                  <div>
                    <label className="block text-sm font-medium mb-1">Target language</label>
                    <Select value={demoLang} onValueChange={(v) => setDemoLang(v)}>
                      <SelectTrigger className="h-9 w-full">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                        <SelectItem value="hi">Hindi</SelectItem>
                        <SelectItem value="ja">Japanese</SelectItem>
                        <SelectItem value="zh-CN">Chinese (Simplified)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Choose how translations are presented below.
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <span className="min-w-36 text-sm text-muted-foreground">inline-auto</span>
                    <GenUII18nText text="Hello world, welcome to our internationalized app!" language={demoLang} showOption="inline-auto" />
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="min-w-36 text-sm text-muted-foreground">inline-manual</span>
                    <GenUII18nText text="Hello world, welcome to our internationalized app!" language={demoLang} showOption="inline-manual" />
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="min-w-36 text-sm text-muted-foreground">on-hover</span>
                    <GenUII18nText text="Hello world, welcome to our internationalized app!" language={demoLang} showOption="on-hover" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="pt-4 text-foreground">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">AI Human Verification Demo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>Test AI-powered human verification using camera and vision AI.</p>
                </div>
                <GenUIHumanVerification
                  onVerified={(confidence) => {
                    console.log('Verified with confidence:', confidence);
                  }}
                  onVerificationFailed={() => {
                    console.log('Verification failed');
                  }}
                  onError={(error) => {
                    console.error('Verification error:', error);
                  }}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
