DROP TABLE `aiChatbotPreferences`;--> statement-breakpoint
DROP TABLE `assignmentRules`;--> statement-breakpoint
DROP TABLE `bankTransactions`;--> statement-breakpoint
DROP TABLE `carrierPortalConfigs`;--> statement-breakpoint
DROP TABLE `carrierPortalCredentials`;--> statement-breakpoint
DROP TABLE `caseActivityLogs`;--> statement-breakpoint
DROP TABLE `caseAssignments`;--> statement-breakpoint
DROP TABLE `caseComments`;--> statement-breakpoint
DROP TABLE `caseTemplates`;--> statement-breakpoint
DROP TABLE `commentAttachments`;--> statement-breakpoint
DROP TABLE `commentMentions`;--> statement-breakpoint
DROP TABLE `commentReactions`;--> statement-breakpoint
DROP TABLE `conversationHistory`;--> statement-breakpoint
DROP TABLE `conversationSessions`;--> statement-breakpoint
DROP TABLE `customerIdentities`;--> statement-breakpoint
DROP TABLE `customerIdentityMatches`;--> statement-breakpoint
DROP TABLE `customerRiskScores`;--> statement-breakpoint
DROP TABLE `customers`;--> statement-breakpoint
DROP TABLE `dataEnrichmentLogs`;--> statement-breakpoint
DROP TABLE `klaviyoProfiles`;--> statement-breakpoint
DROP TABLE `klaviyoReviews`;--> statement-breakpoint
DROP TABLE `notificationPreferences`;--> statement-breakpoint
DROP TABLE `notifications`;--> statement-breakpoint
DROP TABLE `orderSources`;--> statement-breakpoint
DROP TABLE `paymentMatchingSuggestions`;--> statement-breakpoint
DROP TABLE `paymentRecords`;--> statement-breakpoint
DROP TABLE `portalSessions`;--> statement-breakpoint
DROP TABLE `portalSubmissionHistory`;--> statement-breakpoint
DROP TABLE `portalSubmissionQueue`;--> statement-breakpoint
DROP TABLE `radialMenuSettings`;--> statement-breakpoint
DROP TABLE `reamazeTickets`;--> statement-breakpoint
DROP TABLE `reconciliationRules`;--> statement-breakpoint
DROP TABLE `teamMembers`;--> statement-breakpoint
DROP TABLE `userNotificationSettings`;--> statement-breakpoint
DROP TABLE `workflowExecutionSteps`;--> statement-breakpoint
DROP TABLE `workflowExecutions`;--> statement-breakpoint
DROP TABLE `workflowNodeTypes`;--> statement-breakpoint
DROP TABLE `workflowTemplates`;--> statement-breakpoint
DROP TABLE `workflows`;--> statement-breakpoint
DROP TABLE `workloadSnapshots`;--> statement-breakpoint
ALTER TABLE `cases` DROP COLUMN `caseType`;--> statement-breakpoint
ALTER TABLE `cases` DROP COLUMN `recipientEmail`;--> statement-breakpoint
ALTER TABLE `cases` DROP COLUMN `recipientPhone`;--> statement-breakpoint
ALTER TABLE `cases` DROP COLUMN `recipientStatus`;--> statement-breakpoint
ALTER TABLE `cases` DROP COLUMN `shipmentNumber`;--> statement-breakpoint
ALTER TABLE `cases` DROP COLUMN `damageType`;--> statement-breakpoint
ALTER TABLE `cases` DROP COLUMN `damageDescription`;--> statement-breakpoint
ALTER TABLE `cases` DROP COLUMN `damageSeverity`;--> statement-breakpoint
ALTER TABLE `cases` DROP COLUMN `packagingSpacing`;--> statement-breakpoint
ALTER TABLE `cases` DROP COLUMN `customerStatement`;--> statement-breakpoint
ALTER TABLE `cases` DROP COLUMN `insuranceProvider`;--> statement-breakpoint
ALTER TABLE `cases` DROP COLUMN `insurancePolicyNumber`;--> statement-breakpoint
ALTER TABLE `cases` DROP COLUMN `insuranceCoverage`;--> statement-breakpoint
ALTER TABLE `cases` DROP COLUMN `insuranceClaimNumber`;--> statement-breakpoint
ALTER TABLE `cases` DROP COLUMN `insuranceClaimStatus`;--> statement-breakpoint
ALTER TABLE `cases` DROP COLUMN `carrierGuarantee`;--> statement-breakpoint
ALTER TABLE `cases` DROP COLUMN `carrierGuaranteeClaimNumber`;--> statement-breakpoint
ALTER TABLE `cases` DROP COLUMN `carrierGuaranteeStatus`;--> statement-breakpoint
ALTER TABLE `cases` DROP COLUMN `promisedDeliveryDate`;--> statement-breakpoint
ALTER TABLE `cases` DROP COLUMN `actualDeliveryDate`;--> statement-breakpoint
ALTER TABLE `cases` DROP COLUMN `delayReason`;--> statement-breakpoint
ALTER TABLE `cases` DROP COLUMN `adjustmentReason`;--> statement-breakpoint
ALTER TABLE `cases` DROP COLUMN `invoiceReference`;--> statement-breakpoint
ALTER TABLE `cases` DROP COLUMN `purchaseDate`;--> statement-breakpoint
ALTER TABLE `cases` DROP COLUMN `purchaseSource`;--> statement-breakpoint
ALTER TABLE `cases` DROP COLUMN `purchaseVerified`;--> statement-breakpoint
ALTER TABLE `cases` DROP COLUMN `purchaseVerificationNotes`;--> statement-breakpoint
ALTER TABLE `cases` DROP COLUMN `receiptRequired`;--> statement-breakpoint
ALTER TABLE `cases` DROP COLUMN `receiptUploaded`;--> statement-breakpoint
ALTER TABLE `cases` DROP COLUMN `warrantyEligible`;--> statement-breakpoint
ALTER TABLE `cases` DROP COLUMN `warrantyExpirationDate`;--> statement-breakpoint
ALTER TABLE `cases` DROP COLUMN `claimEligibilityStatus`;--> statement-breakpoint
ALTER TABLE `cases` DROP COLUMN `intakeSource`;--> statement-breakpoint
ALTER TABLE `cases` DROP COLUMN `intakeTimestamp`;