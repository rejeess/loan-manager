CREATE TABLE `customers` (
	`id` text PRIMARY KEY NOT NULL,
	`companyId` text NOT NULL,
	`dcsNumber` text NOT NULL,
	`name` text NOT NULL,
	`coApplicantName` text,
	`phone` text,
	`coApplicantPhone` text,
	`area` text,
	`pinCode` text,
	`referredBy` text,
	`rating` integer DEFAULT 3 NOT NULL,
	`recoveryState` text DEFAULT 'healthy' NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `customers_company_dcs_unique` ON `customers` (`companyId`,`dcsNumber`);--> statement-breakpoint
CREATE TABLE `loans` (
	`id` text PRIMARY KEY NOT NULL,
	`companyId` text NOT NULL,
	`customerId` text NOT NULL,
	`product` text NOT NULL,
	`amountPaise` integer NOT NULL,
	`tenureDays` integer,
	`startDate` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE restrict
);
