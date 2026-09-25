# ADR-0006: Authoritative Pricing and Payment Engine

**Status:** Accepted
**Date:** 2026-09-25

## Context
E-commerce and food delivery systems frequently suffer from price calculation drift between cart views, checkout summaries, payment gateway authorization amounts, and persistent order records. Inconsistencies cause customer distrust and payment reconciliation errors.

## Decision
We enforce a single, canonical, **authoritative pricing equation** implemented on the backend and mirrored consistently on the client:

$$\text{Grand Total} = (\text{Subtotal} - \text{Discount}) + \text{Delivery Fee} + \text{Platform Fee} + \text{GST (5\%)}$$

Where:
- **Subtotal:** Sum of $\text{item price} \times \text{quantity}$ across all cart items.
- **Discount:** Authoritative coupon valuation (percentage or flat, bounded by subtotal and maximum cap).
- **Delivery Fee:** Standard flat delivery charge (₹30.00).
- **Platform Fee:** Standard flat platform service charge (₹5.00).
- **GST:** 5% Goods and Services Tax applied to the taxable net amount $(\text{Subtotal} - \text{Discount})$.

The backend `order` and `payment` services compute and validate the authoritative total before persisting orders or initiating Razorpay / COD transactions.

## Consequences
### Positive
- Absolute consistency across cart, checkout, payment capture, invoice emails, and admin records.
- Prevents price tampering or client-side calculation manipulation.

### Negative
- Any modification to fee structures or tax rules requires coordinated updates across contracts and service calculations.

## Alternatives Considered
- **Client-Determined Totals:** Rejected due to obvious security vulnerabilities and financial fraud risks.
