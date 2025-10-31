'use client';

import * as React from 'react';
import {
  Separator,
} from '@/components/ui/separator';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import {Command, CommandList, CommandGroup, CommandItem} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import {
  Plus,
  Type,
  FileText,
  CircleDot,
  Star,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  Trash2,
  Copy,
  Minus as SeparatorIcon,
  Edit,
  AlertCircle,
  Check,
  ExternalLink,
  History,
  X,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

import { ShortTextFieldEdit, type ShortTextFieldProps } from '@/components/openfeedback/form/short-text-field';
import { LongTextFieldEdit, type LongTextFieldProps } from '@/components/openfeedback/form/long-text-field';
import { MultipleChoiceFieldEdit, type MultipleChoiceFieldProps } from '@/components/openfeedback/form/multiple-choice-field';
import { RatingFieldEdit, type RatingFieldProps } from '@/components/openfeedback/form/rating-field';
import { MultipleSelectFieldEdit, type MultipleSelectFieldProps } from '@/components/openfeedback/form/multiple-select-field';
import { FEEDBACK_FORM_STORAGE_KEY, type FeedbackQuestion, type QuestionWithId, type SeparatorItem, parseStoredQuestions, parseStoredForm, serializeForm } from '@/lib/openfeedback/feedback-form';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { GenUIInput } from '@/components/genui-input';
import { GenUITextarea } from '@/components/genui-textarea';
import { genUIToast } from '@/lib/genui-sonner';
import { launchFeedbackForm } from '../actions';
import { Rocket } from 'lucide-react';
import { ThemeColorPicker } from '@/components/ui/theme-color-picker';
import { saveFeedbackLink, getAllFeedbackLinks, deleteFeedbackLink, clearAllFeedbackLinks, type SavedFeedbackLink } from '@/lib/openfeedback/feedback-links-db';

type QuestionType =
  | 'short_text'
  | 'long_text'
  | 'multiple_choice'
  | 'rating'
  | 'multiple_select'
  | 'separator';

type QuestionTypeOption = {
  type: QuestionType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
};

const questionTypes: QuestionTypeOption[] = [
  { type: 'short_text', label: 'Short Text', icon: Type, description: 'Single line text input' },
  { type: 'long_text', label: 'Long Text', icon: FileText, description: 'Multi-line text input' },
  { type: 'multiple_choice', label: 'Multiple Choice', icon: CircleDot, description: 'Single selection from options' },
  { type: 'rating', label: 'Rating', icon: Star, description: 'Star rating scale' },
  { type: 'multiple_select', label: 'Multiple Select', icon: CheckSquare, description: 'Multiple selections from options' },
  { type: 'separator', label: 'Page Break', icon: SeparatorIcon, description: 'Visual separator for form sections' },
];

const createDefaultQuestion = (type: QuestionType): FeedbackQuestion => {
  if (type === 'separator') return { type: 'separator' };
  const base = { questionTitle: 'Untitled Question', required: false };
  switch (type) {
    case 'short_text':
      return { ...base, type: 'short_text', placeholder: '' };
    case 'long_text':
      return { ...base, type: 'long_text', placeholder: '', rows: 4 };
    case 'multiple_choice':
      return { ...base, type: 'multiple_choice', options: ['Option 1', 'Option 2'], displayMode: 'list' };
    case 'rating':
      return { ...base, type: 'rating', maxRating: 5 };
    case 'multiple_select':
      return { ...base, type: 'multiple_select', options: ['Option 1', 'Option 2'], displayMode: 'list' };
  }
};

export default function CreateBuilder() {
  const [open, setOpen] = React.useState(false);
  const [selectedType, setSelectedType] = React.useState<QuestionType | null>(null);
  const [questions, setQuestions] = React.useState<QuestionWithId[]>([]);
  const [isUnsaved, setIsUnsaved] = React.useState(false);
  const [formTitle, setFormTitle] = React.useState<string>('');
  const [formDescription, setFormDescription] = React.useState<string>('');
  const [lightPrimary, setLightPrimary] = React.useState<string>('#000000');
  const [darkPrimary, setDarkPrimary] = React.useState<string>('#ffffff');
  const [isFormDialogOpen, setIsFormDialogOpen] = React.useState(false);
  const [isLaunchDialogOpen, setIsLaunchDialogOpen] = React.useState(false);
  const [isLaunching, setIsLaunching] = React.useState(false);
  const [launchedFormId, setLaunchedFormId] = React.useState<string | null>(null);
  const [launchedReportId, setLaunchedReportId] = React.useState<string | null>(null);
  const [copiedFeedbackLink, setCopiedFeedbackLink] = React.useState(false);
  const [copiedReportLink, setCopiedReportLink] = React.useState(false);
  const [savedLinks, setSavedLinks] = React.useState<SavedFeedbackLink[]>([]);
  const [savedLinksPopoverOpen, setSavedLinksPopoverOpen] = React.useState(false);

  const handleSelectType = (type: QuestionType) => {
    const newQuestion: QuestionWithId = {
      ...createDefaultQuestion(type),
      id: `question-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    } as QuestionWithId;
    setQuestions((prev) => [...prev, newQuestion]);
    setSelectedType(null);
    setOpen(false);
  };

  const handleDeleteQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const handleUpdateQuestion = (id: string, updates: Partial<FeedbackQuestion>) => {
    setQuestions((prev) => prev.map((q) => (q.id === id ? ({ ...q, ...updates } as QuestionWithId) : q)));
  };

  const handleMoveQuestion = (id: string, direction: 'up' | 'down') => {
    setQuestions((prev) => {
      const index = prev.findIndex((q) => q.id === id);
      if (index === -1) return prev;
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      const copy = [...prev];
      [copy[index], copy[newIndex]] = [copy[newIndex], copy[index]];
      return copy;
    });
  };

  const handleDuplicateQuestion = (id: string) => {
    setQuestions((prev) => {
      const question = prev.find((q) => q.id === id);
      if (!question || question.type === 'separator') return prev;
      const duplicated: QuestionWithId = {
        ...question,
        id: `question-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        questionTitle: `${(question as any).questionTitle} (Copy)`,
      } as QuestionWithId;
      const index = prev.findIndex((q) => q.id === id);
      const copy = [...prev];
      copy.splice(index + 1, 0, duplicated);
      return copy;
    });
  };

  const selectedOption = questionTypes.find((q) => q.type === selectedType);

  

  const handleSaveForm = async () => {
    try {
      const payload = serializeForm({
        savedAt: new Date().toISOString(),
        formTitle: formTitle || undefined,
        formDescription: formDescription || undefined,
        theme: {
          lightPrimary: lightPrimary,
          darkPrimary: darkPrimary,
        },
        questions,
      });
      if (payload) {
        localStorage.setItem(FEEDBACK_FORM_STORAGE_KEY, payload);
      }
      setIsUnsaved(false);
      
      // Show funny success toast
      await genUIToast.success('Form saved successfully!', {
        tone: 'funny',
      });
    } catch (error) {
      // no-op: best effort local save
    }
  };

  const handleLaunchForm = async () => {
    setIsLaunching(true);
    try {
      const payload = serializeForm({
        savedAt: new Date().toISOString(),
        formTitle: formTitle || undefined,
        formDescription: formDescription || undefined,
        theme: {
          lightPrimary: lightPrimary,
          darkPrimary: darkPrimary,
        },
        questions,
      });
      
      if (!payload) {
        await genUIToast.error('Failed to serialize form data');
        setIsLaunching(false);
        return;
      }

      const result = await launchFeedbackForm(payload);
      
      if (result.success) {
        // Clear localStorage
        localStorage.removeItem(FEEDBACK_FORM_STORAGE_KEY);
        setIsUnsaved(false);
        
        // Save to IndexedDB
        try {
          await saveFeedbackLink({
            date: new Date().toISOString(),
            feedbackTitle: formTitle || 'Untitled Feedback Form',
            feedbackLink: `${typeof window !== 'undefined' ? window.location.origin : ''}/feedback/${result.formId}`,
            reportId: result.reportId,
          });
          // Refresh saved links list
          const links = await getAllFeedbackLinks();
          setSavedLinks(links);
        } catch (error) {
          console.error('Failed to save feedback link to IndexedDB:', error);
        }
        
        // Clear form data from UI (form is launched and can't be edited)
        setFormTitle('');
        setFormDescription('');
        setQuestions([]);
        setLightPrimary('#000000');
        setDarkPrimary('#ffffff');
        
        // Store the IDs
        setLaunchedFormId(result.formId);
        setLaunchedReportId(result.reportId);
        
        // Close dialog
        setIsLaunchDialogOpen(false);
        
        // Show success toast
        await genUIToast.success('Form launched successfully!', {
          tone: 'funny',
        });
      } else {
        await genUIToast.error(`Failed to launch form: ${result.error}`);
      }
    } catch (error) {
      await genUIToast.error(`Error launching form: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLaunching(false);
    }
  };

  const getStoredQuestions = (): QuestionWithId[] => {
    try {
      const raw = localStorage.getItem(FEEDBACK_FORM_STORAGE_KEY);
      return parseStoredQuestions(raw);
    } catch {
      return [];
    }
  };

  const getStoredMeta = () => {
    try {
      const raw = localStorage.getItem(FEEDBACK_FORM_STORAGE_KEY);
      const parsed = parseStoredForm(raw);
      return {
        title: parsed.formTitle || '',
        description: parsed.formDescription || '',
        theme: parsed.theme || { lightPrimary: '#000000', darkPrimary: '#ffffff' },
      };
    } catch {
      return { title: '', description: '', theme: { lightPrimary: '#000000', darkPrimary: '#ffffff' } };
    }
  };

  const areQuestionsEqual = (a: QuestionWithId[], b: QuestionWithId[]) => {
    try {
      return JSON.stringify(a) === JSON.stringify(b);
    } catch {
      return false;
    }
  };

  React.useEffect(() => {
    // initial check and subsequent checks every 15s
    const check = () => {
      const storedQuestions = getStoredQuestions();
      const storedMeta = getStoredMeta();
      const metaEqual = storedMeta.title === formTitle && 
                       storedMeta.description === formDescription &&
                       storedMeta.theme.lightPrimary === lightPrimary &&
                       storedMeta.theme.darkPrimary === darkPrimary;
      setIsUnsaved(!(areQuestionsEqual(questions, storedQuestions) && metaEqual));
    };
    check();
    const id = setInterval(check, 15000);
    return () => clearInterval(id);
  }, [questions, formTitle, formDescription, lightPrimary, darkPrimary]);

  // Load saved links from IndexedDB
  React.useEffect(() => {
    const loadSavedLinks = async () => {
      try {
        const links = await getAllFeedbackLinks();
        setSavedLinks(links);
      } catch (error) {
        console.error('Failed to load saved feedback links:', error);
      }
    };
    loadSavedLinks();
  }, []);

  // On mount, hydrate metadata if present
  React.useEffect(() => {
    const raw = localStorage.getItem(FEEDBACK_FORM_STORAGE_KEY);
    const parsed = parseStoredForm(raw);
    if (parsed.formTitle) setFormTitle(parsed.formTitle);
    if (parsed.formDescription) setFormDescription(parsed.formDescription);
    if (parsed.theme?.lightPrimary) setLightPrimary(parsed.theme.lightPrimary);
    if (parsed.theme?.darkPrimary) setDarkPrimary(parsed.theme.darkPrimary);
    // hydrate questions if available
    if (Array.isArray(parsed.questions) && parsed.questions.length > 0) {
      setQuestions(parsed.questions);
      setIsUnsaved(false);
    }
  }, []);

  const handleDeleteLink = async (id: string) => {
    try {
      await deleteFeedbackLink(id);
      const links = await getAllFeedbackLinks();
      setSavedLinks(links);
      await genUIToast.success('Link deleted', { tone: 'funny' });
    } catch (error) {
      await genUIToast.error('Failed to delete link');
      console.error('Failed to delete feedback link:', error);
    }
  };

  const handleClearAllLinks = async () => {
    try {
      await clearAllFeedbackLinks();
      setSavedLinks([]);
      await genUIToast.success('All links cleared', { tone: 'funny' });
    } catch (error) {
      await genUIToast.error('Failed to clear links');
      console.error('Failed to clear feedback links:', error);
    }
  };

  const renderQuestionEditor = (question: QuestionWithId, index: number) => {
    const fieldId = question.id;
    const totalQuestions = questions.length;
    const isFirst = index === 0;
    const isLast = index === totalQuestions - 1;
    const questionNumber = questions.slice(0, index + 1).filter((q) => q.type !== 'separator').length;

    if (question.type === 'separator') {
      return (
        <Card key={question.id} className="shadow-none pb-0 gap-0 border-none">
          <CardContent className="">
            <div className="relative flex items-center">
              <div className="flex items-center gap-1 shrink-0 -mt-4">
                <Button variant="outline" size="icon" onClick={() => handleMoveQuestion(question.id, 'up')} disabled={isFirst} className="h-6 w-6" title="Move up">
                  <ChevronUp className="size-3" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => handleMoveQuestion(question.id, 'down')} disabled={isLast} className="h-6 w-6" title="Move down">
                  <ChevronDown className="size-3" />
                </Button>
              </div>
              <div className="relative flex-1 flex items-center justify-center">
                <Separator className="absolute inset-0" />
                <span className="relative bg-background px-4 text-sm text-muted-foreground -mt-2">Page Break</span>
              </div>
              <div className="shrink-0 -mt-4">
                <Button variant="outline" size="icon" onClick={() => handleDeleteQuestion(question.id)} className="h-6 w-6 text-destructive hover:text-destructive" title="Delete">
                  <Trash2 className="size-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card key={question.id} className="shadow-none pb-2 gap-2 relative">
        <div className="absolute -top-3 -left-3 z-10">
          <Badge variant="secondary" className="h-8 w-8 rounded-full flex items-center justify-center p-0 font-semibold text-xs shadow-md border-2 border-background">
            Q{questionNumber}
          </Badge>
        </div>
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="flex-1 space-y-2">
              <GenUIInput
                value={(question as any).questionTitle}
                onChange={(e) => handleUpdateQuestion(question.id, { questionTitle: e.target.value })}
                placeholder="Question title"
                className="font-semibold"

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
              format: 'plain-text',
              length: 'short',
              sharedContext: `Question type: ${question.type}. This is the title/heading for a feedback form question. Requirements: Keep it concise (under 20 words), use clear and professional language, make it a single sentence, and ensure it clearly communicates what information you're asking the respondent to provide. The question should be specific and actionable.`,
              expectedInputLanguages: ['en'],
              expectedContextLanguages: ['en'],
              outputLanguage: 'en',
            }}
            onAccept={(text) => handleUpdateQuestion(question.id, { questionTitle: text })}
            onAIError={(e) => console.error('AI input error:', e)}
              />
              <GenUITextarea
                value={(question as any).questionHint || ''}
                onChange={(e) => handleUpdateQuestion(question.id, { questionHint: e.target.value || undefined })}
                placeholder="Hint (optional)"
                rows={1}
                className="text-sm resize-none"

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
                  format: 'plain-text',
                  length: 'short',
                  sharedContext: `Question type: ${question.type}. This is a hint/helper text for a feedback form question that provides additional context or guidance to respondents. Requirements: Keep it concise (under 20 words), use clear and friendly language, make it a single sentence, and ensure it helps clarify what kind of answer is expected or provides helpful context without duplicating the question title.`,
                  expectedInputLanguages: ['en'],
                  expectedContextLanguages: ['en'],
                  outputLanguage: 'en',
                }}
                onAccept={(e) => handleUpdateQuestion(question.id, { questionHint: e })}
                onAIError={(e) => console.error('AI error:', e)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {question.type === 'short_text' && <ShortTextFieldEdit field={question as ShortTextFieldProps} fieldId={fieldId} hideLabel={true} />}
          {question.type === 'long_text' && <LongTextFieldEdit field={question as LongTextFieldProps} fieldId={fieldId} hideLabel={true} />}
          {question.type === 'multiple_choice' && (
            <MultipleChoiceFieldEdit field={question as MultipleChoiceFieldProps} fieldId={fieldId} hideLabel={true} onUpdateField={(updates) => handleUpdateQuestion(question.id, updates)} />
          )}
          {question.type === 'rating' && <RatingFieldEdit field={question as RatingFieldProps} fieldId={fieldId} hideLabel={true} />}
          {question.type === 'multiple_select' && (
            <MultipleSelectFieldEdit field={question as MultipleSelectFieldProps} fieldId={fieldId} hideLabel={true} onUpdateField={(updates) => handleUpdateQuestion(question.id, updates)} />
          )}
        </CardContent>
        <CardFooter className="border-t items-center justify-between pt-2!">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="shrink-0">
              {(() => {
                const qt = questionTypes.find((qt) => qt.type === question.type);
                const Icon = qt?.icon;
                return (
                  <>
                    {Icon && <Icon className="size-3" />}
                    <span className="hidden sm:inline">{qt?.label}</span>
                  </>
                );
              })()}
            </Badge>
            <div className="flex items-center gap-1 border-r pr-3 mr-3">
              <Button variant="ghost" size="icon" onClick={() => handleMoveQuestion(question.id, 'up')} disabled={isFirst} className="h-8 w-8" title="Move up">
                <ChevronUp className="size-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleMoveQuestion(question.id, 'down')} disabled={isLast} className="h-8 w-8" title="Move down">
                <ChevronDown className="size-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Switch id={`required-${question.id}`} checked={(question as any).required} onCheckedChange={(checked) => handleUpdateQuestion(question.id, { required: checked })} />
              <Label htmlFor={`required-${question.id}`} className="text-sm cursor-pointer hidden sm:inline">
                Required
              </Label>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => handleDuplicateQuestion(question.id)} className="h-8" title="Duplicate">
              <Copy className="size-4 sm:mr-2" />
              <span className="hidden sm:inline">Duplicate</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleDeleteQuestion(question.id)} className="h-8 text-destructive hover:text-destructive" title="Delete">
              <Trash2 className="size-4 sm:mr-2" />
              <span className="hidden sm:inline">Delete</span>
            </Button>
          </div>
        </CardFooter>
      </Card>
    );
  };

  return (
    <>
      <div className="relative min-h-screen pt-16 pb-32">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-8 space-y-4">
            <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
              <div className="space-y-2">
                <div className="flex items-start gap-6">
                  <DialogTrigger asChild>
                    <button className="flex items-center gap-2 group text-left flex-1">
                      <h3 className="text-2xl font-bold border-b border-dashed border-muted-foreground">
                        {formTitle || 'Untitled Feedback Form'}
                      </h3>
                      <Edit className="size-4 text-muted-foreground" />
                    </button>
                  </DialogTrigger>
                  <ThemeColorPicker
                    lightPrimary={lightPrimary}
                    darkPrimary={darkPrimary}
                    onLightPrimaryChange={(color) => {
                      setLightPrimary(color);
                      setIsUnsaved(true);
                    }}
                    onDarkPrimaryChange={(color) => {
                      setDarkPrimary(color);
                      setIsUnsaved(true);
                    }}
                  />
                </div>
                <DialogTrigger asChild>
                  <button className="flex items-center gap-2 group text-left w-full">
                    <div className="text-sm text-muted-foreground border-b border-dashed border-muted-foreground min-h-6">
                      {formDescription || 'Describe your form (optional)'}
                    </div>
                    <Edit className="size-3 text-muted-foreground" />
                  </button>
                </DialogTrigger>
              </div>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit form details</DialogTitle>
                  <DialogDescription>Set a title and description for your form.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="form-title">Title</Label>
                    <GenUIInput
                      id="form-title"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="Untitled Feedback Form"
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
                        format: 'plain-text',
                        length: 'short',
                        sharedContext: 'This is the title for a feedback form. Requirements: Keep it concise (under 10 words), use clear and professional language, and ensure it clearly communicates the purpose of the feedback form.',
                        expectedInputLanguages: ['en'],
                        expectedContextLanguages: ['en'],
                        outputLanguage: 'en',
                      }}
                      onAccept={(text) => setFormTitle(text)}
                      onAIError={(e) => console.error('AI input error:', e)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="form-description">Description</Label>
                    <GenUITextarea
                      id="form-description"
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Describe your form (optional)"
                      rows={3}
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
                        format: 'plain-text',
                        length: 'short',
                        sharedContext: 'This is a description for a feedback form that provides context about what the form is for and what kind of feedback is being collected. Requirements: Keep it concise (under 50 words), use clear and friendly language.',
                        expectedInputLanguages: ['en'],
                        expectedContextLanguages: ['en'],
                        outputLanguage: 'en',
                      }}
                      onAccept={(e) => setFormDescription(e)}
                      onAIError={(e) => console.error('AI error:', e)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="secondary" onClick={() => setIsFormDialogOpen(false)}>Close</Button>
                  <Button type="button" onClick={() => { setIsFormDialogOpen(false); handleSaveForm(); }}>Save</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            {(launchedFormId || launchedReportId) && (
              <Card className="mt-4 border-green-500 bg-green-50 dark:bg-green-950">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <p className="font-semibold text-green-700 dark:text-green-300">Form launched successfully!</p>
                    
                    <div className="space-y-3">
                      {launchedFormId && (
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-green-700 dark:text-green-300">Feedback Link</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              readOnly
                              value={`${typeof window !== 'undefined' ? window.location.origin : ''}/feedback/${launchedFormId}`}
                              className="flex-1 text-xs font-mono bg-background"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                const feedbackUrl = `${window.location.origin}/feedback/${launchedFormId}`;
                                await navigator.clipboard.writeText(feedbackUrl);
                                setCopiedFeedbackLink(true);
                                setTimeout(() => setCopiedFeedbackLink(false), 2000);
                                await genUIToast.success('Feedback link copied!', { tone: 'funny' });
                              }}
                              className="shrink-0"
                              title="Copy link"
                            >
                              {copiedFeedbackLink ? (
                                <Check className="size-4" />
                              ) : (
                                <Copy className="size-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                window.open(`/feedback/${launchedFormId}`, '_blank');
                              }}
                              className="shrink-0"
                              title="Open in new tab"
                            >
                              <ExternalLink className="size-4" />
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">Share this link for people to submit feedback</p>
                        </div>
                      )}
                      
                      {launchedReportId && (
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-green-700 dark:text-green-300">Reports Link</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              readOnly
                              value={`${typeof window !== 'undefined' ? window.location.origin : ''}/reports/${launchedReportId}`}
                              className="flex-1 text-xs font-mono bg-background"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                const reportUrl = `${window.location.origin}/reports/${launchedReportId}`;
                                await navigator.clipboard.writeText(reportUrl);
                                setCopiedReportLink(true);
                                setTimeout(() => setCopiedReportLink(false), 2000);
                                await genUIToast.success('Reports link copied!', { tone: 'funny' });
                              }}
                              className="shrink-0"
                              title="Copy link"
                            >
                              {copiedReportLink ? (
                                <Check className="size-4" />
                              ) : (
                                <Copy className="size-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                window.open(`/reports/${launchedReportId}`, '_blank');
                              }}
                              className="shrink-0"
                              title="Open in new tab"
                            >
                              <ExternalLink className="size-4" />
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">Use this link to view feedback reports and analytics</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="pt-2 border-t border-green-200 dark:border-green-800">
                      <div className="space-y-1 text-xs">
                        {launchedFormId && (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Form ID:</span>
                            <code className="bg-background px-2 py-0.5 rounded text-xs">{launchedFormId}</code>
                          </div>
                        )}
                        {launchedReportId && (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Report ID:</span>
                            <code className="bg-background px-2 py-0.5 rounded text-xs">{launchedReportId}</code>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-4">
            {questions.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16" data-ai-i18n={true}>
                  <div className="text-center space-y-2">
                    <p className="text-lg font-medium text-muted-foreground">No questions yet</p>
                    <p className="text-sm text-muted-foreground">Click the "Add Question" button to get started</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              questions.map((question, index) => renderQuestionEditor(question, index))
            )}
          </div>
        </div>

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              data-assistant-label="Add Question"
              className={cn(
                'fixed left-1 top-1/2 -translate-y-1/2 z-50',
                'shadow-lg hover:shadow-xl transition-shadow',
                selectedOption ? 'h-auto py-3 px-4 gap-2 ' : 'h-auto py-4 px-3 gap-3 flex-col '
              )}
              size="lg"
              variant="default"
            >
              {selectedOption ? (
                <>
                  <selectedOption.icon className="size-5" />
                  <span className="font-medium">{selectedOption.label}</span>
                  <ChevronDown className="size-4 opacity-70" />
                </>
              ) : (
                <>
                  <Plus className="size-5" />
                  <span className="font-medium writing-vertical-rl rotate-180" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
                    Add Question
                  </span>
                  <ChevronDown className="size-4 opacity-70 -rotate-90" />
                </>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start" side="right" sideOffset={12}>
            <Command>
              <CommandList>
                <CommandGroup heading="Choose Question Type">
                  {questionTypes.map((option) => {
                    const Icon = option.icon;
                    const isSelected = selectedType === option.type;
                    return (
                      <CommandItem
                        data-assistant-role="button"
                        data-assistant-label={option.label}
                        key={option.type}
                        onSelect={() => handleSelectType(option.type)}
                        className={cn('flex items-start gap-3 px-3 py-3', isSelected && 'bg-accent text-accent-foreground')}
                      >
                        <Icon className={cn('size-5 mt-0.5 shrink-0', isSelected && 'text-primary')} />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{option.label}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{option.description}</div>
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <div className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-4 ">
          <div className="container mx-auto max-w-2xl border-purple-500 border rounded-lg bg-background shadow-lg">
            <div className="flex items-center justify-between gap-2 p-4">
              <div className="flex items-center gap-2">
                <Popover 
                  open={savedLinksPopoverOpen} 
                  onOpenChange={(open) => {
                    setSavedLinksPopoverOpen(open);
                    if (open) {
                      // Refresh links when popover opens
                      getAllFeedbackLinks().then(setSavedLinks).catch(console.error);
                    }
                  }}
                >
                  <PopoverTrigger asChild>
                    <Button size="sm" variant="outline" title="View saved feedback links" className="gap-2">
                      <History className="size-4" />
                      <span>History</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-96" align="end">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b">
                        <h4 className="font-semibold text-base">Saved Feedback Links</h4>
                        {savedLinks.length > 0 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleClearAllLinks}
                            className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            Clear All
                          </Button>
                        )}
                      </div>
                      {savedLinks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <History className="size-8 text-muted-foreground mb-2 opacity-50" />
                          <p className="text-sm text-muted-foreground">
                            No saved feedback links yet
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Launch a form to see it here
                          </p>
                        </div>
                      ) : (
                        <div className="max-h-96 overflow-y-auto -mx-1 px-1">
                          <div className="space-y-0">
                            {savedLinks.map((link, index) => (
                              <React.Fragment key={link.id}>
                                {index > 0 && <Separator className="my-2" />}
                                <div className="group py-3 px-2 rounded-lg hover:bg-accent/50 transition-colors space-y-3">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0 space-y-1">
                                      <p className="font-semibold text-sm text-foreground truncate">{link.feedbackTitle}</p>
                                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span>{new Date(link.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                        <span>•</span>
                                        <span>{new Date(link.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                                      </div>
                                    </div>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                      onClick={() => handleDeleteLink(link.id)}
                                      title="Delete link"
                                    >
                                      <X className="size-4" />
                                    </Button>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="flex-1 justify-start gap-2 font-medium hover:bg-primary hover:text-primary-foreground"
                                      onClick={() => window.open(link.feedbackLink, '_blank')}
                                    >
                                      <ExternalLink className="size-3.5" />
                                      Form
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="flex-1 justify-start gap-2 font-medium hover:bg-primary hover:text-primary-foreground"
                                      onClick={() => window.open(`/reports/${link.reportId}`, '_blank')}
                                    >
                                      <ExternalLink className="size-3.5" />
                                      Report
                                    </Button>
                                  </div>
                                </div>
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
                <div className={cn("text-sm", isUnsaved ? "text-muted-foreground" : "text-green-600 dark:text-green-400")}>{isUnsaved ? "Unsaved changes" : "All changes saved"}</div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="default" onClick={handleSaveForm} data-assistant-label="Save Form">
                  Save
                </Button>
                <AlertDialog open={isLaunchDialogOpen} onOpenChange={setIsLaunchDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button 
                      size="sm" 
                      variant="default" 
                      className="bg-green-600 hover:bg-green-700 text-white"
                      data-assistant-label="Launch Form"
                      disabled={isLaunching || questions.length === 0}
                    >
                      <Rocket className="size-4 mr-2" />
                      Launch
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Launch Feedback Form</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to launch this form? This will save the form to the server and make it available for responses. 
                        Your local storage will be cleared after launching.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <Alert variant="destructive">
                      <AlertCircle className="size-4" />
                      <AlertDescription>
                        Once launched, you can no longer edit this form.
                      </AlertDescription>
                    </Alert>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isLaunching}>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleLaunchForm}
                        disabled={isLaunching}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {isLaunching ? 'Launching...' : 'Launch'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
            {/* <AssistantUI
              placeholder="Tell the assistant what to do..."
              className="bg-background border border-border rounded-lg shadow-lg p-4"
              contentClassName="max-h-40 overflow-y-auto mb-2"
              inputContainerClassName="mt-2"
             /> */}
          </div>
        </div>
      </div>
    </>
  );
}


