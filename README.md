# LogiGuard AI

**AI-powered inbound logistics control tower for Logistics Businesses**

LogiGuard AI is a supplier and logistics operations platform designed to give Logistics businesses earlier visibility into shipment delays, operational exceptions, and delivery risks.

It brings supplier updates, manager workflows, AI-assisted risk assessment, operational notifications, and management reporting into connected experiences for the people responsible for keeping inbound logistics moving. The result is a clearer operating picture and a more coordinated approach to resolving issues before they disrupt supply availability.

## The Business Challenge

Inbound logistics teams often coordinate deliveries through disconnected updates, email threads, spreadsheets, and carrier information. A delay may be known to a supplier before it is visible to logistics managers, while the supporting details needed for a fast decision remain fragmented.

Operationally, this creates several challenges:

- Delivery delays may not be identified or communicated early enough.
- Suppliers use inconsistent methods to share revised timelines and shipment updates.
- Logistics managers need more than a status update; they need shipment context, risk information, inventory implications, and a clear next step.
- Exception handling can depend on manual follow-up, repeated coordination, and limited visibility across teams.
- Shipment activity, supplier information, inventory conditions, and management reporting may not be connected.
- Problems can remain unresolved while operational data is gathered and stakeholders are notified.

Without a consistent exception workflow, teams spend more time compiling information and less time acting on it.

## The Solution

LogiGuard AI provides role-specific digital workspaces for suppliers and logistics managers.

Suppliers have a focused view of their assigned shipments and can submit timely updates. Logistics managers have a broader view of inbound operations, including shipment status, supplier information, inventory exposure, delivery exceptions, AI-supported assessments, and resolution activity.

The platform connects these operational moments:

- Supplier updates create a structured record of shipment status and revised arrival information.
- Delivery delays can be converted into consistent operational exceptions.
- AI-assisted assessment adds risk context, business impact, and recommended actions.
- Automated notifications help the responsible team respond quickly.
- Managers can acknowledge, investigate, and resolve exceptions in the same operational portal.
- Management reporting provides a broader view of trends and operational priorities.

The objective is not to replace logistics judgment. It is to improve access to the right information so operational teams can make more informed decisions sooner.

## Core Capabilities

### Supplier Portal

The Supplier Portal gives each supplier a focused view of the shipments assigned to its organization.

- Review assigned inbound shipments and delivery status.
- Access shipment details, including tracking information, destination, revised arrival information, and relevant items.
- Submit structured status updates for a shipment.
- Provide tracking numbers, revised estimated arrival dates, and operational notes.
- Review previous shipment update history.
- Keep supplier communication within a defined, role-specific workflow.

Suppliers see only their own assigned shipment information. Manager-only assessments and operational records remain outside the supplier experience.

### Logistics Manager Portal

The Logistics Manager Portal provides a centralized view of a Logistics business's inbound operations.

- Review active and at-risk inbound shipments.
- Identify open, critical, and unresolved exceptions.
- Search and filter shipments by operational status and risk.
- Review shipment events, supplier details, warehouse information, and related products.
- Maintain a supplier directory and view associated shipment context.
- Monitor inventory coverage and stock-risk indicators.
- Raise shipment exceptions directly within the portal.
- Acknowledge, investigate, and resolve exceptions with documented resolution notes.
- Review supplier communication guidance and data gaps associated with exceptions.

The manager experience supports day-to-day operational control without requiring technical tools or direct database access.

### AI-Powered Risk Assessment

LogiGuard AI presents AI-assisted exception assessments that help managers interpret an operational issue and prioritize a response.

Assessment information can include:

- Risk level and score.
- A plain-language summary of the issue.
- Potential business impact.
- Recommended actions.
- Available data gaps.
- Supplier communication guidance.

These assessments provide decision support for logistics professionals. Operational personnel remain responsible for validating circumstances, applying judgment, and selecting the appropriate response.

### Automated Exception Handling and Notifications

A supplier-reported delay can create a structured late-arrival exception without manual exception entry. The exception is then available to the existing automation workflow and manager review process.

The supported workflow helps teams:

- Capture the delay as an operational exception.
- Generate an AI-assisted risk assessment.
- Notify the responsible team through Slack.
- Track acknowledgement and resolution in the manager portal.
- Preserve a clear shipment and exception history.

This reduces reliance on informal follow-up and gives teams a consistent starting point for exception response.

### Operational Analytics and Reporting

Management reporting presents a broader operational view beyond individual transactions. Looker Studio uses dedicated read-only reporting views from Supabase to support reporting across shipment activity, exceptions, inventory, supplier delays, and AI assessments.

Reporting information can help leaders:

- Understand which operational areas require attention.
- Review exception patterns and shipment risks.
- Coordinate follow-up across suppliers and logistics functions.
- Support management discussions with a connected operational view.

## How It Works

The implemented supplier-delay workflow connects supplier updates with operational management and automated assessment:

1. A supplier submits a delayed shipment update through the Supplier Portal.
2. Supabase records the update as a shipment event.
3. A database trigger automatically creates a `late_arrival` exception.
4. The exception is sent through the existing Make.com workflow.
5. Google Gemini analyzes the exception context and produces an AI-assisted risk assessment.
6. The assessment is stored in Supabase.
7. Slack sends an operational notification to the team.
8. Managers review the exception, shipment, risk assessment, and recommended actions in the Manager Portal.
9. Looker Studio reflects the updated operational data through dedicated reporting views.

Managers can also raise exceptions directly through the Manager Portal. These manual exceptions follow the same operational review process and are retained as manually created records.

The supplier portal does not connect directly to Gemini or Make.com. Integration credentials remain outside the browser application.

## Business Value

LogiGuard AI is designed to improve how inbound logistics teams identify, coordinate, and resolve operational issues.

- **Improved shipment visibility:** Managers and suppliers work from structured shipment updates rather than fragmented communications.
- **Earlier identification of delivery risks:** A reported delay becomes visible as an exception that can be assessed and communicated promptly.
- **Faster exception response:** The portal brings shipment details and assessment guidance together for operational review.
- **Better supplier coordination:** Supplier updates follow a consistent structure and remain available in shipment history.
- **More informed inventory decisions:** Shipment risk can be considered alongside inventory availability and reorder information.
- **Reduced manual follow-up:** Automated assessment and notification workflows reduce the need to repeatedly copy exception details across tools.
- **Clearer operational accountability:** Managers can acknowledge, investigate, and resolve issues with a documented outcome.
- **Connected management reporting:** Looker Studio provides a reporting view supported by dedicated read-only Supabase data views.

The platform improves visibility and coordination; it does not replace the judgment of experienced logistics teams.

## Technology Stack

- **React** — Role-based supplier and manager interfaces.
- **Vite** — Fast application development and delivery tooling.
- **TypeScript** — A strongly typed application foundation.
- **Tailwind CSS** — Consistent responsive styling.
- **Supabase** — Authentication, operational data access, database automation, and reporting data sources.
- **PostgreSQL** — Structured storage for shipments, supplier updates, exceptions, and assessments.
- **Make.com** — Orchestrates the exception-to-assessment automation.
- **Google Gemini** — Provides AI-assisted risk assessment content.
- **Slack** — Sends operational notifications.
- **Looker Studio** — Presents management reporting from dedicated read-only views.

## How it works

The supplier-delay scenario demonstrates the complete value of the solution:

1. The Supplier opens the Supplier Portal and selects an assigned shipment.
2. Then he submits a shipment update with status set to **Delayed**, along with the revised arrival, tracking information, and notes.
3. Then he confirms that the update is recorded in the shipment event history.
4. The Logistics Manager opens his Logistics Manager Portal and locates the automatically generated late-arrival exception.
5. The manager then reviews the shipment context and AI-generated risk assessment.
6. The AI-Generated Risk Assessment is sent to the business's Slack channel automatically.
7. The data is automatically updated in the Data Studio/Looker Studio dashboard after simply refreshing the report.

For the current implementation, Make.com is operated with manual Run once execution during demonstrations. Continuous scheduling or unattended automation is not enabled.

The supplier-delay-to-Slack workflow has been successfully tested end to end. A complete demonstration requires the database trigger, webhook, Make.com scenario, assessment workflow, Slack destination, and reporting views to be configured in the applicable environments.

## Project Status and Future Enhancements

### Implemented capabilities

- Separate supplier and logistics manager experiences.
- Supplier-only shipment access and supplier shipment update submission.
- Supabase-backed shipment, supplier, inventory, exception, and assessment views.
- Automatic supplier-delay exception generation through a database trigger.
- Manager capability to raise exceptions manually.
- Persistent exception acknowledgement and resolution workflows.
- AI-assisted risk assessment presentation.
- Automated Slack notification through the existing Make.com workflow.
- Management reporting through dedicated read-only Supabase views used by Looker Studio.

This repository represents a controlled solution prototype and is not described as publicly deployed or production-ready.

### Future enhancements

- Continuous automation scheduling for production-managed exception processing.
- Expanded predictive analytics for delivery risk and operational disruption.
- Additional supplier communication and document-sharing capabilities.
- Broader inventory and supplier performance reporting.
- Persistent notification preferences and role-based alerts.
- Real-time operational updates across manager and supplier workspaces.
- Wider exception workflow automation and historical trend analysis.
- Controlled production deployment, monitoring, and operational governance.

These enhancements represent possible future direction; they are not included in the currently implemented capabilities.
