# Changelog

All notable changes to the Orderly platform are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased]

### Added
- **Multi-Role Portals:** Customer, Restaurant Kitchen, Delivery Partner, and Admin Management web portals.
- **Microservice Architecture:** 6 isolated backend domain services (`identity`, `restaurant`, `order`, `payment`, `delivery`, `notification`) behind an API Gateway.
- **Event Backbone:** Kafka event streaming implementation with `@orderly/contracts` and `@orderly/events` for asynchronous domain events.
- **Real-Time Live Tracking:** Customer order tracking with live status updates, simulated driver transit, and interactive Leaflet map view.
- **Admin Management Portal:** User account status control, restaurant onboarding verification, delivery partner approvals, and sentiment review monitoring.
- **Architecture Decision Records (ADRs):** Initial architectural documentation for monorepo topology, gateway routing, event streaming, per-service databases, RBAC, and authoritative pricing.

### Changed
- **Frontend Architecture:** Converted layouts and navigation adapters to strictly-typed TypeScript components.
- **Pricing Calculation:** Synchronized canonical calculation across cart, checkout, order persistence, and tracking.
- **Repository Documentation:** Standardized documentation suite (`README.md`, `ARCHITECTURE.md`, `API.md`, `DATABASE.md`, `EVENTS.md`, `DEPLOYMENT.md`, `SECURITY.md`, `CONTRIBUTING.md`).

### Fixed
- **React Hook Order Rules:** Resolved conditional hook execution in delivery and restaurant layout guards.
- **Customer Order Filtering:** Improved customer order retrieval in gateway to match both raw user UUIDs and prefixed identities.
- **Linting & Type Safety:** Cleared all compiler and ESLint warnings across the monorepo.
