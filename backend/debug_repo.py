import asyncio
import traceback
import sys

sys.path.insert(0, '.')

async def main():
    from app.database.session import async_session
    from app.repository.task_repository import TaskRepository

    async with async_session() as db:
        repo = TaskRepository(db)
        try:
            result = await repo.list()
            print('SUCCESS: task count =', len(result), flush=True)
        except BaseException as exc:
            print('CAUGHT EXCEPTION:', type(exc).__name__, flush=True)
            traceback.print_exc(file=sys.stdout)
            sys.stdout.flush()

try:
    asyncio.run(main())
except BaseException as exc:
    print('TOP-LEVEL EXCEPTION:', type(exc).__name__, flush=True)
    traceback.print_exc(file=sys.stdout)
    sys.stdout.flush()
