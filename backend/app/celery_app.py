from celery import Celery
from .config import Config

celery = Celery(__name__, broker=Config.CELERY_BROKER_URL)
celery.conf.update({
    'task_serializer': 'json',
    'result_serializer': 'json',
    'accept_content': ['json'],
})

celery.autodiscover_tasks(['app.tasks'])