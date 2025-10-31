import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const feedbackForm = pgTable('feedback_form', {
  formId: uuid('form_id').primaryKey(),
  reportId: uuid('report_id').notNull().unique(),
  questionnaireFormData: text('questionnaire_form_data').notNull(), // JSON dump of questionnaire
  createdAt: timestamp('created_at').defaultNow().notNull(),
  createdIp: text('created_ip'),
})

export const feedbackSubmission = pgTable('feedback_submission', {
  submissionId: uuid('submission_id').primaryKey(),
  formId: uuid('form_id').notNull(),
  feedbackResponseData: text('feedback_response_data').notNull(), // JSON response
  createdAt: timestamp('created_at').defaultNow().notNull(),
  createdIp: text('created_ip'),
})

export type FeedbackForm = typeof feedbackForm.$inferSelect
export type NewFeedbackForm = typeof feedbackForm.$inferInsert

export type FeedbackSubmission = typeof feedbackSubmission.$inferSelect
export type NewFeedbackSubmission = typeof feedbackSubmission.$inferInsert

