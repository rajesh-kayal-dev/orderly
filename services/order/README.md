# Order Service events

The Order Service publishes `order.placed` after its Order record is successfully created. It publishes the established status-specific lifecycle events (`order.accepted`, `order.preparing`, `order.ready`, and `order.cancelled`) after a successful corresponding Order status update.

Events contain stable, cross-service order identifiers and lifecycle metadata only; Order persistence remains the PostgreSQL source of truth. Kafka publishing is not atomic with the database: if publishing fails after the database operation succeeds, the request fails through the existing error handler and the failure is logged. An outbox, Saga, exactly-once processing, DLQ handling, and cross-service consumers are intentionally deferred.
