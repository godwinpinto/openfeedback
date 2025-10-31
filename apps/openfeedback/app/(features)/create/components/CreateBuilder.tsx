'use client';

import * as React from 'react';
import {
  Button,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Command,
  CommandList,
  CommandGroup,
  CommandItem,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Input,
  Textarea,
  Switch,
  Label,
  cn,
  CardFooter,
  Badge,
  Separator as SeparatorComponent,
} from '@shared-ui';
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
} from 'lucide-react';
import { ShortTextFieldEdit, type ShortTextFieldProps } from '../../../../components/openfeedback/form/short-text-field';
import { LongTextFieldEdit, type LongTextFieldProps } from '../../../../components/openfeedback/form/long-text-field';
import { MultipleChoiceFieldEdit, type MultipleChoiceFieldProps } from '../../../../components/openfeedback/form/multiple-choice-field';
import { RatingFieldEdit, type RatingFieldProps } from '../../../../components/openfeedback/form/rating-field';
import { MultipleSelectFieldEdit, type MultipleSelectFieldProps } from '../../../../components/openfeedback/form/multiple-select-field';
import { AssistantProvider, AssistantUI, useAssistantTool } from 'voiceable';
import {
  FEEDBACK_FORM_STORAGE_KEY,
  type FeedbackQuestion,
  type QuestionWithId,
  type SeparatorItem,
  parseStoredQuestions,
  parseStoredForm,
  serializeForm,
} from '../../../lib/feedback-form';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Button as DialogButton } from '@shared-ui';

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
  const [isFormDialogOpen, setIsFormDialogOpen] = React.useState(false);

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

  // Register tools under the provider scope (component wrapped below)
  useAssistantTool({
    name: 'addQuestion',
    description:
      'Add a question to the form by type (short_text, long_text, multiple_choice, rating, multiple_select, separator)',
    parameters: [{ name: 'type', type: 'string', description: 'Question type or label', required: true }],
    handler: async ({ type }) => {
      const normalized = String(type || '').toLowerCase().replace(/\s+/g, '_') as QuestionType;
      if (!(['short_text', 'long_text', 'multiple_choice', 'rating', 'multiple_select', 'separator'] as const).includes(normalized as any)) return;
      handleSelectType(normalized as QuestionType);
    },
  });
  useAssistantTool({
    name: 'deleteQuestion',
    description: 'Delete a question by id',
    parameters: [{ name: 'id', type: 'string', required: true }],
    handler: async ({ id }) => {
      handleDeleteQuestion(String(id));
    },
  });
  useAssistantTool({
    name: 'moveQuestion',
    description: 'Move a question up or down',
    parameters: [
      { name: 'id', type: 'string', required: true },
      { name: 'direction', type: 'string', required: true },
    ],
    handler: async ({ id, direction }) => {
      handleMoveQuestion(String(id), String(direction) as any);
    },
  });
  useAssistantTool({
    name: 'duplicateQuestion',
    description: 'Duplicate a question by id',
    parameters: [{ name: 'id', type: 'string', required: true }],
    handler: async ({ id }) => {
      handleDuplicateQuestion(String(id));
    },
  });
  useAssistantTool({
    name: 'editQuestion',
    description: 'Edit a question by id with updates',
    parameters: [
      { name: 'id', type: 'string', required: true },
      { name: 'updates', type: 'object', required: true },
    ],
    handler: async ({ id, updates }) => {
      handleUpdateQuestion(String(id), (updates || {}) as Partial<FeedbackQuestion>);
    },
  });

  const handleSaveForm = () => {
    try {
      const payload = serializeForm({
        savedAt: new Date().toISOString(),
        formTitle: formTitle || undefined,
        formDescription: formDescription || undefined,
        questions,
      });
      if (payload) {
        localStorage.setItem(FEEDBACK_FORM_STORAGE_KEY, payload);
      }
      setIsUnsaved(false);
    } catch (error) {
      // no-op: best effort local save
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
      };
    } catch {
      return { title: '', description: '' };
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
      const metaEqual = storedMeta.title === formTitle && storedMeta.description === formDescription;
      setIsUnsaved(!(areQuestionsEqual(questions, storedQuestions) && metaEqual));
    };
    check();
    const id = setInterval(check, 15000);
    return () => clearInterval(id);
  }, [questions, formTitle, formDescription]);

  // On mount, hydrate metadata if present
  React.useEffect(() => {
    const raw = localStorage.getItem(FEEDBACK_FORM_STORAGE_KEY);
    const parsed = parseStoredForm(raw);
    if (parsed.formTitle) setFormTitle(parsed.formTitle);
    if (parsed.formDescription) setFormDescription(parsed.formDescription);
    // hydrate questions if available
    if (Array.isArray(parsed.questions) && parsed.questions.length > 0) {
      setQuestions(parsed.questions);
      setIsUnsaved(false);
    }
  }, []);

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
                <SeparatorComponent className="absolute inset-0" />
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
              <Input
                value={(question as any).questionTitle}
                onChange={(e) => handleUpdateQuestion(question.id, { questionTitle: e.target.value })}
                placeholder="Question title"
                className="font-semibold"
              />
              <Textarea
                value={(question as any).questionHint || ''}
                onChange={(e) => handleUpdateQuestion(question.id, { questionHint: e.target.value || undefined })}
                placeholder="Hint (optional)"
                rows={1}
                className="text-sm resize-none"
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
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Create Feedback Form</h1>
            <div className="text-muted-foreground">Start building your feedback form by adding questions.</div>
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
          <div className="container mx-auto max-w-2xl border-purple-500 border rounded-lg">
            <div className="flex items-center justify-between gap-2 p-4">
              <div className={cn("text-sm", isUnsaved ? "text-muted-foreground" : "text-green-600 dark:text-green-400")}>{isUnsaved ? "Unsaved changes" : "All changes saved"}</div>
              <div className="flex items-center gap-2">
                <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">Form details</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit form details</DialogTitle>
                      <DialogDescription>Set a title and description for your form.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="form-title">Title</Label>
                        <Input id="form-title" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Untitled form" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="form-description">Description</Label>
                        <Textarea id="form-description" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Describe your form (optional)" rows={3} />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="secondary" onClick={() => setIsFormDialogOpen(false)}>Close</Button>
                      <Button type="button" onClick={() => { setIsFormDialogOpen(false); handleSaveForm(); }}>Save</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Button size="sm" variant="default" onClick={handleSaveForm} data-assistant-label="Save Form">
                  Save
                </Button>
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


