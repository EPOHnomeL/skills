# Events not HTTP between contexts
Contexts communicate via domain events on the bus, not synchronous HTTP, to avoid temporal coupling.
