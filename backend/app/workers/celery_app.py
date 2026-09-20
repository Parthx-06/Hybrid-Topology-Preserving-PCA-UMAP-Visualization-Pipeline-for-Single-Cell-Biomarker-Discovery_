# =============================================================================
# Celery App Configuration
# =============================================================================
import logging
from celery import Celery
from app.core.config import settings

logger = logging.getLogger(__name__)

celery_app = Celery(
    "cellmap",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_soft_time_limit=3600,
    task_time_limit=7200,
)

# Auto-detect if Redis is accessible; if not, fall back to eager execution for local dev
try:
    import redis
    client = redis.from_url(settings.celery_broker_url, socket_connect_timeout=0.5)
    client.ping()
except Exception:
    logger.info("Redis broker unavailable at %s. Running in task_always_eager mode for local development.", settings.celery_broker_url)
    celery_app.conf.task_always_eager = True

celery_app.autodiscover_tasks(["app.workers"])

