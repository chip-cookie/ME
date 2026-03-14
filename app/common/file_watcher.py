"""
File Watcher Service
폴더에 파일이 추가되면 자동으로 학습을 시작합니다.
"""
import asyncio
import threading
import time
from pathlib import Path
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler, DirCreatedEvent, FileCreatedEvent

from app.core.config import get_settings

settings = get_settings()


class LearningTriggerHandler(FileSystemEventHandler):
    """파일/폴더 생성 시 학습을 트리거하는 핸들러"""
    
    def __init__(self, debounce_seconds: float = 5.0):
        self.debounce_seconds = debounce_seconds
        self.pending_styles = {}  # style_name -> last_event_time
        self._lock = threading.Lock()
        self._timer_thread = None
        self._running = True
        self._start_timer()
    
    def _start_timer(self):
        """디바운스 타이머 스레드 시작"""
        def timer_loop():
            while self._running:
                time.sleep(1)
                self._check_pending()
        self._timer_thread = threading.Thread(target=timer_loop, daemon=True)
        self._timer_thread.start()
    
    def _check_pending(self):
        """대기 중인 스타일 확인 및 학습 트리거"""
        now = time.time()
        to_process = []
        
        with self._lock:
            for style_name, last_time in list(self.pending_styles.items()):
                if now - last_time >= self.debounce_seconds:
                    to_process.append(style_name)
                    del self.pending_styles[style_name]
        
        for style_name in to_process:
            print(f"[FileWatcher] 자동 학습 시작: {style_name}")
            self._trigger_learning(style_name)
    
    def _trigger_learning(self, style_name: str):
        """학습 트리거 - 비동기 함수를 동기적으로 호출"""
        from app.core.database import SessionLocal
        from app.modules.learning.service import LearningService
        
        try:
            db = SessionLocal()
            service = LearningService(db)
            # 기본 기준 사용
            criteria = getattr(settings, 'default_learning_criteria', '논리적이고 잘 작성된 비즈니스 문서')
            
            # 비동기 함수를 새 이벤트 루프에서 실행
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                result = loop.run_until_complete(
                    service.auto_ingest_and_classify(style_name, criteria)
                )
                print(f"[FileWatcher] 학습 완료: {result}")
            finally:
                loop.close()
            db.close()
        except Exception as e:
            print(f"[FileWatcher] 학습 오류: {e}")
    
    def on_created(self, event):
        """파일 또는 폴더 생성 시 호출"""
        path = Path(event.src_path)
        import_dir = Path(settings.learning_dir) / "import"
        interview_dir = Path(settings.learning_dir) / "interview"
        
        target_dir = None
        if str(path).startswith(str(import_dir)):
            target_dir = import_dir
        elif str(path).startswith(str(interview_dir)):
            target_dir = interview_dir
        else:
            return
        
        # 스타일 폴더 이름 추출
        relative = path.relative_to(target_dir)
        parts = relative.parts
        if not parts:
            return
        
        style_name = parts[0]
        
        # 디바운스: 마지막 이벤트 시간 기록
        with self._lock:
            self.pending_styles[style_name] = time.time()
        
        print(f"[FileWatcher] 파일 감지: {path.name} -> 스타일: {style_name}")

    def stop(self):
        self._running = False


class FileWatcherService:
    """파일 감시 서비스"""
    
    def __init__(self):
        self.observer = None
        self.handler = None
    
    def start(self):
        """파일 감시 시작"""
        import_path = Path(settings.learning_dir) / "import"
        interview_path = Path(settings.learning_dir) / "interview"
        
        import_path.mkdir(parents=True, exist_ok=True)
        interview_path.mkdir(parents=True, exist_ok=True)
        
        self.handler = LearningTriggerHandler(debounce_seconds=5.0)
        self.observer = Observer()
        
        self.observer.schedule(self.handler, str(import_path), recursive=True)
        self.observer.schedule(self.handler, str(interview_path), recursive=True)
        
        self.observer.start()
        
        print(f"[FileWatcher] 폴더 감시 시작: {import_path}, {interview_path}")
    
    def stop(self):
        """파일 감시 중지"""
        if self.handler:
            self.handler.stop()
        if self.observer:
            self.observer.stop()
            self.observer.join()
        print("[FileWatcher] 폴더 감시 중지")


# 글로벌 인스턴스
_watcher_service = None


def get_watcher_service() -> FileWatcherService:
    global _watcher_service
    if _watcher_service is None:
        _watcher_service = FileWatcherService()
    return _watcher_service
