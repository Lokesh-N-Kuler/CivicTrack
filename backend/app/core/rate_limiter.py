import time
from collections import defaultdict
from threading import Lock
from fastapi import HTTPException, status


class InMemoryRateLimiter:
    """
    Lightweight, thread-safe in-memory sliding window rate limiter.
    Limits failed/total attempts per key (IP or username).
    """
    def __init__(self, max_requests: int = 10, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests = defaultdict(list)
        self.lock = Lock()

    def is_allowed(self, key: str) -> bool:
        now = time.time()
        with self.lock:
            # Clean old requests
            self.requests[key] = [
                ts for ts in self.requests[key]
                if now - ts < self.window_seconds
            ]
            if len(self.requests[key]) >= self.max_requests:
                return False
            self.requests[key].append(now)
            return True

    def check(self, key: str):
        from app.core.config import settings
        if settings.ENVIRONMENT == "testing":
            return
        if not self.is_allowed(key):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many attempts. Please wait a minute before trying again."
            )


login_rate_limiter = InMemoryRateLimiter(max_requests=10, window_seconds=60)
